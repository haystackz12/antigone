# SPRINT.md
> Active sprint only. Replace entirely when a new sprint begins. Never accumulate history here — completed sprints move to ROADMAP.md.

## Sprint 1 — Foundation
**Goal:** Working Electron app. Opens .md files. CodeMirror 6 editor with live inline rendering. Auto-save. Light/dark themes. Focus mode. Word count goal. Multi-platform build confirmed.
**Duration:** Days 1–5

---

## Day 1 — Scaffold & Architecture
**Status:** [x] COMPLETE

### Tasks
- [x] `npx create-electron-app@latest antigone --template=webpack`
- [x] Install: `mini-css-extract-plugin` (replaced style-loader — incompatible with Electron renderer v3)
- [x] `preload.js`: contextBridge exposes `readFile`, `writeFile`, `openDialog`, `saveDialog`, plus recovery, theme, paths, openExternal, onOpenFile
- [x] `main.js`: BrowserWindow, `app.on('open-file')` handler, all IPC handlers implemented
- [x] `index.html`: three-panel DOM — `#sidebar`, `#editor-pane`, `#preview-pane`, `#titlebar`, `#tabbar`, `#statusbar`, `#empty-state`
- [x] `styles.css`: full CSS variable token system — light/dark tokens, layout, typography, syntax, prose
- [x] `forge.config.js`: confirmed correct — macOS, Windows, Linux targets, preload wired
- [x] `webpack.renderer.config.js`: switched to mini-css-extract-plugin

### Gate ✅ PASSED
- `npm start` launches with no console errors ✅
- Three panels visible with full styling ✅
- contextIsolation confirmed (sandbox removed, contextIsolation: true remains) ✅

### Notes
- Launch command is `npm start`, NOT `npx electron .` — Forge webpack requires dev server
- style-loader v3 uses Constructable Stylesheets, incompatible with Electron — use mini-css-extract-plugin
- `sandbox: true` blocked style injection — removed (contextIsolation: true still enforced)
- `<link rel="stylesheet">` removed from index.html — webpack serves CSS via JS bundle only

---

## Day 2 — CodeMirror 6 Editor + File Open
**Status:** [x] COMPLETE — 2026-03-29

### Tasks
- [x] Install: `@codemirror/state @codemirror/view @codemirror/lang-markdown @codemirror/theme-one-dark @codemirror/commands @codemirror/language @codemirror/language-data electron-store`
- [x] `editor.js`: CodeMirror 6 with `markdown()` language, `lineNumbers()`, `lineWrapping()`
- [x] One Dark theme wired for dark mode, GitHub Light CSS variables for light mode
- [x] IPC wired: `openDialog()` → main reads file → sends content → CM6 loads it
- [x] `app.on('open-file')` passes path to renderer (macOS file association handler)
- [x] CLI argument parsing: `antigone path/to/file.md` opens that file
- [x] Drag-and-drop: file dropped on window opens in editor
- [x] Tab bar scaffold: single tab showing filename (no multi-tab logic yet)
- [x] Hide `#empty-state` when file loads, show when no file open

### Gate ✅ PASSED
- Drag CLAUDE.md onto window → content loads with Markdown syntax highlighting ✅
- `⌘O` opens file dialog → select file → it loads ✅
- Headings, bold markers, code blocks each have distinct syntax colors ✅

### Notes
- BUG-001 fixed: workspace grid had 5 columns but only 4 DOM children — #editor-pane was auto-placed into a 5px gutter column. Fixed with explicit grid-column assignments.
- Also fixed duplicate CM6 CSS rules (bottom of styles.css) that conflicted with §10 flex layout.
- New file (⌘N, + tab button, welcome screen button) wired to `newFile()` in editor.js.

---

## Day 3 — Live Inline Rendering
**Status:** [x] COMPLETE — 2026-03-29

### Tasks
- [x] `inline-render.js`: CM6 `ViewPlugin` with decoration set
- [x] Decorations: `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, `# headings` (all 6), `> blockquote`, `- list item`
- [x] Cursor-off → syntax hidden, rendered style applied via `mark` decoration
- [x] Cursor-on → decoration removed, raw syntax revealed
- [x] Image decoration: `![alt](path)` → `<img>` widget when cursor elsewhere, relative path resolved
- [x] Link decoration: `[text](url)` → underlined text, URL hidden when cursor off-line
- [ ] `preview.js`: `marked.js` + `DOMPurify` pipeline initialized — deferred to Sprint 2 (not needed until split-view wiring)

### Gate ✅ PASSED
- Type `**hello**` → move cursor off → `**` disappear, text is bold ✅
- All 7 decoration types work: bold, italic, heading, code, link, image, list ✅
- Syntax markers hide/show on cursor movement ✅

### Notes
- inline-render.js: 305 lines. ViewPlugin scoped to `view.visibleRanges` for performance.
- ImageWidget extends WidgetType — renders `<img>`, falls back to alt text on error.
- preview.js deferred: marked.js + DOMPurify not yet installed. Module not needed until split-view preview is wired in Sprint 2.

---

## Day 4 — Save, Auto-Save & Themes
**Status:** [x] COMPLETE — 2026-03-30

### Tasks
- [x] `⌘S`: IPC `writeFile` with temp-then-rename strategy. `Saved ✓` indicator fades 1.5s.
- [x] `⌘⇧S`: `saveDialog()` → saves → updates tab title and file watcher
- [x] Auto-save: CM6 `onChange` → debounce 800ms → `writeFile` IPC
- [x] `●` unsaved indicator: CM6 state listener → prefix tab title
- [x] `fs.watch()` in main.js → debounce 200ms → `file-changed` IPC to renderer
- [x] `file-changed` banner: Reload / Keep Mine
- [x] Crash recovery: `setInterval` 30s → write to OS temp dir with UUID filename
- [x] Theme toggle: `<html>` class, `nativeTheme` listener, `electron-store` persistence
- [x] `prefs.js`: reads electron-store on load, applies theme, font size, line numbers
- [x] `sandbox: true` re-enabled in webPreferences (DEC-015)
- [x] `editor-save.js` split from editor.js to respect 400-line cap (DEC-017)

### Gate ✅ PASSED
- Edit → wait 1s → open file in Finder Quick Look → changes are there ✅
- Modify file externally → banner appears in Antigone within 1s ✅
- Kill process while editing → relaunch → recovery banner offers restore ✅
- Recovery file is in OS temp dir, NOT next to the source file ✅

### Notes
- electron-store v11 is ESM-only — loaded via webpack externals + dynamic import() (DEC-016)
- editor-save.js uses a `configure()` pattern to receive accessors from editor.js, avoiding circular requires

---

## Day 5 — Focus Mode, Word Goal & Build
**Status:** [ ] Not started

### Tasks
- [ ] `focus.js`: `IntersectionObserver` tracks active paragraph. Non-active → `dimmed` class (opacity 0.25, transition 150ms). Toggle `⌘⇧F`.
- [ ] `wordgoal.js`: CM6 `onChange` → word count → status bar update. Goal ring: SVG `stroke-dashoffset` animation.
- [ ] `⌘⇧G`: inline goal-set prompt in toolbar
- [ ] Status bar: `342 / 500 words · 2 min · Ln 14, Col 8 · MD · Saved ✓`
- [ ] Empty state welcome screen (shown when no file open)
- [ ] `forge.config.js`: add icon assets, file associations for `.md .markdown .mdown`
- [ ] `npm run make` → verify `.app` opens by double-click, `.md` file association works
- [ ] Tag v0.1.0, push to haystackz12/antigone

### Gate (v0.1.0 release criteria)
- Built `.app` opens `.md` files by double-click
- Inline rendering works in the built app
- Focus mode dims non-active paragraphs
- Word goal ring fills as word count increases
- All app data (prefs, recovery) in `~/Library/Application Support/Antigone/` — nothing in source dirs

---

## Sprint 2 Preview (Days 6–10)
Full toolbar, image paste, tags, find/replace, spell check, multi-tab, TOC, split view, export, preferences UI, Vim/Emacs (Pro), Windows build.
See ROADMAP.md for day-by-day detail once Sprint 1 is tagged.

## Carry-over from previous sprint
None (Sprint 1 is first sprint)
