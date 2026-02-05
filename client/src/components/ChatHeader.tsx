import type { ChatRoom } from '../types';

interface ChatHeaderProps {
  room: ChatRoom;
  isTyping: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({ room, isTyping }) => {
  const onlineCount = room.participants.filter((p) => p.isOnline).length;
  const totalCount = room.participants.length;

  return (
    <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                room.name
              )} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}
            >
              {getInitials(room.name)}
            </div>
            {room.type === 'direct' && room.participants[0]?.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--success)] border-2 border-[var(--bg-secondary)]" />
            )}
          </div>

          {/* Info */}
          <div>
            <h2 className="font-semibold text-[var(--text-primary)] text-lg">
              {room.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              {isTyping ? (
                <span className="flex items-center gap-1 text-[var(--accent-primary)]">
                  <span className="typing-dot w-1.5 h-1.5 bg-current rounded-full" />
                  <span className="typing-dot w-1.5 h-1.5 bg-current rounded-full" />
                  <span className="typing-dot w-1.5 h-1.5 bg-current rounded-full" />
                  <span className="ml-1">typing...</span>
                </span>
              ) : room.type === 'direct' ? (
                <span className="flex items-center gap-1.5">
                  {room.participants[0]?.isOnline ? (
                    <>
                      <span className="w-2 h-2 rounded-full status-online" />
                      Online
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full status-offline" />
                      Offline
                    </>
                  )}
                </span>
              ) : (
                <span>
                  {onlineCount} of {totalCount} online
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Encryption Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="hidden sm:inline">E2EE</span>
          </div>

          {/* Video Call */}
          <button className="p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>

          {/* Voice Call */}
          <button className="p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>

          {/* More Options */}
          <button className="p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
