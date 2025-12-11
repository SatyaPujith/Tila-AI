import express from 'express';
import Snippet from '../models/Snippet.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all snippets grouped by topic
router.get('/', authMiddleware, async (req, res) => {
  try {
    const snippets = await Snippet.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    // Group by topic
    const grouped = snippets.reduce((acc, snippet) => {
      const topic = snippet.topic;
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic].push(snippet);
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get snippets by topic
router.get('/topic/:topic', authMiddleware, async (req, res) => {
  try {
    const snippets = await Snippet.find({ 
      userId: req.userId, 
      topic: req.params.topic 
    }).sort({ createdAt: -1 });
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create snippet
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { topic, title, code, language, explanation, tags, difficulty } = req.body;
    
    const snippet = new Snippet({
      userId: req.userId,
      topic,
      title,
      code,
      language,
      explanation,
      tags: tags || [],
      difficulty: difficulty || 'Medium'
    });
    
    await snippet.save();
    res.status(201).json(snippet);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update snippet
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    
    res.json(snippet);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete snippet
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    
    res.json({ message: 'Snippet deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all topics
router.get('/topics/list', authMiddleware, async (req, res) => {
  try {
    const topics = await Snippet.distinct('topic', { userId: req.userId });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
