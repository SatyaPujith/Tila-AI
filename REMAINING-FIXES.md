# Remaining Fixes to Implement

## ✅ Already Fixed:
1. Challenge "Ask Tutor" now only shows function signature
2. Gemini responses now formatted with sections
3. Chat history model and routes created
4. Token persistence improved
5. Roadmap made scrollable

## 🔧 Still Need to Fix:

### 1. Code Editor Dynamic Filename
**Issue**: Filename doesn't change when language changes
**Solution**: Add state for filename and update based on language

```typescript
const [filename, setFilename] = useState('main.py');

// When language changes:
useEffect(() => {
  const extensions = {
    [ProgrammingLanguage.PYTHON]: '.py',
    [ProgrammingLanguage.JAVASCRIPT]: '.js',
    [ProgrammingLanguage.TYPESCRIPT]: '.ts',
    [ProgrammingLanguage.JAVA]: '.java',
    [ProgrammingLanguage.CPP]: '.cpp'
  };
  setFilename(`main${extensions[language]}`);
}, [language]);
```

### 2. Editable Default Syntax
**Issue**: Default code appears as background, not editable
**Solution**: Set code state directly, not as placeholder

```typescript
// When language changes, set actual code:
const templates = {
  python: '# Write your code here\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()',
  javascript: '// Write your code here\n\nfunction main() {\n    \n}\n\nmain();',
  // ... other languages
};

setCode(templates[language]);
```

### 3. Code Validation Before Execution
**Issue**: Code runs even with errors
**Solution**: Add syntax validation

```typescript
const validateCode = (code: string, language: string) => {
  // Check for basic syntax errors
  const errors = [];
  
  if (language === 'python') {
    // Check for missing return statements
    if (code.includes('def ') && !code.includes('return') && !code.includes('pass')) {
      errors.push('Function may be missing return statement');
    }
    // Check for unclosed brackets
    const openBrackets = (code.match(/\(/g) || []).length;
    const closeBrackets = (code.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push('Unclosed parentheses detected');
    }
  }
  
  return errors;
};

// Before running:
const errors = validateCode(code, language);
if (errors.length > 0) {
  setEditorOutput(`Errors found:\n${errors.join('\n')}`);
  return;
}
```

### 4. Challenge Deduplication
**Issue**: Same challenges generated multiple times
**Solution**: Check existing challenges before saving

```typescript
// In backend route:
router.post('/bulk', authMiddleware, async (req, res) => {
  const { challenges, topic } = req.body;
  
  // Check for existing challenges with same title
  const existingTitles = await Challenge.find({
    userId: req.userId,
    topic: topic
  }).distinct('title');
  
  // Filter out duplicates
  const newChallenges = challenges.filter(c => 
    !existingTitles.includes(c.title)
  );
  
  // Save only new ones
  const saved = await Promise.all(
    newChallenges.map(c => new Challenge({...c, userId: req.userId}).save())
  );
  
  res.json({ saved: saved.length, skipped: challenges.length - saved.length });
});
```

### 5. Chat History Auto-Save
**Issue**: Chat not saved automatically
**Solution**: Save after each message

```typescript
// In sendMessage function:
useEffect(() => {
  if (messages.length > 0 && !isGuestMode) {
    // Debounce save
    const timer = setTimeout(async () => {
      try {
        const title = messages[0]?.text?.substring(0, 50) || 'Chat';
        await apiService.saveChatHistory(title, messages);
      } catch (error) {
        console.error('Failed to save chat:', error);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }
}, [messages, isGuestMode]);
```

### 6. Chunked AI Responses
**Issue**: All content shown at once
**Solution**: Implement streaming or pagination

```typescript
const [currentSection, setCurrentSection] = useState(0);
const [sections, setSections] = useState<string[]>([]);

// Split response into sections
const splitResponse = (text: string) => {
  return text.split(/##/).filter(s => s.trim());
};

// Show next section
const showNext = () => {
  if (currentSection < sections.length - 1) {
    setCurrentSection(prev => prev + 1);
  }
};

// In UI:
{sections.slice(0, currentSection + 1).map((section, i) => (
  <div key={i}>{section}</div>
))}
{currentSection < sections.length - 1 && (
  <Button onClick={showNext}>Next →</Button>
)}
```

### 7. Filename Renaming
**Issue**: Can't rename files
**Solution**: Add editable filename input

```typescript
const [isEditingFilename, setIsEditingFilename] = useState(false);

// In UI:
{isEditingFilename ? (
  <input 
    value={filename}
    onChange={(e) => setFilename(e.target.value)}
    onBlur={() => setIsEditingFilename(false)}
    autoFocus
  />
) : (
  <span onClick={() => setIsEditingFilename(true)}>
    {filename}
  </span>
)}
```

## 📝 Implementation Priority:

1. **High Priority**:
   - Code validation before execution
   - Challenge deduplication
   - Chat history auto-save
   - Token persistence (already done)

2. **Medium Priority**:
   - Dynamic filename
   - Editable default syntax
   - Chunked responses

3. **Low Priority**:
   - Filename renaming
   - Advanced code analysis

## 🎯 Quick Wins:

These can be implemented quickly:
1. Dynamic filename (5 minutes)
2. Editable syntax (10 minutes)
3. Challenge deduplication (15 minutes)

## 🔄 Next Steps:

1. Implement code validation
2. Add challenge deduplication
3. Enable chat auto-save
4. Test all features
5. Deploy

## 📊 Testing Checklist:

- [ ] Code editor filename changes with language
- [ ] Default code is editable
- [ ] Invalid code shows errors
- [ ] Challenges don't duplicate
- [ ] Chat saves automatically
- [ ] Page refresh keeps user logged in
- [ ] Roadmap is scrollable
- [ ] AI responses are formatted
