We are working on the Antigone project — a cross-platform Markdown and plain text
editor built on Electron + CodeMirror 6, targeting macOS, Windows, and Linux.
Repo: haystackz12/antigone  |  Local path: ~/Projects/antigone

Today is **Sprint 1, Day 4 — Save, Auto-Save & Themes**.

Please read the following files before we begin:
1. `docs/CLAUDE.md`
2. `docs/SESSION_STATE.md`
3. `docs/SPRINT.md`
4. `docs/DECISIONS.md`

Also read: `docs/features/AUTOSAVE.md`

---

## Day 4 Tasks (from SPRINT.md)

- [ ] `⌘S`: IPC `writeFile` with temp-then-rename strategy. `Saved ✓` indicator fades 1.5s.
- [ ] `⌘⇧S`: `saveDialog()` → saves → updates tab title and file watcher
- [ ] Auto-save: CM6 `onChange` → debounce 800ms → `writeFile` IPC
- [ ] `●` unsaved indicator: CM6 state listener → prefix tab title
- [ ] `fs.watch()` in main.js → debounce 200ms → `file-changed` IPC to renderer
- [ ] `file-changed` banner: Reload / Keep Mine
- [ ] Crash recovery: `setInterval` 30s → write to OS temp dir with UUID filename
- [ ] Theme toggle: `<html>` class, `nativeTheme` listener, `electron-store` persistence
- [ ] `prefs.js`: reads electron-store on load, applies theme, font size, line numbers

## Gate

- Edit → wait 1s → open file in Finder Quick Look → changes are there
- Modify file externally → banner appears in Antigone within 1s
- Kill process while editing → relaunch → recovery banner offers restore
- Recovery file is in OS temp dir, NOT next to the source file

## Constraints (never change these)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — permanent
- 400-line file cap per source file
- Show planned file changes before making them

## Carry-over issues from SESSION_STATE.md

- `sandbox: true` is listed as a hard constraint but is NOT currently set in `webPreferences` in `main.js`. Day 1 notes say it was removed because it "blocked style injection." Now using `mini-css-extract-plugin` instead of `style-loader` — confirm whether to re-enable sandbox before starting Day 4 work.
- Bundled fonts (Lora, Cormorant Garamond, Recursive, DM Sans) not yet added — falls back to system fonts. Not blocking Day 4.
- `preview.js` (marked.js + DOMPurify) deferred to Sprint 2.
- Apple Developer ID and EV Code Signing cert still needed before Day 13.

## Start with

Open `src/editor.js` and implement `saveFile()` that calls `window.api.writeFile()` with the current file path and document content. See `docs/features/AUTOSAVE.md` for the temp-then-rename strategy.
