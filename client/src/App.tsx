import { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { ChatLayout } from './components/ChatLayout';
import { useAuthStore } from './stores/authStore';
import { encryptionService } from './services/encryption';
import { useChat } from './hooks/useChat';
import './index.css';

// Wrapper component that connects to chat
const ChatApp = () => {
  const chat = useChat();

  return (
    <div className="h-screen w-full bg-[var(--background)]">
      <ChatLayout chat={chat} />
    </div>
  );
};

function App() {
  const { isAuthenticated, privateKey, user } = useAuthStore();
  const [showAuth, setShowAuth] = useState(!isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setShowAuth(!isAuthenticated);
  }, [isAuthenticated]);

  // Load encryption keys on app start if user is authenticated
  useEffect(() => {
    const loadKeys = async () => {
      if (isAuthenticated && privateKey && user) {
        try {
          // Prompt for password to decrypt private key
          const password = prompt('Enter your password to unlock your encryption keys:');
          if (password) {
            await encryptionService.loadKeyPair(privateKey, password);
            console.log('[APP] Encryption keys loaded successfully');
          } else {
            // User cancelled, log them out
            useAuthStore.getState().logout();
          }
        } catch (error) {
          console.error('[APP] Failed to load encryption keys:', error);
          alert('Failed to unlock encryption keys. Please login again.');
          useAuthStore.getState().logout();
        }
      }
      setIsLoading(false);
    };

    loadKeys();
  }, [isAuthenticated, privateKey, user]);

  const handleAuthenticated = () => {
    setShowAuth(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {showAuth ? (
        <AuthScreen onAuthenticated={handleAuthenticated} />
      ) : (
        <ChatApp />
      )}
    </>
  );
}

export default App;
