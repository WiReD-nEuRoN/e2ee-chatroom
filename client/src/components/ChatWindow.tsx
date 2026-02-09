import type { ChatRoom, Message } from '../types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { chatService } from '../services/chat';

interface ChatWindowProps {
  room: ChatRoom;
  messages: Message[];
  onTyping: () => void;
  isTyping: boolean;
  onShowMedia?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  room,
  messages,
  onTyping,
  isTyping,
  onShowMedia,
}) => {
  const handleSendMessage = (content: string, type: 'text' | 'file' | 'voice' = 'text', fileInfo?: any) => {
    chatService.sendMessage(room.id, content, undefined, { type, fileInfo });
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
      <ChatHeader room={room} isTyping={isTyping} onShowMedia={onShowMedia} />
      <MessageList messages={messages} />
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={onTyping}
        disabled={!room.isEncrypted}
      />
    </div>
  );
};
