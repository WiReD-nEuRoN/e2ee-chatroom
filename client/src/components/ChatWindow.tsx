import type { ChatRoom, Message } from '../types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  room: ChatRoom;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onTyping: () => void;
  isTyping: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  room,
  messages,
  onSendMessage,
  onTyping,
  isTyping,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
      <ChatHeader room={room} isTyping={isTyping} />
      <MessageList messages={messages} />
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        disabled={!room.isEncrypted}
      />
    </div>
  );
};
