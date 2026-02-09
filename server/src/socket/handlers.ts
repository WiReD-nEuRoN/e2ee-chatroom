// In-memory storage (replace with database in production)
interface User {
  id: string;
  socketId: string;
  username: string;
  publicKey: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface Room {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[]; // user IDs
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

// Helper to transform room with participant IDs to room with full user objects
function transformRoomForClient(room: Room, forUserId?: string) {
  const participants = room.participants.map(pid => {
    const user = users.get(pid);
    if (user) {
      return {
        id: user.id,
        username: user.username,
        publicKey: user.publicKey,
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
    socket.on('authenticate', (data: { userId: string; username?: string; publicKey?: string }) => {
      const { userId, username, publicKey } = data;
      
      const user: User = {
        id: userId,
        socketId: socket.id,
        username: username || `User-${userId.slice(0, 6)}`,
        publicKey: publicKey || '',
        isOnline: true,
        lastSeen: new Date(),
      };

      users.set(userId, user);
      socket.userId = userId;

      console.log(`User authenticated: ${username} (${userId})`);

      // Send user's rooms with full participant data
      console.log(`[SERVER] Sending rooms:list to ${username}, total rooms: ${rooms.size}, userId: ${userId}`);
      console.log(`[SERVER] All users:`, Array.from(users.values()).map(u => ({id: u.id, username: u.username, hasKey: !!u.publicKey})));
      const userRooms = Array.from(rooms.values())
        .filter((room) => room.participants.includes(userId))
        .map((room) => transformRoomForClient(room, userId));
      console.log(`[SERVER] Sending ${userRooms.length} rooms to ${username}`);
      userRooms.forEach((room, i) => {
        console.log(`[SERVER] Room ${i}: ${room.id}, participants:`, room.participants.map((p: any) => ({id: p.id, username: p.username, hasKey: !!p.publicKey})));
      });
      socket.emit('rooms:list', userRooms);

      // Notify others that user is online
      socket.broadcast.emit('user:online', { userId });
    });

    // Room management
    socket.on('room:create', (data: { name: string; type: 'direct' | 'group'; participantIds: string[] }) => {
      const { name, type, participantIds } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[SERVER] Creating room: ${roomId}, requested participants:`, participantIds);
      console.log(`[SERVER] Creator userId: ${userId}, all authenticated users:`, Array.from(users.values()).map(u => ({id: u.id, username: u.username})));
      
      // Convert usernames to userIds if needed
      const resolvedParticipantIds = participantIds.map(pid => {
        // If it's already a valid userId, use it
        if (users.has(pid)) {
          console.log(`[SERVER] ${pid} is a valid userId`);
          return pid;
        }
        // Otherwise try to find by username
        const userByName = Array.from(users.values()).find(u => u.username === pid);
        if (userByName) {
          console.log(`[SERVER] Resolved username '${pid}' to userId '${userByName.id}'`);
          return userByName.id;
        }
        // If not found, keep the original (might be offline user)
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

      console.log(`[SERVER] Room created with participants:`, room.participants);

      // Add all participants' sockets to the room and notify them
      console.log(`[SERVER] Notifying ${room.participants.length} participants about room ${roomId}`);
      room.participants.forEach((pid) => {
        // Try to find user by userId first, then by username
        let user = users.get(pid);
        
        // If not found by ID, search by username
        if (!user) {
          user = Array.from(users.values()).find((u) => u.username === pid);
        }
        
        if (user) {
          console.log(`[SERVER] Processing participant ${user.username} (${user.id}), socket: ${user.socketId}`);
          // Add socket to the room so they receive messages immediately
          const userSocket = io.sockets.sockets.get(user.socketId);
          if (userSocket) {
            userSocket.join(roomId);
            console.log(`[SERVER] Added ${user.username} to room ${roomId}`);
          } else {
            console.log(`[SERVER] Socket not found for ${user.username}, they may be offline`);
          }
          // Notify participant about the new room (with full participant data)
          const roomForClient = transformRoomForClient(room, user.id);
          io.to(user.socketId).emit('room:created', roomForClient);
          console.log(`[SERVER] Notified ${user.username} about room ${roomId}`);
        } else {
          console.log(`[SERVER] User ${pid} not found (tried as userId and username)`);
        }
      });

      console.log(`Room created: ${name} (${roomId})`);
    });

    socket.on('room:join', (data: { roomId: string }) => {
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
    socket.on('message:send', (data: { roomId: string; content: string; encryptedContent?: string; tempId: string; type: string; fileInfo?: any }) => {
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

      // Store message (without isOwn field - client will determine this)
      const roomMessages = messages.get(roomId) || [];
      roomMessages.push(message);
      messages.set(roomId, roomMessages);

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

    socket.on('message:read', (data: { roomId: string; messageId: string }) => {
      const { roomId, messageId } = data;
      
      // Notify the sender that message was read
      const roomMessages = messages.get(roomId) || [];
      const message = roomMessages.find((m) => m.id === messageId);
      
      if (message) {
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
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      const userId = socket.userId;
      if (userId) {
        const user = users.get(userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          users.set(userId, user);

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
