import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useNotificationStore } from '../stores/notificationStore';
import { encryptionService } from './encryption';
import type { Message, ChatRoom } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class ChatService {
  private socket: Socket | null = null;
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
        console.log('[CLIENT] Authenticating user:', user.username, 'with publicKey:', user.publicKey ? 'present' : 'missing');
        this.socket?.emit('authenticate', {
          userId: user.id,
          username: user.username,
          token,
          publicKey: user.publicKey,
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
      console.log('[CLIENT] Received room:created event:', room);
      useChatStore.getState().addRoom(room);
    });

    this.socket.on('room:updated', ({ roomId, updates }: { roomId: string; updates: Partial<ChatRoom> }) => {
      useChatStore.getState().updateRoom(roomId, updates);
    });

    // Message events
    this.socket.on('message:new', async (data: { roomId: string; message: Message }) => {
      console.log('[CLIENT] Received message:new:', data);
      const { roomId, message } = data;

      // Determine if this is own message
      const { user } = useAuthStore.getState();
      const isOwn = user ? message.senderId === user.id : false;

      // Add isOwn field to message
      const messageWithOwnFlag = {
        ...message,
        isOwn,
        status: isOwn ? 'sent' : 'delivered' as Message['status'],
      };

      console.log('[CLIENT] Message isOwn:', isOwn, 'senderId:', message.senderId, 'my userId:', user?.id);

      // Decrypt message if encrypted
      if (message.encryptedContent) {
        try {
          console.log('[CLIENT] Decrypting message...');
          const decryptedContent = await encryptionService.decryptMessage(
            message.encryptedContent,
            undefined // TODO: Get sender's public key for verification
          );
          messageWithOwnFlag.content = decryptedContent;
          console.log('[CLIENT] Message decrypted successfully');
        } catch (error) {
          console.error('[CLIENT] Failed to decrypt message:', error);
          messageWithOwnFlag.content = '🔒 Encrypted message (decryption failed)';
        }
      }

      console.log('[CLIENT] Adding message to store for room:', roomId);
      useChatStore.getState().addMessage(roomId, messageWithOwnFlag);

      // Show notification if message is from another user and room is not selected
      if (!isOwn) {
        const selectedRoom = useChatStore.getState().selectedRoom;
        if (selectedRoom?.id !== roomId) {
          // Get room name
          const room = useChatStore.getState().rooms.find(r => r.id === roomId);
          const roomName = room?.name || 'Unknown';
          
          // Get notification message based on type
          let notificationMessage = messageWithOwnFlag.content;
          if (messageWithOwnFlag.type === 'voice') {
            notificationMessage = 'sent a voice message';
          } else if (messageWithOwnFlag.type === 'file' && messageWithOwnFlag.fileInfo) {
            const { type, isImage } = messageWithOwnFlag.fileInfo;
            if (isImage || type?.startsWith('image/')) {
              notificationMessage = 'sent an image';
            } else if (type?.startsWith('video/')) {
              notificationMessage = 'sent a video';
            } else {
              notificationMessage = 'sent a file';
            }
          }

          useNotificationStore.getState().addNotification({
            title: roomName,
            message: `${message.senderName}: ${notificationMessage}`,
            roomId,
            senderName: message.senderName,
            type: messageWithOwnFlag.type,
          });
        }
      }
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
  async sendMessage(
    roomId: string, 
    content: string, 
    recipientPublicKeys?: string[],
    options?: { type?: 'text' | 'file' | 'voice'; fileInfo?: any }
  ) {
    if (!this.socket) {
      console.error('[CLIENT] Cannot send message: socket not connected');
      return;
    }

    console.log('[CLIENT] Sending message to room:', roomId);
    const tempId = `temp-${Date.now()}`;
    const { user } = useAuthStore.getState();

    if (!user) return;

    const messageType = options?.type || 'text';

    // Create temporary message
    const tempMessage: Message = {
      id: tempId,
      senderId: user.id,
      senderName: user.username,
      content,
      timestamp: new Date(),
      type: messageType,
      status: 'sending',
      isOwn: true,
      fileInfo: options?.fileInfo,
    };

    useChatStore.getState().addMessage(roomId, tempMessage);

    // Encrypt message (only for text, skip for files/voice)
    let encryptedContent: string | undefined;
    if (messageType === 'text' && recipientPublicKeys && recipientPublicKeys.length > 0) {
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
      type: messageType,
      fileInfo: options?.fileInfo,
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
    if (!this.socket) {
      console.error('[CLIENT] Cannot join room: socket not connected');
      return;
    }
    console.log('[CLIENT] Joining room:', roomId);
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
