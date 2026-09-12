# TESTING.md
> QA approach, test fixtures, and per-feature checklists. Read before a test pass or when writing new tests.

## Test philosophy
Antigone has no automated unit test suite in v1.0. All testing is manual against the checklists below. Automated tests are a v1.1 addition.
Each sprint's GATE conditions in SPRINT.md are the minimum test pass for that day.

## Test fixtures
Located in `test/fixtures/`. These files are used for every test pass.

| File | Purpose |
|------|---------|
| `basic.md` | Standard GFM: all heading levels, bold, italic, lists, code, tables, blockquotes, links |
| `images.md` | Relative image references, missing image references, external image URLs |
| `tags.md` | Inline #tags, #namespace/tag, YAML frontmatter tags array |
| `large.md` | ~2000 lines, ~150K characters. Used for performance testing. |
| `unicode.md` | CJK characters, emoji, RTL text, special punctuation |
| `codeblocks.md` | Fenced blocks in 15 languages: js, ts, py, sh, sql, json, yaml, rust, go, java, css, html, bash, diff, plaintext |
| `mermaid.md` | Flowchart, sequence, Gantt, ERD Mermaid blocks |
| `pagebreaks.md` | Multiple `<!-- pagebreak -->` markers, H1 headings, designed for print testing |
| `frontmatter.md` | YAML frontmatter with title, date, author, tags array |
| `malicious.html` | HTML with script tags, event handlers, iframes — must render sanitized with all dangerous elements stripped |

## Environment setup before testing
```
1. Set theme to Light, then test. Repeat with Dark.
2. Set typeface pairing to Literary (default).
3. Close and relaunch between major feature tests (tests session restore).
4. Test each platform separately: macOS and Windows minimum, Linux on CI.
```

## v1.0 full release checklist
Run this before tagging any release. All items must pass on macOS and Windows.

### File operations
- [ ] Double-click .md file → Antigone opens it (file association)
- [ ] `⌘O` → open dialog → file loads in new tab
- [ ] Drag .md file onto window → loads in new tab  
- [ ] `⌘S` → file saved → `Saved ✓` indicator shown → open file in external editor → changes present
- [ ] `⌘⇧S` → save dialog → saves to new path → tab title updates
- [ ] `⌘W` on modified file → unsaved changes prompt shown → Cancel keeps file open
- [ ] Modify open file externally → edit in app → ⌘S → overwrite dialog appears (DEC-034; live banner deferred to v1.1 per DEC-019)

### Editor
- [ ] Type `**hello**` → move cursor off → bold, no asterisks
- [ ] Type `# Heading` → move off → styled heading rendered
- [ ] Type `` `code` `` → move off → code chip rendered
- [ ] Type `![](test/fixtures/basic.md)` relative path → image renders inline (use an actual image)
- [ ] Click a `[link](url)` → browser opens, editor does not navigate
- [ ] Every toolbar button produces correct Markdown and toggles off correctly
- [ ] `⌘B` on selected text → wraps in ** → `⌘B` again → removes **
- [ ] Paste image from clipboard (take a screenshot first) → PNG saved to `assets/`, reference inserted, cursor in alt text position
- [ ] `⌘F` → search finds all matches → Next/Prev cycle → Escape closes (match counter is stock CM6 — v1.1 enhancement)
- [ ] `⌘⌥F` → replace → Replace All replaces only matches (⌘H reserved by macOS, DEC-022)

### Auto-save & safety
- [ ] Edit file → wait 800ms → open in external editor → changes present
- [ ] Edit file → `kill -9` the process → relaunch → recovery banner offers restore → restore works
- [ ] Recovery file is in OS temp dir, NOT in the source file's directory
- [ ] Modify file externally while editing → save → overwrite dialog appears (DEC-034; live reload deferred to v1.1)

### View modes
- [ ] `⌘⇧F` → focus mode → non-active paragraphs dimmed to ~25% opacity
- [ ] View menu → Split View → editor left, preview right (no accelerator in v1.0)
- [ ] View menu → Preview Only → full width rendered preview (no accelerator in v1.0)
- [ ] View menu → Editor Only → no preview (no accelerator in v1.0; ⌘⇧E is Export PDF)
- [ ] Drag split view divider → panels resize

### Navigation
- [ ] TOC builds from H1–H3 headings → click TOC item → editor scrolls to that line
- [ ] Active TOC item highlights as cursor moves through document
- [ ] `⌘P` → quick open → type partial filename → correct file highlighted → Enter opens it

### Tags
- [ ] Type `#project/antigone` → indexed correctly in sidebar (inline chip styling deferred to v1.1)
- [ ] Save file → open tag sidebar → `project/antigone` appears
- [ ] Type `#` in editor → autocomplete dropdown shows previously used tags within 100ms
- [ ] YAML frontmatter `tags: [legal, draft]` → both indexed in tag sidebar

### Word count goal
- [ ] Word goal ring visible in toolbar → click → set goal → ring fills as words are typed
- [ ] Status bar shows live word count

### Spell check
- [ ] Misspelled word → red underline appears (not inside code block)
- [ ] Right-click misspelled word → suggestions shown → click suggestion → word replaced
- [ ] Add word to dictionary → word no longer underlined → verify dictionary.txt in OS user data dir
- [ ] No spell check underline inside `` `code` `` or fenced code block (native Chromium spellcheck — code block exclusion deferred to v1.1)

### Export
- [ ] `⌘⇧E` → PDF created in same directory as source file → opens correctly in Preview/Acrobat
- [ ] HTML export → open exported file with no internet → renders correctly with all styles
- [ ] Print (`⌘P`) → print preview shows sidebar/toolbar hidden
- [ ] `<!-- pagebreak -->` → appears as dashed rule in editor → creates actual page break in PDF

### Multi-tab
- [ ] `⌘T` → new blank tab → `⌘W` closes it
- [ ] Open 3 files in 3 tabs → scroll each to different position → switch between them → positions preserved
- [ ] Quit → relaunch → all 3 tabs restored with correct files

### Preferences
- [ ] Change theme → instant switch → quit → relaunch → theme persists
- [ ] Change typeface pairing to Editorial → Cormorant Garamond visible in preview
- [ ] Change editor font size → editor updates immediately
- [ ] .txt association toggle → change in prefs → verify file association reflects change

### Themes
- [ ] Light mode → dark mode → light mode → no flash of unstyled content
- [ ] OS appearance change (System Settings) → Antigone follows automatically when set to System theme
- [ ] Code blocks use GitHub Light in light mode, One Dark in dark mode

### Platform-specific
- [ ] macOS: no Gatekeeper warning on signed build
- [ ] macOS: `app.on('open-file')` fires correctly when file double-clicked before app is ready
- [ ] Windows: no SmartScreen warning on signed build
- [ ] Windows: .md file association registered in Explorer → right-click → Open with Antigone present
- [ ] Linux: AppImage runs on Ubuntu 22.04 with no additional dependencies
- [ ] Linux: fs.watch does not cause excessive reload banners (debounce working)

## v1.0.1 polish release checklist

### Context menu (BUG-053)
- [ ] Right-click in editor with no selection → Cut (disabled), Copy (disabled), Paste, Select All shown
- [ ] Right-click with text selected → Cut, Copy, Paste, Select All shown, Cut/Copy enabled
- [ ] Right-click misspelled word → spelling suggestions shown above separator, click suggestion → word replaced
- [ ] Right-click misspelled word → "Add to Dictionary" shown → click → word no longer underlined
- [ ] Right-click with selection → "Copy as HTML" item shown → click → clipboard contains rendered HTML
- [ ] Paste clipboard HTML into another app (e.g., TextEdit rich text) → formatting preserved

### View mode shortcuts
- [ ] `⌘1` → Editor only mode
- [ ] `⌘2` → Split view mode
- [ ] `⌘3` → Preview only mode
- [ ] View menu shows ⌘1/⌘2/⌘3 accelerators next to each item

### Find panel match counter
- [ ] `⌘F` → search panel opens → type a word → "N of M" counter appears
- [ ] Press Next/Prev → counter updates to show current match index
- [ ] No matches → counter shows "No results"
- [ ] Clear search field → counter disappears
- [ ] Regex search → counter correctly counts regex matches

### File → Open Recent
- [ ] File → Open Recent → shows recently opened files (up to 5)
- [ ] Click a recent file → file opens in new tab
- [ ] "Clear Menu" item shown at bottom → click → list cleared
- [ ] After clearing, submenu shows "No Recent Files" (disabled)

### Inline tag chip decoration
- [ ] Type `#project` → move cursor off line → tag rendered as chip with accent background
- [ ] Type `#nested/tag` → move cursor off → rendered as chip
- [ ] Move cursor back to tag line → raw `#tag` syntax revealed for editing
- [ ] Tag inside `` `#code` `` → NOT rendered as chip
- [ ] Tag inside fenced code block → NOT rendered as chip
- [ ] Tag after heading `# ` → NOT rendered as chip (heading marker, not tag)
- [ ] Chip styling adapts to current theme (light/dark)

### Data isolation
- [ ] Verify `~/Library/Application Support/Antigone/` exists after first launch (macOS)
- [ ] Verify NO `.antigone-*` files in any source directory after a full editing session
- [ ] Verify recovery file path is in OS temp dir: `ls $(python3 -c "import tempfile; print(tempfile.gettempdir())")` → look for `antigone-recovery-*`
