import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username createdAt');
    res.json(users);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Search users
router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    const users = await User.find(
      { username: { $regex: q, $options: 'i' } },
      'username'
    ).limit(10);
    res.json(users);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get DM history
router.get('/dm/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      type: 'dm',
      $or: [
        { username: user1, recipient: user2 },
        { username: user2, recipient: user1 },
      ]
    }).sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;