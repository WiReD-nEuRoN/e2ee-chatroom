import type { ChatRoom } from '../types';

import { useState } from 'react';
import { chatService } from '../services/chat';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  currentUser: { username: string; fingerprint: string };
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

const formatTime = (date: Date) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diff = now.getTime() - messageDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'short' });
  } else {
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
  currentUser,
}) => {
  return (
    <div className="w-80 flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold gradient-text">E2EE Chat</h1>
          <div className="flex items-center gap-2 text-xs text-[var(--success)]">
            <div className="w-2 h-2 rounded-full status-online animate-pulse-slow" />
            <span>Encrypted</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`w-full p-4 flex items-center gap-3 transition-all duration-200 hover:bg-[var(--bg-tertiary)] ${
              selectedRoom?.id === room.id
                ? 'bg-[var(--bg-tertiary)] border-l-2 border-[var(--accent-primary)]'
                : 'border-l-2 border-transparent'
            }`}
          >
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
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="font-medium text-[var(--text-primary)] truncate">
                  {room.name}
                </h3>
                {room.lastMessage && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatTime(room.lastMessage.timestamp)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {room.lastMessage
                    ? `${
                        room.lastMessage.isOwn ? 'You: ' : ''
                      }${room.lastMessage.content}`
                    : 'No messages yet'}
                </p>
                {room.unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-[var(--accent-primary)] text-white rounded-full">
                    {room.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(currentUser.username)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {currentUser.username}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {currentUser.fingerprint}
            </p>
          </div>
          <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]">
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
