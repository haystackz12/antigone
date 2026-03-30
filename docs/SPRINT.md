# SPRINT.md
> Active sprint only. Replace entirely when a new sprint begins. Never accumulate history here — completed sprints move to ROADMAP.md.

## Sprint 2 — Complete Editor
**Goal:** Full editing feature set shipped and tested on macOS + Windows.
**Duration:** Days 6–10

---

## Day 6 — Toolbar + Image Paste
**Status:** [x] COMPLETE — 2026-03-30

### Tasks
- [x] `toolbar.js`: `wrapSelection()` for bold/italic/strike/code, `toggleHeadingPrefix()` for H1-H3, `insertLink()` for links
- [x] All 8 toolbar buttons wired via `data-action` attributes + click handlers
- [x] ⌘B (bold), ⌘I (italic), ⌘K (link) keyboard shortcuts — both CM6 keymap and global fallback
- [x] Image paste from clipboard: `save-image` IPC saves to `assets/` dir, inserts `![](./assets/image-TIMESTAMP.ext)` at cursor
- [x] `saveImage` added to preload.js API surface
- [x] SPRINT.md replaced with Sprint 2 content

### Gate
- Click Bold with text selected → wraps in `**` ✅
- Click Bold again → unwraps `**` ✅
- ⌘B keyboard shortcut works ✅
- Paste image from clipboard → image file saved, reference inserted ✅
- All 8 toolbar buttons functional ✅

### Notes
- toolbar.js uses a `configure()` pattern to receive `getView` and `getCurrentPath` from editor.js, same as editor-save.js
- Image paste requires a saved file path for the assets/ directory context — disabled for unsaved files
- Heading toggle removes any existing heading prefix before applying the new one

---

## Day 7 — Tags + Find/Replace + Spell Check
**Status:** [x] COMPLETE — 2026-03-30

### Tasks
- [x] `tags.js`: scans document for `#tag` patterns (regex: `(?:^|\s)#([a-zA-Z][\w-]*)`) with 300ms debounce
- [x] Tag sidebar: alphabetically sorted tag list with occurrence counts, click-to-jump
- [x] Sidebar tab switching: click Files/Tags/TOC tabs to show/hide sections
- [x] Tag autocomplete: CM6 `autocompletion()` with custom `tagCompletion()` source — triggers on `#` prefix
- [x] ⌘F / ⌘H: `@codemirror/search` wired via `searchKeymap` + `highlightSelectionMatches()`
- [x] Spell check: Electron's built-in `spellcheck: true` already active — OS spell checker underlines misspelled words. Custom dictionary IPC deferred to later sprint.

### Gate ✅ PASSED
- Type `#mytag` → appears in sidebar ✅
- Click tag in sidebar → cursor jumps to tag location ✅
- ⌘F opens find bar, searches work ✅
- ⌘H opens find/replace, replacements work ✅
- Misspelled words show red underline ✅

### Notes
- Tag autocomplete scans the full document on each completion request — acceptable for files under 150K chars
- Sidebar tab switching was not previously wired — added in tags.js
- Custom dictionary (.antigone-dict) IPC deferred — core OS spell check works without it

---

## Day 8 — Multi-tab + TOC + Split View
**Status:** [ ] Not started

### Tasks
- [ ] Tab state management: open, close, switch tabs
- [ ] Session restore: remember open tabs on restart
- [ ] TOC: generate from headings, click-to-navigate
- [ ] Split view: editor | preview side by side
- [ ] Scroll sync between editor and preview

### Gate
- Open 3 files in 3 tabs, switch between them
- Close app → reopen → same tabs restored
- TOC shows headings, clicking scrolls editor
- Split view renders Markdown preview

---

## Day 9 — Export + Page Breaks + Print
**Status:** [ ] Not started

### Tasks
- [ ] PDF silent export
- [ ] HTML self-contained export
- [ ] Print stylesheet
- [ ] `<!-- pagebreak -->` detection + print CSS injection

### Gate
- Export to PDF produces readable output
- Export to HTML produces standalone file
- ⌘P prints with correct formatting

---

## Day 10 — Preferences UI + Vim/Emacs (Pro) + Windows Build
**Status:** [ ] Not started

### Tasks
- [ ] All 22 prefs wired to UI
- [ ] Vim/Emacs CM6 toggle (Pro feature)
- [ ] Windows .exe build confirmed
- [ ] Windows file association for .md

### Gate
- Preferences UI opens, changes persist
- Vim mode toggle works (Pro)
- Windows build produces working .exe
- Tag v0.3.0

---

## Carry-over from Sprint 1
- Bundled fonts not yet added — falls back to system fonts
- No app icon yet — uses default Electron icon
- Apple Developer ID and EV Code Signing cert needed before Day 13
