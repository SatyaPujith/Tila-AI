import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get user profile with all stats
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate impact score
    const impactScore = (user.problemsSolvedEasy * 10) + (user.problemsSolvedMedium * 30) + (user.problemsSolvedHard * 60);
    
    // Get leaderboard position
    const totalUsers = await User.countDocuments();
    const usersWithHigherScore = await User.countDocuments({ impactScore: { $gt: impactScore } });
    const rank = usersWithHigherScore + 1;
    const percentile = Math.round(((totalUsers - usersWithHigherScore) / totalUsers) * 100);

    // Convert problemsPerDay Map to object for JSON serialization
    const problemsPerDay = {};
    if (user.problemsPerDay && user.problemsPerDay.size > 0) {
      user.problemsPerDay.forEach((value, key) => {
        problemsPerDay[key] = value;
      });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      rank: user.rank,
      streak: user.streak,
      xp: user.xp,
      impactScore,
      problemsSolvedEasy: user.problemsSolvedEasy,
      problemsSolvedMedium: user.problemsSolvedMedium,
      problemsSolvedHard: user.problemsSolvedHard,
      totalProblemsSolved: user.problemsSolvedEasy + user.problemsSolvedMedium + user.problemsSolvedHard,
      problemsPerDay,
      leaderboardRank: rank,
      leaderboardPercentile: percentile,
      lastSolvedDate: user.lastSolvedDate,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update problems solved for a day
router.post('/:userId/log-problem', authMiddleware, async (req, res) => {
  try {
    const { difficulty, date } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update problems per day
    const dateStr = date || new Date().toISOString().split('T')[0];
    const currentCount = user.problemsPerDay.get(dateStr) || 0;
    user.problemsPerDay.set(dateStr, currentCount + 1);

    // Update difficulty counters
    if (difficulty === 'Easy') user.problemsSolvedEasy += 1;
    else if (difficulty === 'Medium') user.problemsSolvedMedium += 1;
    else if (difficulty === 'Hard') user.problemsSolvedHard += 1;

    // Update impact score
    user.impactScore = (user.problemsSolvedEasy * 10) + (user.problemsSolvedMedium * 30) + (user.problemsSolvedHard * 60);
    user.lastSolvedDate = new Date();

    await user.save();

    res.json({ 
      success: true, 
      impactScore: user.impactScore,
      problemsSolvedEasy: user.problemsSolvedEasy,
      problemsSolvedMedium: user.problemsSolvedMedium,
      problemsSolvedHard: user.problemsSolvedHard
    });
  } catch (error) {
    console.error('Error logging problem:', error);
    res.status(500).json({ error: 'Failed to log problem' });
  }
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await User.find()
      .sort({ impactScore: -1 })
      .limit(limit)
      .select('name rank impactScore problemsSolvedEasy problemsSolvedMedium problemsSolvedHard _id');

    const leaderboard = users.map((user, index) => ({
      _id: user._id,
      id: user._id,
      rank: index + 1,
      name: user.name,
      rankTitle: user.rank,
      impactScore: user.impactScore,
      totalProblems: user.problemsSolvedEasy + user.problemsSolvedMedium + user.problemsSolvedHard
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Generate share code for current user
router.post('/share/generate', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate random share code if not exists
    if (!user.shareCode) {
      user.shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await user.save();
    }

    res.json({
      shareCode: user.shareCode,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile/${user.name}/${user.shareCode}`
    });
  } catch (error) {
    console.error('Error generating share code:', error);
    res.status(500).json({ error: 'Failed to generate share code' });
  }
});

// Get all users' impact scores (for admin/debugging)
router.get('/admin/all-scores', async (req, res) => {
  try {
    const users = await User.find().select('name problemsSolvedEasy problemsSolvedMedium problemsSolvedHard');
    
    const scores = users.map(user => {
      const easy = user.problemsSolvedEasy || 0;
      const medium = user.problemsSolvedMedium || 0;
      const hard = user.problemsSolvedHard || 0;
      const impactScore = (easy * 10) + (medium * 30) + (hard * 60);
      const total = easy + medium + hard;
      
      return {
        name: user.name,
        easy,
        medium,
        hard,
        total,
        impactScore,
        breakdown: {
          easyPoints: easy * 10,
          mediumPoints: medium * 30,
          hardPoints: hard * 60
        }
      };
    });
    
    const summary = {
      totalUsers: users.length,
      totalProblems: scores.reduce((sum, s) => sum + s.total, 0),
      totalImpactScore: scores.reduce((sum, s) => sum + s.impactScore, 0),
      averageImpactScore: Math.round(scores.reduce((sum, s) => sum + s.impactScore, 0) / users.length)
    };
    
    res.json({
      summary,
      users: scores.sort((a, b) => b.impactScore - a.impactScore)
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

export default router;
