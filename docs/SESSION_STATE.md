# SESSION_STATE.md
> Overwrite this file completely at the end of every session. It is the single source of truth for "where we left off."

## Last updated
2026-03-30 — Sprint 1, Day 4

## Current sprint
Sprint 1 — Foundation

## Current day
Day 4 — Save, Auto-Save & Themes — COMPLETE

## What was completed this session
- Re-enabled `sandbox: true` in webPreferences — confirmed working with mini-css-extract-plugin (DEC-015).
- Added `fs.watch` file watcher with 200ms debounce: `startWatching()`, `stopWatching()` functions + IPC handlers `start-watching`, `stop-watching` in main.js.
- Added `list-recovery` IPC handler to enumerate recovery files in OS temp dir.
- Added electron-store prefs IPC: `get-prefs`, `set-prefs`, `set-native-theme` in main.js. Loaded via webpack externals + dynamic import since v11 is ESM-only (DEC-016).
- Added preload API surface: `listRecovery`, `startWatching`, `stopWatching`, `onFileChanged`, `getPrefs`, `setPrefs`, `setNativeTheme`.
- Created `editor-save.js` (212 lines): `saveFile()`, `saveFileAs()`, `scheduleAutoSave()` (800ms debounce), `startRecovery()` (30s interval to OS temp), `checkRecovery()` (launch-time banner), `showFileChangedBanner()`, `showSavedIndicator()`.
- Updated `editor.js` (248 lines): `⌘S`/`⌘⇧S` keymaps in CM6 + global keyboard fallback, auto-save on doc change, file watcher start/stop on file load, editor-save integration via `configure()` pattern.
- Created `prefs.js` (39 lines): `loadPrefs()`, `applyTheme()`, `applyFontSize()`, `applyLineNumbers()`, `toggleTheme()`.
- Updated `renderer.js` (37 lines): loads prefs before editor init, wires theme toggle button, listens for OS theme changes.
- Added HTML: `#file-changed-banner`, `#recovery-banner`, `#saved-indicator` in index.html.
- Added CSS: banner styles (light + dark), saved indicator fade, hide-line-numbers toggle in styles.css.
- Added webpack.main.config.js: electron-store as webpack external (DEC-016).
- Logged DEC-015 (sandbox re-enabled), DEC-016 (electron-store external), DEC-017 (editor-save split) in DECISIONS.md.

## Exact state of the codebase
- `src/main.js` (352 lines): BrowserWindow with sandbox: true, all IPC handlers (read-file, write-file, open-dialog, save-dialog, write-recovery, read-recovery, delete-recovery, list-recovery, start-watching, stop-watching, get-prefs, set-prefs, set-native-theme, get-native-theme, get-app-paths, open-external), file watchers, nativeTheme listener, security handlers.
- `src/preload.js` (228 lines): complete contextBridge API surface including file watching, prefs, and recovery.
- `src/editor.js` (248 lines): CM6 editor with save/auto-save keymaps, file watcher integration, editor-save module wiring.
- `src/editor-save.js` (212 lines): save, auto-save, crash recovery, external file-change detection.
- `src/inline-render.js` (305 lines): full inline rendering — unchanged from Day 3.
- `src/prefs.js` (39 lines): preference loading and theme management.
- `src/renderer.js` (37 lines): entry point — loads prefs, inits editor, wires theme toggle.
- `src/index.html` (283 lines): three-panel shell with file-changed banner, recovery banner, saved indicator.
- `src/styles.css` (~1280 lines): full token system with banner and indicator styles added.
- `webpack.main.config.js`: electron-store as external.
- `forge.config.js`: unchanged.

## What to do FIRST next session
Open `docs/SPRINT.md` Day 5 tasks. Start with `focus.js` — implement `IntersectionObserver` to track the active paragraph and apply the `dimmed` class to non-active paragraphs. See `SPRINT.md` Day 5 for full task list.

## Blockers / open issues
- Bundled fonts (Lora, Cormorant Garamond, Recursive, DM Sans) not yet added — falls back to system fonts. Not blocking Day 5.
- `preview.js` (marked.js + DOMPurify) deferred — not needed until Sprint 2 split-view wiring.
- Apple Developer ID and EV Code Signing cert still needed before Day 13.

## Files modified this session
- `src/main.js` (modified — sandbox: true, file watchers, list-recovery, prefs IPC)
- `src/preload.js` (modified — new API methods)
- `src/editor.js` (modified — save keymaps, auto-save, file watcher integration)
- `src/editor-save.js` (created — save, auto-save, recovery, file-changed)
- `src/prefs.js` (created — preference loading, theme toggle)
- `src/renderer.js` (modified — prefs loading, theme toggle wiring)
- `src/index.html` (modified — banners, saved indicator)
- `src/styles.css` (modified — banner + indicator styles)
- `webpack.main.config.js` (modified — electron-store external)
- `docs/DECISIONS.md` (modified — DEC-015, DEC-016, DEC-017)
- `docs/SPRINT.md` (modified — Day 4 marked complete)
- `docs/SESSION_STATE.md` (overwritten)

## Known working / broken state
| Feature | Status | Notes |
|---------|--------|-------|
| App launches | Working | `npm start` — sandbox: true confirmed |
| Three-panel layout | Working | Unchanged from Day 3 |
| Titlebar drag region | Working | macOS traffic lights correct |
| Tab bar | Working | ● dirty prefix on unsaved changes |
| Status bar | Working | Saved ✓ indicator wired |
| contextIsolation + sandbox | Working | Both true, confirmed |
| IPC bridge (window.api) | Working | All channels registered |
| Empty state welcome screen | Working | Shows on init, hides on file load |
| CodeMirror 6 editor | Working | Syntax highlighting, inline rendering |
| File open (⌘O) | Working | Native dialog, loads content |
| Drag-and-drop | Working | Drop .md → loads in editor |
| New file (⌘N) | Working | + tab button, welcome screen, shortcut |
| Inline rendering | Working | All decoration types, cursor-line exclusion |
| ⌘S save | Working | Atomic temp-then-rename via IPC |
| ⌘⇧S save-as | Working | Native save dialog |
| Auto-save | Working | 800ms debounce after doc change |
| File watcher | Working | fs.watch with 200ms debounce |
| File-changed banner | Working | Reload / Keep Mine buttons |
| Crash recovery | Working | 30s interval to OS temp dir |
| Recovery banner | Working | Restore / Dismiss on launch |
| Theme toggle | Working | Persists via electron-store |
| Prefs loading | Working | Applied before first paint |
| Focus mode | Stubbed | CSS complete, toggle present, logic Day 5 |
| Word goal ring | Stubbed | SVG present, animation Day 5 |
| Build / packaging | Not started | Day 5 |

## Environment notes
- Dev machine: macOS, ~/Projects/antigone/
- Launch command: `npm start` (Forge webpack dev server + Electron)
- Build command: `npm run make`
- Node: system Node 18+
