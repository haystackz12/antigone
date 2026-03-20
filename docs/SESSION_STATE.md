# SESSION_STATE.md
> Overwrite this file completely at the end of every session. It is the single source of truth for "where we left off."

## Last updated
<!-- Replace with: YYYY-MM-DD, Session N -->
YYYY-MM-DD — Pre-development. No sessions run yet.

## Current sprint
Sprint 1 — Foundation

## Current day
Day 0 — Not started

## What was completed this session
<!-- List every discrete task completed. Be specific — file names, function names, IPC channels. -->
- Nothing yet. Awaiting Sprint 1 Day 1 kickoff.

## Exact state of the codebase
<!-- Describe the state of each modified file. What works, what's stubbed, what's broken. -->
- Repo not yet initialized.
- Spec document complete: Antigone-Spec-v0.3.docx
- Documentation hierarchy created: docs/ folder with all files ready.

## What to do FIRST next session
<!-- One sentence. No ambiguity. -->
Run: `npx create-electron-app@latest antigone --template=webpack` in ~/Projects/, then follow Sprint 1 Day 1 in SPRINT.md.

## Blockers / open issues
<!-- Anything that will prevent forward progress. -->
- Need Apple Developer ID before Day 13 signing work. Start the enrollment process now — it takes 24–48 hours.
- Need EV Code Signing certificate decision for Windows before Day 13.

## Files modified this session
<!-- List every file touched. Helps scope the next read. -->
- None (pre-development)

## Known working / broken state
| Feature | Status | Notes |
|---------|--------|-------|
| App scaffold | Not started | |
| CodeMirror 6 editor | Not started | |
| Inline rendering | Not started | |
| Auto-save | Not started | |
| Themes | Not started | |
| Tags | Not started | |
| Multi-tab | Not started | |
| Build / packaging | Not started | |

## Environment notes
<!-- Anything specific to the dev machine that matters. -->
- Dev machine: macOS, ~/Projects/antigone/
- Node: use system Node (check: node --version should be 18+)
- Python path if needed: /opt/homebrew/bin/python3.12
- Run via: npx electron . (never node main.js directly)
