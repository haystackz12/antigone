# NEXT_SESSION.md — Ship v1.0 (replaces Day 14 + Day 15)

We are working on the Antigone project — a Markdown editor built on Electron +
CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone | Run: npm start

Today's goal is one thing: **a public v1.0.0 GitHub Release with a signed,
notarized DMG attached.** Nothing else ships today. Every task below serves that.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md
5. docs/TESTING.md (the v1.0 release checklist)

Then run `git log --oneline -5` and `git status` and confirm the tree is clean at
f718bd5 or later on main. Report before proceeding.

---

## Scope change — record this FIRST

Day 14 (freemium gates, upgrade modal, trial) is **cancelled for v1.0**.
v1.0 ships with every feature enabled and no Pro gating. Pricing returns in v1.1
once real users exist.

### Task 0 — DEC-033
Append to docs/DECISIONS.md:

```
## DEC-033 — v1.0 ships fully free, no Pro gate
**Decision:** Supersedes the v1.0 portion of DEC-004. v1.0.0 has no proGate(),
no upgrade modal, no trial. Vim mode, preprocessors, and all themes are enabled
for everyone.
**Why:** The app was feature-complete and notarized on 2026-04-05 and then
stalled for five months on the business layer. Gating features in a product with
zero users optimises the wrong thing. Shipping first produces the feedback that
should shape the Pro tier.
**Trade-off:** Users who adopt v1.0 will see features move behind a paywall in
v1.1. Mitigation: v1.0 users are grandfathered on any feature they already have.
**Payment stack:** unchanged — Paddle/Stripe evaluation moves to v1.1 planning.
```

Update SPRINT.md: mark Day 14 as `[x] CANCELLED — see DEC-033`. Remove the
`isProUser()` stub and any dead Pro-gate references from src/ if present
(grep for `isProUser`, `proGate`, `PRO_` first and report what exists before
deleting anything).

---

## Task 1 — App icon
There is no .icns in the repo. Create one:
- Generate a 1024×1024 PNG. Keep it in the spirit of the app: a single serif
  capital "A" on a plain background, no gradients, no gloss. Use the Parchment
  theme colours from src/styles.css so it matches the app.
- Build `assets/icon.icns` via `iconutil` (macOS) from a full iconset
  (16 through 1024, @1x and @2x).
- Wire `packagerConfig.icon: './assets/icon'` in forge.config.js (no extension —
  Forge resolves .icns/.ico per platform).
- Verify: `npm run package` → `out/Antigone-darwin-*/Antigone.app` shows the icon
  in Finder.

## Task 2 — README.md
Replace the current 415-byte README. Model it on gregmos/plain's README
structure (short, user-facing, no roadmap):
- One-paragraph description
- What it does (bulleted, the real feature list from SPRINT.md Sprints 1–3)
- Installation — macOS only for now: download DMG from Releases, drag to
  Applications, Get Info → Open with → Change All for .md
- Using it — open, edit, save, split view, themes, ⌘, for preferences
- Where your data lives — `~/Library/Application Support/Antigone/`
  (config.json, recovery files, dictionary). Cite DEC-005.
- How it treats your files — temp-then-rename atomic saves (DEC-006), external
  change detection, recovery on crash
- Building from source — Node version from package.json, `npm install`,
  `npm start`, `npm run make`
- License — MIT
Move the current dev-oriented content to docs/CLAUDE.md if it isn't already there.

## Task 3 — CHANGELOG.md
Create it. One entry, `## 1.0.0 — <today's date>`, summarising Sprints 1–3 in
user language (not commit messages). Pull the feature list from SPRINT.md and
the notable fixes from docs/BUGS.md (selection layer fix, electron-store
replacement, duplicate IPC handler).

## Task 4 — Release checklist
Run the v1.0 full release checklist in docs/TESTING.md, macOS only. Skip the
Windows column and note it as deferred. I will do the manual steps; you tell me
each step and wait for my result. Log any failure to docs/BUGS.md and fix it
before continuing — do not defer bugs found during the checklist.

## Task 5 — Build, sign, notarize
```
cd ~/Projects/antigone
source .env
npm run make
```
The postMake hook signs the DMG and submits to notarytool using keychain
profile `AntignoneNotarize`. Expect 5–15 minutes. Then:
```
xcrun stapler staple out/make/Antigone.dmg
xcrun stapler validate out/make/Antigone.dmg
```
Reminder from the April session: if the build hangs at "Finalizing package",
Terminal needs Full Disk Access in System Settings.

## Task 6 — Tag and release
```
git add -A
git commit -m "release: v1.0.0"
git tag -a v1.0.0 -m "Antigone 1.0.0"
git push origin main --tags
gh release create v1.0.0 out/make/Antigone.dmg \
  --title "Antigone 1.0.0" \
  --notes-file CHANGELOG.md
```
Rename the asset to `Antigone-1.0.0-universal.dmg` (or `-arm64` / `-x64` if the
build is single-arch — check `lipo -info` on the binary first) before uploading.

## Task 7 — Verify the updater
The auto-updater (src/main-updater.js) polls GitHub Releases. With v1.0.0
published, install the DMG fresh, launch, and confirm no updater error in the
console. Then confirm SESSION_STATE.md reflects the true post-release state.

---

## Constraints reminder
- contextIsolation: true, nodeIntegration: false, sandbox: true — NEVER change these
- 400-line file cap per source file (main.js at 477 and styles.css at 2063 are
  known exceptions — do not refactor them today; log as v1.1 carry-over)
- All renderer↔main communication via preload.js contextBridge ONLY
- Do not add features. Anything that isn't on the path to the Release is v1.1.

## Gate
- v1.0.0 tag exists on origin
- GitHub Release exists with the notarized DMG attached
- Fresh install from that DMG opens with no Gatekeeper warning
- README and CHANGELOG are accurate to what shipped

---

## Carry-over (v1.1 — do not touch today)
- Pro tier, licensing, Paddle/Stripe (DEC-004, DEC-033)
- Gumroad products
- antigone.app screenshots and social links (site currently points at
  placeholder download URLs — update the Download button to the Release asset
  URL as a follow-up, not today)
- Windows build / CI
- Bundled fonts
- main.js and styles.css over the line cap

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for
v1.1 planning.
