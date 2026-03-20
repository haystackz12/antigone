# ARCHITECTURE.md
> Read this when touching main.js, preload.js, forge.config.js, or the IPC surface. Not required for feature work in renderer modules.

## Security model (immutable)
```
Renderer process          preload.js (bridge)         Main process
─────────────────         ──────────────────          ────────────────────
No Node access            contextBridge               Full Node + fs access
No require()              ipcRenderer ↔ ipcMain       BrowserWindow owner
DOMPurify required        Exposes named methods only  All file I/O lives here
```

## contextBridge API surface
Every method exposed in preload.js is documented here. Adding a method requires updating this file.

```javascript
window.antigone = {
  // File operations
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>   // temp-then-rename
  watchFile(path: string): void                              // fires 'file-changed' event
  stopWatch(path: string): void
  openDialog(options): Promise<string|null>                  // returns path or null
  saveDialog(options): Promise<string|null>                  // returns path or null

  // Image paste
  saveImage(dataUrl: string, destDir: string): Promise<string>  // returns relative path

  // Preprocessor (Pro)
  runPreprocessor(cmd: string, content: string): Promise<string>  // stdout or throws

  // Preferences
  getPrefs(): Promise<object>
  setPrefs(partial: object): Promise<void>

  // System
  openExternal(url: string): void
  getPlatform(): string   // 'darwin' | 'win32' | 'linux'
  getAppDataPath(): string
  getVersion(): string

  // Events (main → renderer)
  on(event: string, callback: Function): void
  // Events fired by main: 'file-changed', 'update-ready', 'open-file'
}
```

## Data flow: opening a file
```
User double-clicks .md file
  → OS → app.on('open-file') in main.js
  → main.js reads file with fs.readFile
  → ipcMain sends { path, content } to renderer
  → renderer/tabs.js creates new tab
  → renderer/editor.js loads content into CodeMirror
  → renderer/inline-render.js applies decorations
  → renderer/toc.js builds TOC from headings
  → renderer/tags.js scans for #tags, updates index
  → main.js starts fs.watch on the path
```

## Data flow: auto-save
```
User types in CodeMirror
  → CM6 onChange fires
  → renderer/editor.js debounces 800ms
  → window.antigone.writeFile(path, content) called
  → preload.js → ipcRenderer.invoke('write-file', path, content)
  → main.js ipcMain.handle('write-file'):
      1. Write content to path + '.tmp'
      2. fs.rename(tmp, path)   ← atomic on all platforms
      3. resolve()
  → renderer shows 'Saved ✓' indicator
```

## IPC channel names
All channels use kebab-case. Documented here to prevent duplicates.
```
read-file          main reads file, returns string content
write-file         main writes file atomically, returns void
watch-file         main starts fs.watch on path
stop-watch         main stops fs.watch on path
open-dialog        main shows open file dialog, returns path
save-dialog        main shows save dialog, returns path
save-image         main saves image buffer to assets/, returns relative path
run-preprocessor   main spawns child_process, returns stdout
get-prefs          main reads electron-store, returns prefs object
set-prefs          main writes partial prefs to electron-store
open-external      main calls shell.openExternal
get-platform       main returns process.platform
get-app-data-path  main returns app.getPath('userData')
get-version        main returns app.getVersion()

// Main → renderer (use webContents.send):
file-changed       external file modification detected
update-ready       auto-updater has downloaded an update
open-file          file path to open (from OS file association or CLI)
```

## OS user data paths
```javascript
// main.js — use app.getPath('userData') always, never hardcode
const userDataPath = app.getPath('userData');
// Results in:
// macOS:   ~/Library/Application Support/Antigone
// Windows: %APPDATA%\Antigone
// Linux:   ~/.config/Antigone
```

## Platform detection pattern
```javascript
// main.js
const isMac   = process.platform === 'darwin';
const isWin   = process.platform === 'win32';
const isLinux = process.platform === 'linux';

// Debounce values (Linux fires duplicate fs.watch events)
const watchDebounce = isLinux ? 200 : 100;
```

## forge.config.js structure
```javascript
module.exports = {
  packagerConfig: {
    name: 'Antigone',
    executableName: 'Antigone',  // capital A on all platforms
    icon: './assets/icon',       // forge adds .icns/.ico/.png automatically
    extendInfo: './assets/Info.plist.additions',  // macOS file associations
  },
  makers: [
    { name: '@electron-forge/maker-dmg',  platforms: ['darwin'] },
    { name: '@electron-forge/maker-squirrel', platforms: ['win32'],
      config: { setupExe: 'AntigoneSetup.exe' } },
    { name: '@electron-forge/maker-deb',  platforms: ['linux'] },
    { name: '@electron-forge/maker-zip',  platforms: ['linux'],
      config: { options: { name: 'Antigone' } } },
  ],
};
```

## File association registration
**macOS** — `assets/Info.plist.additions`:
```xml
<key>CFBundleDocumentTypes</key>
<array>
  <dict>
    <key>CFBundleTypeExtensions</key>
    <array><string>md</string><string>markdown</string><string>mdown</string></array>
    <key>CFBundleTypeRole</key><string>Editor</string>
    <key>LSHandlerRank</key><string>Owner</string>
  </dict>
</array>
```
`.txt` association uses `LSHandlerRank: Alternate` and only if user opted in during install.

**Windows** — NSIS script registers `HKCR\.md` → `AntigoneFile`.
**Linux** — `antigone.desktop` with `MimeType=text/markdown;text/x-markdown;`.
