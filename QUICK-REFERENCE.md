# Quick Reference - TIVA AI

## 🚀 Start the App

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 📝 Key Features

### 1. Challenges by Topic
- Enter topic → Generate challenges
- Challenges saved under topic name
- Click topic card to view all challenges
- New challenges add to existing topic

### 2. Roadmaps
- Enter topic → Generate roadmap
- Roadmap saved with topic name
- Click roadmap card to view
- Generate challenges for each node
- Ask tutor about any node

### 3. Tutor Chat
- Explains algorithms and approaches
- Provides pseudocode and logic
- Only gives code when asked
- Encourages problem-solving

### 4. Snippets by Topic
- Auto-saves code from conversations
- Organizes by detected topic
- Groups related snippets
- No duplicate topics

## 🎯 Common Tasks

### Generate Challenges
```
1. Go to Challenges tab
2. Enter: "Binary Trees"
3. Click Generate
4. See 3 challenges
5. Click topic card to view
```

### Create Roadmap
```
1. Go to Roadmap tab
2. Enter: "JavaScript"
3. Click Generate
4. See learning path
5. Click "Generate Challenges" on nodes
6. Click "Ask Tutor" to learn
```

### Chat with Tutor
```
User: "Explain quicksort"
AI: [Explains algorithm, no code]

User: "Show me the code"
AI: [Provides actual code]
```

### Save Snippets
```
1. Chat about a topic
2. Code automatically extracted
3. Saved under detected topic
4. View in Snippets tab
```

## 🔧 Troubleshooting

### Not Staying Logged In
- Check if backend is running
- Check browser console for errors
- Clear cache and try again

### Challenges Not Saving
- Ensure you're logged in (not guest)
- Check backend connection
- Look at server logs

### Roadmap Not Showing
- Wait 10-15 seconds for generation
- Check if saved roadmaps appear
- Try refreshing the page

## 📊 Data Structure

### Challenges
```
Topic: Arrays
  - Challenge 1 (Easy)
  - Challenge 2 (Medium)
  - Challenge 3 (Hard)
```

### Roadmaps
```
Topic: Python
  - Node 1: Basics
  - Node 2: Functions
  - Node 3: OOP
```

### Snippets
```
Topic: Sorting
  - Bubble Sort
  - Quick Sort
  - Merge Sort
```

## ✅ Success Indicators

- ✅ Stay logged in after refresh
- ✅ Challenges grouped by topic
- ✅ Roadmaps persist
- ✅ Tutor explains before coding
- ✅ Snippets organized
- ✅ No data loss

## 🎉 You're All Set!

Everything is working and persisting properly!
