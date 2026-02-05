import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { encryptionService } from './encryption';
import type { Message, ChatRoom } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class ChatService {
  private socket: Socket | null = null;
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      useChatStore.getState().setConnecting(false);
      useChatStore.getState().setConnectionError(null);

      // Authenticate with the server
      const { user, token } = useAuthStore.getState();
      if (user && token) {
        this.socket?.emit('authenticate', {
          userId: user.id,
          token,
          publicKey: encryptionService.getPublicKey(),
        });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      useChatStore.getState().setConnectionError(error.message);
    });

    // Room events
    this.socket.on('rooms:list', (rooms: ChatRoom[]) => {
      useChatStore.getState().setRooms(rooms);
    });

    this.socket.on('room:created', (room: ChatRoom) => {
      useChatStore.getState().addRoom(room);
    });

    this.socket.on('room:updated', ({ roomId, updates }: { roomId: string; updates: Partial<ChatRoom> }) => {
      useChatStore.getState().updateRoom(roomId, updates);
    });

    // Message events
    this.socket.on('message:new', async (data: { roomId: string; message: Message }) => {
      const { roomId, message } = data;
      
      // Decrypt message if encrypted
      if (message.encryptedContent) {
        try {
          const decryptedContent = await encryptionService.decryptMessage(
            message.encryptedContent,
            undefined // TODO: Get sender's public key for verification
          );
          message.content = decryptedContent;
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          message.content = '🔒 Encrypted message (decryption failed)';
        }
      }

      useChatStore.getState().addMessage(roomId, message);
    });

    this.socket.on('message:sent', (data: { roomId: string; messageId: string; tempId: string }) => {
      const { roomId, messageId, tempId } = data;
      useChatStore.getState().updateMessage(roomId, tempId, {
        id: messageId,
        status: 'sent',
      });
    });

    this.socket.on('message:delivered', (data: { roomId: string; messageId: string }) => {
      const { roomId, messageId } = data;
      useChatStore.getState().updateMessage(roomId, messageId, {
        status: 'delivered',
      });
    });

    this.socket.on('message:read', (data: { roomId: string; messageId: string }) => {
      const { roomId, messageId } = data;
      useChatStore.getState().updateMessage(roomId, messageId, {
        status: 'read',
      });
    });

    // Typing indicators
    this.socket.on('typing:start', (data: { roomId: string; userId: string; username: string }) => {
      const { roomId, userId, username } = data;
      useChatStore.getState().setTyping(roomId, { userId, username });
    });

    this.socket.on('typing:stop', (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      useChatStore.getState().clearTyping(roomId, userId);
    });

    // User presence
    this.socket.on('user:online', (data: { userId: string }) => {
      // Update user online status in rooms
      const rooms = useChatStore.getState().rooms;
      rooms.forEach((room) => {
        const participant = room.participants.find((p) => p.id === data.userId);
        if (participant) {
          useChatStore.getState().updateRoom(room.id, {
            participants: room.participants.map((p) =>
              p.id === data.userId ? { ...p, isOnline: true } : p
            ),
          });
        }
      });
    });

    this.socket.on('user:offline', (data: { userId: string; lastSeen: Date }) => {
      // Update user offline status in rooms
      const rooms = useChatStore.getState().rooms;
      rooms.forEach((room) => {
        const participant = room.participants.find((p) => p.id === data.userId);
        if (participant) {
          useChatStore.getState().updateRoom(room.id, {
            participants: room.participants.map((p) =>
              p.id === data.userId
                ? { ...p, isOnline: false, lastSeen: data.lastSeen }
                : p
            ),
          });
        }
      });
    });
  }

  // Public methods
  async sendMessage(roomId: string, content: string, recipientPublicKeys?: string[]) {
    if (!this.socket) return;

    const tempId = `temp-${Date.now()}`;
    const { user } = useAuthStore.getState();

    if (!user) return;

    // Create temporary message
    const tempMessage: Message = {
      id: tempId,
      senderId: user.id,
      senderName: user.username,
      content,
      timestamp: new Date(),
      type: 'text',
      status: 'sending',
      isOwn: true,
    };

    useChatStore.getState().addMessage(roomId, tempMessage);

    // Encrypt message
    let encryptedContent: string | undefined;
    if (recipientPublicKeys && recipientPublicKeys.length > 0) {
      try {
        if (recipientPublicKeys.length === 1) {
          encryptedContent = await encryptionService.encryptMessage(
            content,
            recipientPublicKeys[0]
          );
        } else {
          encryptedContent = await encryptionService.encryptGroupMessage(
            content,
            recipientPublicKeys
          );
        }
      } catch (error) {
        console.error('Encryption failed:', error);
      }
    }

    this.socket.emit('message:send', {
      roomId,
      content,
      encryptedContent,
      tempId,
      type: 'text',
    });
  }

  startTyping(roomId: string) {
    if (!this.socket) return;

    this.socket.emit('typing:start', { roomId });

    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set new timeout to stop typing after 3 seconds
    this.typingTimeout = setTimeout(() => {
      this.stopTyping(roomId);
    }, 3000);
  }

  stopTyping(roomId: string) {
    if (!this.socket) return;

    this.socket.emit('typing:stop', { roomId });

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  joinRoom(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('room:join', { roomId });
  }

  leaveRoom(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('room:leave', { roomId });
  }

  createRoom(name: string, type: 'direct' | 'group', participantIds: string[]) {
    if (!this.socket) return;
    this.socket.emit('room:create', { name, type, participantIds });
  }

  markAsRead(roomId: string, messageId: string) {
    if (!this.socket) return;
    this.socket.emit('message:read', { roomId, messageId });
  }
}

export const chatService = new ChatService();
