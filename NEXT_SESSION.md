# NEXT_SESSION.md — Sprint 4, Day 1 (Automated Tests + CI)

We are working on the Antigone project — a Markdown editor built on Electron +
CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone | Run: npm start

v1.0.0 shipped on 2026-09-09. Sprint 4 hardens the app before Sprint 5 adds
features. Day 1 sets up the automated test suite and CI pipeline.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md (note DEC-035: no commercial features)
5. docs/ROADMAP.md (Sprint 4 scope)
6. docs/TESTING.md (the v1.0 manual checklist to automate)
7. docs/BUGS.md (BUG-042, BUG-051, BUG-052 get regression tests first)

Then run `git log --oneline -5` and `git status` and confirm the tree is clean
on main. Report before proceeding.

---

## Day 1 — Playwright E2E Suite + GitHub Actions

### Task 1 — Set up Playwright with Electron
- Install `@playwright/test` and `electron` as dev dependencies
- Configure `playwright.config.ts` for Electron (use `_electron.launch()`)
- Create `tests/` directory structure
- First smoke test: app launches, editor mounts, title bar visible

### Task 2 — Regression tests for v1.0 bugs
Write failing-then-passing tests for:
1. **BUG-042 — Tab title bleed:** Open file, Save As to new name, click +,
   verify new tab shows "Untitled" not the Save As name
2. **BUG-051 — Theme persistence:** Select Sepia in prefs, quit, relaunch,
   verify the editor loads with Sepia theme (not White)
3. **BUG-052 — Cmd+Q quit:** Launch, Cmd+Q, verify the app process exits
   (not stuck in dock)

### Task 3 — Convert manual checklist items to E2E tests
Priority order (highest-value tests first):
1. File open (Cmd+O), save (Cmd+S), save-as (Cmd+Shift+S)
2. Unsaved-changes dialog on Cmd+W with dirty buffer
3. Inline rendering: type `**bold**`, move cursor off, verify decoration
4. Auto-save: type, wait 1s, verify file content on disk
5. Crash recovery: write recovery file, kill, relaunch, verify banner
6. Save-time mtime conflict: modify file externally, Cmd+S, verify dialog
7. Cmd+B bold toggle (wraps and unwraps)
8. Image paste inserts single reference

### Task 4 — GitHub Actions CI
- Create `.github/workflows/test.yml`
- Trigger: push to main, pull requests
- Matrix: macOS only for now (Electron + Playwright)
- Steps: checkout, install, build, run Playwright suite
- Upload test results as artifacts

### Gate
- `npx playwright test` passes locally with all regression tests green
- GitHub Actions runs the suite on push and reports pass/fail
- At least 10 checklist items from TESTING.md have automated coverage

---

## Sprint 4 rule
A bug fix is not done until it has a failing-then-passing test.

## Constraints reminder
- contextIsolation: true, nodeIntegration: false, sandbox: true — NEVER change
- 400-line file cap per source file
- All renderer-main communication via preload.js contextBridge ONLY
- Do not break any v1.0 functionality
