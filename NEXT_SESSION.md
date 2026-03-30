# NEXT_SESSION.md — Day 7 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 2, Day 7 — Tags + Find/Replace + Spell Check.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md
5. docs/features/EDITOR.md

---

## Day 7 Tasks (from SPRINT.md)

### Task 1 — Tag indexing + sidebar
- Scan document for `#tag` patterns (word boundary, not inside code blocks)
- Build tag index, populate `#sidebar-content [data-section="tags"]`
- Click tag in sidebar to jump to its location in the editor
- Update tags on every document change (debounced)

### Task 2 — Tag autocomplete
- While typing `#`, show autocomplete dropdown with known tags
- Select from dropdown to complete the tag

### Task 3 — Find and Replace (Cmd+F / Cmd+H)
- Cmd+F opens find bar overlay at top of editor pane
- Cmd+H opens find and replace bar
- Next/Previous navigation, match count, case sensitivity toggle
- CM6 has built-in @codemirror/search — wire it

### Task 4 — Spell check
- OS spellcheck bridge via Electron's built-in webFrame spellcheck
- Custom dictionary IPC — add/remove words from .antigone-dict (per-project, opt-in)

---

## Gate
- Type `#mytag` in document, tag appears in sidebar
- Click tag in sidebar, cursor jumps to tag
- Cmd+F opens search, finds matches with highlighting
- Cmd+H opens replace, replacements work
- Misspelled words show red underline

---

## Hard constraints (never change these)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — permanent
- 400-line file cap — split files if they go over
- Show planned file changes before making them
- All app data to `~/Library/Application Support/Antigone/` — never to source dirs
- Recovery files to `os.tmpdir()` — never adjacent to source files

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 8.
