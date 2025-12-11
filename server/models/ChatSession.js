import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  title: { type: String, default: 'New Chat' },
  messages: [{
    id: String,
    role: String,
    text: String,
    timestamp: Date,
    codeSnippet: String
  }],
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now }
});

export default mongoose.model('ChatSession', chatSessionSchema);
