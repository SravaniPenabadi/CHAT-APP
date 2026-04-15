import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  username:  String,
  text:      String,
  room:      { type: String, default: 'general' },
  type:      { type: String, enum: ['room', 'dm'], default: 'room' },
  recipient: { type: String, default: null }, // for DMs
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);