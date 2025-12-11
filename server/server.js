import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import challengeRoutes from './routes/challenges.js';
import chatRoutes from './routes/chats.js';
import roadmapRoutes from './routes/roadmaps.js';
import snippetRoutes from './routes/snippets.js';
import chatHistoryRoutes from './routes/chatHistory.js';
import communityRoutes from './routes/community.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/community', communityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });
