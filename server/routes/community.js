import express from 'express';
import CommunityPost from '../models/CommunityPost.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all community posts (public)
router.get('/', async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get posts by tag
router.get('/tag/:tag', async (req, res) => {
  try {
    const posts = await CommunityPost.find({ tags: req.params.tag })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's posts
router.get('/my-posts', authMiddleware, async (req, res) => {
  try {
    const posts = await CommunityPost.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { title, description, code, language, tags } = req.body;
    
    const post = new CommunityPost({
      userId: req.userId,
      author: user.name || user.username || 'Anonymous',
      title,
      description,
      code,
      language,
      tags: tags || []
    });
    
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await CommunityPost.findOne({ _id: req.params.id, userId: req.userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }
    
    const { title, description, code, language, tags } = req.body;
    post.title = title || post.title;
    post.description = description || post.description;
    post.code = code || post.code;
    post.language = language || post.language;
    post.tags = tags || post.tags;
    
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await CommunityPost.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Like post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const alreadyLiked = post.likedBy.includes(req.userId);
    if (alreadyLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => id.toString() !== req.userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      post.likedBy.push(req.userId);
      post.likes += 1;
    }
    
    await post.save();
    res.json({ likes: post.likes, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Fork post (copy to user's snippets)
router.post('/:id/fork', authMiddleware, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Increment fork count
    if (!post.forkedBy.includes(req.userId)) {
      post.forkedBy.push(req.userId);
      post.forks += 1;
      await post.save();
    }
    
    // Return the post data for the frontend to save as snippet
    res.json({ 
      forked: true, 
      forks: post.forks,
      snippet: {
        title: `Forked: ${post.title}`,
        code: post.code,
        language: post.language,
        explanation: post.description,
        tags: [...(post.tags || []), 'forked']
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
