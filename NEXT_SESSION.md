# NEXT_SESSION.md — Day 6 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 2, Day 6 — Toolbar + Image Paste.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md (will need Sprint 2 content added)
4. docs/DECISIONS.md
5. docs/features/EDITOR.md (toolbar section)

---

## Day 6 Tasks (from ROADMAP.md)

### Task 1 — Toolbar formatting buttons
Wire all 16 toolbar buttons to CM6 commands:
- Bold (⌘B), Italic (⌘I), Strikethrough, Inline code
- Link (⌘K), H1, H2, H3
- Each button wraps/unwraps selected text with appropriate Markdown syntax
- Create `src/toolbar.js` for button wiring logic

### Task 2 — Image paste from clipboard
- ⌘V with image data on clipboard → save image to assets/ dir adjacent to file
- Insert `![](./assets/image-TIMESTAMP.png)` at cursor
- Requires new IPC: `save-image` in main.js (write buffer to disk)
- Add `saveImage` to preload.js

### Task 3 — Sprint 2 SPRINT.md
- Replace Sprint 1 content in SPRINT.md with Sprint 2 day-by-day tasks
- Move Sprint 1 summary to ROADMAP.md

---

## Gate
- Click Bold button with text selected → wraps in `**`
- Click Bold again → unwraps `**`
- ⌘B keyboard shortcut works
- Paste image from clipboard → image file saved, reference inserted
- All 16 toolbar buttons functional

---

## Hard constraints (never change these)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — permanent
- 400-line file cap — split files if they go over
- Show planned file changes before making them
- All app data to `~/Library/Application Support/Antigone/` — never to source dirs
- Recovery files to `os.tmpdir()` — never adjacent to source files
- Atomic writes only (temp-then-rename) — never partial writes to source file

---

## Carry-over
- Bundled fonts not yet added — falls back to system fonts
- No app icon yet — uses default Electron icon
- Apple Developer ID and EV Code Signing cert needed before Day 13

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 7.
