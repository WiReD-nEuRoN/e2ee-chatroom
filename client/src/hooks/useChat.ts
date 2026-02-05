import { useEffect, useCallback } from 'react';
import { chatService } from '../services/chat';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import type { Message } from '../types';

export const useChat = () => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    rooms,
    selectedRoom,
    messages,
    typingUsers,
    isConnecting,
    connectionError,
    selectRoom,
    setConnecting,
  } = useChatStore();

  // Connect to chat server when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setConnecting(true);
      chatService.connect();

      return () => {
        chatService.disconnect();
      };
    }
  }, [isAuthenticated, user, setConnecting]);

  // Handle room selection
  useEffect(() => {
    if (selectedRoom) {
      chatService.joinRoom(selectedRoom.id);

      return () => {
        chatService.leaveRoom(selectedRoom.id);
      };
    }
  }, [selectedRoom?.id]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedRoom || !user) return;

      const recipientKeys = selectedRoom.participants
        .filter((p) => p.id !== user.id)
        .map((p) => p.publicKey);

      await chatService.sendMessage(selectedRoom.id, content, recipientKeys);
    },
    [selectedRoom, user]
  );

  const handleTyping = useCallback(() => {
    if (!selectedRoom) return;
    chatService.startTyping(selectedRoom.id);
  }, [selectedRoom]);

  const getRoomMessages = useCallback(
    (roomId: string): Message[] => {
      return messages[roomId] || [];
    },
    [messages]
  );

  const isTyping = useCallback(
    (roomId: string): boolean => {
      const roomTyping = typingUsers[roomId] || [];
      return roomTyping.length > 0;
    },
    [typingUsers]
  );

  const getTypingNames = useCallback(
    (roomId: string): string[] => {
      const roomTyping = typingUsers[roomId] || [];
      return roomTyping.map((u) => u.username);
    },
    [typingUsers]
  );

  const createRoom = useCallback(
    (name: string, type: 'direct' | 'group', participantIds: string[]) => {
      chatService.createRoom(name, type, participantIds);
    },
    []
  );

  const markAsRead = useCallback((roomId: string, messageId: string) => {
    chatService.markAsRead(roomId, messageId);
  }, []);

  return {
    // State
    rooms,
    selectedRoom,
    isConnecting,
    connectionError,
    currentUser: user,

    // Actions
    selectRoom,
    sendMessage,
    handleTyping,
    createRoom,
    markAsRead,

    // Helpers
    getRoomMessages,
    isTyping,
    getTypingNames,
  };
};
