# closing_instructions.md
> Run through this file top to bottom at the end of every sprint day, no exceptions.
> This file lives in docs/ and is never modified by Claude — it is a permanent procedure.

---

## Step 1 — Verify all files are saved

Check that no tab in your editor shows an unsaved indicator (● prefix).
In terminal, confirm the working directory is correct:
```bash
cd ~/Projects/antigone
pwd
# Should print: /Users/michaelhastings/Projects/antigone
```

---

## Step 2 — Check git status

```bash
git status
```

Review every file listed. Ask:
- Is this file supposed to exist? (No accidental temp files, `.antigone-recovery-*`, or OS junk like `.DS_Store`)
- Is this file in the right location?

If you see unexpected files, do NOT commit them. Delete or gitignore them first.

Useful gitignore entries to confirm are present in `.gitignore`:
```
node_modules/
dist/
out/
.DS_Store
*.tmp
*.antigone-recovery-*
.antigone-dict
```

---

## Step 3 — Stage and review the diff

```bash
git add -A
git diff --staged --stat
```

Read the diff stat. Confirm the number of files changed makes sense for what was done today.
If a file shows unexpected changes, unstage it and investigate:
```bash
git restore --staged path/to/file
```

---

## Step 4 — Commit with a conventional commit message

Format: `type(scope): short description`

**Types:**
- `feat` — new feature added
- `fix` — bug fixed
- `refactor` — code restructured, no behavior change
- `docs` — documentation only
- `style` — CSS, formatting, no logic change
- `test` — test fixtures or checklist updates
- `chore` — build config, package.json, forge config

**Scopes** (use the module name):
`editor`, `preview`, `toolbar`, `tabs`, `toc`, `tags`, `autosave`, `spellcheck`, `export`, `prefs`, `main`, `preload`, `forge`, `docs`, `styles`

**Examples:**
```bash
git commit -m "feat(editor): add CodeMirror 6 with Markdown language and syntax highlighting"
git commit -m "feat(inline-render): implement decoration layer for bold, italic, heading tokens"
git commit -m "fix(autosave): use temp-then-rename to prevent partial file writes"
git commit -m "docs(sprint): update SESSION_STATE and SPRINT for Day 2 completion"
```

If today covered multiple areas, use multiple commits (one per logical unit) or a summary:
```bash
git commit -m "feat(editor): scaffold CM6, file open IPC, drag-and-drop, tab bar"
```

---

## Step 5 — Push to GitHub

```bash
git push origin main
```

Confirm it succeeds. If rejected (non-fast-forward), do NOT force push:
```bash
git pull --rebase origin main
git push origin main
```

Go to https://github.com/haystackz12/antigone and confirm the commit appears.

---

## Step 6 — Update SESSION_STATE.md

Open `docs/SESSION_STATE.md` and overwrite it completely. Fill in every field accurately:

```markdown
# SESSION_STATE.md

## Last updated
YYYY-MM-DD — Sprint N, Day N

## Current sprint
Sprint N — [Sprint name]

## Current day
Day N — [Day title] — COMPLETE

## What was completed this session
- [Specific task 1 — file name, function name, IPC channel]
- [Specific task 2]
- [Specific task 3]

## Exact state of the codebase
- main.js: [what works, what's stubbed]
- preload.js: [channels exposed]
- renderer/editor.js: [state]
- renderer/inline-render.js: [state]
- [every modified file]

## What to do FIRST next session
[One sentence. Exact file and function to open. No ambiguity.]
Example: "Open renderer/editor.js and implement the `wrapSelection()` function for the Bold toolbar button — see features/EDITOR.md toolbar section."

## Blockers / open issues
- [Anything preventing forward progress]
- None if clear

## Files modified this session
- [list every file touched]

## Known working / broken state
| Feature | Status | Notes |
|---------|--------|-------|
| [feature] | Working / Stubbed / Broken | [detail] |
```

---

## Step 7 — Update SPRINT.md task statuses

Open `docs/SPRINT.md`.
Mark each completed task:
- Change `[ ]` to `[x]` for completed tasks
- Add any tasks that were discovered and completed (not on the original list)
- If a GATE was tested and passed, add `✅ PASSED` next to it
- If a GATE failed, add `❌ FAILED — [reason]` and move it to BUGS.md

---

## Step 8 — Log any new bugs

If any bugs were found today (even if not yet fixed), add them to `docs/BUGS.md`:

```markdown
### BUG-001 — Short title
- **Found:** 2026-03-21, Day 2 of Sprint 1
- **Severity:** High
- **Status:** Open
- **Symptom:** What the user sees
- **Reproduction:** Step 1, Step 2, Step 3
- **Root cause:** (leave blank if unknown)
- **Files involved:** renderer/editor.js
```

---

## Step 9 — Final commit (docs update)

After updating SESSION_STATE.md, SPRINT.md, and BUGS.md:

```bash
git add docs/
git commit -m "docs(session): Day N complete — update SESSION_STATE, SPRINT, BUGS"
git push origin main
```

---

## Step 10 — Verify on GitHub

Go to: https://github.com/haystackz12/antigone
Confirm:
- Latest commit shows today's work
- docs/SESSION_STATE.md shows the current day as COMPLETE
- No unexpected files committed

---

## Opening message for the NEXT day's chat session

Copy and paste this template into a new Claude chat at the start of the next session.
Fill in the bracketed fields before sending.

---

**COPY FROM HERE:**

```
We are working on the Antigone project — a cross-platform Markdown and plain text
editor built on Electron + CodeMirror 6, targeting macOS, Windows, and Linux.
Repo: haystackz12/antigone  |  Local path: ~/Projects/antigone

Please read the following files before we begin:
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/BUGS.md

Today is Sprint [N], Day [N] — [Day title].

[PASTE THE CONTENT OF docs/SESSION_STATE.md HERE]

Today's goals from SPRINT.md:
[PASTE TODAY'S DAY SECTION FROM SPRINT.md HERE]

The gate we must pass before ending today:
[PASTE THE GATE CONDITION FROM SPRINT.md HERE]

Also read: docs/features/[FEATURE FILE RELEVANT TO TODAY].md

Let's begin with: [PASTE THE "WHAT TO DO FIRST" LINE FROM SESSION_STATE.md HERE]
```

**END COPY**

---

## Quick reference — git commands

```bash
# Check status
git status

# Stage all
git add -A

# Stage specific file
git add path/to/file.js

# Unstage a file
git restore --staged path/to/file

# Commit
git commit -m "type(scope): message"

# Push
git push origin main

# See recent commits
git log --oneline -10

# See what changed in a specific file
git diff HEAD~1 -- path/to/file.js

# Create and push a version tag
git tag v0.1.0
git push origin v0.1.0
```
