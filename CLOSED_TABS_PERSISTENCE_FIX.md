# Bug Fix: Closed Tabs Re-appear After Switching Workspaces

## Problem
When switching to another workspace and coming back to the IDE workspace, all previously closed file tabs were re-appearing.

## Root Cause
The `closedFileIds` state was local to the CodeEditor component and was being reset when:
1. The component re-mounted
2. The workspace was switched
3. The parent component re-rendered

This meant the tracking of closed tabs was lost.

## Solution
Changed the approach from tracking closed IDs to **syncing tabs with the actual editorFiles array**:

### Key Changes:

1. **Removed Local Tracking** - Removed `closedFileIds` state
2. **Sync with Source of Truth** - Tabs now only exist if they're in `editorFiles`
3. **Remove on Close** - When a tab is closed, the file is removed from `editorFiles`
4. **Persistent State** - `editorFiles` is managed in App.tsx (persists across workspace switches)

## How It Works

### Before (Buggy):
```
Close a tab
    ↓
Track in closedFileIds (local state)
    ↓
Switch workspace
    ↓
closedFileIds is reset
    ↓
Switch back to IDE
    ↓
Closed tabs re-appear (BUG!)
```

### After (Fixed):
```
Close a tab
    ↓
Remove from editorFiles (App.tsx state)
    ↓
Switch workspace
    ↓
editorFiles persists in App.tsx
    ↓
Switch back to IDE
    ↓
Only files in editorFiles appear ✓
```

## Code Changes

### CodeEditor - Simplified useEffect:
```typescript
useEffect(() => {
  if (editorFiles && editorFiles.length > 0) {
    setTabs(prev => {
      const mainTab = prev.find(t => t.id === 'main');
      const existingTabIds = new Set(prev.map(t => t.id));
      
      // Create tabs from editorFiles
      const fileTabs = editorFiles.map(file => ({
        id: file.id,
        title: file.name,
        content: file.content,
        type: 'code' as const,
        isClosable: true,
        language: (file.type as ProgrammingLanguage) || language
      }));
      
      // Keep only tabs that are in editorFiles
      const otherTabs = prev.filter(t => t.id !== 'main' && fileTabs.some(ft => ft.id === t.id));
      
      // Add new file tabs
      const newFileTabs = fileTabs.filter(ft => !existingTabIds.has(ft.id));
      
      return mainTab ? [mainTab, ...otherTabs, ...newFileTabs] : [...otherTabs, ...newFileTabs];
    });
  }
}, [editorFiles]);
```

### CodeEditor - Updated closeTab:
```typescript
const closeTab = (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  const newTabs = tabs.filter(t => t.id !== id);
  setTabs(newTabs);
  
  // Notify parent to remove the file
  if (onRemoveFile && id !== 'main') {
    onRemoveFile(id);
  }
  
  if (activeTabId === id) {
    setActiveTabId(newTabs[newTabs.length - 1].id);
  }
  if (splitTabId === id) {
    setSplitTabId(null);
  }
};
```

### App.tsx - Remove file handler:
```typescript
onRemoveFile={(fileId) => setFiles(f => f.filter(file => file.id !== fileId))}
```

## Testing

1. Open the app
2. Ask AI for code - new tab appears
3. Close the tab (click X)
4. Switch to another workspace (e.g., Challenges)
5. Switch back to IDE
6. The closed tab should NOT re-appear ✓
7. Ask AI for more code
8. New tab should appear ✓

## Benefits

✅ **Persistent State** - Closed tabs stay closed across workspace switches
✅ **Single Source of Truth** - editorFiles is the source of truth
✅ **No Local Tracking** - Simpler logic, fewer bugs
✅ **Automatic Cleanup** - Closed files are removed from state
✅ **Workspace Safe** - Works correctly when switching workspaces

## Architecture

### State Flow:
```
App.tsx (files state)
    ↓
ChatArea (editorFiles prop)
    ↓
CodeEditor (tabs state synced with editorFiles)
    ↓
User closes tab
    ↓
onRemoveFile callback
    ↓
App.tsx removes file from files state
    ↓
CodeEditor re-syncs tabs
```

## Edge Cases Handled

- ✅ Closing a tab and switching workspaces
- ✅ Closing multiple tabs
- ✅ Creating new files after closing
- ✅ Main tab always stays open
- ✅ Switching between workspaces multiple times
- ✅ Closing all file tabs

## Related Features

- Tab switching
- File creation from chat
- Workspace switching
- File persistence

## Future Enhancements

- [ ] Undo close tab
- [ ] Tab history
- [ ] Restore closed tabs
- [ ] Tab groups
