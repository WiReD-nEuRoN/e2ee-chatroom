import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'from-purple-500 to-indigo-500',
    'from-pink-500 to-red-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-purple-500',
    'from-cyan-500 to-blue-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  showOnlineIndicator = false,
  isOnline = false,
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getAvatarColor(
          name
        )} flex items-center justify-center text-white font-semibold shadow-lg overflow-hidden`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {showOnlineIndicator && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${
            size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'
          } rounded-full ${
            isOnline ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'
          } border-2 border-[var(--bg-secondary)]`}
        />
      )}
    </div>
  );
};
