# NEXT_SESSION.md — Day 13 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 3, Day 13 — Code Signing + Auto-updater.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md

---

## Day 13 Tasks (from SPRINT.md)

### Task 1 — Apple notarization
- Configure code signing in forge.config.js
- Set up Apple Developer ID certificate
- Test notarization workflow

### Task 2 — NSIS signing (Windows)
- Configure Windows code signing
- EV code signing certificate setup

### Task 3 — electron-updater with GitHub Releases CI
- Install electron-updater
- Configure auto-update check on launch
- Set up GitHub Actions for release builds

---

## Gate
- Signed .app passes macOS Gatekeeper
- Auto-updater detects and installs new version

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 14.
