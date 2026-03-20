# DECISIONS.md
> Why we made key architectural choices. Read when confused about a past decision. Add new entries as decisions are made.

## DEC-001 — Electron over Tauri
**Decision:** Electron for v1.0.
**Why:** Reuses the exact IPC security architecture and patterns from EmailVault. Node.js file system APIs (fs.watch, child_process for preprocessors) are well-understood. Electron Forge handles all three platform builds from one config. The ~150MB bundle size is acceptable for a desktop app.
**Trade-off:** Larger bundle vs. Tauri (~10MB). Tauri uses Rust for the backend — a full rewrite. Reconsidered for v3.0 if bundle size becomes a retention issue.
**Revisit trigger:** User complaints about download size exceed 5% of support tickets.

## DEC-002 — CodeMirror 6 over Monaco
**Decision:** CodeMirror 6 as the editor engine.
**Why:** ~250KB vs Monaco's ~8MB. First-class Markdown language support. Decoration/widget API enables live inline rendering without a second renderer process. `@codemirror/vim` and `@codemirror/next` (emacs) are drop-in Pro features. Active maintenance, good a11y.
**Trade-off:** Higher learning curve for custom extensions vs. Monaco's VS Code familiarity.
**Revisit trigger:** Never. This is the right choice for this product.

## DEC-003 — Live inline rendering as the default view
**Decision:** Inline rendering (Typora-style) is the default. Split-pane is an option.
**Why:** This is the most-requested differentiator vs. every other Markdown editor. Users who replace Typora expect this. Split-pane is available for users who want it.
**Trade-off:** More complex rendering architecture (CM6 decoration layer) vs. simpler split-pane only.
**Revisit trigger:** If inline rendering causes persistent performance issues on large files, fall back to split-pane as default with a toggle.

## DEC-004 — Freemium, not free open source
**Decision:** Free tier with a Pro subscription at $5.99/mo or $49/yr.
**Why:** Cross-platform distribution, code signing certificates, and auto-updater infrastructure have real ongoing costs. A paid Pro tier funds continued development. Free tier includes all core editing features — no feature is crippled, only extended.
**Trade-off:** Adds payment integration complexity. Pro gate UI must never feel hostile.
**Payment stack:** Paddle or Stripe. Integration deferred to v1.1 — v1.0 ships with a stub that accepts a hardcoded dev license.

## DEC-005 — OS user data directory only
**Decision:** All app-generated files (prefs, session, dictionary, tag index, recovery) go to the OS user data directory. Never to source directories.
**Why:** Source directories belong to the user's project. Polluting them with hidden dot-files breaks git, confuses folder size utilities, and creates unexpected file-open dialogs in other apps.
**Exception:** `.antigone-dict` — a per-project spell check dictionary. Explicitly named, documented, and only written if the user opts in via preferences. This is the only file Antigone ever writes to a source directory.

## DEC-006 — Auto-save with temp-then-rename
**Decision:** Auto-save writes to `filename.tmp` first, then `fs.rename` to the target.
**Why:** `fs.rename` is atomic on all three platforms. If the process crashes mid-write, the source file is intact. The `.tmp` file is abandoned in the source directory (cleaned up on next successful save). A partial write to the actual source file is never possible.

## DEC-007 — Bundled fonts, no CDN
**Decision:** Lora, Cormorant Garamond, Recursive, and DM Sans are bundled inside the app.
**Why:** The app must function fully offline. CDN font loading would fail with no internet, and any latency would cause a flash of unstyled content on launch. Bundle size increase (~600KB for all four) is negligible relative to Electron's base size.

## DEC-008 — .txt file association opt-in
**Decision:** `.txt` file association is opt-in, unchecked by default in the installer.
**Why:** `.txt` is a system-wide format used by everything. Hijacking it as the default handler would break user workflows (Notepad on Windows, TextEdit on macOS). Users who want it can enable it during install or in preferences.

## DEC-009 — Crash recovery to OS temp, not source dir
**Decision:** Recovery files go to `os.tmpdir()` with a UUID filename.
**Why:** Source directories must not be polluted (see DEC-005). OS temp directories are cleaned by the OS. Recovery files are only useful for the current session's machine — there is no cross-machine recovery use case.

## DEC-010 — Tags stored in OS user data dir index, not embedded in files
**Decision:** Tag index is a sqlite/JSON database in the OS user data directory, built by scanning open files.
**Why:** Embedding a tag database in each file would require modifying source files to add metadata — violating the principle that Antigone edits what you give it without adding hidden state. The index is rebuilt from file content on demand.
**Trade-off:** Tag index can go stale if files are modified outside Antigone. Mitigated by rebuilding on file open.
