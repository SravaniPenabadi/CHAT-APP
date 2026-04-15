import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username:           { type: String, required: true, unique: true, trim: true },
  email:              { type: String, required: true, unique: true, lowercase: true },
  password:           { type: String, required: true },
  resetToken:         { type: String },
  resetTokenExpires:  { type: Date },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);