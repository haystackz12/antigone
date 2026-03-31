# NEXT_SESSION.md — Day 10 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 2, Day 10 — Preferences UI + Vim/Emacs (Pro) + Windows Build.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md

---

## Day 10 Tasks (from SPRINT.md)

### Task 1 — Preferences UI
- Create a preferences panel/modal accessible from toolbar or menu
- Wire all existing prefs: theme, font size, line numbers, auto-save, view mode
- Changes persist immediately to electron-store
- UI updates in real-time as prefs change

### Task 2 — Vim/Emacs keybindings (Pro feature stub)
- Install @codemirror/vim
- Add a "Keybindings" pref: Normal / Vim / Emacs
- Vim toggle loads/unloads the vim() extension via Compartment
- Gate behind a Pro flag (stub for now — always allow in dev)

### Task 3 — Windows build
- Run npm run make on Windows (or cross-compile if on macOS)
- Verify .exe file association for .md files
- Test basic functionality on Windows

### Task 4 — Tag v0.3.0
- Tag and push v0.3.0

---

## Gate
- Preferences UI opens, changes persist across relaunch
- Vim mode toggle works
- Windows build produces working .exe (if testable)
- Tag v0.3.0

---

## Hard constraints (never change these)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — permanent
- 400-line file cap — split files if they go over
- Show planned file changes before making them
- All app data to `~/Library/Application Support/Antigone/` — never to source dirs

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 11 (Sprint 3).
