# NEXT_SESSION.md — v1.1 Planning

We are working on the Antigone project — a Markdown editor built on Electron +
CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone | Run: npm start

v1.0.0 shipped on 2026-09-09 with a signed, notarized DMG on GitHub Releases.
This session begins v1.1 planning and implementation.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md
5. docs/BUGS.md (review resolved bugs for context)

Then run `git log --oneline -10` and `git status` and confirm the tree is clean
on main. Report before proceeding.

---

## v1.1 Carry-over from v1.0

These items were explicitly deferred during the v1.0 release session:

### Features
- [ ] Pro tier, licensing, Paddle/Stripe (DEC-004, DEC-033) — pricing returns in v1.1
- [ ] Dark mode (DEC-032) — proper implementation with dedicated CSS variables
- [ ] Live file watcher (DEC-019) — replace save-time mtime check with fs.watch + content hash
- [ ] Typeface pairings — Literary, Editorial, Technical, Modern, Classic
- [ ] Word goal progress ring — removed for v1.0, re-add with goal input
- [ ] Inline tag chip styling — #tags rendered as styled chips
- [ ] View mode keyboard accelerators — Cmd+Shift+P/R/E for split/preview/editor
- [ ] Find/replace match counter — CM6 search panel enhancement
- [ ] Spell check code block exclusion — skip underlines inside backticks
- [ ] Session restore (DEC-023) — opt-in "Restore last session" preference

### Infrastructure
- [ ] Windows build + CI
- [ ] Bundled fonts (DEC-007) — Lora, Cormorant Garamond, Recursive, DM Sans
- [ ] main.js refactor — currently 500+ lines, over the 400-line cap
- [ ] styles.css refactor — currently 2063 lines, over the 400-line cap
- [ ] Disable HMR in forge webpack config (source of BUG-040, BUG-044 listener accumulation)
- [ ] Gumroad products — Free and Pro URLs for antigone.app download buttons
- [ ] antigone.app — real screenshots, social links, download URL pointing to Release asset

### Bug follow-ups
- [ ] Spell check suggestion replacement — verify across all CM6 decoration states
- [ ] Image paste in untitled files — prompt Save As first, then paste

## Constraints reminder
- contextIsolation: true, nodeIntegration: false, sandbox: true — NEVER change these
- 400-line file cap per source file
- All renderer-main communication via preload.js contextBridge ONLY
- Do not break any v1.0 functionality — all v1.0 checklist items must continue to pass

## Planning approach
1. Prioritize features by user impact vs. implementation effort
2. Group into sprint days (Day 16+)
3. Create new SPRINT.md content for Sprint 4
4. Begin implementation
