# TILA AI - AI-Powered Coding Tutor & Learning Platform

An intelligent coding education platform that combines AI tutoring, interactive code execution, learning roadmaps, and community features to help developers master programming concepts.

## Features

- **AI Coding Tutor** - Powered by Google Gemini for intelligent code explanations, debugging, and optimization
- **Interactive Code Editor** - Write, run, and test code with AI-simulated execution
- **Learning Roadmaps** - Visual learning paths for various programming topics
- **Coding Challenges** - Practice problems with difficulty levels (Easy/Medium/Hard)
- **Code Snippets Library** - Save and organize reusable code snippets
- **Voice Mentor** - ElevenLabs-powered voice interaction (optional)
- **Community Hub** - Share code, collaborate, and learn from others
- **User Progress Tracking** - Track solved problems, streaks, and achievements

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling via inline classes)
- Lucide React (icons)
- Google Gemini AI SDK
- ElevenLabs SDK (voice features)

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs (password hashing)

## Project Structure

```
tila-ai/
├── components/           # React components
│   ├── ChatArea.tsx     # AI chat interface
│   ├── CodeEditor.tsx   # Code editor component
│   ├── LandingPage.tsx  # Landing/welcome page
│   ├── Notebook.tsx     # Snippets library
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── SidebarIntegrated.tsx
├── services/            # Frontend services
│   ├── apiService.ts    # Backend API client
│   ├── geminiService.ts # Google Gemini AI integration
│   ├── elevenLabsService.ts # Voice AI integration
│   └── audioUtils.ts    # Audio processing utilities
├── server/              # Backend server
│   ├── models/          # MongoDB schemas
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Challenge.js
│   │   ├── ChatHistory.js
│   │   ├── ChatSession.js
│   │   ├── CommunityPost.js
│   │   ├── Roadmap.js
│   │   └── Snippet.js
│   ├── routes/          # API routes
│   │   ├── auth.js      # Authentication
│   │   ├── projects.js  # User projects
│   │   ├── challenges.js # Coding challenges
│   │   ├── chats.js     # Chat sessions
│   │   ├── chatHistory.js
│   │   ├── community.js # Community posts
│   │   ├── roadmaps.js  # Learning roadmaps
│   │   └── snippets.js  # Code snippets
│   ├── middleware/      # Express middleware
│   ├── server.js        # Express app entry
│   ├── package.json
│   └── .env             # Backend environment variables
├── App.tsx              # Main React application
├── index.tsx            # React entry point
├── types.ts             # TypeScript type definitions
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Frontend dependencies
├── .env.local           # Frontend environment variables
├── .env.example         # Frontend env template
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- ElevenLabs API key (optional, for voice features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tila-ai
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Configure environment variables**

   Frontend (`.env.local`):
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your API keys:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
   VITE_ELEVENLABS_AGENT_ID=your_agent_id
   ```

   Backend (`server/.env`):
   ```bash
   cp server/.env.example server/.env
   ```
   Edit `server/.env` and add your configuration:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

### Running Locally

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on http://localhost:5000

2. **Start the frontend** (in a new terminal)
   ```bash
   npm run dev
   ```
   Frontend runs on http://localhost:5173

### Quick Start Scripts (Windows)

```bash
# Start backend
start-backend.bat

# Start frontend
start-frontend.bat
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Challenges
- `GET /api/challenges` - List challenges
- `GET /api/challenges/topic/:topic` - Get by topic
- `POST /api/challenges` - Create challenge
- `POST /api/challenges/:id/complete` - Mark complete

### Snippets
- `GET /api/snippets` - List snippets
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/:id` - Update snippet
- `DELETE /api/snippets/:id` - Delete snippet

### Community
- `GET /api/community` - List posts
- `POST /api/community` - Create post
- `POST /api/community/:id/like` - Like post
- `POST /api/community/:id/fork` - Fork post

### Roadmaps
- `GET /api/roadmaps` - List roadmaps
- `POST /api/roadmaps` - Create roadmap
- `PUT /api/roadmaps/:id/nodes/:nodeId` - Update node status

## Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder

3. Set environment variables in your hosting platform:
   - `VITE_API_URL` - Your backend URL
   - `VITE_GEMINI_API_KEY`
   - `VITE_ELEVENLABS_API_KEY` (optional)
   - `VITE_ELEVENLABS_AGENT_ID` (optional)

### Backend (Railway/Render/Heroku)

1. Deploy the `server` folder

2. Set environment variables:
   - `PORT` - Usually auto-assigned
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - Secure random string

3. For production, update CORS in `server/server.js`:
   ```javascript
   app.use(cors({
     origin: 'https://your-frontend-domain.com'
   }));
   ```

## Environment Variables Reference

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key |
| `VITE_ELEVENLABS_API_KEY` | No | ElevenLabs API key for voice |
| `VITE_ELEVENLABS_AGENT_ID` | No | ElevenLabs agent ID |
| `VITE_ELEVENLABS_VOICE_ID` | No | ElevenLabs voice ID |

### Backend (server/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |

## License

MIT
