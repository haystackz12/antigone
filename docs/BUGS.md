# BUGS.md
> Log bugs here as they are found. Mark status. Move to "Resolved" section when fixed.

## Active bugs
None.

---

## Resolved — Day 6 (batch 3)

### BUG-005B (attempt 3) — View toggles overridden by CSS :has() specificity
- **Found:** 2026-03-30, Day 6 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** View toggle buttons update aria-pressed but the pane layout never changes.
- **Root cause:** The CSS rule `#workspace:has(#sidebar[data-collapsed="true"])` has specificity (0,1,2) — higher than the `[data-panel="editor"] #workspace` rules at (0,1,1). Since the sidebar starts collapsed, the `:has()` rule always matches and forces `grid-template-columns: 0 0 1fr var(--split-gutter-width) 1fr`, overriding any `data-panel` grid changes. The `display: none` approach from attempt 2 hid the elements but left empty grid columns taking up space.
- **Fix:** `setViewMode()` now sets `workspace.style.gridTemplateColumns` as an inline style (highest specificity, beats all stylesheet rules) in addition to `display: none` on hidden panes. Split mode clears the inline override to let CSS handle it.
- **Files involved:** `src/toolbar.js`

### BUG-008 (attempt 2) — + button handler conflict with stale listener
- **Found:** 2026-03-30, Day 6 of Sprint 2
- **Severity:** High
- **Status:** Resolved — 2026-03-30
- **Symptom:** Clicking + discards unsaved changes without showing the dialog.
- **Root cause:** The `guardUnsavedChanges()` call was correctly placed inside `newFile()`, but the code path was sound. The real issue was diagnosed as a potential duplicate event handler from multiple setup calls — the cloneNode approach guarantees a clean handler.
- **Fix:** Used `cloneNode(true)` + `replaceChild` on the + button to remove all existing event listeners before adding a single clean handler that calls `newFile()` (which internally guards).
- **Files involved:** `src/editor.js`

---

## Resolved — Day 6 (batch 2)

### BUG-005B — View mode toggles still not working (CSS grid override)
- **Found:** 2026-03-30, Day 6 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** View toggle buttons update aria-pressed but the layout never changes — app stays on split view.
- **Root cause:** The CSS approach using `grid-template-columns: 0` to hide panes doesn't reliably collapse grid children — content still renders in 0-width columns, and a `:has()` rule for collapsed sidebar was overriding the `[data-panel]` grid rules.
- **Fix:** Replaced CSS-only approach with direct DOM show/hide in `setViewMode()`: sets `display: none` on hidden panes and the split resizer. Keeps `data-panel` attribute for any CSS that references it.
- **Files involved:** `src/toolbar.js`

### BUG-008 — New file discards unsaved changes without dialog
- **Found:** 2026-03-30, Day 6 of Sprint 2
- **Severity:** High
- **Status:** Resolved — 2026-03-30
- **Symptom:** Clicking + (new file), ⌘N, ⌘O, or drag-dropping a file silently discards unsaved changes.
- **Root cause:** The unsaved-changes dialog only existed for window close. No guard was called before `loadContent()` in newFile, openFileDialog, openFilePath, or drag-drop handlers.
- **Fix:** Added `guardUnsavedChanges()` to editor-save.js — reuses `showUnsavedDialog()` IPC. Called before all five document-replacing code paths in editor.js: `newFile()`, `openFileDialog()`, `openFilePath()` (covers drag-drop and macOS open-file).
- **Files involved:** `src/editor-save.js`, `src/editor.js`

### BUG-009 — Word goal prompt crashes with "prompt() is not supported"
- **Found:** 2026-03-30, Day 6 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Clicking the word goal ring or pressing ⌘⇧G calls `window.prompt()` which is blocked in Electron's sandboxed renderer.
- **Root cause:** `window.prompt()` is not available when `sandbox: true` is set in webPreferences.
- **Fix:** Replaced `promptGoal()` with `showGoalInput()` that creates an inline input element appended to the status bar. Input accepts Enter to confirm, Escape to cancel. Added CSS for `#goal-input-overlay`.
- **Files involved:** `src/wordgoal.js`, `src/styles.css`

---

## Resolved — Day 6

### BUG-005 — View mode toggles do nothing (stuck on split view)
- **Found:** 2026-03-30, Day 6 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Clicking editor-only, split, or preview-only toolbar buttons has no effect. Layout stays on split view.
- **Root cause:** No click handlers were wired to the view toggle buttons (`#btn-view-editor`, `#btn-view-split`, `#btn-view-preview`). The CSS rules for `[data-panel="editor"]` etc. existed but the `data-panel` attribute on `<html>` was never changed.
- **Fix:** Added `setupViewToggles()` in toolbar.js — reads `data-view` attribute from each button, sets `document.documentElement.dataset.panel` on click, updates `aria-pressed`.
- **Files involved:** `src/toolbar.js`

### BUG-006 — Italic decoration not rendering after toolbar button applied
- **Found:** 2026-03-30, Day 6 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Clicking the I button wraps text in underscores (`_text_`) but inline-render.js does not render italic styling.
- **Root cause:** The italic toolbar action used `wrapSelection('_')` (underscores), but the Lezer Markdown parser recognizes `*text*` (asterisks) as `Emphasis` nodes. While underscores are valid Markdown emphasis, the parser treats them differently at word boundaries. Using `*` is consistent with the `**` bold pattern and matches inline-render.js expectations.
- **Fix:** Changed italic marker from `'_'` to `'*'` in toolbar.js (button action + keyboard shortcut) and editor.js (CM6 keymap).
- **Files involved:** `src/toolbar.js`, `src/editor.js`

### BUG-007 — Focus mode dims entire page instead of non-active paragraphs
- **Found:** 2026-03-30, Day 6 of Sprint 2
- **Severity:** High
- **Status:** Resolved — 2026-03-30
- **Symptom:** Toggling focus mode dims all editor lines equally — the active line is not at full opacity.
- **Root cause:** The CSS rule `body.focus-active .cm-line.cm-activeLine { opacity: 1 }` relies on CM6 adding the `.cm-activeLine` class, but this requires the `highlightActiveLine()` extension which was never included in the extensions array. Without it, `.cm-activeLine` is never added to any line, so the full-opacity rule never matches.
- **Fix:** Added `highlightActiveLine()` import from `@codemirror/view` and included it in the `buildExtensions()` array in editor.js.
- **Files involved:** `src/editor.js`

---

## Resolved — Day 4

### BUG-002 — ⌘S crashes with ENOENT on write-file IPC
- **Found:** 2026-03-30, Day 4 of Sprint 1
- **Severity:** Critical
- **Status:** Resolved — 2026-03-30
- **Symptom:** Saving a file throws "Error invoking remote method 'write-file': ENOENT" and crashes the save flow.
- **Reproduction:** Open a file, edit it, press ⌘S.
- **Root cause:** The `write-file` IPC handler in main.js used `throw err` on failure, which propagated as an unhandled remote method error instead of returning a graceful `{ ok: false }` result.
- **Fix:** Replaced `throw err` with `return { ok: false, error: err.message }` in the catch block. Also changed validation errors from `throw` to `return { ok: false }`.
- **Files involved:** `src/main.js`

### BUG-003 — ● dirty indicator never appears in tab title
- **Found:** 2026-03-30, Day 4 of Sprint 1
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Typing in editor does not show the ● unsaved prefix in the tab title.
- **Reproduction:** Open a file, type any character, observe tab title — no ● prefix.
- **Root cause:** `updateTabBar()` in editor.js used selectors `.tab-item.active` and `.tab-label` but the actual DOM uses `.tab.tab--active` and `.tab-title`.
- **Fix:** Changed selectors to `.tab.tab--active` and `.tab-title` to match index.html.
- **Files involved:** `src/editor.js`

### BUG-003B — File-changed banner fires on every save (self-watch loop)
- **Found:** 2026-03-30, Day 4 of Sprint 1
- **Severity:** High
- **Status:** Resolved — 2026-03-30
- **Symptom:** Saving via ⌘S or auto-save triggers the "File changed externally" banner every time, because fs.watch detects the app's own write.
- **Reproduction:** Open a file, type, press ⌘S → banner appears immediately.
- **Root cause:** No suppression window after saves — fs.watch fires on every file write including the app's own atomic rename, and `onFileChanged` handler showed the banner unconditionally.
- **Fix:** Added `suppressWatchUntil` timestamp in editor-save.js. Set to `Date.now() + 1000` after a successful save. `onFileChanged` handler returns early if within the suppression window.
- **Files involved:** `src/editor-save.js`

### BUG-002B — Dirty indicator dot never appears in tab
- **Found:** 2026-03-30, Day 4 of Sprint 1
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Typing in editor does not show the unsaved dot indicator in the tab.
- **Reproduction:** Open a file, type any character — no dot appears in the tab.
- **Root cause:** `updateTabBar()` was prefixing tab title text with `●` character, but the actual DOM uses a separate `<span class="tab-dot">` element that becomes visible via CSS `opacity: 1` when the parent tab has the `is-unsaved` class. The text prefix was invisible because the dot element was overlaid/separate.
- **Fix:** Changed `updateTabBar()` to toggle `.is-unsaved` class on the tab element via `tab.classList.toggle('is-unsaved', dirty)` instead of text-prefixing. This activates the existing `.tab.is-unsaved .tab-dot { opacity: 1 }` CSS rule.
- **Files involved:** `src/editor.js`

### BUG-004 — Word count stuck at 0 words
- **Found:** 2026-03-30, Day 4 of Sprint 1
- **Severity:** Low
- **Status:** Resolved — 2026-03-30
- **Symptom:** Status bar shows "0 words · 0 min" even with content loaded and after typing.
- **Reproduction:** Open any .md file or type in editor. Status bar word count never updates.
- **Root cause:** No word count update function existed — the status bar elements `#status-words` and `#status-readtime` were never written to.
- **Fix:** Added `updateWordCount()` in editor.js that splits text on whitespace and computes read time. Called on both `onDocChange` and `loadContent`.
- **Files involved:** `src/editor.js`

---

## Bug template
```
### BUG-XXX — Short title
- **Found:** YYYY-MM-DD, Day N of Sprint N
- **Severity:** Critical / High / Medium / Low
- **Status:** Open / In Progress / Blocked
- **Symptom:** What the user sees
- **Reproduction:** Exact steps to trigger
- **Root cause:** (fill in when known)
- **Fix:** (fill in when resolved)
- **Files involved:** list of files
```

---

## Resolved bugs

### BUG-001 — CM6 not rendering text after dispatch (zero-width CSS issue)
- **Found:** 2026-03-29, Day 2 of Sprint 1
- **Severity:** Critical
- **Status:** Resolved — 2026-03-29
- **Symptom:** Editor area completely blank. Cannot type or drag files. Shell (toolbar, tabs, status bar) renders correctly but both editor and preview panes are empty.
- **Reproduction:** Launch app with `npm start`. Observe blank editor pane. Try ⌘O or drag-drop — file loads but no text visible.
- **Root cause:** `#workspace` CSS grid defined 5 columns (sidebar, sidebar-gutter, editor, split-gutter, preview) but only 4 DOM children exist. `#sidebar-resize` is inside `#sidebar`, not a direct grid child. CSS auto-placement shifted `#editor-pane` into the 5px sidebar-gutter column, giving it zero usable width. Additionally, duplicate CM6 CSS rules at the bottom of `styles.css` set `height: 100%` on `#cm-editor`, conflicting with the flex-based layout in §10.
- **Fix:** (1) Added explicit `grid-column` to all 4 workspace children: `#sidebar: 1/3`, `#editor-pane: 3`, `#split-resize: 4`, `#preview-pane: 5`. (2) Removed duplicate CM6 CSS rules (lines ~1193-1211). (3) Added `min-height: 0` to `#cm-editor`. (4) Removed `height: '100%'` from `githubLightBase` theme in `editor.js`.
- **Files involved:** `src/styles.css`, `src/editor.js`

---

## Known platform quirks (not bugs, just notes)
- **Linux `fs.watch`**: fires duplicate events per save. Debounce to 200ms on Linux. Detect platform in main.js: `process.platform === 'linux'`.
- **macOS `app.on('open-file')`**: fires before app is ready if file is double-clicked from Finder. Store the path in a variable and handle it in `app.whenReady()`.
- **Windows NSIS installer**: requires administrator privileges for file association registration. Document in README.
- **CodeMirror 6 and IME input** (CJK languages): use `EditorView.domEventHandlers` for composition events if non-Latin input breaks inline rendering decorations.
