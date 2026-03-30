# BUGS.md
> Log bugs here as they are found. Mark status. Move to "Resolved" section when fixed.

## Active bugs
None.

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
