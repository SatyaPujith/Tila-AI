# App.tsx Restoration Instructions

## Current Situation
- App.tsx has 515 syntax errors
- Broken version backed up to `App.tsx.broken`
- No git history available
- Backend is fully functional and ready

## ✅ What's Already Working
- Backend server on port 5000
- All database models (User, Project, Challenge, Roadmap, Snippet, ChatHistory)
- All API routes functional
- services/apiService.ts - Fixed and working
- services/geminiService.ts - Updated with better prompts
- services/elevenLabsService.ts - Voice integration ready

## 🔧 Solution Options

### Option 1: Use Original App.tsx (Recommended)
The original App.tsx from the project should still work. The file at line 1-600 before modifications was functional.

### Option 2: Minimal Working Version
Create a minimal App.tsx that:
1. Handles authentication
2. Shows dashboard
3. Has basic chat functionality
4. Can be extended incrementally

### Option 3: Fix Current File
Would require fixing 515 syntax errors - not recommended.

## 📝 Key Changes Needed (Once File is Restored)

### 1. Import ElevenLabs Service
```typescript
import { textToSpeech, playAudioBlob, startSpeechRecognition } from './services/elevenLabsService';
```

### 2. Add State for Persistence
```typescript
const [userChallenges, setUserChallenges] = useState<any[]>([]);
const [userRoadmaps, setUserRoadmaps] = useState<any[]>([]);
const [isGuestMode, setIsGuestMode] = useState(false);
const [authError, setAuthError] = useState('');
```

### 3. Load Data on Mount
```typescript
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    loadUserData();
  }
}, []);

useEffect(() => {
  if (user && !isGuestMode) {
    loadUserChallenges();
    loadUserRoadmaps();
  }
}, [user, isGuestMode]);
```

### 4. Add Load Functions
```typescript
const loadUserChallenges = async () => {
  try {
    const challenges = await apiService.getChallenges();
    setUserChallenges(challenges);
  } catch (error) {
    console.error('Failed to load challenges:', error);
  }
};

const loadUserRoadmaps = async () => {
  try {
    const roadmaps = await apiService.getRoadmaps();
    setUserRoadmaps(roadmaps);
  } catch (error) {
    console.error('Failed to load roadmaps:', error);
  }
};
```

### 5. Fix Token Persistence
```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    setAuthError('');
    const response = await apiService.login(email, password);
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      apiService.setToken(response.token);
    }
    
    setIsGuestMode(false);
    await loadUserData();
  } catch (error: any) {
    const errorMessage = error.message || 'Login failed';
    if (errorMessage.includes('Invalid credentials')) {
      setAuthError('Invalid email or password. Please try again.');
    } else if (errorMessage.includes('not found')) {
      setAuthError('No account found with this email. Please register first.');
    } else {
      setAuthError('Login failed. Please try again later.');
    }
  }
};
```

### 6. Update Challenge Loading
```typescript
const loadChallenge = (c: CodingChallenge) => {
  // Extract just the function signature
  const lines = c.starterCode.split('\n');
  const functionSignature = lines.find(line => 
    line.includes('def ') || 
    line.includes('function ') || 
    line.includes('public ')
  ) || lines[0];
  
  // Create minimal starter code
  const minimalCode = `${functionSignature}\n    # Write your solution here\n    pass`;
  
  setCode(minimalCode);
  setViewState(ViewState.IDE);
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    role: MessageRole.MODEL,
    text: `CHALLENGE STARTED: ${c.title}\n\n${c.description}\n\nImplement the logic yourself. Ask for hints if needed!`,
    timestamp: new Date()
  }]);
};
```

## 🚀 Quick Start Steps

1. **Restore Original App.tsx**
   - If you have the original file, use it
   - Or start with a minimal version

2. **Test Compilation**
   ```bash
   npm run dev
   ```

3. **Verify Backend**
   ```bash
   cd server
   npm start
   ```

4. **Test Basic Flow**
   - Open http://localhost:5173
   - Try guest demo
   - Try sign up/login
   - Test chat

5. **Add Features Incrementally**
   - Test after each addition
   - Commit working states

## 📊 Priority Order

1. **Critical** (Must have):
   - Authentication (login/register/guest)
   - Basic chat with AI
   - Project management
   - Token persistence

2. **High** (Should have):
   - Challenge generation and storage
   - Roadmap generation and storage
   - Code editor
   - Snippet management

3. **Medium** (Nice to have):
   - Voice integration
   - Chat history
   - Advanced features

## 💡 Recommendation

Start fresh with a minimal App.tsx that has:
- Authentication screens
- Dashboard
- Basic IDE view
- Chat functionality

Then add features one by one, testing each addition.

The backend is solid and ready to support all features!
