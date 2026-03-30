# NEXT_SESSION.md — Day 9 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 2, Day 9 — Export + Page Breaks + Print.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md

---

## Day 9 Tasks (from SPRINT.md)

### Task 1 — PDF silent export
- Use Electron's `webContents.printToPDF()` via IPC
- Render Markdown to HTML (reuse preview.js pipeline)
- Export to user-selected path via save dialog
- Add `export-pdf` IPC handler in main.js
- Add `exportPdf` to preload.js

### Task 2 — HTML self-contained export
- Render Markdown to HTML with inline styles
- Save as standalone .html file
- Include CSS for proper formatting

### Task 3 — Print stylesheet
- `@media print` CSS rules for clean printing
- Hide UI elements (toolbar, sidebar, tabs, status bar)
- Show only prose content

### Task 4 — Page break detection
- Detect `<!-- pagebreak -->` in Markdown
- Inject `page-break-before: always` CSS at those points
- Works for both PDF export and print

---

## Gate
- Export to PDF produces readable output
- Export to HTML produces standalone file
- Cmd+P prints with correct formatting
- `<!-- pagebreak -->` creates page breaks in PDF/print

---

## Hard constraints (never change these)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — permanent
- 400-line file cap — split files if they go over
- Show planned file changes before making them
- All app data to `~/Library/Application Support/Antigone/` — never to source dirs

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 10.
