# Testing Guide: Chat History & UI Modals

## 🧪 Quick Test Scenarios

### Test 1: Notification System
1. **Start the app** and log in
2. **Generate a study plan**: Click "Generate Syllabus" in sidebar
3. **Verify**: You should see a beautiful notification (not an alert) saying "AI Study Plan generated!"
4. **Check**: Notification should auto-dismiss after 4 seconds
5. **Try**: Click the X button to manually close a notification

**Expected Result**: ✅ Smooth slide-in notification with color-coded styling

---

### Test 2: Input Modal
1. **Click "Generate Syllabus"** in the sidebar
2. **Verify**: A beautiful modal appears (not a browser prompt)
3. **Enter**: "Data Structures and Algorithms"
4. **Press Enter** or click Submit
5. **Check**: Modal closes and syllabus is generated

**Expected Result**: ✅ Dark-themed modal with backdrop blur, smooth animations

---

### Test 3: Confirm Modal
1. **Write some code** in the editor (at least 20 characters)
2. **Change the language** dropdown (e.g., Python → JavaScript)
3. **Verify**: A confirmation modal appears asking if you want to convert
4. **Click Confirm** to convert or Cancel to skip
5. **Check**: Appropriate notification appears based on your choice

**Expected Result**: ✅ Beautiful confirm dialog with two action buttons

---

### Test 4: Chat History - Create New Session
1. **Log in** to the app (not guest mode)
2. **Send a message** in the chat: "Explain binary search"
3. **Wait for response**
4. **Check**: A new chat session is automatically created
5. **Verify**: Chat title is set to first 50 chars of your message

**Expected Result**: ✅ Chat session created and visible in history

---

### Test 5: Chat History - Multiple Sessions
1. **Click the chat history icon** (MessageSquare icon) in ChatArea
2. **Verify**: Sidebar opens showing your chat sessions
3. **Click "New Chat"** button
4. **Send a different message**: "What is recursion?"
5. **Check**: New chat session appears in the list
6. **Click on the first chat** to switch back
7. **Verify**: Previous conversation loads correctly

**Expected Result**: ✅ Seamless switching between chat sessions

---

### Test 6: Auto-Save Mechanism
1. **Start a chat session**
2. **Send several messages** back and forth
3. **Wait 30 seconds** (auto-save interval)
4. **Check browser console**: Should see "Chat auto-saved"
5. **Refresh the page**
6. **Log back in**
7. **Verify**: Your chat history is preserved

**Expected Result**: ✅ All messages saved and restored after refresh

---

### Test 7: Save Code Snippet
1. **Write some code** in the editor
2. **Click the Save icon** in the code editor toolbar
3. **Verify**: Input modal appears (not a prompt)
4. **Enter a name**: "Quick Sort Implementation"
5. **Submit**
6. **Check**: Success notification appears
7. **Go to Snippets tab**
8. **Verify**: Your snippet is saved

**Expected Result**: ✅ Snippet saved with beautiful modal flow

---

### Test 8: Challenge Generation
1. **Go to Challenges view**
2. **Enter a topic**: "Dynamic Programming"
3. **Click "Generate New Challenges"**
4. **Wait for generation**
5. **Verify**: Notification appears (not alert) with success message
6. **Check**: Challenges are displayed

**Expected Result**: ✅ Smooth notification flow, no browser alerts

---

### Test 9: Guest Mode vs Authenticated
1. **Test in Guest Mode**:
   - Send messages
   - Verify: Chats stored locally
   - Refresh page
   - Check: Local chats may not persist

2. **Test Authenticated**:
   - Log in with real account
   - Send messages
   - Refresh page
   - Check: All chats restored from backend

**Expected Result**: ✅ Backend persistence for authenticated users

---

### Test 10: Error Handling
1. **Disconnect from internet** (or stop backend server)
2. **Try to save a snippet**
3. **Verify**: Error notification appears (not alert)
4. **Check**: Message says "Failed to save snippet"
5. **Reconnect**
6. **Try again**
7. **Verify**: Success notification appears

**Expected Result**: ✅ Graceful error handling with notifications

---

## 🎯 Visual Checklist

### Notifications
- [ ] Appears at top-right corner
- [ ] Color-coded (green=success, red=error, blue=info, yellow=warning)
- [ ] Auto-dismisses after 4 seconds
- [ ] Has close button (X)
- [ ] Smooth slide-in animation
- [ ] Backdrop blur effect

### Confirm Modal
- [ ] Centered on screen
- [ ] Dark background (zinc-950)
- [ ] Backdrop blur
- [ ] Two buttons (Cancel + Confirm)
- [ ] Click outside to close
- [ ] Smooth fade-in animation

### Input Modal
- [ ] Centered on screen
- [ ] Text input field
- [ ] Placeholder text visible
- [ ] Submit button disabled when empty
- [ ] Enter key submits
- [ ] Cancel button works

### Chat History Sidebar
- [ ] Toggle button in ChatArea
- [ ] Shows all chat sessions
- [ ] "New Chat" button at top
- [ ] Active chat highlighted
- [ ] Shows chat title and date
- [ ] Smooth slide animation

---

## 🐛 Common Issues & Solutions

### Issue: Notifications not appearing
**Solution**: Check that `notification` state is being set correctly. Look for `showNotification()` calls.

### Issue: Modals not closing
**Solution**: Ensure `setConfirmModal(null)` or `setInputModal(null)` is called after action.

### Issue: Chat history not loading
**Solution**: 
1. Check backend is running
2. Verify user is authenticated (not guest mode)
3. Check browser console for API errors
4. Verify MongoDB connection

### Issue: Auto-save not working
**Solution**: 
1. Check the 30-second interval is running
2. Verify `activeChatId` is set
3. Check backend API is responding
4. Look for errors in console

### Issue: Chat sessions duplicating
**Solution**: Ensure proper ID management. Backend IDs should replace temporary frontend IDs.

---

## 📊 Performance Checks

1. **Notification Performance**: Should appear instantly (<100ms)
2. **Modal Rendering**: Should open smoothly (<200ms)
3. **Chat Loading**: Should load within 1 second
4. **Auto-Save**: Should not cause UI lag
5. **Session Switching**: Should be instant (<500ms)

---

## ✅ Success Criteria

All tests pass when:
- ✅ No browser alert(), prompt(), or confirm() dialogs appear
- ✅ All notifications are beautiful and color-coded
- ✅ All modals have backdrop blur and smooth animations
- ✅ Chat history persists across page refreshes
- ✅ Auto-save works every 30 seconds
- ✅ Multiple chat sessions can be managed
- ✅ Guest mode works with local storage
- ✅ Authenticated mode syncs to backend
- ✅ Error handling shows notifications (not alerts)
- ✅ UI is responsive and smooth

---

## 🚀 Quick Start Testing

```bash
# Terminal 1: Start Backend
cd server
npm start

# Terminal 2: Start Frontend
npm run dev

# Open browser to http://localhost:5173
# Follow test scenarios above
```

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________

Test 1 - Notifications: [ ] Pass [ ] Fail
Test 2 - Input Modal: [ ] Pass [ ] Fail
Test 3 - Confirm Modal: [ ] Pass [ ] Fail
Test 4 - New Chat Session: [ ] Pass [ ] Fail
Test 5 - Multiple Sessions: [ ] Pass [ ] Fail
Test 6 - Auto-Save: [ ] Pass [ ] Fail
Test 7 - Save Snippet: [ ] Pass [ ] Fail
Test 8 - Challenge Gen: [ ] Pass [ ] Fail
Test 9 - Guest vs Auth: [ ] Pass [ ] Fail
Test 10 - Error Handling: [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
_________________________________
```
