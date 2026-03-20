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
**Status:** [ ] Not started

### Tasks
- [ ] Install: `@codemirror/state @codemirror/view @codemirror/lang-markdown @codemirror/theme-one-dark @codemirror/commands @codemirror/language @codemirror/language-data electron-store`
- [ ] `editor.js`: CodeMirror 6 with `markdown()` language, `lineNumbers()`, `lineWrapping()`
- [ ] One Dark theme wired for dark mode, GitHub Light CSS variables for light mode
- [ ] IPC wired: `openDialog()` → main reads file → sends content → CM6 loads it
- [ ] `app.on('open-file')` passes path to renderer (macOS file association handler)
- [ ] CLI argument parsing: `antigone path/to/file.md` opens that file
- [ ] Drag-and-drop: file dropped on window opens in editor
- [ ] Tab bar scaffold: single tab showing filename (no multi-tab logic yet)
- [ ] Hide `#empty-state` when file loads, show when no file open

### Gate
- Drag CLAUDE.md onto window → content loads with Markdown syntax highlighting
- `⌘O` opens file dialog → select file → it loads
- Headings, bold markers, code blocks each have distinct syntax colors

---

## Day 3 — Live Inline Rendering
**Status:** [ ] Not started

### Tasks
- [ ] `inline-render.js`: CM6 `ViewPlugin` with decoration set
- [ ] Decorations: `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, `# headings` (all 6), `> blockquote`, `- list item`
- [ ] Cursor-off → syntax hidden, rendered style applied via `mark` decoration
- [ ] Cursor-on → decoration removed, raw syntax revealed
- [ ] Image decoration: `![alt](path)` → `<img>` widget when cursor elsewhere, relative path resolved
- [ ] Link decoration: `[text](url)` → underlined text; click → `shell.openExternal(url)`
- [ ] `preview.js`: `marked.js` + `DOMPurify` pipeline initialized (used in Sprint 2, module exists now)

### Gate
- Type `**hello**` → move cursor off → `**` disappear, text is bold
- All 7 decoration types work: bold, italic, heading, code, link, image, list
- Open 500-line file → no visible lag on cursor movement

---

## Day 4 — Save, Auto-Save & Themes
**Status:** [ ] Not started

### Tasks
- [ ] `⌘S`: IPC `writeFile` with temp-then-rename strategy. `Saved ✓` indicator fades 1.5s.
- [ ] `⌘⇧S`: `saveDialog()` → saves → updates tab title and file watcher
- [ ] Auto-save: CM6 `onChange` → debounce 800ms → `writeFile` IPC
- [ ] `●` unsaved indicator: CM6 state listener → prefix tab title
- [ ] `fs.watch()` in main.js → debounce 200ms → `file-changed` IPC to renderer
- [ ] `file-changed` banner: Reload / Keep Mine
- [ ] Crash recovery: `setInterval` 30s → write to OS temp dir with UUID filename
- [ ] Theme toggle: `<html>` class, `nativeTheme` listener, `electron-store` persistence
- [ ] `prefs.js`: reads electron-store on load, applies theme, font size, line numbers

### Gate
- Edit → wait 1s → open file in Finder Quick Look → changes are there
- Modify file externally → banner appears in Antigone within 1s
- Kill process while editing → relaunch → recovery banner offers restore
- Recovery file is in OS temp dir, NOT next to the source file

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
