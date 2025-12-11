import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  description: { type: String, required: true },
  starterCode: { type: String, default: '' },
  testCases: [String],
  topic: { type: String, required: true },
  solved: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  lastAttempt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Challenge', challengeSchema);
