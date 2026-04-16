// // ─────────────────────────────────────────
// // socket.js — Single shared Socket.io instance
// // ─────────────────────────────────────────

// import { io } from 'socket.io-client';

// // Connect to the backend server
// // This runs ONCE when the module is first imported.
// // Every component that imports `socket` shares the same connection.
// const socket = io('http://localhost:3000', {
//   autoConnect: true,  // Connects immediately on import
// });

// export default socket;
// ─────────────────────────────────────────
// socket.js — Single shared Socket.io instance
// ─────────────────────────────────────────

import { io } from 'socket.io-client';

// Use deployed backend URL in production, localhost in development
const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const socket = io(URL, {
  autoConnect: true,
  transports: ['websocket'], // improves reliability on Render
});

export default socket;
