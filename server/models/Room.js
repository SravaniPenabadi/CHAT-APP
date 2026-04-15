import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  createdBy:   { type: String, required: true },
  members:     [{ type: String }],
}, { timestamps: true });

export default mongoose.model('Room', RoomSchema);