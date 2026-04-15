import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { initSocket } from './socket.js';
import authRoutes  from './routes/auth.js';
import userRoutes  from './routes/users.js';
import roomRoutes  from './routes/rooms.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

// Routes
app.use('/auth',  authRoutes);
app.use('/users', userRoutes);
app.use('/rooms', roomRoutes);
app.get('/', (req, res) => res.json({ status: 'ChatApp running ✅' }));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
});
initSocket(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));