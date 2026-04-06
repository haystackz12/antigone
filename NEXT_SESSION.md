# NEXT_SESSION.md — Day 14 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 3, Day 14 — Freemium Gates + Account Stub.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md

---

## Day 14 Tasks (from SPRINT.md)

### Task 1 — proGate() function
- Create src/pro-gate.js — a proGate() utility that checks electron-store for
  license/trial state and returns a boolean
- v1.0 ships with a stub that accepts a hardcoded dev license (see DEC-004)

### Task 2 — Wire all Pro gates
- Vim mode gated behind proGate()
- Preprocessor execution gated behind proGate()
- Any other Pro features gated

### Task 3 — Upgrade modal
- Design and implement an upgrade modal shown when a Pro feature is attempted
- Must never feel hostile (DEC-004)
- Shows feature name, pricing ($5.99/mo or $49/yr), and a way to enter a license key

### Task 4 — 14-day trial
- Implement a 14-day trial period stored in electron-store
- Trial starts when first Pro feature is attempted
- After trial expires, Pro features are locked until license is entered

---

## Constraints reminder
- contextIsolation: true, nodeIntegration: false, sandbox: true — NEVER change these
- 400-line file cap per source file
- All renderer↔main communication via preload.js contextBridge ONLY
- Payment stack (Paddle/Stripe) deferred to v1.1 — v1.0 uses hardcoded dev license

## Gate
- Pro features gated behind proGate()
- Upgrade modal shows when Pro feature attempted
- 14-day trial works correctly

---

## Carry-over
- Gumroad products not yet created — Free and Pro placeholder URLs in docs/index.html
  need to be replaced with real URLs after Gumroad setup
- antigone.app is live but screenshot placeholders need real screenshots before launch
- Social links in footer are placeholders

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 15.
