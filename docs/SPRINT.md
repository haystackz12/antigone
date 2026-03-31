# SPRINT.md
> Active sprint only. Replace entirely when a new sprint begins. Never accumulate history here — completed sprints move to ROADMAP.md.

## Sprint 3 — Polish & Distribution
**Goal:** Production-quality v1.0 release candidate. Signed on all platforms. Auto-updater live.
**Duration:** Days 11–15

---

## Day 11 — Preprocessors (Pro) + Tag Enhancements
**Status:** [x] COMPLETE — 2026-03-31

### Tasks
- [x] `preprocessor.js`: shell pipe with 5s timeout, Pro gate stub, loads saved command from prefs
- [x] `run-preprocessor` IPC handler in main-export.js: execFile with sandboxed child_process, 5s timeout, 1MB maxBuffer
- [x] `runPreprocessor` API added to preload.js
- [x] YAML frontmatter tag parsing: `tags: [tag1, tag2]`, `tags:\n  - tag1`, `tags: single`
- [x] Frontmatter tags shown in sidebar alongside inline #tags with `+fm` indicator
- [x] Right-click tag → rename dialog, updates all inline occurrences in document
- [x] SPRINT.md replaced with Sprint 3 content

### Gate ✅ PASSED
- Configure preprocessor → preview shows processed output ✅
- YAML frontmatter tags appear in sidebar ✅
- Rename tag → all occurrences updated ✅

---

## Day 12 — Performance + Accessibility
**Status:** [ ] Not started

### Tasks
- [ ] Large file handling (150K char cap)
- [ ] Keyboard navigation audit
- [ ] ARIA labels on all interactive elements
- [ ] Reduce-motion support

### Gate
- Open 150K+ file → warning shown, inline rendering disabled
- Tab through all UI elements with keyboard
- Screen reader announces all buttons and regions

---

## Day 13 — Code Signing + Auto-updater
**Status:** [ ] Not started

### Tasks
- [ ] Apple notarization
- [ ] NSIS signing (Windows)
- [ ] electron-updater with GitHub Releases CI

### Gate
- Signed .app passes macOS Gatekeeper
- Auto-updater detects and installs new version

---

## Day 14 — Freemium Gates + Account Stub
**Status:** [ ] Not started

### Tasks
- [ ] `proGate()` function
- [ ] All Pro gates wired (Vim, preprocessors)
- [ ] Upgrade modal
- [ ] 14-day trial

### Gate
- Pro features gated behind proGate()
- Upgrade modal shows when Pro feature attempted

---

## Day 15 — Full Test Pass + v1.0 Release
**Status:** [ ] Not started

### Tasks
- [ ] 21-item checklist
- [ ] README.md
- [ ] CHANGELOG.md
- [ ] Tag v1.0.0

### Gate
- All checklist items pass
- v1.0.0 tagged and pushed

---

## Carry-over
- Windows build deferred — requires Windows CI
- Bundled fonts not yet added
- No app icon yet
