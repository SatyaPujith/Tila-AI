# TIVA AI - Quick Startup Guide

## ✅ Current Status

Your backend server is **RUNNING** on port 5000 and connected to MongoDB!

## 🚀 How to Start the Application

### Option 1: Using Batch Files (Windows - Easiest)

1. **Start Backend** (if not already running):
   - Double-click `start-backend.bat`
   - Wait for: `✅ Connected to MongoDB` and `🚀 Server running on port 5000`

2. **Start Frontend** (in a new terminal):
   - Double-click `start-frontend.bat`
   - Wait for the dev server to start
   - Open browser to the URL shown (usually `http://localhost:5173`)

### Option 2: Using Command Line

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🎯 Using the Application

### Landing Page Options:

1. **Sign In** - Login with existing account
2. **Sign Up** - Create new account  
3. **Guest Demo** - Try without authentication (no data saved)

### Authentication Features:

- ✅ Full user registration with validation
- ✅ Login with email/password
- ✅ Error messages for invalid credentials
- ✅ "No account found" message for new users
- ✅ "Account already exists" for duplicate emails
- ✅ Guest mode for trying the app

### After Login:

- Create and manage projects
- Upload study files
- Chat with AI tutor
- Generate coding challenges
- View learning roadmaps
- Save code snippets
- View your profile stats

## 🔧 Configuration

### Backend is already configured:
- MongoDB: Connected to Atlas cluster
- JWT Secret: Set
- Port: 5000
- CORS: Enabled for frontend

### Frontend configuration:
- Gemini API Key: Already set in `.env.local`
- API URL: Points to `http://localhost:5000/api`

## ⚠️ Troubleshooting

### "Failed to fetch" or "ERR_CONNECTION_REFUSED"
**Solution:** Start the backend server first
```bash
cd server
npm start
```

### "MongoDB connection error"
**Solution:** Check internet connection (using MongoDB Atlas)

### Port 5000 already in use
**Solution:** Kill the process using port 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend not loading
**Solution:** Make sure you ran `npm install` in root directory

## 📝 Quick Test

1. ✅ Backend running? Check terminal for "🚀 Server running on port 5000"
2. ✅ Frontend running? Open `http://localhost:5173`
3. ✅ Try Guest Demo - Should work immediately
4. ✅ Try Sign Up - Create a test account
5. ✅ Try Sign In - Login with your account

## 🎉 You're All Set!

The backend is running and ready to accept connections. Just start the frontend and you're good to go!

### Current Backend Status:
- ✅ Server: Running on port 5000
- ✅ Database: Connected to MongoDB
- ✅ Routes: All API endpoints active
- ✅ Authentication: JWT enabled

### Next Steps:
1. Start the frontend: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Click "Guest Demo" to try immediately, or "Sign Up" to create an account
