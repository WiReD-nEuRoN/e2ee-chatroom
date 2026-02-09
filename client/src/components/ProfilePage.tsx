import { useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

interface ProfilePageProps {
  onClose: () => void;
  onProfileUpdate?: (username: string, avatar: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onClose, onProfileUpdate }) => {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Update user in store
      if (user) {
        const updatedUser = {
          ...user,
          username: displayName,
          avatar: avatar,
        };
        setUser(updatedUser);
        
        // Call parent callback to broadcast changes
        onProfileUpdate?.(displayName, avatar);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 w-96 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                {getInitials(displayName || user?.username || 'U')}
              </div>
            )}
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
              >
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Display Name Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!isEditing}
            placeholder="Enter your display name"
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl focus:border-[var(--accent-primary)] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]"
          />
        </div>

        {/* User ID Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            User ID
          </label>
          <div className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-secondary)] truncate">
            {user?.id || 'N/A'}
          </div>
        </div>

        {/* Fingerprint Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Public Key Fingerprint
          </label>
          <div className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-secondary)] truncate font-mono">
            {user?.fingerprint || 'N/A'}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2 px-4 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/80 transition-colors font-medium"
              >
                Edit Profile
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80 transition-colors font-medium"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-2 px-4 rounded-xl bg-[var(--success)] text-white hover:bg-[var(--success)]/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setDisplayName(user?.username || '');
                  setAvatar(user?.avatar || '');
                  setIsEditing(false);
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80 transition-colors font-medium"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
