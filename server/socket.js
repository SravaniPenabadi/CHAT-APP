import Message from './models/Message.js';
import { io } from "socket.io-client";
const onlineUsers = new Map(); // socketId → { username, room, lastSeen }
const userSockets = new Map(); // username → socketId

export function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // ── Join ──────────────────────────────
    socket.on('user:join', async ({ username, room }) => {
      onlineUsers.set(socket.id, { username, room, lastSeen: new Date() });
      userSockets.set(username, socket.id);
      socket.join(room);

      // Room message history
      const history = await Message.find({ room, type: 'room' })
        .sort({ createdAt: 1 }).limit(100);
      socket.emit('message:history', history);

      // Broadcast online list
      io.emit('users:online', getOnlineInfo());

      // Notify room
      io.to(room).emit('room:update', {
        message: `${username} joined`,
        userCount: getRoomCount(room)
      });
    });

    // ── Switch room ───────────────────────
    socket.on('room:switch', async ({ room }) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      // Leave old room
      socket.leave(user.room);
      io.to(user.room).emit('room:update', {
        message: `${user.username} left`,
        userCount: getRoomCount(user.room)
      });

      // Join new room
      user.room = room;
      onlineUsers.set(socket.id, user);
      socket.join(room);

      const history = await Message.find({ room, type: 'room' })
        .sort({ createdAt: 1 }).limit(100);
      socket.emit('message:history', history);

      io.to(room).emit('room:update', {
        message: `${user.username} joined`,
        userCount: getRoomCount(room)
      });
    });

    // ── Room message ──────────────────────
    socket.on('message:send', async ({ text, room }) => {
      const user = onlineUsers.get(socket.id);
      if (!user || !text?.trim()) return;
      const saved = await Message.create({
        username: user.username, text: text.trim(),
        room, type: 'room'
      });
      io.to(room).emit('message:receive', {
        id: saved._id, username: saved.username,
        text: saved.text, timestamp: saved.createdAt
      });
    });

    // ── DM ───────────────────────────────
    socket.on('dm:send', async ({ text, to }) => {
      const user = onlineUsers.get(socket.id);
      if (!user || !text?.trim()) return;
      const saved = await Message.create({
        username: user.username, text: text.trim(),
        type: 'dm', recipient: to
      });
      const payload = {
        id: saved._id, username: user.username,
        from: user.username, text: saved.text,
        timestamp: saved.createdAt, type: 'dm'
      };
      socket.emit('dm:receive', payload);
      const recipientSocket = userSockets.get(to);
      if (recipientSocket) io.to(recipientSocket).emit('dm:receive', payload);
    });

    // ── Typing ────────────────────────────
    socket.on('typing:start', () => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;
      socket.to(user.room).emit('typing:start', { username: user.username });
    });

    socket.on('typing:stop', () => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;
      socket.to(user.room).emit('typing:stop', { username: user.username });
    });

    socket.on('dm:typing:start', ({ to }) => {
      const user = onlineUsers.get(socket.id);
      const recipientSocket = userSockets.get(to);
      if (user && recipientSocket)
        io.to(recipientSocket).emit('dm:typing:start', { from: user.username });
    });

    socket.on('dm:typing:stop', ({ to }) => {
      const user = onlineUsers.get(socket.id);
      const recipientSocket = userSockets.get(to);
      if (user && recipientSocket)
        io.to(recipientSocket).emit('dm:typing:stop', { from: user.username });
    });

    // ── Disconnect ────────────────────────
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        // Update last seen
        user.lastSeen = new Date();
        onlineUsers.delete(socket.id);
        userSockets.delete(user.username);
        io.emit('users:online', getOnlineInfo());
        io.to(user.room).emit('room:update', {
          message: `${user.username} left`,
          userCount: getRoomCount(user.room)
        });
        // Broadcast last seen
        io.emit('user:lastSeen', {
          username: user.username,
          lastSeen: user.lastSeen
        });
      }
    });
  });

  function getRoomCount(room) {
    let count = 0;
    onlineUsers.forEach(u => { if (u.room === room) count++; });
    return count;
  }

  function getOnlineInfo() {
    const info = {};
    onlineUsers.forEach(u => { info[u.username] = true; });
    return info; // { username: true }
  }
}