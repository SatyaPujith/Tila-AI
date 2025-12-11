import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'model', 'assistant'], required: true },
    text: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
chatHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('ChatHistory', chatHistorySchema);
