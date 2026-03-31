# NEXT_SESSION.md — Day 11 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 3, Day 11 — Preprocessors (Pro) + Tag Enhancements.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md (will need Sprint 3 content added)
4. docs/DECISIONS.md

---

## Day 11 Tasks (from ROADMAP.md)

### Task 1 — Preprocessors (Pro feature)
- Shell pipe: user configures a command, editor pipes Markdown through it
- Output replaces or augments the preview
- Sandboxed child_process with 5s hard timeout
- Pro feature gate (stub — always allow in dev)

### Task 2 — YAML frontmatter tag indexing
- Parse YAML frontmatter for `tags:` field
- Include frontmatter tags in the tag sidebar alongside inline #tags

### Task 3 — Tag rename
- Right-click tag in sidebar → rename
- Updates all occurrences in the document

### Task 4 — Sprint 3 SPRINT.md
- Replace Sprint 2 content in SPRINT.md with Sprint 3 tasks
- Move Sprint 2 summary to ROADMAP.md

---

## Gate
- Configure a preprocessor command → preview shows processed output
- YAML frontmatter tags appear in sidebar
- Rename tag → all occurrences updated

---

## Hard constraints (never change these)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — permanent
- 400-line file cap — split files if they go over
- Show planned file changes before making them
- All app data to `~/Library/Application Support/Antigone/` — never to source dirs
- Preprocessors: sandboxed child_process, 5s hard timeout, user-configured only

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 12.
