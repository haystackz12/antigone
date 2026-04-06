# SESSION_STATE.md

## Last updated
2026-04-05 — Sprint 3, Day 13 (extended)

## Current sprint
Sprint 3 — Polish & Distribution

## Current day
Day 13 extended — IPC fix, notarization, marketing site — COMPLETE

## What was completed this session
- Fixed duplicate IPC handler crash on relaunch: added ipcMain.removeHandler() before all 20 ipcMain.handle() calls across main.js (17) and main-export.js (3) — commit 32649d6
- No debugLog calls remained (already cleaned in prior commit)
- Built, signed, notarized, and stapled DMG — out/make/Antigone.dmg
- Built antigone.app marketing site — docs/index.html, docs/privacy.html, docs/terms.html
- Deployed to Vercel — repo: haystackz12/antigone, root directory: docs
- Connected antigone.app domain — Namecheap nameservers pointing to Vercel, Valid Configuration confirmed

## Exact state of the codebase
- src/main.js: ipcMain.removeHandler() prefixes all 17 handle() calls, no debugLog calls
- src/main-export.js: ipcMain.removeHandler() prefixes all 3 handle() calls
- src/main-updater.js: unchanged
- src/preload.js: unchanged
- forge.config.js: unchanged
- docs/index.html: full marketing site — 10 sections, theme tab switcher, scroll reveal
- docs/privacy.html: privacy policy page
- docs/terms.html: terms of service page

## What to do FIRST next session
Day 14: Open src/ and implement proGate() function in a new file src/pro-gate.js — see SPRINT.md Day 14 tasks.

## Blockers / open issues
- Gumroad products not yet created — Free and Pro URLs are placeholders in docs/index.html
- antigone.app screenshot placeholders need real screenshots before launch
- Social links in footer are placeholders
- Windows build deferred — requires Windows CI

## Files modified this session
- src/main.js
- src/main-export.js
- docs/index.html (new)
- docs/privacy.html (new)
- docs/terms.html (new)

## Known working / broken state
| Feature | Status | Notes |
|---------|--------|-------|
| Duplicate IPC handler bug | Fixed | removeHandler() before all 20 handle() calls |
| Notarized DMG | Working | out/make/Antigone.dmg, stapled |
| App launch | Working | No crashes on relaunch |
| antigone.app site | Live | Vercel, Valid Configuration |
| Gumroad links | Stubbed | Placeholder URLs in docs/index.html |
| Code signing (macOS) | Ready | Needs APPLE_IDENTITY secret in CI |
| Auto-updater | Working | Checks on launch + 4hr interval |
