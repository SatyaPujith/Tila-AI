import express from 'express';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all challenges for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get challenges by topic
router.get('/topic/:topic', authMiddleware, async (req, res) => {
  try {
    const challenges = await Challenge.find({ 
      userId: req.userId, 
      topic: req.params.topic 
    }).sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create challenge
router.post('/', authMiddleware, async (req, res) => {
  try {
    const challenge = new Challenge({
      userId: req.userId,
      ...req.body
    });
    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark challenge as solved
router.post('/:id/solve', authMiddleware, async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ _id: req.params.id, userId: req.userId });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (!challenge.solved) {
      challenge.solved = true;
      challenge.lastAttempt = new Date();
      await challenge.save();

      // Update user stats
      const user = await User.findById(req.userId);
      if (challenge.difficulty === 'Easy') {
        user.problemsSolvedEasy += 1;
        user.xp += 10;
      } else if (challenge.difficulty === 'Medium') {
        user.problemsSolvedMedium += 1;
        user.xp += 30;
      } else if (challenge.difficulty === 'Hard') {
        user.problemsSolvedHard += 1;
        user.xp += 60;
      }

      // Update rank based on XP
      if (user.xp >= 1000) user.rank = 'Architect';
      else if (user.xp >= 500) user.rank = 'Senior Dev';
      else if (user.xp >= 200) user.rank = 'Junior Dev';
      else user.rank = 'Script Kiddie';

      await user.save();

      res.json({ challenge, user });
    } else {
      res.json({ challenge, message: 'Already solved' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start challenge
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ _id: req.params.id });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    challenge.lastAttempt = new Date();
    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete challenge
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { solution } = req.body;
    const challenge = await Challenge.findOne({ _id: req.params.id });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    challenge.solved = true;
    challenge.lastAttempt = new Date();
    await challenge.save();

    // Update user stats
    const user = await User.findById(req.userId);
    if (challenge.difficulty === 'Easy') {
      user.problemsSolvedEasy += 1;
      user.xp += 10;
    } else if (challenge.difficulty === 'Medium') {
      user.problemsSolvedMedium += 1;
      user.xp += 30;
    } else if (challenge.difficulty === 'Hard') {
      user.problemsSolvedHard += 1;
      user.xp += 60;
    }

    // Update rank based on XP
    if (user.xp >= 1000) user.rank = 'Architect';
    else if (user.xp >= 500) user.rank = 'Senior Dev';
    else if (user.xp >= 200) user.rank = 'Junior Dev';
    else user.rank = 'Script Kiddie';

    await user.save();

    res.json({ 
      challenge, 
      user,
      feedback: 'Great job! Challenge completed successfully.' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk create challenges
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { challenges, topic } = req.body;
    
    const savedChallenges = await Promise.all(
      challenges.map(c => {
        const challenge = new Challenge({
          userId: req.userId,
          title: c.title,
          difficulty: c.difficulty,
          description: c.description,
          starterCode: c.starterCode || '',
          testCases: c.testCases || [],
          topic: topic || 'General'
        });
        return challenge.save();
      })
    );
    
    res.status(201).json(savedChallenges);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get global challenges (public challenges)
router.get('/global', authMiddleware, async (req, res) => {
  try {
    // Return challenges from all users (you can add filters/pagination)
    const challenges = await Challenge.find().limit(50).sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
