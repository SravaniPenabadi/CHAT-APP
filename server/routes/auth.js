import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields required' });
    if (await User.findOne({ username }))
      return res.status(400).json({ error: 'Username already taken' });
    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ error: 'All fields required' });
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: 'No account found with this email' });
    if (!await bcrypt.compare(password, user.password))
      return res.status(400).json({ error: 'Wrong password' });
    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: 'No account found with this email' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000;
    await user.save();
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `"ChatApp" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Reset your ChatApp password',
      html: `<div style="font-family:sans-serif;padding:32px;background:#111b21;color:#fff;border-radius:12px;max-width:480px;margin:auto">
        <h2 style="color:#00a884">Reset Your Password</h2>
        <p>Click below to reset your password. Expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#00a884;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
        <p style="color:#8696a0;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>`
    });
    res.json({ success: true, message: 'Reset link sent!' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });
    if (!user)
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;