import { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { ChatLayout } from './components/ChatLayout';
import { useAuthStore } from './stores/authStore';
import { useChat } from './hooks/useChat';
import './index.css';

// Wrapper component that connects to chat
const ChatApp = () => {
  const chat = useChat();
  
  return (
    <div className="h-screen w-full bg-[var(--bg-primary)]">
      <ChatLayout chat={chat} />
    </div>
  );
};

function App() {
  const { isAuthenticated } = useAuthStore();
  const [showAuth, setShowAuth] = useState(!isAuthenticated);

  useEffect(() => {
    setShowAuth(!isAuthenticated);
  }, [isAuthenticated]);

  const handleAuthenticated = () => {
    setShowAuth(false);
  };

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
