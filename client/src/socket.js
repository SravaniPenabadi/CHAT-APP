// ─────────────────────────────────────────
// socket.js — Single shared Socket.io instance
// ─────────────────────────────────────────

import { io } from 'socket.io-client';

// Connect to the backend server
// This runs ONCE when the module is first imported.
// Every component that imports `socket` shares the same connection.
const socket = io('http://localhost:3000', {
  autoConnect: true,  // Connects immediately on import
});

export default socket;
