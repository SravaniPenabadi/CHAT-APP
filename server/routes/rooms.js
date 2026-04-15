import express from 'express';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: 1 });
    res.json(rooms);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Create room
router.post('/', async (req, res) => {
  const { name, description, createdBy } = req.body;
  try {
    if (!name || !createdBy)
      return res.status(400).json({ error: 'Name and creator required' });
    if (await Room.findOne({ name }))
      return res.status(400).json({ error: 'Room name already taken' });
    const room = await Room.create({
      name, description, createdBy,
      members: [createdBy]
    });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join room
router.post('/:id/join', async (req, res) => {
  const { username } = req.body;
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.members.includes(username)) {
      room.members.push(username);
      await room.save();
    }
    res.json(room);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Leave room
router.post('/:id/leave', async (req, res) => {
  const { username } = req.body;
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    room.members = room.members.filter(m => m !== username);
    await room.save();
    res.json(room);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get room messages
router.get('/:id/messages', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const messages = await Message.find({ room: room.name, type: 'room' })
      .sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;