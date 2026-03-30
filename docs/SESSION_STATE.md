# SESSION_STATE.md
> Overwrite this file completely at the end of every session. It is the single source of truth for "where we left off."

## Last updated
2026-03-29 — Sprint 1, Day 3

## Current sprint
Sprint 1 — Foundation

## Current day
Day 3 — Live Inline Rendering — COMPLETE

## What was completed this session
- Fixed BUG-001: workspace grid had 5 columns but only 4 DOM children — `#editor-pane` was auto-placed into a 5px gutter column. Fixed with explicit `grid-column` assignments on `#sidebar` (1/3), `#editor-pane` (3), `#split-resize` (4), `#preview-pane` (5).
- Removed duplicate CM6 CSS rules at bottom of `styles.css` (lines ~1193-1211) that conflicted with §10 flex-based layout.
- Removed competing `height: '100%'` from `githubLightBase` theme in `editor.js` — CSS §10 is the single authority for CM6 height.
- Added `min-height: 0` to `#cm-editor` for proper flex shrinking.
- Wired new file: `newFile()` function in `editor.js`, click handlers for `#btn-new-tab` and `#btn-new-file`, `⌘N` keyboard shortcut.
- Implemented `inline-render.js` (305 lines): CM6 `ViewPlugin` with `DecorationSet` for live inline rendering of Markdown syntax.
  - Decorations: bold, italic, strikethrough, inline code, headings (1–6), blockquote, list markers, links, images.
  - Cursor-line exclusion: raw syntax revealed on cursor line, styled decorations on all other lines.
  - `ImageWidget` extends `WidgetType` — renders `<img>`, falls back to alt text on error.
  - Scoped to `view.visibleRanges` for performance.
- Updated `SPRINT.md`: marked Day 2 and Day 3 COMPLETE with gates passed.

## Exact state of the codebase
- `src/main.js` (273 lines): fully implemented — BrowserWindow, all IPC handlers, open-file, CLI args, security handlers. Note: `sandbox: true` not set in webPreferences (hard constraint says it should be — add next session or confirm intent).
- `src/preload.js` (175 lines): fully implemented — complete contextBridge API surface.
- `src/index.html` (269 lines): fully implemented — three-panel shell, all mount points.
- `src/styles.css` (~1210 lines): fully implemented — all tokens, light/dark, layout, typography, syntax classes. Duplicate CM6 rules removed, explicit grid-column assignments added.
- `src/renderer.js` (12 lines): entry point — imports styles.css, calls `initEditor()` on DOMContentLoaded.
- `src/editor.js` (215 lines): CM6 editor — mount, file open (⌘O, drag-drop, macOS IPC), new file (⌘N, buttons), tab bar update, empty state toggle, theme compartment.
- `src/inline-render.js` (305 lines): full inline rendering — ViewPlugin with DecorationSet, 10 decoration types, cursor-line exclusion, ImageWidget, visible-range scoping.
- `webpack.renderer.config.js`: mini-css-extract-plugin wired.
- `forge.config.js`: correct — macOS, Windows, Linux targets, preload wired.

## What to do FIRST next session
Open `docs/SPRINT.md` Day 4 tasks. Start with `⌘S` save — implement `saveFile()` in `editor.js` that calls `window.api.writeFile()` with the current file path and document content. See `docs/features/AUTOSAVE.md` for the temp-then-rename strategy.

## Blockers / open issues
- `sandbox: true` is listed as a hard constraint but is NOT set in `webPreferences` in `main.js`. SESSION_STATE from Day 1 says it was removed because it "blocked style injection." Confirm whether to re-enable now that mini-css-extract-plugin is used instead of style-loader.
- Bundled fonts (Lora, Cormorant Garamond, Recursive, DM Sans) not yet added — falls back to system fonts. Not blocking Day 4.
- `preview.js` (marked.js + DOMPurify) deferred — not needed until Sprint 2 split-view wiring.
- Apple Developer ID and EV Code Signing cert still needed before Day 13.

## Files modified this session
- `src/editor.js` (created)
- `src/inline-render.js` (created)
- `src/styles.css` (modified — BUG-001 grid fix, duplicate CM6 rules removed, min-height added)
- `src/renderer.js` (modified — imports editor.js)
- `src/preload.js` (modified)
- `package.json` (modified — CM6 dependencies added)
- `package-lock.json` (modified)
- `webpack.renderer.config.js` (modified)
- `docs/SPRINT.md` (updated — Day 2 + Day 3 marked complete)
- `docs/SESSION_STATE.md` (updated)
- `docs/DECISIONS.md` (updated — new decisions logged)
- `docs/BUGS.md` (updated — BUG-001 resolved)

## Known working / broken state
| Feature | Status | Notes |
|---------|--------|-------|
| App launches | Working | `npm start` only — Forge webpack dev server |
| Three-panel layout | Working | BUG-001 fixed — explicit grid-column assignments |
| Titlebar drag region | Working | macOS traffic lights in correct position |
| Tab bar | Working | Single tab shows filename, ● dirty prefix |
| Status bar | Working | MD · 0 words · 0 min · Saved ✓ (static defaults) |
| contextIsolation | Working | Confirmed true |
| IPC bridge (window.api) | Working | All channels registered in main + preload |
| Empty state welcome screen | Working | Shows on init, hides on file load |
| CodeMirror 6 editor | Working | Mounts into #cm-editor, syntax highlighting active |
| File open (⌘O) | Working | Opens native dialog, loads file content |
| Drag-and-drop | Working | Drop .md file onto window → loads in editor |
| New file (⌘N) | Working | + tab button, welcome screen button, ⌘N shortcut |
| macOS open-file IPC | Working | app.on('open-file') → renderer |
| CLI file argument | Working | `antigone path/to/file.md` opens file |
| Inline rendering | Working | Bold, italic, strike, code, headings, blockquote, lists, links, images |
| Cursor-line exclusion | Working | Raw syntax on cursor line, styled elsewhere |
| Auto-save | Not started | Day 4 |
| ⌘S / ⌘⇧S save | Not started | Day 4 |
| File watcher | Not started | Day 4 |
| Crash recovery | Not started | Day 4 |
| Theme toggle | Stubbed | Token system + button present, logic Day 4 |
| Focus mode | Stubbed | CSS complete, toggle present, logic Day 5 |
| Word goal ring | Stubbed | SVG present, animation Day 5 |
| Build / packaging | Not started | Day 5 |

## Environment notes
- Dev machine: macOS, ~/Projects/antigone/
- Launch command: `npm start` (Forge webpack dev server + Electron)
- Build command: `npm run make`
- Node: system Node 18+
- Python path if needed: /opt/homebrew/bin/python3.12
