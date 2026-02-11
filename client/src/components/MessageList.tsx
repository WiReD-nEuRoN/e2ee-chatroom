import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

const isSingleEmoji = (text: string): boolean => {
  // Remove whitespace and check if it's a single emoji
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Use a simpler approach - count grapheme clusters and check if it's just one emoji
  // This regex matches emoji sequences including flags and skin tone modifiers
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const segments = Array.from(segmenter.segment(trimmed)).map(s => s.segment);

  if (segments.length !== 1) return false;

  // Check if the single segment is an emoji
  const emoji = segments[0];
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]|[\u{2764}]|[\u{2764}\u{FE0F}]|[\u{2B50}]|[\u{2B55}]|[\u{1F44D}]|[\u{1F44C}]|[\u{1F44F}]|[\u{1F4A9}]|[\u{1F920}]|[\u{1F921}]|[\u{1F922}]|[\u{1F923}]|[\u{1F924}]|[\u{1F925}]|[\u{1F927}]|[\u{1F928}]|[\u{1F929}]|[\u{1F92A}]|[\u{1F92B}]|[\u{1F92C}]|[\u{1F92D}]|[\u{1F92E}]|[\u{1F92F}]|[\u{1F970}]|[\u{1F971}]|[\u{1F972}]|[\u{1F973}]|[\u{1F974}]|[\u{1F975}]|[\u{1F976}]|[\u{1F97A}]|[\u{1F9D0}]/u;

  return emojiRegex.test(emoji);
};

const isOnlyEmojis = (text: string): boolean => {
  // Check if text contains only emojis (no regular text)
  const trimmed = text.trim();
  if (!trimmed) return false;

  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const segments = Array.from(segmenter.segment(trimmed)).map(s => s.segment);

  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]|[\u{2764}]|[\u{2764}\u{FE0F}]|[\u{2B50}]|[\u{2B55}]|[\u{1F44D}]|[\u{1F44C}]|[\u{1F44F}]|[\u{1F4A9}]|[\u{1F920}]|[\u{1F921}]|[\u{1F922}]|[\u{1F923}]|[\u{1F924}]|[\u{1F925}]|[\u{1F927}]|[\u{1F928}]|[\u{1F929}]|[\u{1F92A}]|[\u{1F92B}]|[\u{1F92C}]|[\u{1F92D}]|[\u{1F92E}]|[\u{1F92F}]|[\u{1F970}]|[\u{1F971}]|[\u{1F972}]|[\u{1F973}]|[\u{1F974}]|[\u{1F975}]|[\u{1F976}]|[\u{1F97A}]|[\u{1F9D0}]/u;

  // Check if every segment is an emoji or whitespace
  return segments.every(segment => emojiRegex.test(segment) || /^\s*$/.test(segment));
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const shouldShowTime = (currentMsg: Message, prevMsg: Message | null): boolean => {
  if (!prevMsg) return true;
  const currentTime = new Date(currentMsg.timestamp).getTime();
  const prevTime = new Date(prevMsg.timestamp).getTime();
  const diffInMinutes = (currentTime - prevTime) / (1000 * 60);
  return diffInMinutes >= 40;
};

const getStatusIcon = (status: Message['status']) => {
  switch (status) {
    case 'sending':
      return (
        <svg
          className="w-3.5 h-3.5 text-[var(--muted-foreground)] animate-spin"
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
          className="w-3.5 h-3.5 text-[var(--muted-foreground)]"
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
          className="w-3.5 h-3.5 text-[var(--muted-foreground)]"
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
          className="w-3.5 h-3.5 text-[var(--primary)]"
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
          className="w-3.5 h-3.5 text-red-500"
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

const FileMessage = ({ message }: { message: Message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (message.fileInfo?.isImage) {
    return (
      <div className="max-w-[300px]">
        <img
          src={message.content}
          alt="Shared image"
          className="rounded-lg max-w-full cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => window.open(message.content, '_blank')}
        />
      </div>
    );
  }

  if (message.type === 'voice' && message.fileInfo?.data) {
    const handlePlay = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio(message.fileInfo!.data);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    };

    const duration = message.fileInfo?.duration || 0;
    const formattedDuration = duration > 0 
      ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
      : '0:00';

    return (
      <div className="flex items-center gap-3 min-w-[200px]">
        <button
          onClick={handlePlay}
          className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white hover:scale-105 transition-transform"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Voice message</span>
            <span className="text-xs text-[var(--muted-foreground)]">{formattedDuration}</span>
          </div>
          {/* Waveform visualization */}
          <div className="flex items-center gap-0.5 mt-1.5">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-[var(--primary)] transition-all duration-300 ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
                style={{
                  height: `${Math.max(4, Math.random() * 20)}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Regular file message
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--muted)] rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
        <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{message.fileInfo?.name || message.content}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {message.fileInfo?.size ? formatFileSize(message.fileInfo.size) : 'Unknown size'}
        </p>
      </div>
      {message.fileInfo?.data && (
        <a
          href={message.fileInfo.data}
          download={message.fileInfo.name}
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      )}
    </div>
  );
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
            <div className="px-4 py-1 rounded-full bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
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
            
            const prevMessage = index > 0 ? group.messages[index - 1] : null;
            const showTime = shouldShowTime(message, prevMessage);
            const isSingleEmojiMessage = isSingleEmoji(message.content) && message.type === 'text';

            return (
              <div key={message.id} className="space-y-1">
                {/* Time separator if needed */}
                {showTime && (
                  <div className="flex justify-center my-2">
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                )}
                
                <div
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
                      <div className="flex-shrink-0">
                        {showAvatar && (
                          <Avatar
                            src={message.senderAvatar}
                            name={message.senderName}
                            size="sm"
                          />
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className="flex flex-col">
                      {/* Sender name for group chats */}
                      {!message.isOwn && showAvatar && (
                        <span className="text-xs text-[var(--muted-foreground)] mb-1 ml-1">
                          {message.senderName}
                        </span>
                      )}

                      {/* Message Content */}
                      {isSingleEmojiMessage ? (
                        // Single emoji - Large display (WhatsApp style)
                        <div className="text-6xl animate-bounce-slow hover:scale-110 transition-transform cursor-default select-none">
                          {message.content.trim()}
                        </div>
                      ) : isOnlyEmojis(message.content) && message.type === 'text' ? (
                        // Multiple emojis only - Standard size, styled
                        <div className="text-2xl tracking-wider py-1">
                          {message.content.trim()}
                        </div>
                      ) : (
                        /* Regular Message with text */
                        <div
                          className={`px-4 py-2.5 shadow-sm ${
                            message.type === 'text'
                              ? message.isOwn
                                ? 'message-sent'
                                : 'message-received border border-[var(--border)]'
                              : 'bg-transparent border-none shadow-none'
                          }`}
                        >
                          {message.type === 'text' ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          ) : (
                            <FileMessage message={message} />
                          )}
                        </div>
                      )}

                      {/* Status (only for text messages with actual text, not just emojis) */}
                      {!isSingleEmojiMessage && !isOnlyEmojis(message.content) && message.type === 'text' && (
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            message.isOwn ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.isOwn && getStatusIcon(message.status)}
                        </div>
                      )}
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
