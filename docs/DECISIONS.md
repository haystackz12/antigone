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

## DEC-011 — Explicit grid-column placement for workspace children (BUG-001 fix)
**Decision:** All four `#workspace` children (`#sidebar`, `#editor-pane`, `#split-resize`, `#preview-pane`) have explicit `grid-column` CSS rather than relying on auto-placement.
**Why:** The workspace grid defines 5 columns (sidebar, sidebar-gutter, editor, split-gutter, preview) but only 4 DOM children exist — `#sidebar-resize` is inside `#sidebar`, not a direct grid child. CSS auto-placement shifted every element one column left, putting `#editor-pane` in a 5px gutter column with zero usable width. `#sidebar` now spans columns 1–2, absorbing its internal resize handle's gutter.
**Date:** 2026-03-29

## DEC-012 — Inline rendering via collect-sort-build pattern
**Decision:** The `buildDecorations()` function in `inline-render.js` collects all decorations into an array of `{ from, to, deco }` tuples, sorts by position, then passes to `Decoration.set()` with `sort: true`.
**Why:** CM6's `RangeSetBuilder` requires decorations in strict document order. Walking the Lezer syntax tree yields nodes in tree order (parents before children), but decorations for marker-hiding (`Decoration.replace`) on child nodes and content-styling (`Decoration.mark`) on parent ranges can interleave in position order. Collecting and sorting avoids subtle ordering bugs and makes the code straightforward.
**Trade-off:** One extra sort pass per viewport update. Negligible for visible-range-scoped decoration sets.
**Date:** 2026-03-29

## DEC-013 — Cursor-line exclusion at line granularity
**Decision:** Inline rendering excludes the entire line the cursor is on, not just the specific syntax node at the cursor position.
**Why:** Line-level exclusion is the standard Typora-style behavior users expect. It reveals all raw syntax on the active line so the user can see and edit markers in context. Token-level exclusion would leave some markers hidden on the same line, creating a confusing mixed state.
**Date:** 2026-03-29

## DEC-015 — sandbox: true re-enabled (Day 4)
**Decision:** Re-enabled `sandbox: true` in BrowserWindow webPreferences.
**Why:** Day 1 removed it because style-loader v3 used Constructable Stylesheets incompatible with sandbox mode. Since Day 1 switched to mini-css-extract-plugin (CSS served as `<link>` via webpack), the sandbox restriction no longer applies. Tested Day 4 — app launches, three-panel layout renders, CSS loads, drag-and-drop works, inline rendering works.
**Date:** 2026-03-30

## DEC-016 — electron-store v11 as webpack external
**Decision:** electron-store is loaded at runtime via webpack externals, not bundled.
**Why:** electron-store v11 is ESM-only. Webpack's CJS bundling cannot process it. Adding `externals: { 'electron-store': 'commonjs2 electron-store' }` to webpack.main.config.js lets Node load it natively at runtime via dynamic `import()`.
**Date:** 2026-03-30

## DEC-017 — editor-save.js split from editor.js
**Decision:** Save, auto-save, crash recovery, and external file-change detection logic lives in `editor-save.js`, separate from `editor.js`.
**Why:** Adding these features would push editor.js past the 400-line cap. editor-save.js receives accessor functions via a `configure()` call to avoid circular requires. editor.js remains focused on CM6 init, keymaps, extensions, and file open.
**Date:** 2026-03-30

## DEC-018 — Auto-save off by default
**Decision:** Auto-save is disabled by default. Users can enable it via the `autoSave` preference in electron-store.
**Why:** Auto-save-always creates UX problems: the file-changed banner fires on every save (self-watch loop), users lose the mental model of "saved vs unsaved," and silent overwrites can be surprising. Manual ⌘S is the default; auto-save is opt-in for power users who want it.
**Date:** 2026-03-30

## DEC-019 — File watcher / external-change banner removed Sprint 1
**Decision:** Removed `fs.watch`, `startWatching`, `stopWatching`, `onFileChanged`, and the `#file-changed-banner` UI entirely from Sprint 1.
**Why:** The self-watch loop (BUG-003B) where saves trigger fs.watch which shows the banner was a persistent UX problem. The timestamp-suppression workaround was fragile. External change detection adds complexity disproportionate to its benefit at this stage. Will revisit in Sprint 2 with proper ignore-own-writes logic (e.g., content hash comparison before showing the banner).
**Revisit trigger:** Sprint 2, when multi-tab and collaborative workflows make external change detection genuinely useful.
**Date:** 2026-03-30

## DEC-020 — Unsaved-changes dialog on window close
**Decision:** When the user closes the window with unsaved changes, a native dialog appears with Save / Don't Save / Cancel options.
**Why:** Standard desktop app behavior. Without this, closing the window silently discards unsaved work, which is a data loss risk. The dialog is implemented via `win.on('close')` intercepting the close event and `dialog.showMessageBox` presenting the options.
**Date:** 2026-03-30

## DEC-031 — Editor themes with preferences picker
**Decision:** 5 editor themes: Default, Academic (serif), Minimal (no line numbers), Night (warm dark serif), Typewriter (monospace cream). Theme CSS loaded dynamically via `<link>` element. Persists in electron-store. Picker in preferences modal with visual preview cards.
**Why:** Writers have different aesthetic preferences. Themes change fonts, colors, and spacing without affecting functionality. Dynamic CSS loading avoids bundling all themes, and the data-theme attribute approach allows clean CSS scoping.
**Date:** 2026-04-01

## DEC-030 — Option C1 format strip
**Decision:** Titlebar cleaned to view toggles + app name + theme/word-goal only. All formatting tools moved to a dedicated 32px format strip below the titlebar with three pill groups (text formatting, insert, headings) + Tags toggle. Active state tracking highlights the relevant button when cursor is inside formatted text.
**Why:** Reduces titlebar crowding. Groups related tools visually. Active states give immediate feedback about the formatting at cursor position. Tags toggle provides quick access without needing the icon rail.
**Date:** 2026-04-01

## DEC-029 — Markdown parity: footnotes, math, video deferred to Sprint 5
**Decision:** Footnotes, math (KaTeX), and video/iframe embeds deferred to Sprint 5. All other Markdown features from Typora reference implemented pre-Day-13.
**Why:** Footnotes require complex bidirectional link rendering. Math requires KaTeX (~300KB) loaded on demand. Video/iframe requires security review with sandbox:true. Task lists, highlights, callouts, emoji, superscript, subscript, TOC, auto-linking, reference links, and table alignment all implemented in this session.
**Date:** 2026-04-01

## DEC-028 — Option D toolbar: icon rail replaces sidebar
**Decision:** 52px icon rail on left edge replaces the hamburger-toggled sidebar. Right panel opens from rail icons for Tags, TOC. Focus mode is a toggle on the rail (no panel). Titlebar cleaned up: view toggles left, title centered, formatting right.
**Why:** The hamburger sidebar had UX issues (auto-open/close fighting, no visible toggle, unclear panel tabs). The icon rail provides persistent visual access to panels without taking space from the editor. Scales to TOC, file browser in Sprint 4-5 by adding rail icons.
**Date:** 2026-03-31

## DEC-027 — Sidebar panels: only Tags active in v1.0
**Decision:** Only the Tags panel is active in the sidebar for v1.0. Folder browser and TOC/Headers panels removed from sidebar HTML.
**Why:** Folder browser requires a project/workspace concept that doesn't exist yet. TOC is functional as a feature but was moved to the sidebar section system which is now simplified to Tags-only. Both can be re-added in Sprint 4 when the sidebar panel system is properly designed.
**Revisit trigger:** Sprint 4 — sidebar panel architecture.
**Date:** 2026-03-31

## DEC-026 — GFM breaks enabled (single newline = line break)
**Decision:** `breaks: true` in marked.js configuration. Single newlines produce `<br>` in the preview.
**Why:** Antigone is a writing app, not a code documentation tool. Writers expect Enter to create a visible line break, not to be collapsed into a space. This matches the behavior of Typora, iA Writer, and most Markdown writing apps.
**Date:** 2026-03-31

## DEC-025 — Scroll sync removed from split view
**Decision:** Scroll sync removed entirely. Split view has two independent panes that scroll independently.
**Why:** Scroll sync requires identical content height between editor and rendered HTML, which is not achievable with complex documents containing tables, lists, and code blocks. The height ratio between raw Markdown and rendered HTML can be 6:1 or higher, making any sync approach produce jarring jumps or feedback loops. Multiple approaches were attempted (percentage-based, anchor-based, heading-map, line-number/data-line injection, polling loops, timestamp deadbands, drift validators) — all produced worse UX than independent scrolling.
**Revisit trigger:** Post-v1.0, consider a dedicated line-marker approach scoped to simple documents only, or a "click heading to sync" button instead of continuous sync.
**Date:** 2026-03-31

## DEC-024 — View mode always resets to editor-only on launch
**Decision:** View mode always resets to editor-only on launch. The stored viewMode preference is not read at startup.
**Why:** Launching in split view shows an empty preview pane which is confusing when no file is loaded. Editor-only is the cleanest initial state. Users switch to split or preview via toolbar buttons during their session.
**Date:** 2026-03-30

## DEC-023 — Auto-restore last session disabled
**Decision:** Auto-restore last session disabled — always launch to empty state.
**Why:** Auto-restoring files on launch without asking is surprising behavior and can be slow if many files were open. Users open files explicitly via ⌘O, drag-drop, or file association. Session restore can be added as an opt-in preference in Sprint 3.
**Revisit trigger:** Sprint 3 — preferences UI can add a "Restore last session" toggle.
**Date:** 2026-03-30

## DEC-022 — Find/replace remapped from ⌘H to ⌘⌥F
**Decision:** ⌘H is not used for find/replace. ⌘⌥F (Cmd+Opt+F) is used instead.
**Why:** ⌘H is reserved by macOS for Hide Window and cannot be overridden in Electron. CM6's default `searchKeymap` binds `Mod-h` to open the search panel with replace enabled. This binding is filtered out and replaced with `Mod-Alt-f`, which is the standard replace shortcut in many Mac editors (VS Code, Sublime Text).
**Date:** 2026-03-30

## DEC-021 — Preview-only mode and + button deferred to Day 8
**Decision:** Split view and preview-only mode show a placeholder until preview.js is wired on Day 8. The + button behaves as single-tab "New file" (with unsaved-changes guard) until multi-tab is implemented on Day 8. Preview-only toolbar button is disabled.
**Why:** preview.js (marked.js + DOMPurify) is not yet implemented. Showing an empty pane or allowing preview-only mode without a preview renderer is confusing. The + button's multi-tab behavior requires tab state management which is a Day 8 deliverable.
**Revisit trigger:** Day 8 (multi-tab + split view implementation).
**Date:** 2026-03-30

## DEC-014 — preview.js deferred to Sprint 2
**Decision:** The `preview.js` module (marked.js + DOMPurify pipeline) is not created in Sprint 1.
**Why:** The preview pane is not wired for live updates until Sprint 2 (split-view, scroll sync). Installing marked.js and DOMPurify now would add unused dependencies. The `inline-render.js` decoration layer handles all visual rendering in Sprint 1.
**Revisit trigger:** Sprint 2, Day 8 (split-view implementation).
**Date:** 2026-03-29
