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
    console.error('Get chat histories error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create or update chat history
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, messages } = req.body;
    
    console.log('Creating chat history:', { title, messageCount: messages?.length || 0 });
    
    // Clean and validate messages
    const cleanMessages = (messages || []).map(msg => ({
      role: String(msg.role || 'user').toLowerCase(),
      text: String(msg.text || msg.content || ''),
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    }));
    
    const history = new ChatHistory({
      userId: req.userId,
      title: String(title || 'Chat Session'),
      messages: cleanMessages
    });
    
    await history.save();
    console.log('Chat history created:', history._id);
    res.status(201).json(history);
  } catch (error) {
    console.error('Create chat history error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update chat history
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if ID is a valid MongoDB ObjectId
    const mongoose = await import('mongoose');
    const isValidObjectId = mongoose.default.Types.ObjectId.isValid(req.params.id);
    
    console.log('Update chat history request:', { 
      id: req.params.id, 
      isValidObjectId,
      messageCount: req.body.messages?.length || 0 
    });
    
    if (!isValidObjectId) {
      // If not a valid ObjectId, it might be a temporary frontend ID
      // Create a new chat history instead
      const { messages, title } = req.body;
      
      // Clean and validate messages
      const cleanMessages = (messages || []).map(msg => ({
        role: String(msg.role || 'user').toLowerCase(),
        text: String(msg.text || msg.content || ''),
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));
      
      const history = new ChatHistory({
        userId: req.userId,
        title: String(title || messages?.[0]?.text?.substring(0, 50) || 'Chat Session'),
        messages: cleanMessages
      });
      await history.save();
      console.log('New chat history created from temporary ID:', history._id);
      return res.status(201).json(history);
    }
    
    // Clean and validate messages
    const cleanMessages = (req.body.messages || []).map(msg => ({
      role: String(msg.role || 'user').toLowerCase(),
      text: String(msg.text || msg.content || ''),
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    }));
    
    const updateData = { updatedAt: new Date() };
    if (req.body.messages !== undefined) updateData.messages = cleanMessages;
    if (req.body.title !== undefined) updateData.title = String(req.body.title);
    
    const history = await ChatHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: false }
    );
    
    if (!history) {
      console.log('Chat history not found:', req.params.id);
      return res.status(404).json({ error: 'Chat history not found' });
    }
    
    console.log('Chat history updated:', req.params.id);
    res.json(history);
  } catch (error) {
    console.error('Update chat history error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
    
    console.log('Chat history deleted:', req.params.id);
    res.json({ message: 'Chat history deleted' });
  } catch (error) {
    console.error('Delete chat history error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;
