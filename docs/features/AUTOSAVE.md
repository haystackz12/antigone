# features/AUTOSAVE.md
> Read when working on: auto-save, file watching, crash recovery, external change detection, conflict resolution.

## Auto-save flow
```
CM6 onChange → debounce(800ms) → window.antigone.writeFile(path, content)
  → IPC 'write-file' → main.js:
      1. fs.writeFile(path + '.tmp', content, 'utf8')
      2. fs.rename(path + '.tmp', path)  ← atomic
      3. resolve()
  → renderer clears ● indicator, shows 'Saved ✓' for 1500ms
```
Config options stored in prefs: `autoSaveDelay`: 0 (off) | 500 | 800 | 1000 | 2000 | 5000 ms.

## fs.watch setup (main.js)
```javascript
const watchers = new Map(); // path → FSWatcher

ipcMain.on('watch-file', (event, path) => {
  if (watchers.has(path)) return; // already watching
  const debounceMs = process.platform === 'linux' ? 200 : 100;
  let timer;
  const watcher = fs.watch(path, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      event.sender.send('file-changed', path);
    }, debounceMs);
  });
  watchers.set(path, watcher);
});

ipcMain.on('stop-watch', (event, path) => {
  watchers.get(path)?.close();
  watchers.delete(path);
});
```
**Always call stop-watch when:** tab is closed, new file opened in same tab, window closes.

## Crash recovery
```javascript
// main.js — runs every 30 seconds
setInterval(() => {
  for (const [path, content] of openFiles) {
    const recoveryPath = path.join(os.tmpdir(), `antigone-recovery-${uuidv4()}.md`);
    fs.writeFile(recoveryPath, content, 'utf8'); // fire and forget
    // Store mapping: original path → recovery path in electron-store
  }
}, 30000);

// On launch: check electron-store for recovery entries
// If found: show banner 'Recovered content available — Restore / Discard'
// On restore: load recovery file content into editor for that path
// On discard or after restore: delete recovery file, remove from store
```
Recovery files are in `os.tmpdir()` — NEVER in the source directory.

## External change detection
```javascript
// When 'file-changed' IPC fires in renderer:
// 1. Check if the file's current content differs from editor content
// 2. If differs: show non-blocking banner
//    "filename.md changed on disk — [Reload] [Keep mine] [Diff]"
// 3. Reload: read file → replace CM6 content → update watcher
// 4. Keep mine: dismiss banner, do nothing (auto-save will overwrite on next keystroke)
// 5. Diff: open split view with disk version on right (v1.2 feature)
// IMPORTANT: auto-save is PAUSED while the conflict banner is shown
```
