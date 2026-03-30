# NEXT_SESSION.md — Day 5 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 1, Day 5 — Focus Mode, Word Goal & Build.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md

---

## Day 5 Tasks (from SPRINT.md)

### Task 1 — focus.js
- `IntersectionObserver` tracks active paragraph
- Non-active paragraphs get `dimmed` class (opacity 0.25, transition 150ms)
- Toggle with `Cmd+Shift+F`

### Task 2 — wordgoal.js
- CM6 `onChange` dispatches word count to status bar
- Goal ring: SVG `stroke-dashoffset` animation
- `Cmd+Shift+G`: inline goal-set prompt in toolbar

### Task 3 — Status bar wiring
- Format: `342 / 500 words . 2 min . Ln 14, Col 8 . MD . Saved`
- Wire cursor position from CM6 `EditorView.updateListener`

### Task 4 — Empty state welcome screen
- Already stubbed in index.html — verify it shows when no file open, hides on file load

### Task 5 — Build configuration
- `forge.config.js`: add icon assets, file associations for `.md .markdown .mdown`
- `npm run make` to verify `.app` opens by double-click
- Verify `.md` file association works

### Task 6 — Tag and push
- Tag `v0.1.0`
- Push to haystackz12/antigone

---

## Gate (v0.1.0 release criteria)
- Built `.app` opens `.md` files by double-click
- Inline rendering works in the built app
- Focus mode dims non-active paragraphs
- Word goal ring fills as word count increases
- All app data (prefs, recovery) in `~/Library/Application Support/Antigone/` — nothing in source dirs

---

## Hard constraints (never change these)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — permanent
- 400-line file cap — split files if they go over
- Show planned file changes before making them
- All app data to `~/Library/Application Support/Antigone/` — never to source dirs
- Recovery files to `os.tmpdir()` — never adjacent to source files
- Atomic writes only (temp-then-rename) — never partial writes to source file

---

## Carry-over from Day 4
- Bundled fonts (Lora, Cormorant Garamond, Recursive, DM Sans) not yet added — falls back to system fonts
- Apple Developer ID and EV Code Signing cert still needed before Day 13

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 6 (Sprint 2, Day 1).
