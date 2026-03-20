# Antigone — CLAUDE.md
> Entry point. Read this file every session, no exceptions. Then read only the files listed under your task below.

## What this project is
Cross-platform Markdown + plain text editor. Electron + CodeMirror 6. macOS / Windows / Linux.
Repo: haystackz12/antigone   Path: ~/Projects/antigone   Executable: Antigone

## Architecture constraints — PERMANENT, never override
1. contextIsolation: true — renderer has zero Node access. Never disable.
2. nodeIntegration: false — no require() in renderer. Never enable.
3. All renderer↔main communication via preload.js contextBridge ONLY.
4. All file I/O (read, write, watch, image save, preprocessor exec) in main.js ONLY.
5. DOMPurify sanitizes ALL rendered HTML before DOM injection. No exceptions.
6. No eval(), no Function(), no innerHTML without DOMPurify.
7. External links via shell.openExternal() only. Editor pane never navigates.
8. Source files capped at 400 lines. Refactor before exceeding.
9. Auto-save: temp file → atomic rename. Never partially write the source file.
10. File watchers cleaned up on tab close / file change / window close. Leaked watchers = bugs.
11. ALL app data to OS user data dir ONLY. Never write to source directories.
    - macOS: ~/Library/Application Support/Antigone/
    - Windows: %APPDATA%\Antigone\
    - Linux: ~/.config/Antigone/
    Exception: .antigone-dict in project dir (spell check, documented, user opt-in only).
12. Crash recovery files → OS temp dir. Never adjacent to source files.
13. Preprocessors: sandboxed child_process, 5s hard timeout, user-configured only.
14. Executable: Antigone (capital A). Package/repo: antigone (lowercase).
15. Fonts (Lora, Cormorant Garamond, Recursive, DM Sans) bundled in app. Never fetched at runtime.

## Launch command (development)
```
cd ~/Projects/antigone && npx electron .
```

## Build command
```
npm run make
```

## Navigation map — read ONLY what your session needs

### Starting a new session
1. This file (CLAUDE.md) — always
2. SESSION_STATE.md — what was done last, what's next
3. SPRINT.md — current day's tasks and gates
4. BUGS.md — anything blocking today's work

### Working on a specific feature
Read the matching file in features/ — nothing else unless it references another doc.
- Editor / inline rendering / keymaps → features/EDITOR.md
- Preview pane / Mermaid / scroll sync → features/PREVIEW.md
- Tags / tag index / tag sidebar → features/TAGS.md
- Pro gates / license / upgrade flow → features/FREEMIUM.md
- PDF / HTML / DOCX / print / page breaks → features/EXPORT.md
- Spell check / custom dictionary → features/SPELLCHECK.md
- Auto-save / file watch / crash recovery → features/AUTOSAVE.md
- Typeface pairings / font loading → features/TYPOGRAPHY.md

### Touching infrastructure (IPC, main.js, preload, forge)
Read ARCHITECTURE.md in addition to the session files above.

### Confused about a past decision
Read DECISIONS.md.

### Planning the next sprint
Read ROADMAP.md.

### Running QA / writing tests
Read TESTING.md.

## Module map (one-line each)
```
main.js            BrowserWindow, IPC handlers, fs.watch, auto-save, updater
preload.js         contextBridge: readFile, writeFile, watchFile, openDialog,
                   saveDialog, saveImage, runPreprocessor, getPrefs, setPrefs
renderer/
  index.html       Three-panel shell: sidebar | editor | preview
  editor.js        CodeMirror 6, Markdown lang, inline rendering, keymaps
  inline-render.js CM6 decoration layer — hides syntax tokens on cursor leave
  preview.js       marked.js + DOMPurify + highlight.js + mermaid
  toolbar.js       Formatting buttons, view mode toggles, word goal ring
  tabs.js          Multi-tab state, session save/restore
  toc.js           TOC generation, scroll sync, IntersectionObserver
  tags.js          #tag scanner, tag index IPC, tag sidebar
  focus.js         Paragraph dimming overlay
  wordgoal.js      Word count engine, goal tracking, progress ring SVG
  spellcheck.js    OS spellcheck bridge + custom dictionary IPC
  preprocessor.js  Shell command pipe → stdout → preview
  pagebreak.js     <!-- pagebreak --> detection + print CSS injection
  prefs.js         electron-store reads, apply to UI, typeface pairing loader
  styles.css       Design tokens, light/dark, editor + preview CSS, print CSS
forge.config.js    macOS DMG · Windows NSIS · Linux AppImage + DEB
```

## Key npm scripts
```
npx electron .     Run in development
npm run make       Build distributable for current platform
npm run package    Package without making installer
```

## End-of-session checklist
- [ ] Update SESSION_STATE.md with what was done and exact next step
- [ ] Update SPRINT.md task statuses
- [ ] Add any new bugs to BUGS.md
- [ ] commit + push: git add -A && git commit -m "type(scope): message" && git push
