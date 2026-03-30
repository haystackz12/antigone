# NEXT_SESSION.md — Day 8 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 2, Day 8 — Multi-tab + TOC + Split View.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md

---

## Day 8 Tasks (from SPRINT.md)

### Task 1 — Tab state management
- Open, close, switch tabs
- Each tab has its own document state, file path, dirty flag
- + button opens a new tab (not replaces current)
- Close tab button with unsaved guard

### Task 2 — Session restore
- Remember open tabs on quit (store in electron-store)
- Restore tab state on relaunch

### Task 3 — TOC (Table of Contents)
- Generate heading list from document
- Populate the TOC sidebar section
- Click heading in TOC to scroll editor to that position
- Update on document change (debounced)

### Task 4 — Split view with preview
- Install marked.js + DOMPurify
- Create preview.js — render Markdown to HTML in preview pane
- Wire split view: editor changes update preview
- Replace preview placeholder with live content

### Task 5 — Enable preview-only toolbar button
- Remove disabled attribute from preview-only button (DEC-021 revisit)

---

## Gate
- Open 3 files in 3 tabs, switch between them
- Close app, reopen — same tabs restored
- TOC shows headings, clicking scrolls editor
- Split view renders live Markdown preview
- Preview-only mode shows rendered Markdown

---

## Hard constraints (never change these)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — permanent
- 400-line file cap — split files if they go over
- Show planned file changes before making them
- All app data to `~/Library/Application Support/Antigone/` — never to source dirs

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 9.
