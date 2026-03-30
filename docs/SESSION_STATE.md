# SESSION_STATE.md
> Overwrite this file completely at the end of every session. It is the single source of truth for "where we left off."

## Last updated
2026-03-30 — Sprint 1, Day 5

## Current sprint
Sprint 1 — Foundation — COMPLETE

## Current day
Day 5 — Focus Mode, Word Goal & Build — COMPLETE

## What was completed this session
- Created `focus.js` (37 lines): toggles `body.focus-active` class. CSS in §16 dims all CM6 lines except `.cm-activeLine`. Wired to `⌘⇧F` and `#btn-focus` toolbar button.
- Created `wordgoal.js` (92 lines): listens to `editor:change` events, updates `#status-words` and `#status-readtime` with word count + read time. Goal ring SVG `stroke-dashoffset` animation. `⌘⇧G` prompts for goal.
- Added cursor position tracking to editor.js: `updateCursorPosition()` updates `#status-cursor` with `Ln N, Col N` on every selection/doc change.
- Updated `renderer.js`: imports and inits focus.js and wordgoal.js.
- Updated `forge.config.js`: added `name: Antigone`, `appBundleId: com.haystackz.antigone`, `CFBundleDocumentTypes` for `.md .markdown .mdown` file associations.
- Built with `npm run make` — .app launches, file associations in Info.plist confirmed.
- Tagged v0.1.0.

## Exact state of the codebase
- `src/main.js` (342 lines): BrowserWindow with sandbox: true, all IPC handlers, before-close + unsaved dialog, electron-store prefs, crash recovery, security handlers.
- `src/preload.js` (224 lines): complete contextBridge API — file I/O, dialogs, recovery, prefs, unsaved dialog, theme, paths.
- `src/editor.js` (264 lines): CM6 editor with keymaps (⌘O/⌘S/⌘⇧S), cursor position tracking, word count, inline rendering, editor-save integration.
- `src/editor-save.js` (208 lines): save, auto-save (opt-in), crash recovery, unsaved-changes before-close handler.
- `src/inline-render.js` (305 lines): full inline rendering — unchanged from Day 3.
- `src/focus.js` (37 lines): focus mode toggle.
- `src/wordgoal.js` (92 lines): word count engine, goal ring animation.
- `src/prefs.js` (39 lines): preference loading, theme management.
- `src/renderer.js` (43 lines): entry point — loads prefs, inits editor, focus, wordgoal, theme toggle.
- `src/index.html` (277 lines): three-panel shell, recovery banner, statusbar, word goal ring, focus overlay.
- `src/styles.css` (~1270 lines): full token system, focus mode, goal ring, banners.
- `forge.config.js`: macOS file associations, Antigone naming.
- `webpack.main.config.js`: electron-store as webpack external.

## What to do FIRST next session
Sprint 2 begins. Open `docs/ROADMAP.md` for Sprint 2 day-by-day plan. Day 6 likely starts with toolbar formatting buttons (bold, italic, heading wiring) and image paste support.

## Blockers / open issues
- Bundled fonts (Lora, Cormorant Garamond, Recursive, DM Sans) not yet added — falls back to system fonts.
- Apple Developer ID and EV Code Signing cert still needed before Day 13.
- preview.js (marked.js + DOMPurify) deferred to Sprint 2.
- No icon assets yet — app uses default Electron icon.

## Files modified this session
- `src/focus.js` (created)
- `src/wordgoal.js` (created)
- `src/editor.js` (modified — cursor position tracking)
- `src/renderer.js` (modified — focus + wordgoal init)
- `forge.config.js` (modified — file associations, app naming)
- `docs/SPRINT.md` (modified — Day 5 marked complete)
- `docs/SESSION_STATE.md` (overwritten)

## Known working / broken state
| Feature | Status | Notes |
|---------|--------|-------|
| App launches (dev) | Working | `npm start` — sandbox: true |
| App launches (built) | Working | `npm run make` → .app opens |
| Three-panel layout | Working | |
| Titlebar drag region | Working | macOS traffic lights correct |
| Tab bar | Working | .is-unsaved class → dot indicator |
| Status bar | Working | Words · Read time · Ln, Col · Saved/Unsaved |
| contextIsolation + sandbox | Working | Both true |
| IPC bridge | Working | All channels |
| Empty state | Working | Shows on init, hides on file load |
| CM6 editor | Working | Syntax highlighting, inline rendering |
| File open (⌘O) | Working | Native dialog |
| Drag-and-drop | Working | |
| New file (⌘N) | Working | |
| Inline rendering | Working | 10 decoration types |
| ⌘S save | Working | Atomic temp-then-rename |
| ⌘⇧S save-as | Working | Native save dialog |
| Unsaved dialog on close | Working | Save / Don't Save / Cancel |
| Crash recovery | Working | 30s to OS temp dir |
| Recovery banner | Working | Restore / Dismiss |
| Theme toggle | Working | Persists via electron-store |
| Focus mode (⌘⇧F) | Working | Dims non-active lines |
| Word count | Working | Updates on every keystroke |
| Word goal ring | Working | SVG animation, ⌘⇧G to set |
| Cursor position | Working | Ln N, Col N in status bar |
| File associations | Working | .md .markdown .mdown in Info.plist |
| Build (macOS) | Working | npm run make → zip |

## Environment notes
- Dev machine: macOS, ~/Projects/antigone/
- Launch command: `npm start`
- Build command: `npm run make`
- Build output: out/make/ (zip), out/Antigone-darwin-arm64/ (.app)
- Node: system Node 18+
