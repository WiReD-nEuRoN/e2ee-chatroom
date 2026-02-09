import { useMemo } from 'react';
import type { Message } from '../types';

interface MediaPageProps {
  messages: Message[];
  onClose: () => void;
  roomName: string;
}

type MediaType = 'photos' | 'videos' | 'links' | 'documents' | 'voice';

interface MediaItem {
  message: Message;
  url?: string;
  title?: string;
}

const extractMediaItems = (
  messages: Message[],
  type: MediaType
): MediaItem[] => {
  return messages
    .filter((msg) => {
      if (type === 'photos' && msg.fileInfo?.isImage) {
        return msg.fileInfo?.type?.startsWith('image/');
      }
      if (type === 'videos' && msg.fileInfo) {
        return msg.fileInfo?.type?.startsWith('video/');
      }
      if (type === 'documents' && msg.fileInfo) {
        return (
          msg.fileInfo?.type &&
          !msg.fileInfo?.type?.startsWith('image/') &&
          !msg.fileInfo?.type?.startsWith('video/') &&
          !msg.fileInfo?.type?.startsWith('audio/')
        );
      }
      if (type === 'voice' && msg.type === 'voice') {
        return true;
      }
      return false;
    })
    .map((msg) => ({
      message: msg,
      url: msg.fileInfo?.data,
      title: msg.fileInfo?.name,
    }));
};

const extractLinks = (messages: Message[]): MediaItem[] => {
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const items: MediaItem[] = [];

  messages.forEach((msg) => {
    if (msg.type === 'text' && msg.content) {
      const matches = msg.content.match(linkRegex);
      matches?.forEach((url) => {
        items.push({
          message: msg,
          url,
          title: url,
        });
      });
    }
  });

  return items;
};

const MediaSection = ({
  title,
  items,
  type,
}: {
  title: string;
  items: MediaItem[];
  type: MediaType;
}) => {
  if (items.length === 0) {
    return (
      <div className="pb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 px-4">
          {title}
        </h3>
        <div className="px-4 py-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">No {title.toLowerCase()} found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 px-4">
        {title}
      </h3>

      {type === 'photos' ? (
        <div className="px-4 grid grid-cols-3 gap-2">
          {items.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
            >
              <img
                src={item.url}
                alt="Photo"
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>
      ) : type === 'videos' ? (
        <div className="px-4 space-y-2">
          {items.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <svg
                className="w-6 h-6 text-[var(--accent-primary)] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">
                  {item.title || 'Video'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(item.message.timestamp).toLocaleDateString()}
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : type === 'voice' ? (
        <div className="px-4 space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg"
            >
              <svg
                className="w-6 h-6 text-[var(--accent-primary)] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">
                  {item.title || 'Voice message'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(item.message.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : type === 'links' ? (
        <div className="px-4 space-y-2">
          {items.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <svg
                className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--accent-primary)] truncate font-medium">
                  {item.url}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(item.message.timestamp).toLocaleDateString()}
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        // Documents
        <div className="px-4 space-y-2">
          {items.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              download={item.title}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <svg
                className="w-6 h-6 text-[var(--accent-primary)] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">
                  {item.title || 'Document'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(item.message.timestamp).toLocaleDateString()}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export const MediaPage: React.FC<MediaPageProps> = ({
  messages,
  onClose,
  roomName,
}) => {
  const photos = useMemo(() => extractMediaItems(messages, 'photos'), [messages]);
  const videos = useMemo(() => extractMediaItems(messages, 'videos'), [messages]);
  const voiceNotes = useMemo(() => extractMediaItems(messages, 'voice' as MediaType), [
    messages,
  ]);
  const links = useMemo(() => extractLinks(messages), [messages]);
  const documents = useMemo(
    () => extractMediaItems(messages, 'documents'),
    [messages]
  );

  const hasMedia =
    photos.length +
      videos.length +
      voiceNotes.length +
      links.length +
      documents.length >
    0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Media - {roomName}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!hasMedia ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[var(--text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-[var(--text-muted)] text-sm">
                  No media files found in this conversation
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <MediaSection title="Photos & Videos" items={photos} type="photos" />
              {videos.length > 0 && (
                <MediaSection title="Videos" items={videos} type="videos" />
              )}
              {links.length > 0 && (
                <MediaSection title="Links" items={links} type="links" />
              )}
              {voiceNotes.length > 0 && (
                <MediaSection
                  title="Voice Notes"
                  items={voiceNotes}
                  type={'voice' as MediaType}
                />
              )}
              {documents.length > 0 && (
                <MediaSection title="Documents" items={documents} type="documents" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
