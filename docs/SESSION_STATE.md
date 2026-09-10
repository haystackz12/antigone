# SESSION_STATE.md

## Last updated
2026-09-09 — v1.0.0 Release Session

## Current sprint
Sprint 3 — Polish & Distribution — COMPLETE

## Current day
v1.0.0 Release — COMPLETE

## What was completed this session
- DEC-033: Cancelled Day 14 freemium gates, v1.0 ships fully free
- DEC-034: Save-time conflict check (mtime) instead of live watcher
- App icon: 1024px serif "A" on parchment, .icns built via iconutil, wired in forge.config.js
- README.md: user-facing, replaces dev stub
- CHANGELOG.md: v1.0.0 entry covering Sprints 1-3
- test/fixtures/basic.md: test fixture for release checklist
- BUG-039 through BUG-052: 14 bugs found and fixed during release checklist
- HMR listener accumulation fix: all ipcRenderer.on handlers in preload.js now removeAllListeners before registering
- Cmd+B/I double-toggle fix: removed redundant toolbar.js keyboard shortcuts
- Paste image handler: guarded against HMR duplication
- Inline image onerror infinite loop: changed insertBefore to replaceChild
- Cmd+W/Cmd+Q unsaved-changes dialog: fixed via HMR listener cleanup + isQuitting/quitAfterClose flags
- Save-time mtime conflict check: stat-file and show-overwrite-dialog IPC
- Crash recovery: removed unconditional startup deletion
- Theme persistence: removed forced white-on-launch, added setPrefs in theme picker
- Spell check context menu: CM6-aware replacement via posAtCoords + dispatch
- Nested tag regex: extended to support #project/antigone paths
- v1.0.0 tagged, GitHub Release created with notarized DMG

## Exact state of the codebase
- src/main.js: all IPC handlers, close/quit flow with isQuitting flag, spell-check context menu, stat-file/show-overwrite-dialog handlers
- src/preload.js: all ipcRenderer.on handlers use removeAllListeners before registering (HMR safe)
- src/editor.js: loadContent sets currentFilePath before dispatch (BUG-042), recordMtime on open
- src/editor-save.js: mtime tracking (DEC-034), save-cancellation abort, recordMtime export
- src/tabs.js: setActiveTabPath for Save As sync, closeTab checks getIsDirty(), no session write to prefs
- src/toolbar.js: paste handler guarded, redundant keyboard shortcuts removed
- src/inline-render.js: img.onerror uses replaceChild not insertBefore
- src/tags.js: TAG_REGEX supports nested tags with /
- src/prefs-ui.js: theme picker calls setPrefs
- forge.config.js: icon wired to ./assets/icon
- assets/icon.icns: app icon (serif A on parchment)
- README.md: user-facing with feature list, installation, data paths
- CHANGELOG.md: accurate v1.0.0 entry
- docs/DECISIONS.md: DEC-033 (no Pro gate) and DEC-034 (mtime conflict check) added

## What to do FIRST next session
Read CLAUDE.md, then plan v1.1 features from the carry-over list in NEXT_SESSION.md.

## Blockers / open issues
- Spell check suggestion replacement works but "Add to Dictionary" may need OS restart to take effect
- Inline tag chip styling not implemented (v1.1)
- Typeface pairings not implemented (v1.1)
- Word goal progress ring removed for v1.0 (v1.1)
- Live file watcher deferred (DEC-019/DEC-034)
- Dark mode deferred (DEC-032)
- Windows/Linux builds deferred
- main.js at 500+ lines, styles.css at 2063 lines — over 400-line cap, refactor in v1.1

## Files modified this session
- src/main.js, src/preload.js, src/editor.js, src/editor-save.js
- src/tabs.js, src/toolbar.js, src/inline-render.js, src/tags.js
- src/prefs-ui.js, src/renderer.js
- forge.config.js
- assets/icon.icns, assets/icon_1024.png, assets/icon.iconset/*
- README.md, CHANGELOG.md, NEXT_SESSION.md
- docs/DECISIONS.md, docs/SPRINT.md, docs/TESTING.md, docs/BUGS.md, docs/SESSION_STATE.md
- test/fixtures/basic.md

## Known working / broken state
| Feature | Status | Notes |
|---------|--------|-------|
| Inline rendering | Working | Bold, italic, headings, code, links, images |
| Split/preview modes | Working | Via menu and toolbar, no accelerators |
| Focus mode | Working | Cmd+Shift+F |
| File open/save/save-as | Working | Cmd+O, Cmd+S, Cmd+Shift+S |
| Unsaved changes dialog | Working | Cmd+W and Cmd+Q, with auto-save awareness |
| Auto-save | Working | 800ms debounce, opt-in via prefs |
| Crash recovery | Working | 30s interval, banner on relaunch |
| Save-time mtime check | Working | DEC-034, Overwrite/Cancel dialog |
| Cmd+B/I/K shortcuts | Working | CM6 keymap only, no document listeners |
| Image paste | Working | Single insert, onerror fallback safe |
| Tabs | Working | Open, close, switch, Save As path sync |
| Tags | Working | Nested tags, autocomplete, frontmatter |
| Spell check | Working | Context menu with suggestions + Add to Dictionary |
| Theme persistence | Working | White, Parchment, Sepia, Midnight |
| App icon | Working | Serif A on parchment, .icns |
| Code signing | Working | Signed, notarized, stapled DMG |
| Cmd+Q quit | Working | Single press, with unsaved guard |
| Word count | Working | Live count + read time in status bar |
| Export PDF/HTML | Working | Cmd+Shift+E, pagebreak support |
