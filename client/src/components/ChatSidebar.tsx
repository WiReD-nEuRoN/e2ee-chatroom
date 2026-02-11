import type { ChatRoom } from '../types';
import { useState } from 'react';
import { chatService } from '../services/chat';
import { Avatar } from './Avatar';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  currentUser: { username: string; fingerprint: string; avatar?: string };
  onShowProfile?: () => void;
}

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
  onShowProfile,
}) => {
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChatUsername.trim()) {
      chatService.createRoom(newChatUsername.trim(), 'direct', [newChatUsername.trim()]);
      setNewChatUsername('');
      setShowNewChat(false);
    }
  };

  const filteredRooms = searchQuery.trim()
    ? rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (room.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : rooms;

  return (
    <div className="w-80 flex flex-col bg-[var(--background)] border-r border-[var(--border)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[var(--foreground)]">E2EE Chat</h1>
          <div className="flex items-center gap-2 text-xs text-green-500">
            <div className="w-2 h-2 rounded-full status-online animate-pulse-slow" />
            <span>Encrypted</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-xl focus:border-[var(--ring)] focus:outline-none transition-colors text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none"
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

        {/* Add New User Button */}
        <button
          onClick={() => setShowNewChat(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-colors font-medium"
        >
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          Add New User
        </button>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-2xl p-6 w-96 shadow-2xl border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
              Add New User
            </h2>
            <form onSubmit={handleCreateChat}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newChatUsername}
                  onChange={(e) => setNewChatUsername(e.target.value)}
                  placeholder="Enter username to start chat..."
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:border-[var(--ring)] focus:outline-none transition-colors text-[var(--foreground)]"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewChat(false);
                    setNewChatUsername('');
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] hover:opacity-90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChatUsername.trim()}
                  className="flex-1 py-2 px-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 && searchQuery.trim() && (
          <div className="p-8 text-center">
            <p className="text-[var(--muted-foreground)] text-sm">
              No conversations found matching &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
        {filteredRooms.length === 0 && !searchQuery.trim() && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[var(--muted-foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm">
              No conversations yet.
              <br />
              Click &quot;Add New User&quot; to start!
            </p>
          </div>
        )}
        {filteredRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`w-full p-4 flex items-center gap-3 transition-all duration-200 hover:bg-[var(--muted)] ${
              selectedRoom?.id === room.id
                ? 'bg-[var(--accent)] border-l-2 border-[var(--primary)]'
                : 'border-l-2 border-transparent'
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <Avatar
                src={room.participants[0]?.avatar}
                name={room.name}
                size="md"
                showOnlineIndicator={room.type === 'direct'}
                isOnline={room.type === 'direct' && room.participants[0]?.isOnline}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="font-medium text-[var(--foreground)] truncate">
                  {room.name}
                </h3>
                {room.lastMessage && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatTime(room.lastMessage.timestamp)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted-foreground)] truncate">
                  {room.lastMessage
                    ? `${
                        room.lastMessage.isOwn ? 'You: ' : ''
                      }${room.lastMessage.content}`
                    : 'No messages yet'}
                </p>
                {room.unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full">
                    {room.unreadCount} new
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center gap-3">
          <Avatar
            src={currentUser.avatar}
            name={currentUser.username}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--foreground)] truncate">
              {currentUser.username}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">
              {currentUser.fingerprint}
            </p>
          </div>
          <button 
            onClick={onShowProfile}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]"
            title="Settings"
          >
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
