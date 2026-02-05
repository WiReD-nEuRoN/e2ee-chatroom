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
  type: 'text' | 'file' | 'system';
}

const users = new Map<string, User>();
const rooms = new Map<string, Room>();
const messages = new Map<string, Message[]>();

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

      // Send user's rooms
      const userRooms = Array.from(rooms.values()).filter((room) =>
        room.participants.includes(userId)
      );
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
      const room: Room = {
        id: roomId,
        name,
        type,
        participants: [...new Set([userId, ...participantIds])],
        createdAt: new Date(),
      };

      rooms.set(roomId, room);
      messages.set(roomId, []);

      // Notify all participants
      room.participants.forEach((pid) => {
        const user = users.get(pid);
        if (user) {
          io.to(user.socketId).emit('room:created', room);
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
    socket.on('message:send', (data: { roomId: string; content: string; encryptedContent?: string; tempId: string; type: string }) => {
      const { roomId, content, encryptedContent, tempId, type } = data;
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
      };

      // Store message
      const roomMessages = messages.get(roomId) || [];
      roomMessages.push(message);
      messages.set(roomId, roomMessages);

      // Confirm to sender
      socket.emit('message:sent', { roomId, messageId, tempId });

      // Broadcast to room (excluding sender)
      socket.to(roomId).emit('message:new', { roomId, message });

      console.log(`Message sent in room ${roomId} by ${user.username}`);
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
