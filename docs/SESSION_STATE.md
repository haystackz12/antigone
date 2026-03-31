# SESSION_STATE.md
> Overwrite this file completely at the end of every session. It is the single source of truth for "where we left off."

## Last updated
2026-03-31 — Sprint 3, Day 11

## Current sprint
Sprint 3 — Polish & Distribution

## Current day
Day 11 — Preprocessors (Pro) + Tag Enhancements — COMPLETE

## What was completed this session
- Created `preprocessor.js` (92 lines): shell pipe to preview with Pro gate stub, loads saved command from prefs, intercepts editor:change to run preprocessor and replace preview content.
- Added `run-preprocessor` IPC handler in main-export.js: execFile with sandboxed child_process, 5s hard timeout, 1MB maxBuffer, cwd set to file's directory.
- Added `runPreprocessor` API to preload.js.
- Updated `tags.js` (220 lines): YAML frontmatter tag parsing (array, list, and single formats), frontmatter tags shown with `+fm` indicator, right-click tag rename dialog that updates all inline occurrences.
- Replaced SPRINT.md with Sprint 3 content.

## Exact state of the codebase
- `src/main.js` (387 lines)
- `src/main-menu.js` (150 lines)
- `src/main-export.js` (83 lines): export + preprocessor IPC
- `src/preload.js` (285 lines)
- `src/editor.js` (314 lines)
- `src/editor-save.js` (249 lines)
- `src/inline-render.js` (305 lines)
- `src/toolbar.js` (227 lines)
- `src/tabs.js` (285 lines)
- `src/tags.js` (220 lines)
- `src/toc.js` (85 lines)
- `src/preview.js` (119 lines)
- `src/export.js` (171 lines)
- `src/preprocessor.js` (92 lines)
- `src/prefs-ui.js` (141 lines)
- `src/prefs.js` (39 lines)
- `src/focus.js` (37 lines)
- `src/wordgoal.js` (141 lines)
- `src/renderer.js` (114 lines)

## What to do FIRST next session
Day 12: Performance + Accessibility. Start with large file handling — add 150K char cap.

## Blockers / open issues
- Windows build deferred
- Bundled fonts not added
- No app icon

## Known working / broken state
| Feature | Status | Notes |
|---------|--------|-------|
| All prior features | Working | |
| Preprocessor (Pro) | Working | Shell pipe, 5s timeout, Pro stub |
| YAML frontmatter tags | Working | Array, list, single formats |
| Tag rename | Working | Right-click → rename all occurrences |

## Environment notes
- Dev machine: macOS
- Launch: `npm start`
- Build: `npm run make`
