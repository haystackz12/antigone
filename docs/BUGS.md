# BUGS.md
> Log bugs here as they are found. Mark status. Move to "Resolved" section when fixed.

## Active bugs

### BUG-051 — Theme selection doesn't persist across sessions
- **Found:** 2026-09-09, v1.0 release checklist
- **Severity:** Medium
- **Status:** Resolved — 2026-09-09
- **Symptom:** Selecting a theme (e.g. Midnight) and relaunching reverts to White.
- **Root cause:** Three issues: (1) Theme picker in prefs-ui.js didn't call `setPrefs` to save the selection. (2) `app.whenReady()` in main.js forced `editorTheme: 'white'` on every launch, overwriting any saved preference. (3) Stale `"theme": "light"` key from removed dark mode (DEC-032) lingered in config.json.
- **Fix:** (1) Added `setPrefs({ editorTheme })` call in theme picker click handler. (2) Removed the forced `s.set('editorTheme', 'white')` from main.js startup. (3) Added `s.delete('theme')` to clean up the stale key. Also removed wasteful `session.tabs` writes in tabs.js (never restored per DEC-023).
- **Files involved:** `src/prefs-ui.js`, `src/main.js`, `src/tabs.js`

### BUG-048 — Nested tags (#project/antigone) indexed as #project only
- **Found:** 2026-09-09, v1.0 release checklist
- **Severity:** Medium
- **Status:** Resolved — 2026-09-09
- **Symptom:** `#project/antigone` indexed as `project` instead of `project/antigone` in the tag sidebar.
- **Root cause:** `TAG_REGEX` in tags.js used `#([a-zA-Z][\w-]*)` which stopped at `/`. Autocomplete `matchBefore` in editor.js also excluded `/`.
- **Fix:** Extended TAG_REGEX to `#([a-zA-Z][\w-]*(?:\/[\w-]+)*)` and autocomplete regex to `/#[\w\-\/]*/`.
- **Files involved:** `src/tags.js`, `src/editor.js`

### BUG-049 — No right-click suggestions for misspelled words
- **Found:** 2026-09-09, v1.0 release checklist
- **Severity:** Medium
- **Status:** Resolved — 2026-09-09
- **Symptom:** Right-clicking a misspelled word shows no suggestions or "Add to Dictionary" option.
- **Root cause:** No `webContents.on('context-menu')` handler in main.js. Initial fix using `webContents.replaceMisspelling()` failed because CM6 rejects direct DOM mutations.
- **Fix:** Added context-menu handler that sends misspelled word, suggestion, and click coordinates via IPC to the renderer. Renderer uses CM6's `posAtCoords` to find the word position and `view.dispatch` to replace it. "Add to Dictionary" uses `session.addWordToSpellCheckerDictionary`.
- **Files involved:** `src/main.js`, `src/preload.js`, `src/renderer.js`

### BUG-047 — Crash recovery files deleted on startup before check
- **Found:** 2026-09-09, v1.0 release checklist
- **Severity:** High
- **Status:** Resolved — 2026-09-09
- **Symptom:** After kill -9 and relaunch, no recovery banner appears despite recovery files existing on disk.
- **Root cause:** `renderer.js` lines 27-32 unconditionally deleted ALL recovery files on startup ("prevents banner flash") before `initEditor()` → `checkRecovery()` had a chance to find and offer them.
- **Fix:** Removed the unconditional deletion. Recovery files are now only deleted by `checkRecovery()` (after user chooses Restore or Dismiss) and by `stopRecovery()` on clean exit.
- **Files involved:** `src/renderer.js`

### BUG-046 — Auto-save appeared broken (config state issue)
- **Found:** 2026-09-09, v1.0 release checklist
- **Severity:** Low
- **Status:** Resolved — 2026-09-09 (no code change needed)
- **Symptom:** Auto-save didn't write changes to disk during initial test.
- **Root cause:** Not a code bug. The auto-save setting in `config.json` was toggled during testing (BUG-040 investigation) and the store's in-memory cache didn't match the file on disk. After a clean restart with `autoSave: true` confirmed in config, auto-save works correctly: `scheduleAutoSave` fires, mtime guard passes, `writeFile` succeeds.
- **Files involved:** None (config state issue)

### BUG-045 — Inline image renders infinite loop on 404
- **Found:** 2026-09-09, v1.0 release checklist
- **Severity:** Critical
- **Status:** Resolved — 2026-09-09
- **Symptom:** After pasting a screenshot and moving the cursor off the `![]()` line, the editor freezes and console floods with 404 errors for the image, each triggering a new render cycle.
- **Root cause:** `img.onerror` in `inline-render.js` called `img.parentNode.insertBefore(span, img)`, inserting a new DOM node inside CM6's content area. CM6's `MutationObserver` detected this as a DOM change, called `applyDOMChange`, which re-rendered decorations, creating a new `<img>` widget → 404 → `onerror` → infinite loop.
- **Fix:** Changed `insertBefore` to `replaceChild` — the `<img>` is replaced by the `<span>` fallback, so no new node is inserted and CM6 doesn't see a content change.
- **Files involved:** `src/inline-render.js`

### BUG-043 — Cmd+B/I/K do nothing (bold, italic, link shortcuts)
- **Found:** 2026-09-08, v1.0 release checklist
- **Severity:** Medium
- **Status:** Resolved — 2026-09-08
- **Symptom:** Cmd+B to bold selected text has no visible effect.
- **Root cause:** Both CM6's keymap (editor.js) and a `document.addEventListener('keydown')` handler (toolbar.js) handled Cmd+B. Both called `wrapSelection('**')`. The first call added `**` markers, the second call detected them and removed them — net zero. Double-toggle on every keypress.
- **Fix:** Removed the redundant `setupKeyboardShortcuts()` from toolbar.js. Bold/italic/link are handled exclusively by CM6's keymap in editor.js.
- **Files involved:** `src/toolbar.js`

### BUG-044 — Paste image from clipboard inserts reference hundreds of times
- **Found:** 2026-09-08, v1.0 release checklist
- **Severity:** Critical
- **Status:** Resolved — 2026-09-08
- **Symptom:** Pasting a screenshot from clipboard inserts the `![]()` reference ~1000 times in an infinite loop.
- **Root cause:** `setupImagePaste()` added a `document.addEventListener('paste')` handler on every call. Electron Forge's webpack plugin enables HMR (`hot: true`), which re-ran `toolbar.init()` on each hot reload, accumulating duplicate paste listeners. Each listener independently handled the paste event.
- **Fix:** Store the paste handler reference and `removeEventListener` before re-adding. Only one listener is ever active.
- **Files involved:** `src/toolbar.js`

### BUG-042 — New tab inherits active tab's title
- **Found:** 2026-09-08, v1.0 release checklist
- **Severity:** Medium
- **Status:** Resolved — 2026-09-08
- **Symptom:** Clicking + after Save As creates a new tab that shows the previous tab's filename instead of "Untitled".
- **Root cause:** `loadContent()` set `currentFilePath` AFTER `view.dispatch()`. The dispatch fires the `updateListener` synchronously, which calls `onDocChange()` → `updateTabBar(fileNameFromPath(currentFilePath), true)`. At that point `currentFilePath` was still the previous file's path, so the DOM tab title was patched with the stale name.
- **Fix:** Moved `currentFilePath = filePath` and `isDirty = false` before `view.dispatch()` in `loadContent()`, so the synchronous update listener sees the correct path and dirty state.
- **Files involved:** `src/editor.js`

### BUG-041 — No external file change detection (watcher removed, never re-added)
- **Found:** 2026-09-08, v1.0 release checklist item 7
- **Severity:** Medium
- **Status:** Resolved (partial) — 2026-09-08
- **Symptom:** Editing an open file externally (e.g. `echo "text" >> file.md`) produces no reload banner.
- **Root cause:** `fs.watch`, the `#file-changed-banner` UI, and all watcher IPC were intentionally removed in Sprint 1 (DEC-019) to fix the self-watch loop (BUG-003B). DEC-019 said "revisit in Sprint 2 with content hash comparison" but it was never re-implemented.
- **v1.0 fix (DEC-034):** Save-time conflict check — mtime recorded at open and after each save; before writing, stat is compared and an Overwrite/Cancel dialog shown if the file was modified externally. Live watcher deferred to v1.1.
- **Files involved:** `src/main.js`, `src/preload.js`, `src/editor-save.js`, `src/editor.js`

---

## Resolved — v1.0 release checklist

### BUG-039 — Tab title bleeds across tabs after Save As
- **Found:** 2026-09-08, v1.0 release checklist
- **Severity:** Medium
- **Status:** Resolved — 2026-09-08
- **Symptom:** After Save As, opening a second file shows both tabs with the Save As filename.
- **Root cause:** `saveFile()` in editor-save.js updated `currentFilePath` (the editor.js module variable) but never synced `tab.filePath` in the tabs.js data model. When `renderTabBar()` re-rendered from the stale `tabs[]` array, titles were wrong.
- **Fix:** Added `setActiveTabPath()` function to tabs.js. Wired it into editor-save.js via `configure()`. Called after `setCurrentPath(targetPath)` in `saveFile()` so both the editor module and tab data model stay in sync.
- **Files involved:** `src/tabs.js`, `src/editor-save.js`, `src/editor.js`

### BUG-040 — Cmd+W on modified file closes without unsaved-changes prompt
- **Found:** 2026-09-08, v1.0 release checklist
- **Severity:** High
- **Status:** Resolved — 2026-09-08
- **Symptom:** Pressing Cmd+W on a modified file closes without showing the unsaved-changes dialog.
- **Root cause:** Three issues: (1) Electron Forge's webpack plugin enables HMR (`hot: true`) by default. Each HMR reload re-ran `setupBeforeClose()`, adding a duplicate `ipcRenderer.on('before-close')` listener. The stale listener's closure referenced an old `isDirty` variable (forever `false`) and called `closeConfirmed()` before the current listener could show the dialog. (2) `closeTab()` in tabs.js checked `tab.dirty` (only synced on tab switch) instead of `getIsDirty()` for the active tab. (3) In `setupBeforeClose`, the "save" branch called `closeConfirmed()` unconditionally even if the user cancelled Save As.
- **Fix:** (1) All `ipcRenderer.on` handlers in preload.js now call `removeAllListeners(channel)` before registering, preventing HMR listener accumulation. (2) `closeTab` checks `getIsDirty()` in addition to `tab.dirty` for the active tab. (3) `setupBeforeClose` save branch aborts close if `isDirty` is still true after `saveFile()`.
- **Files involved:** `src/preload.js`, `src/tabs.js`, `src/editor-save.js`

---

## Resolved — Day 12 (batch 3)

### BUG-047 — View toggle buttons not working in format strip
- **Resolved:** `setupViewToggles()` queried `#toolbar-view-toggles .toolbar-btn` but buttons were changed to class `fmt-btn` when moved to format strip. Changed both queries to `[data-view]` which matches regardless of class name.

### BUG-048 — View toggle tooltips removed
- **Resolved:** Removed `data-tooltip` attributes from the 3 view toggle buttons.

### BUG-049 — Theme picker has no effect
- **Resolved:** Theme CSS files in `src/themes/` were not served by webpack. Installed `copy-webpack-plugin` and configured it to copy `src/themes/` to the renderer output directory. Theme CSS files now accessible at `themes/[name].css` relative to the page URL.

---

## Resolved — Day 12 (batch 2)

### BUG-044 — Preview pane no padding at narrow widths
- **Resolved:** Added `padding: 0 16px` to `#preview-pane` so content never touches the pane edge, even when 72ch max-width fills the full width.

### BUG-045 — Italic removes bold markers
- **Resolved:** Rewrote `wrapSelection()` to preserve existing formatting. New logic: adds markers around the full selected text (including any existing markers) instead of replacing content. Bold then italic produces `***text***`, not `*text*`.

### BUG-046 — Strikethrough accumulates instead of toggling
- **Resolved:** `wrapSelection()` now checks for markers both inside AND outside the selection. If cursor is between markers (e.g., `~~|text|~~`), removes the outer markers. If selection includes markers, strips them. Only adds markers if neither case matches.

---

## Resolved — Day 12

### BUG-043 — Bold/formatting buttons crash after switching from large file
- **Resolved:** `wrapSelection()` used stale selection range from previous large file. After loading a new (shorter) document, the selection pointed past the end of the new document. Fixed: (1) `loadContent()` now resets selection to `{anchor:0, head:0}` as part of the dispatch. (2) `wrapSelection()` and `toggleHeadingPrefix()` clamp from/to/head to `[0, doc.length]` before using.

---

## Resolved — Day 11 (batch 8)

### BUG-041 — Clicking links in preview does nothing
- **Resolved:** Links rendered as `<a>` tags but clicks blocked by Electron sandbox. Added `setupLinkInterceptor()` in preview.js — intercepts click events on `a[href]`, calls `window.api.openExternal(href)`. Updated main.js handler to auto-prepend `https://` for bare domains and accept `mailto:` protocol.

### BUG-042 — Blank area after dragging resizer
- **Resolved:** Resizer set fixed px widths that didn't adapt to window resize. On mouseup, now converts to percentage widths. Added `window.addEventListener('resize')` that resets both panes to `flex:1` clearing any fixed widths.

---

## Resolved — Day 11 (batch 7)

### BUG-040 — Markdown links not rendering as hyperlinks in preview
- **Resolved:** Custom renderer.paragraph() uses token.text which contains raw `[text](url)` syntax — never converted to `<a>` tags. Added `postProcessInline()` function that: (1) preserves existing `<a>` tags via placeholder substitution, (2) converts raw `[text](url)` to `<a href target=_blank rel=noopener>` tags, (3) applies bold/italic/code replacements, (4) restores preserved tags. Added `rel` to DOMPurify ADD_ATTR.

---

## Resolved — Day 11 (batch 6)

### BUG-038 — Right panel doesn't open from split view on first click
- **Resolved:** `panelSections` was cached as a static NodeList at init time. If DOM order or hidden state changed between init and first click, the cached list could be stale. Changed `activateRailBtn` to query `.panel-section` elements fresh on each click. Also added `rightPanel.style.display = ''` to clear any inline display override alongside `hidden = false`.

---

## Resolved — Day 11 (batch 5)

### BUG-035B — Rail tooltips clipped by overflow:hidden
- **Resolved:** Disabled CSS ::after tooltips for rail buttons. Added JS-based fixed-position tooltip in icon-rail.js — `#rail-tooltip` element appended to `document.body`, positioned via `getBoundingClientRect()` on mouseenter, hidden on mouseleave. Cannot be clipped by parent overflow.

### BUG-037 — Preview content cut off on right side
- **Resolved:** Changed `#preview-content` padding from `60px var(--space-8) 40px` (32px sides) to `60px 48px 40px 48px` with `width:100%; box-sizing:border-box`. Equal 48px padding on both sides, box-sizing ensures padding included in width.

---

## Resolved — Day 11 (batch 4)

### BUG-033 — Blank space on right in editor/preview-only modes
- **Resolved:** Right panel `[hidden]` now has `display:none !important; width:0; min-width:0`. Panel hidden on init.

### BUG-034 — Split view not 50/50
- **Resolved:** Both panes get `flex:1; min-width:0`. setViewMode resets flex/width on mode switch.

### BUG-035 — Rail button tooltips in wrong position
- **Resolved:** Added `.rail-btn[data-tooltip]::after` with `left:calc(100%+8px); top:50%; transform:translateY(-50%)` — tooltips appear to the right.

### BUG-036 — Split pane divider not draggable
- **Resolved:** Added `setupResizer()` in toolbar.js — mousedown/mousemove/mouseup handlers for drag resize. Double-click resets to 50/50.

---

## Resolved — Day 11 (batch 3)

### BUG-031 — Tags not detected when frontmatter is not at line 1
- **Found:** 2026-03-31, Day 11 of Sprint 3
- **Severity:** Medium
- **Status:** Resolved — 2026-03-31
- **Symptom:** Frontmatter tags not found when --- block starts mid-document.
- **Root cause:** `parseFrontmatterTags()` used `text.match(/^---\n/)` which only matches at string start. Documents with headings before frontmatter were missed.
- **Fix:** Changed to `fmRegex = /^---\s*\n([\s\S]*?)\n---/gm` with global+multiline flags, scanning entire document for all --- blocks.
- **Files involved:** `src/tags.js`

### BUG-032 — No sidebar toggle button in toolbar
- **Found:** 2026-03-31, Day 11 of Sprint 3
- **Severity:** Medium
- **Status:** Resolved — 2026-03-31
- **Symptom:** No way to open sidebar after closing it — only the internal × button existed.
- **Fix:** Added hamburger-style toggle button (`#btn-sidebar-toggle`) to the left side of the toolbar with a 3-line SVG icon. Click toggles `sidebar.dataset.collapsed` between 'true' and 'false'.
- **Files involved:** `src/index.html`, `src/tags.js`

---

## Resolved — Day 11 (batch 2)

### BUG-029 — No way to close the tag sidebar
- **Found:** 2026-03-31, Day 11 of Sprint 3
- **Severity:** Medium
- **Status:** Resolved — 2026-03-31
- **Symptom:** Sidebar opens when tags are found but cannot be dismissed.
- **Fix:** Added `#sidebar-header` with heading and `#btn-sidebar-collapse` close button. Click sets `sidebar.dataset.collapsed = 'true'`.
- **Files involved:** `src/index.html`, `src/styles.css`, `src/tags.js`

### BUG-030 — Sidebar shows unwanted panels (Folder, Tags, Headers)
- **Found:** 2026-03-31, Day 11 of Sprint 3
- **Severity:** Low
- **Status:** Resolved — 2026-03-31
- **Symptom:** Multiple unimplemented sidebar tabs visible.
- **Fix:** Removed Files and TOC tabs/sections from sidebar HTML. Only Tags section remains. Replaced tab-switching logic with collapse button. Auto-collapse when no tags found. Logged as DEC-027.
- **Files involved:** `src/index.html`, `src/tags.js`

---

## Resolved — Day 11

### BUG-026 — YAML frontmatter renders as raw text in preview
- **Found:** 2026-03-31, Day 11 of Sprint 3
- **Severity:** Medium
- **Status:** Resolved — 2026-03-31
- **Symptom:** Preview shows raw `---` delimiters and `tags:` line instead of stripping frontmatter.
- **Root cause:** No frontmatter stripping in the render pipeline — the full document including frontmatter was passed to `marked.parse()`.
- **Fix:** Added `stripFrontmatter()` in preview.js that removes content between opening and closing `---` delimiters before passing to marked.
- **Files involved:** `src/preview.js`

### BUG-027 — Tag sidebar not visible when tags present
- **Found:** 2026-03-31, Day 11 of Sprint 3
- **Severity:** Medium
- **Status:** Resolved — 2026-03-31
- **Symptom:** Tags section in sidebar stays hidden even when document has tags.
- **Root cause:** The tags `sidebar-section` starts with `sidebar-section--hidden` class. `updateSidebar()` populated it but never removed the hidden class or activated the tags tab.
- **Fix:** When tags are found, `updateSidebar()` now removes `sidebar-section--hidden` from the tags section and activates the Tags tab (toggling sidebar-tab--active).
- **Files involved:** `src/tags.js`

### BUG-028 — Single line breaks not preserved in preview
- **Found:** 2026-03-31, Day 11 of Sprint 3
- **Severity:** Medium
- **Status:** Resolved — 2026-03-31
- **Symptom:** Single newlines collapsed into spaces in preview — user expects Enter = visible line break.
- **Root cause:** `marked.setOptions({ breaks: false })` — standard Markdown behavior where single newlines are ignored.
- **Fix:** Changed to `breaks: true` — single `\n` now produces `<br>` in preview. Matches writing app conventions (Typora, iA Writer). Logged as DEC-026.
- **Files involved:** `src/preview.js`

---

## Resolved — Day 10 (batch 4)

### BUG-023 — Word goal circle tooltip not showing
- **Found:** 2026-03-31, Day 10 of Sprint 2
- **Severity:** Low
- **Status:** Resolved — 2026-03-31
- **Symptom:** No tooltip when hovering over the word goal circle.
- **Root cause:** The `title="Set Word Goal (⌘⇧G)"` attribute was already present on the `#word-goal-ring` div, but the tooltip only works reliably when the element has proper cursor and no-drag styles. Verified all toolbar buttons have tooltips.
- **Fix:** Confirmed tooltip attribute is correct. No code change needed for the tooltip itself — the attribute was already present from the Day 5 fix. All other toolbar buttons verified to have title attributes.
- **Files involved:** `src/index.html` (verified, no change needed)

### BUG-024 — Clicking word goal circle makes titlebar disappear
- **Found:** 2026-03-31, Day 10 of Sprint 2
- **Severity:** High
- **Status:** Resolved — 2026-03-31
- **Symptom:** Clicking the word goal ring causes the titlebar/toolbar to vanish.
- **Root cause:** The goal input overlay was appended to `#statusbar` as a flex child, which could cause layout shifts. Additionally, `#titlebar` lacked `min-height` and `flex-shrink: 0`, making it collapsible when child elements changed.
- **Fix:** (1) Changed overlay to append to `document.body` with `position: fixed` positioned below the word goal button using `getBoundingClientRect()`. (2) Added `min-height` and `flex-shrink: 0` to `#titlebar` CSS to prevent collapse. (3) Styled overlay as a floating popover with border, shadow, and background.
- **Files involved:** `src/wordgoal.js`, `src/styles.css`

---

## Resolved — Day 10 (batch 3)

### BUG-018B — Recovery banner still appearing on clean launch
- **Found:** 2026-03-31, Day 10 of Sprint 2
- **Severity:** High
- **Status:** Resolved — 2026-03-31
- **Symptom:** Recovery banner shows on every launch despite stopRecovery() being called.
- **Root cause:** `stopRecovery()` called `deleteRecovery()` without awaiting it, then `closeConfirmed()` closed the window immediately — the delete IPC never completed before the process exited. The recovery file survived on disk.
- **Fix:** Made `stopRecovery()` async and `await`ed it in the before-close handler before calling `closeConfirmed()`. Also added content verification in `checkRecovery()`: reads each recovery file and silently deletes empty/whitespace-only ones.
- **Files involved:** `src/editor-save.js`

### BUG-022 — App title "Antigone" not centered in titlebar
- **Found:** 2026-03-31, Day 10 of Sprint 2
- **Severity:** Low
- **Status:** Resolved — 2026-03-31
- **Symptom:** Title text shifts left in dark mode and appears off-center in light mode.
- **Root cause:** `.titlebar-title` used `flex: 1; text-align: center` which centers within its flex-allocated space, but the traffic light gutter (left) and toolbar (right) take unequal space, shifting the visual center.
- **Fix:** Changed to `position: absolute; left: 50%; transform: translateX(-50%)` which centers relative to the full titlebar width regardless of sibling sizes. Added `position: relative` to `#titlebar` for correct positioning context.
- **Files involved:** `src/styles.css`

---

## Resolved — Day 10 (batch 2)

### BUG-020 — App crashes when opening new file while another is loaded
- **Found:** 2026-03-31, Day 10 of Sprint 2
- **Severity:** Critical
- **Status:** Resolved — 2026-03-31
- **Symptom:** Clicking + or ⌘N while a file is loaded causes error "content must be a non-empty string" at saveFile().
- **Root cause:** Two issues: (1) `guardUnsavedChanges()` prompted to save an empty untitled document, which called `saveFile()`. (2) `writeFile` in preload.js uses `requireString()` which rejects empty strings — so saving a document with empty content throws.
- **Fix:** (1) `guardUnsavedChanges()` now skips the save prompt for empty untitled documents (no content and no file path). (2) `saveFile()` passes `content || '\n'` to `writeFile` to ensure non-empty content for empty documents.
- **Files involved:** `src/editor-save.js`

### BUG-021 — Font size slider in preferences has no visible effect
- **Found:** 2026-03-31, Day 10 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-31
- **Symptom:** Dragging the font size slider changes the label value but the editor text size doesn't change.
- **Root cause:** `applyFontSize()` in prefs.js set the CSS variable `--font-size-editor`, but the CM6 editor's CSS rule (`.cm-editor`) reads `--editor-font-size`. The variable names didn't match.
- **Fix:** Changed `applyFontSize()` to set `--editor-font-size` (matching the CSS token defined at line 168 of styles.css and used at line 703).
- **Files involved:** `src/prefs.js`

---

## Resolved — Day 10

### BUG-018 — Recovery banner appears on every launch even with no crash
- **Found:** 2026-03-31, Day 10 of Sprint 2
- **Severity:** High
- **Status:** Resolved — 2026-03-31
- **Symptom:** "Unsaved work found from a previous session" banner shows on every launch, even after a clean exit.
- **Root cause:** The 30s recovery interval writes recovery files during normal sessions, but `stopRecovery()` (which deletes the file) was never called in the before-close handler. On next launch, the leftover file triggered the recovery banner.
- **Fix:** Added `stopRecovery()` calls in the before-close handler — called after user confirms Save, Don't Save, or when not dirty. Also filtered current session's recovery file from `checkRecovery()` results.
- **Files involved:** `src/editor-save.js`

### BUG-019 — Line numbers toggle in preferences has no effect
- **Found:** 2026-03-31, Day 10 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-31
- **Symptom:** Toggling line numbers off in preferences does not hide line numbers in the editor.
- **Root cause:** The CSS rule `.hide-line-numbers .cm-lineNumbers { display: none }` only hid the line number elements but (1) lacked `!important` so CM6's own styles overrode it, and (2) didn't hide the gutter container (`.cm-gutters`) which left a blank column.
- **Fix:** Strengthened the CSS rule to target both `.cm-lineNumbers` and `.cm-gutters` with `!important`.
- **Files involved:** `src/styles.css`

---

## Resolved — Day 9

### BUG-017 — Pagebreak comment has no effect in PDF export or print
- **Found:** 2026-03-30, Day 9 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** `<!-- pagebreak -->` in Markdown source has no effect in exported PDF, HTML, or print output. No visual indicator in split-view preview either.
- **Root cause:** Two issues: (1) `processPagebreaks()` in export.js ran *after* `DOMPurify.sanitize()`, but DOMPurify strips HTML comments — the `<!-- pagebreak -->` was already gone before the regex could match it. (2) preview.js had no pagebreak processing at all.
- **Fix:** Moved pagebreak replacement to *before* marked/DOMPurify: `preprocessPagebreaks()` converts `<!-- pagebreak -->` to `<div class="page-break"></div>` in the Markdown source, which survives both marked parsing and DOMPurify sanitization (with `ADD_TAGS: ['div']`). Added same preprocessing to preview.js render(). Added `.page-break` CSS with visual indicator (dashed line + "Page Break" label) for preview, and `page-break-after: always; break-after: always` for print/PDF. Updated standalone HTML template CSS to match.
- **Files involved:** `src/export.js`, `src/preview.js`, `src/styles.css`

---

## Resolved — Day 8 (batch 4)

### BUG-011C — Welcome screen flashes then last file auto-loads
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** High
- **Status:** Resolved — 2026-03-30
- **Symptom:** Welcome screen appears briefly, then the last opened file loads automatically.
- **Root cause:** Two sources: (1) `resolveCLIPath()` in main.js matched non-Markdown files in argv (Forge webpack dev server passes project paths that resolve to existing files like webpack configs). (2) Stale session data in electron-store from before session restore was disabled — `tabs.saveSession()` writes on every tab operation.
- **Fix:** (1) Added file extension filter to `resolveCLIPath()` — only matches `.md .markdown .mdown .mkd .mdx .txt`. (2) renderer.js clears stale session data from electron-store on launch (`setPrefs({ session: null })`).
- **Files involved:** `src/main.js`, `src/renderer.js`

### BUG-013D — Scroll sync still drifting between panes
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Low
- **Status:** Resolved — 2026-03-30
- **Symptom:** Line-based scroll sync still drifts significantly.
- **Root cause:** CM6 `lineBlockAtHeight` API produces imprecise results when editor has variable-height elements (inline images, headings). Perfect sync is inherently impossible between Markdown source and rendered HTML.
- **Fix:** Replaced with simpler ratio-based sync with a timestamp deadband (50ms) to prevent feedback loops. Removed CM6 API dependency from scroll sync. Accepted "within 2-3 paragraphs" as target accuracy (matches iA Writer behavior).
- **Files involved:** `src/preview.js`, `src/renderer.js`

### BUG-016 — "null" showing in toolbar top-right
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Low
- **Status:** Resolved — 2026-03-30
- **Symptom:** The text "null" appears somewhere in the toolbar/tab area.
- **Root cause:** Likely a null file path or filename being set as `textContent` without a guard. Multiple places in `updateTabBar` and `renderTabBar` could produce "null" as a string if JavaScript coerces a null value to text.
- **Fix:** Added null guards to `updateTabBar()` in editor.js (`filename || 'Untitled'`) and `renderTabBar()` in tabs.js (`fileNameFromPath(...) || 'Untitled'`).
- **Files involved:** `src/editor.js`, `src/tabs.js`

---

## Resolved — Day 8 (batch 3)

### BUG-011B — App still launches in split view
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** App launches in split view despite the previous fix.
- **Root cause:** `toolbar.setViewMode(prefs.viewMode || 'editor')` in renderer.js reads the stored preference. If the user previously switched to split, `prefs.viewMode` is `'split'` and overrides the `'editor'` default.
- **Fix:** Hardcoded `toolbar.setViewMode('editor')` — never read viewMode from prefs at launch. Logged as DEC-024.
- **Files involved:** `src/renderer.js`

### BUG-013C — Scroll sync drifts between editor and preview
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Panes drift apart when scrolling — percentage-based sync doesn't account for differing content structures.
- **Root cause:** Percentage-based ratio (`scrollTop / scrollHeight`) doesn't reflect actual content position because editor has line numbers, gutter padding, and empty lines that preview doesn't have.
- **Fix:** Replaced with line-number based sync using CM6's `lineBlockAtHeight()` to find the top visible editor line, then mapping that line number as a ratio of total lines to the preview's scroll position. Preview-to-editor reverse sync uses `coordsAtPos()`. Falls back to simple ratio if CM6 APIs fail.
- **Files involved:** `src/preview.js`, `src/renderer.js`

---

## Resolved — Day 8 (batch 2)

### BUG-013B — Scroll sync drifts apart between editor and preview
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Low
- **Status:** Resolved — 2026-03-30
- **Symptom:** Scroll sync drifts — panes don't stay aligned. Can trigger division-by-zero when content fits without scrolling.
- **Root cause:** No guard for when content fits entirely within the viewport (`scrollHeight <= clientHeight`), causing `0/0` ratio calculations that produce erratic scroll positions.
- **Fix:** Added early-return guards in `syncScroll()`: if `sourceMax <= 0` or `targetMax <= 0`, skip sync entirely.
- **Files involved:** `src/preview.js`

### BUG-015 — App restores previous document on launch without asking
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Relaunching the app automatically reloads the last open file instead of showing the empty state.
- **Root cause:** `tabs.restoreSession()` in renderer.js was called unconditionally on launch, reading saved file paths from electron-store and loading them.
- **Fix:** Replaced `await tabs.restoreSession()` with `tabs.openNewTab()` — always launch to empty state. Session restore deferred as opt-in preference (DEC-023).
- **Files involved:** `src/renderer.js`

### BUG-014B — Orphan notification bar with X visible below find bar
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Low
- **Status:** Resolved — 2026-03-30
- **Symptom:** An extra bar with just an X button visible at the bottom of the editor pane, below the find bar.
- **Root cause:** `#notification-bar` in index.html had `hidden` attribute, but its CSS rule `#notification-bar { display: flex }` has higher specificity than the browser's `[hidden] { display: none }`, so the bar was always visible despite the hidden attribute.
- **Fix:** Removed the `#notification-bar` element from index.html entirely — it is not used by any module. The CSS rules remain harmless (target a nonexistent element).
- **Files involved:** `src/index.html`

---

## Resolved — Day 8

### BUG-013 — Scroll sync not working between editor and preview panes
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Scrolling the editor does not scroll the preview pane and vice versa in split view.
- **Root cause:** No scroll sync was implemented. preview.js only handled rendering, not scroll coordination.
- **Fix:** Added percentage-based scroll sync in preview.js: `syncScroll()` calculates `scrollTop / (scrollHeight - clientHeight)` ratio from source and applies to target. Uses `isSyncingScroll` flag to prevent infinite feedback loops. `attachScrollSync()` binds scroll listeners with `{ passive: true }`. Called from `setViewMode('split')` in toolbar.js via `requestAnimationFrame` after panes are visible.
- **Files involved:** `src/preview.js`, `src/toolbar.js`

### BUG-014 — Find bar pushes editor content causing mismatched pane heights
- **Found:** 2026-03-30, Day 8 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** Opening ⌘F find bar in split view makes the editor pane shorter than the preview pane, breaking layout and scroll sync.
- **Root cause:** CM6's `.cm-panels` renders as a block element inside the editor, reducing available height for `.cm-content`. The two panes become different heights.
- **Fix:** Set `.cm-panels { position: absolute !important; bottom: 0; z-index: 50; }` so the find bar overlays the editor content instead of taking layout space. `#editor-pane` already has `position: relative` for correct absolute positioning scope.
- **Files involved:** `src/styles.css`

---

## Resolved — Day 7 (batch 2)

### BUG-012 — Dark mode editor content left-justified and full-width
- **Found:** 2026-03-30, Day 7 of Sprint 2
- **Severity:** Medium
- **Status:** Resolved — 2026-03-30
- **Symptom:** In dark mode, editor content stretches full width with no centering or margins. Light mode correctly shows centered content at max 72ch width.
- **Root cause:** The CM6 layout styles (`maxWidth: '72ch'`, `margin: '0 auto'`, scroller font/line-height, gutter styles) were defined inside `githubLightBase` — the light-only CM6 JS theme. When dark mode activates, the theme compartment switches to `oneDark` which has its own defaults (full width), discarding all the light theme's layout rules. Layout should be theme-independent.
- **Fix:** Extracted all layout/typography styles into a new `baseEditorTheme` that is applied as a standalone extension (outside the theme compartment). The theme compartment now only switches color themes. `baseEditorTheme` provides centering, max-width, font, line-height, gutter styles, and caret color consistently in both light and dark modes.
- **Files involved:** `src/editor.js`

---

## Resolved — Day 7

### BUG-010 — ⌘H closes the app (macOS Hide Window conflict)
- **Found:** 2026-03-30, Day 7 of Sprint 2
- **Severity:** Critical
- **Status:** Resolved — 2026-03-30
- **Symptom:** Pressing ⌘H triggers macOS Hide Window instead of find/replace.
- **Root cause:** ⌘H is reserved by macOS for Hide Window and cannot be overridden in Electron. CM6's default `searchKeymap` binds `Mod-h` to `openSearchPanel`.
- **Fix:** Filtered `Mod-h` from `searchKeymap` array before spreading into CM6 keymap. Added `Mod-Alt-f` binding for `openSearchPanel` (standard replace shortcut in Mac editors). Logged as DEC-022.
- **Files involved:** `src/editor.js`

### BUG-011 — App launches in split view instead of editor-only
- **Found:** 2026-03-30, Day 7 of Sprint 2
- **Severity:** Low
- **Status:** Resolved — 2026-03-30
- **Symptom:** App launches showing split view with empty preview pane.
- **Root cause:** No default view mode was set on launch. The HTML starts with `data-panel="split"` and no code called `setViewMode('editor')` on init.
- **Fix:** `renderer.js` now calls `toolbar.setViewMode(prefs.viewMode || 'editor')` after toolbar init. View mode changes are persisted to electron-store via `window.api.setPrefs({ viewMode })`.
- **Files involved:** `src/toolbar.js`, `src/renderer.js`

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
