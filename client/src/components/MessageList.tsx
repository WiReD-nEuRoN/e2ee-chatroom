import { useEffect, useRef } from 'react';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusIcon = (status: Message['status']) => {
  switch (status) {
    case 'sending':
      return (
        <svg
          className="w-3.5 h-3.5 text-[var(--text-muted)] animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    case 'sent':
      return (
        <svg
          className="w-3.5 h-3.5 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    case 'delivered':
      return (
        <svg
          className="w-3.5 h-3.5 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7M5 13l4 4L19 7"
          />
        </svg>
      );
    case 'read':
      return (
        <svg
          className="w-3.5 h-3.5 text-[var(--accent-primary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7M5 13l4 4L19 7"
          />
        </svg>
      );
    case 'error':
      return (
        <svg
          className="w-3.5 h-3.5 text-[var(--error)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    default:
      return null;
  }
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const groupedMessages = messages.reduce(
    (groups: { date: string; messages: Message[] }[], message) => {
      const date = new Date(message.timestamp).toLocaleDateString();
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ date, messages: [message] });
      }

      return groups;
    },
    []
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          {/* Date Divider */}
          <div className="flex items-center justify-center">
            <div className="px-4 py-1 rounded-full bg-[var(--bg-tertiary)] text-xs text-[var(--text-muted)]">
              {new Date(group.date).toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Messages */}
          {group.messages.map((message, index) => {
            const showAvatar =
              !message.isOwn &&
              (index === 0 ||
                group.messages[index - 1].senderId !== message.senderId);

            return (
              <div
                key={message.id}
                className={`flex ${
                  message.isOwn ? 'justify-end' : 'justify-start'
                } animate-slide-in`}
              >
                <div
                  className={`flex gap-3 max-w-[70%] ${
                    message.isOwn ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar for received messages */}
                  {!message.isOwn && (
                    <div className="flex-shrink-0 w-8">
                      {showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                          {message.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    {/* Sender name for group chats */}
                    {!message.isOwn && showAvatar && (
                      <span className="text-xs text-[var(--text-muted)] mb-1 ml-1">
                        {message.senderName}
                      </span>
                    )}

                    <div
                      className={`px-4 py-2.5 shadow-sm ${
                        message.isOwn
                          ? 'message-sent'
                          : 'message-received border border-[var(--border-color)]'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    {/* Timestamp and Status */}
                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        message.isOwn ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.isOwn && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
