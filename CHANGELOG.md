# Changelog

## [1.0.1] — 2026-09-11

### Fixed
- **BUG-053**: Right-click now shows a full context menu (Cut / Copy / Paste / Select All) everywhere in the editor — not just on misspelled words. Spelling suggestions and "Add to Dictionary" are prepended when a misspelled word is right-clicked. "Copy as HTML" is shown when there is a text selection.

### Added
- **View mode shortcuts**: `⌘1` Editor, `⌘2` Split, `⌘3` Preview — accelerators visible in the View menu.
- **Find panel match counter**: Search panel now displays "N of M" showing the current match index and total matches.
- **Inline tag chip decoration**: `#tag` and `#nested/tag` tokens render as styled chips in the editor (theme-aware background, revealed on cursor line for editing). Tags inside code blocks and headings are not decorated.

### Changed
- File → "Recent Files" renamed to **"Open Recent"**; "Clear Recent Files" renamed to **"Clear Menu"**.
- Find and Replace menu items now properly wired to open the CM6 search panel.

## [1.0.0] — 2026-09-08

First public release.

### Editor
- Inline Markdown rendering — bold, italic, headings, code, links, images, and
  task lists render in place as you type, with raw syntax revealed on the active
  line
- Split view (editor + preview side by side) and preview-only mode
- Focus mode dims non-active paragraphs
- Vim mode (opt-in via preferences)
- Find and replace with regex support
- Paste image from clipboard — saves PNG to an `assets/` folder and inserts the
  reference
- Large file handling — inline rendering disabled above 150K characters with a
  warning banner

### Writing tools
- Live word count and estimated read time in the status bar
- Tags — inline `#tags` and YAML frontmatter `tags:` arrays, indexed in a
  sidebar panel with autocomplete and rename
- Spell check via the OS spell checker, with per-project custom dictionaries
- Preprocessors — pipe Markdown through a user-configured shell command

### Themes and typography
- Four editor themes: White, Parchment, Sepia, and Midnight
- Adjustable editor font size

### Export
- PDF export with page break support (`<!-- pagebreak -->`)
- Standalone HTML export (works offline)
- Print with hidden chrome and proper page breaks

### Multi-tab
- Open multiple files in tabs, each with independent scroll position and undo
  history
- Unsaved-changes dialog on close and before opening a new file
- Tab session is not auto-restored on launch (by design — see DEC-023)

### File handling
- macOS file association for `.md`, `.markdown`, `.mdown`
- Open via Cmd+O, drag-and-drop, double-click from Finder, or command line
- Atomic saves — temp file then rename, never a partial write
- Auto-save (opt-in) with 800ms debounce
- Crash recovery — periodic snapshots to OS temp directory, restore offered on
  relaunch
- Save-time conflict check — warns before overwriting externally modified files

### Platform
- macOS code signing, notarization, and stapling
- DMG installer
- Auto-updater checking GitHub Releases
- ARIA labels on all interactive elements
- Respects `prefers-reduced-motion`

### Notable fixes
- Fixed invisible editor content caused by CSS grid auto-placement (BUG-001)
- Fixed electron-store incompatibility in production — replaced with JSON file
  store
- Fixed duplicate IPC handler crash on app relaunch
- Fixed selection layer z-index causing unclickable elements
