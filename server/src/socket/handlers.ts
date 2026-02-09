import { Database, User as DbUser, Room as DbRoom, Message as DbMessage } from '../services/database.js';

// In-memory fallback storage
interface User {
  id: string;
  socketId: string;
  username: string;
  publicKey: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface Room {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  isEncrypted: boolean;
  createdAt: Date;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  encryptedContent?: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system' | 'voice';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    data?: string;
    isImage?: boolean;
    duration?: number;
  };
}

const users = new Map<string, User>();
const rooms = new Map<string, Room>();
const messages = new Map<string, Message[]>();

// Try to initialize database (will fail gracefully if Supabase not configured)
let db: Database | null = null;
try {
  db = new Database();
  console.log('✅ Database service initialized');
} catch (error) {
  console.log('⚠️  Database service unavailable, using in-memory storage');
}

// Helper to transform room with participant IDs to room with full user objects
function transformRoomForClient(room: Room, forUserId?: string) {
  const participants = room.participants.map(pid => {
    const user = users.get(pid);
    if (user) {
      return {
        id: user.id,
        username: user.username,
        publicKey: user.publicKey,
        avatar: user.avatar,
        fingerprint: user.publicKey ? 'No fingerprint' : 'No key',
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      };
    }
    // Fallback if user not found
    return {
      id: pid,
      username: pid,
      publicKey: '',
      avatar: undefined,
      fingerprint: 'Unknown',
      isOnline: false,
    };
  });

  // For direct messages, set the room name to the other participant's username
  let roomName = room.name;
  if (room.type === 'direct' && forUserId) {
    const otherParticipant = participants.find(p => p.id !== forUserId);
    if (otherParticipant) {
      roomName = otherParticipant.username;
    }
  }

  return {
    ...room,
    name: roomName,
    participants,
  };
}

export function setupSocketHandlers(io: any) {
  io.on('connection', (socket: any) => {
    console.log(`Client connected: ${socket.id}`);

    // Authentication
    socket.on('authenticate', async (data: { userId: string; username?: string; publicKey?: string; avatar?: string }) => {
      const { userId, username, publicKey, avatar } = data;
      
      const user: User = {
        id: userId,
        socketId: socket.id,
        username: username || `User-${userId.slice(0, 6)}`,
        publicKey: publicKey || '',
        avatar,
        isOnline: true,
        lastSeen: new Date(),
      };

      users.set(userId, user);
      socket.userId = userId;

      // Try to save to database
      if (db) {
        try {
          console.log(`[DATABASE] Saving user to database: ${user.id}`);
          await db.createOrUpdateUser({
            id: user.id,
            username: user.username,
            publicKey: user.publicKey,
            avatar: user.avatar,
            isOnline: true,
            lastSeen: user.lastSeen,
          });
          console.log(`[DATABASE] ✅ User saved successfully: ${user.id}`);
        } catch (error) {
          console.error(`[DATABASE] ❌ Error saving user to database:`, error);
        }
      } else {
        console.log(`[DATABASE] ⚠️  No database connection, using in-memory storage`);
      }

      console.log(`User authenticated: ${username} (${userId})`);

      // Send user's rooms with full participant data
      console.log(`[SERVER] Sending rooms:list to ${username}, total rooms: ${rooms.size}, userId: ${userId}`);
      const userRooms = Array.from(rooms.values())
        .filter((room) => room.participants.includes(userId))
        .map((room) => transformRoomForClient(room, userId));
      console.log(`[SERVER] Sending ${userRooms.length} rooms to ${username}`);
      socket.emit('rooms:list', userRooms);

      // Notify others that user is online
      socket.broadcast.emit('user:online', { userId });
    });

    // Profile update
    socket.on('profile:update', async (data: { username?: string; avatar?: string }) => {
      const userId = socket.userId;
      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const user = users.get(userId);
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Update in-memory user
      if (data.username) user.username = data.username;
      if (data.avatar !== undefined) user.avatar = data.avatar;
      users.set(userId, user);

      // Try to save to database
      if (db) {
        try {
          console.log(`[DATABASE] Updating user profile in database: ${userId}`);
          await db.updateUserProfile(userId, data);
          console.log(`[DATABASE] ✅ User profile updated successfully: ${userId}`);
        } catch (error) {
          console.error(`[DATABASE] ❌ Error updating user profile in database:`, error);
        }
      } else {
        console.log(`[DATABASE] ⚠️  No database connection, using in-memory storage`);
      }

      // Broadcast profile update to all connected clients
      io.emit('user:profile-updated', {
        userId,
        username: user.username,
        avatar: user.avatar,
      });

      console.log(`User ${userId} updated profile`);
    });

    // Room management
    socket.on('room:create', async (data: { name: string; type: 'direct' | 'group'; participantIds: string[] }) => {
      const { name, type, participantIds } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[SERVER] Creating room: ${roomId}, requested participants:`, participantIds);
      
      // Convert usernames to userIds if needed
      const resolvedParticipantIds = participantIds.map(pid => {
        if (users.has(pid)) {
          console.log(`[SERVER] ${pid} is a valid userId`);
          return pid;
        }
        const userByName = Array.from(users.values()).find(u => u.username === pid);
        if (userByName) {
          console.log(`[SERVER] Resolved username '${pid}' to userId '${userByName.id}'`);
          return userByName.id;
        }
        console.log(`[SERVER] Could not resolve '${pid}', keeping as-is`);
        return pid;
      });
      
      const room: Room = {
        id: roomId,
        name,
        type,
        participants: [...new Set([userId, ...resolvedParticipantIds])],
        isEncrypted: true,
        createdAt: new Date(),
      };

      rooms.set(roomId, room);
      messages.set(roomId, []);

      // Try to save to database
      if (db) {
        try {
          console.log(`[DATABASE] Saving room to database: ${roomId}`);
          await db.createRoom(room);
          console.log(`[DATABASE] ✅ Room saved successfully: ${roomId}`);
        } catch (error) {
          console.error(`[DATABASE] ❌ Error creating room in database:`, error);
        }
      } else {
        console.log(`[DATABASE] ⚠️  No database connection, using in-memory storage`);
      }

      console.log(`[SERVER] Room created with participants:`, room.participants);

      // Add all participants' sockets to the room and notify them
      console.log(`[SERVER] Notifying ${room.participants.length} participants about room ${roomId}`);
      room.participants.forEach((pid) => {
        let user = users.get(pid);
        
        if (!user) {
          user = Array.from(users.values()).find((u) => u.username === pid);
        }
        
        if (user) {
          console.log(`[SERVER] Processing participant ${user.username} (${user.id}), socket: ${user.socketId}`);
          const userSocket = io.sockets.sockets.get(user.socketId);
          if (userSocket) {
            userSocket.join(roomId);
            console.log(`[SERVER] Added ${user.username} to room ${roomId}`);
          } else {
            console.log(`[SERVER] Socket not found for ${user.username}, they may be offline`);
          }
          const roomForClient = transformRoomForClient(room, user.id);
          io.to(user.socketId).emit('room:created', roomForClient);
          console.log(`[SERVER] Notified ${user.username} about room ${roomId}`);
        } else {
          console.log(`[SERVER] User ${pid} not found (tried as userId and username)`);
        }
      });

      console.log(`Room created: ${name} (${roomId})`);
    });

    socket.on('room:join', async (data: { roomId: string }) => {
      const { roomId } = data;
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);

      // Send message history
      const roomMessages = messages.get(roomId) || [];
      socket.emit('messages:history', { roomId, messages: roomMessages });
    });

    socket.on('room:leave', (data: { roomId: string }) => {
      const { roomId } = data;
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room: ${roomId}`);
    });

    // Message handling
    socket.on('message:send', async (data: { roomId: string; content: string; encryptedContent?: string; tempId: string; type: string; fileInfo?: any }) => {
      const { roomId, content, encryptedContent, tempId, type, fileInfo } = data;
      const userId = socket.userId;

      console.log(`[SERVER] Received message:send from ${userId} for room ${roomId}, type: ${type}`);

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const user = users.get(userId);
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message: Message = {
        id: messageId,
        roomId,
        senderId: userId,
        senderName: user.username,
        content,
        encryptedContent,
        timestamp: new Date(),
        type: type as any,
        status: 'sent',
        fileInfo,
      };

      // Store message in memory
      const roomMessages = messages.get(roomId) || [];
      roomMessages.push(message);
      messages.set(roomId, roomMessages);

      // Try to save to database
      if (db) {
        try {
          console.log(`[DATABASE] Saving message to database: ${messageId}`);
          await db.createMessage(message);
          console.log(`[DATABASE] ✅ Message saved successfully: ${messageId}`);
        } catch (error) {
          console.error(`[DATABASE] ❌ Error saving message to database:`, error);
        }
      } else {
        console.log(`[DATABASE] ⚠️  No database connection, using in-memory storage`);
      }

      // Confirm to sender
      socket.emit('message:sent', { roomId, messageId, tempId });
      console.log(`[SERVER] Sent message:sent to sender ${userId}`);

      // Broadcast to room (excluding sender)
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      console.log(`[SERVER] Broadcasting to room ${roomId}, sockets in room:`, roomSockets ? Array.from(roomSockets) : 'none');
      
      socket.to(roomId).emit('message:new', { roomId, message });
      console.log(`[SERVER] Broadcasted message:new to room ${roomId}`);

      console.log(`[SERVER] Message ${messageId} sent in room ${roomId} by ${user.username}`);
    });

    socket.on('message:read', async (data: { roomId: string; messageId: string }) => {
      const { roomId, messageId } = data;
      
      // Update message status in memory
      const roomMessages = messages.get(roomId) || [];
      const message = roomMessages.find((m) => m.id === messageId);
      
      if (message) {
        message.status = 'read';

        // Try to save status to database
        if (db) {
          try {
            await db.updateMessageStatus(messageId, 'read');
          } catch (error) {
            console.error('Error updating message status in database:', error);
          }
        }

        const sender = users.get(message.senderId);
        if (sender) {
          io.to(sender.socketId).emit('message:read', { roomId, messageId });
        }
      }
    });

    // Typing indicators
    socket.on('typing:start', (data: { roomId: string }) => {
      const { roomId } = data;
      const userId = socket.userId;

      if (!userId) return;

      const user = users.get(userId);
      if (!user) return;

      socket.to(roomId).emit('typing:start', {
        roomId,
        userId,
        username: user.username,
      });
    });

    socket.on('typing:stop', (data: { roomId: string }) => {
      const { roomId } = data;
      const userId = socket.userId;

      if (!userId) return;

      socket.to(roomId).emit('typing:stop', { roomId, userId });
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      const userId = socket.userId;
      if (userId) {
        const user = users.get(userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          users.set(userId, user);

          // Try to update database
          if (db) {
            try {
              await db.updateUserOnlineStatus(userId, false);
            } catch (error) {
              console.error('Error updating user status in database:', error);
            }
          }

          // Notify others
          socket.broadcast.emit('user:offline', {
            userId,
            lastSeen: user.lastSeen,
          });
        }
      }
    });
  });
}
