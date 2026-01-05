# Bug Fix: Run Button Executes Wrong File

## Problem
When clicking the "Run" button, the code from the main file was always executed, regardless of which tab was currently open. Users couldn't run code from the file tabs they created.

## Root Cause
The `handleRunCode` function in App.tsx was always using the main `code` state variable instead of checking which tab was currently active in the CodeEditor.

## Solution
Updated the code execution flow to pass the active tab's code and language to the run handler:

### Changes Made:

1. **Updated `onRun` Signature** (`components/CodeEditor.tsx`)
   - Changed from: `onRun: (testCases?: TestCase[]) => void`
   - Changed to: `onRun: (testCases?: TestCase[], codeToRun?: string, languageToRun?: ProgrammingLanguage) => void`
   - Now accepts the code and language to execute

2. **Updated `runWithTestCases` Function** (`components/CodeEditor.tsx`)
   - Gets the active tab's content: `tabs.find(t => t.id === activeTabId)?.content`
   - Gets the active tab's language: `activeTab?.language`
   - Passes both to `onRun` function

3. **Updated `handleRunCode` Function** (`App.tsx`)
   - Accepts optional `codeToRun` and `languageToRun` parameters
   - Uses provided code/language if available
   - Falls back to main editor state if not provided
   - All validation and execution uses the correct code/language

## How It Works

### Before (Buggy):
```
User opens "solution_123.py" tab
    ↓
User clicks "Run"
    ↓
handleRunCode uses main code state
    ↓
Main file is executed (WRONG!)
```

### After (Fixed):
```
User opens "solution_123.py" tab
    ↓
User clicks "Run"
    ↓
runWithTestCases gets active tab content
    ↓
Passes code to handleRunCode
    ↓
Active tab code is executed ✓
```

## Code Changes

### CodeEditor - Updated onRun Signature:
```typescript
onRun: (testCases?: TestCase[], codeToRun?: string, languageToRun?: ProgrammingLanguage) => void;
```

### CodeEditor - Updated runWithTestCases:
```typescript
const runWithTestCases = () => {
  // Get the current active tab's code and language
  const currentContent = tabs.find(t => t.id === activeTabId)?.content || code;
  const currentLanguage = activeTab?.language || language;
  
  if (testCases.length > 0) {
    onRun(testCases, currentContent, currentLanguage);
  } else {
    onRun(undefined, currentContent, currentLanguage);
  }
};
```

### App.tsx - Updated handleRunCode:
```typescript
const handleRunCode = async (
  testCases?: TestCase[], 
  codeToRun?: string, 
  languageToRun?: ProgrammingLanguage
) => {
  // Use provided code/language or fall back to main editor state
  const codeContent = codeToRun || code;
  const codeLanguage = languageToRun || language;
  
  // ... rest of function uses codeContent and codeLanguage
};
```

## Testing

1. Open the app
2. Ask AI for code: "Write a function"
3. Click "Add to Editor" - new tab appears
4. Click on the new tab to open it
5. Click the "Run" button
6. The code from the NEW tab should execute ✓
7. Switch back to main.py tab
8. Click "Run" again
9. The main code should execute ✓

## Benefits

✅ **Correct Execution** - Runs the code from the active tab
✅ **Multi-File Support** - Each file can be executed independently
✅ **Backward Compatible** - Still works with main editor code
✅ **Language Aware** - Uses the correct language for each tab

## Edge Cases Handled

- ✅ Running main.py (default behavior)
- ✅ Running solution files
- ✅ Running with test cases
- ✅ Language detection per tab
- ✅ Syntax validation per tab
- ✅ Error handling per tab

## Related Features

- Tab switching
- File creation from chat
- Test case execution
- Code validation
- Language detection

## Future Enhancements

- [ ] Run all files
- [ ] Compare execution results
- [ ] Debug mode per file
- [ ] Breakpoints per file
- [ ] Performance profiling per file
