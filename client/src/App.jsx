import { useState } from 'react';
import socket from './socket';
import Auth from './components/Auth';
import Chat from './components/Chat';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_user')); } catch { return null; }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('chat_theme') || 'dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('chat_theme', next);
  };

  const handleAuth = (userData) => {
    localStorage.setItem('chat_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_user');
    socket.disconnect();
    socket.connect();
    setUser(null);
  };

  if (!user) return <Auth onAuth={handleAuth} />;
  return <Chat user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />;
}