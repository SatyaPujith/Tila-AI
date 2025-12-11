import express from 'express';
import ChatHistory from '../models/ChatHistory.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all chat histories
router.get('/', authMiddleware, async (req, res) => {
  try {
    const histories = await ChatHistory.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt messages');
    res.json(histories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single chat history
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    if (!history) {
      return res.status(404).json({ error: 'Chat history not found' });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update chat history
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, messages } = req.body;
    
    const history = new ChatHistory({
      userId: req.userId,
      title,
      messages
    });
    
    await history.save();
    res.status(201).json(history);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update chat history
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if ID is a valid MongoDB ObjectId
    const mongoose = await import('mongoose');
    const isValidObjectId = mongoose.default.Types.ObjectId.isValid(req.params.id);
    
    if (!isValidObjectId) {
      // If not a valid ObjectId, it might be a temporary frontend ID
      // Create a new chat history instead
      const { messages, title } = req.body;
      const history = new ChatHistory({
        userId: req.userId,
        title: title || messages?.[0]?.text?.substring(0, 50) || 'Chat Session',
        messages: messages || []
      });
      await history.save();
      return res.status(201).json(history);
    }
    
    const updateData = { updatedAt: new Date() };
    if (req.body.messages !== undefined) updateData.messages = req.body.messages;
    if (req.body.title !== undefined) updateData.title = req.body.title;
    
    const history = await ChatHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    );
    
    if (!history) {
      return res.status(404).json({ error: 'Chat history not found' });
    }
    
    res.json(history);
  } catch (error) {
    console.error('Update chat history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete chat history
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const history = await ChatHistory.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!history) {
      return res.status(404).json({ error: 'Chat history not found' });
    }
    
    res.json({ message: 'Chat history deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
