import express from 'express';
import ChatSession from '../models/ChatSession.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all chat sessions for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.userId }).sort({ lastMessageAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single chat session
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new chat session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const session = new ChatSession({
      userId: req.userId,
      ...req.body
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add message to chat session
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    session.messages.push(req.body);
    session.lastMessageAt = new Date();
    await session.save();
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chat history (messages) for a session
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json(session.messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete chat session
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json({ message: 'Chat session deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
