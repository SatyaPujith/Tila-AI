import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.streak,
        xp: user.xp,
        rank: user.rank,
        problemsSolvedEasy: user.problemsSolvedEasy,
        problemsSolvedMedium: user.problemsSolvedMedium,
        problemsSolvedHard: user.problemsSolvedHard
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.name,
      streak: user.streak,
      xp: user.xp,
      rank: user.rank,
      problemsSolvedEasy: user.problemsSolvedEasy,
      problemsSolvedMedium: user.problemsSolvedMedium,
      problemsSolvedHard: user.problemsSolvedHard
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update streak
    const today = new Date().setHours(0, 0, 0, 0);
    const lastLogin = new Date(user.lastLoginDate).setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      user.streak += 1;
    } else if (daysDiff > 1) {
      user.streak = 1;
    }

    user.lastLoginDate = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.streak,
        xp: user.xp,
        rank: user.rank,
        problemsSolvedEasy: user.problemsSolvedEasy,
        problemsSolvedMedium: user.problemsSolvedMedium,
        problemsSolvedHard: user.problemsSolvedHard
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
