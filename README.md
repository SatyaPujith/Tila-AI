# TIVA AI - Your AI Learning Companion

A full-stack AI-powered learning platform with authentication, projects, challenges, and real-time chat.


## Features

- 🔐 User Authentication (Register/Login)
- 💬 AI Chat with Gemini
- 📁 Project Management
- 🏆 Coding Challenges
- 🗺️ Learning Roadmaps
- 💻 Code Editor
- 📓 Notebook Interface

## Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

**AI:**
- Google Gemini API

## Run Locally

**Prerequisites:** Node.js, MongoDB (or MongoDB Atlas account)

### Quick Start

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Configure Environment Variables:**
   
   Frontend (`.env.local`):
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```
   
   Note: ElevenLabs API key is optional - only needed for Live Connect voice feature
   
   Backend (`server/.env`):
   ```
   MONGODB_URI=mongodb+srv://your_connection_string
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

4. **Start Backend Server (Terminal 1):**
   ```bash
   cd server
   npm start
   ```
   
   Wait for: `✅ Connected to MongoDB` and `🚀 Server running on port 5000`

5. **Start Frontend Dev Server (Terminal 2):**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Important Notes

- **Backend must be running first** before using authentication features
- Guest Demo mode works without backend
- MongoDB connection string is already configured in `server/.env`
- JWT secret is already set in `server/.env`

### Troubleshooting

**Error: "Failed to fetch" or "ERR_CONNECTION_REFUSED"**
- Make sure the backend server is running on port 5000
- Check that MongoDB is connected (look for ✅ in server terminal)

**Error: "MongoDB connection error"**
- Verify your MongoDB URI in `server/.env`
- Check your internet connection (if using MongoDB Atlas)

**Guest Demo Mode**
- Click "Guest Demo" on landing page to try without authentication
- Guest users cannot save projects to database

## Project Structure

```
├── components/           # React components
│   ├── ChatArea.tsx
│   ├── CodeEditor.tsx
│   ├── NotebookSimple.tsx
│   └── SidebarIntegrated.tsx
├── services/            # API and AI services
│   ├── apiService.ts
│   └── geminiService.ts
├── server/              # Backend
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── App-integrated.tsx   # Main integrated app
└── types.ts            # TypeScript types
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Challenges
- `GET /api/challenges` - Get all challenges
- `POST /api/challenges/:id/start` - Start challenge
- `POST /api/challenges/:id/complete` - Complete challenge

### Chat
- `GET /api/chats/:id/messages` - Get chat history
- `POST /api/chats/:id/messages` - Send message

### Roadmaps
- `GET /api/roadmaps` - Get all roadmaps
- `POST /api/roadmaps` - Create roadmap
