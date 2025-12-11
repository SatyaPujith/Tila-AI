import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true }, // e.g., "Arrays", "Dynamic Programming"
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  explanation: { type: String, default: '' },
  tags: [String],
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
snippetSchema.index({ userId: 1, topic: 1 });

export default mongoose.model('Snippet', snippetSchema);
