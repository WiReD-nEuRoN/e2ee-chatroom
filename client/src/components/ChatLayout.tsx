import type { ChatRoom } from '../types';
import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ProfilePage } from './ProfilePage';
import { MediaPage } from './MediaPage';

interface ChatLayoutProps {
  chat: {
    rooms: ChatRoom[];
    selectedRoom: ChatRoom | null;
    isConnecting: boolean;
    connectionError: string | null;
    currentUser: { username: string; fingerprint: string } | null;
    selectRoom: (room: ChatRoom | null) => void;
    sendMessage: (content: string) => Promise<void>;
    handleTyping: () => void;
    getRoomMessages: (roomId: string) => any[];
    isTyping: (roomId: string) => boolean;
  };
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ chat }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showMedia, setShowMedia] = useState(false);

  const {
    rooms,
    selectedRoom,
    isConnecting,
    connectionError,
    currentUser,
    selectRoom,
    handleTyping,
    getRoomMessages,
    isTyping,
  } = chat;

  const messages = selectedRoom ? getRoomMessages(selectedRoom.id) : [];

  if (!currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Connecting to chat server...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--error)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Connection Failed
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[var(--bg-primary)] overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelectRoom={selectRoom}
        currentUser={currentUser}
        onShowProfile={() => setShowProfile(true)}
      />

      {/* Main Chat Window */}
      {selectedRoom ? (
        <ChatWindow
          room={selectedRoom}
          messages={messages}
          onTyping={handleTyping}
          isTyping={isTyping(selectedRoom.id)}
          onShowMedia={() => setShowMedia(true)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
              <svg
                className="w-10 h-10 text-white"
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
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Welcome to E2EE Chat
            </h2>
            <p className="text-[var(--text-secondary)] max-w-sm">
              Select a conversation from the sidebar to start chatting securely
            </p>
            {rooms.length === 0 && (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                No conversations yet. Create one to get started!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <ProfilePage
          onClose={() => setShowProfile(false)}
          onProfileUpdate={(username, avatar) => {
            console.log('Profile updated:', { username, avatar });
            // Broadcast to other users would happen here via socket
          }}
        />
      )}

      {/* Media Modal */}
      {showMedia && selectedRoom && (
        <MediaPage
          messages={messages}
          onClose={() => setShowMedia(false)}
          roomName={selectedRoom.name}
        />
      )}
    </div>
  );
};
