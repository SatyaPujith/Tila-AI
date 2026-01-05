import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function checkImpactScores() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tila-ai');
    console.log('Connected to MongoDB');
    
    const users = await User.find().select('name problemsSolvedEasy problemsSolvedMedium problemsSolvedHard');
    
    console.log('\n=== USER IMPACT SCORES ===\n');
    
    let totalUsers = 0;
    let totalProblems = 0;
    let totalImpactScore = 0;
    
    users.forEach(user => {
      const easy = user.problemsSolvedEasy || 0;
      const medium = user.problemsSolvedMedium || 0;
      const hard = user.problemsSolvedHard || 0;
      const impactScore = (easy * 10) + (medium * 30) + (hard * 60);
      const total = easy + medium + hard;
      
      console.log(`User: ${user.name}`);
      console.log(`  Easy: ${easy} (+${easy * 10} pts)`);
      console.log(`  Medium: ${medium} (+${medium * 30} pts)`);
      console.log(`  Hard: ${hard} (+${hard * 60} pts)`);
      console.log(`  Total Problems: ${total}`);
      console.log(`  Impact Score: ${impactScore}`);
      console.log('');
      
      totalUsers++;
      totalProblems += total;
      totalImpactScore += impactScore;
    });
    
    console.log('=== SUMMARY ===');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Total Problems Solved: ${totalProblems}`);
    console.log(`Total Impact Score (All Users): ${totalImpactScore}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkImpactScores();
