export interface User {
  id: string;
  username: string;
  publicKey: string;
  fingerprint: string;
  isOnline: boolean;
  lastSeen?: Date;
  avatar?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  encryptedContent?: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  isOwn: boolean;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    data?: string;
    isImage?: boolean;
    duration?: number;
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isEncrypted: boolean;
  createdAt: Date;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  roomId: string;
  timestamp: Date;
}
