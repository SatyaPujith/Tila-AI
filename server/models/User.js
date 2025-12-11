import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  streak: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  rank: { type: String, default: 'Script Kiddie' },
  problemsSolvedEasy: { type: Number, default: 0 },
  problemsSolvedMedium: { type: Number, default: 0 },
  problemsSolvedHard: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
