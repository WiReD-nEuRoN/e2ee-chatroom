import { create } from 'zustand';
import type { ChatRoom, Message } from '../types';

interface ChatState {
  // State
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, { userId: string; username: string; timestamp: number }[]>;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Actions
  setRooms: (rooms: ChatRoom[]) => void;
  addRoom: (room: ChatRoom) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  selectRoom: (room: ChatRoom | null) => void;
  
  setMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, messageId: string, updates: Partial<Message>) => void;
  
  setTyping: (roomId: string, user: { userId: string; username: string }) => void;
  clearTyping: (roomId: string, userId: string) => void;
  
  setConnecting: (value: boolean) => void;
  setConnectionError: (error: string | null) => void;
  
  // Helpers
  getRoomMessages: (roomId: string) => Message[];
  getUnreadCount: (roomId: string) => number;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  rooms: [],
  selectedRoom: null,
  messages: {},
  typingUsers: {},
  isConnecting: false,
  connectionError: null,

  setRooms: (rooms) => set({ rooms }),
  
  addRoom: (room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
    })),
  
  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    })),
  
  selectRoom: (room) => set({ selectedRoom: room }),

  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    })),
  
  addMessage: (roomId, message) =>
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      return {
        messages: {
          ...state.messages,
          [roomId]: [...roomMessages, message],
        },
      };
    }),
  
  updateMessage: (roomId, messageId, updates) =>
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        },
      };
    }),

  setTyping: (roomId, user) =>
    set((state) => {
      const roomTyping = state.typingUsers[roomId] || [];
      const filtered = roomTyping.filter((u) => u.userId !== user.userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: [...filtered, { ...user, timestamp: Date.now() }],
        },
      };
    }),
  
  clearTyping: (roomId, userId) =>
    set((state) => {
      const roomTyping = state.typingUsers[roomId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: roomTyping.filter((u) => u.userId !== userId),
        },
      };
    }),

  setConnecting: (isConnecting) => set({ isConnecting }),
  setConnectionError: (connectionError) => set({ connectionError }),

  getRoomMessages: (roomId) => get().messages[roomId] || [],
  
  getUnreadCount: (roomId) => {
    const room = get().rooms.find((r) => r.id === roomId);
    return room?.unreadCount || 0;
  },
}));
