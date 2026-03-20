# features/EDITOR.md
> Read this when working on: editor.js, inline-render.js, keymaps, toolbar.js (formatting logic), or CodeMirror 6 configuration.

## CodeMirror 6 setup
```javascript
// renderer/editor.js
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection, dropCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { inlineRenderPlugin } from './inline-render.js';

const state = EditorState.create({
  doc: initialContent,
  extensions: [
    history(),
    lineNumbers(),
    drawSelection(),
    dropCursor(),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    inlineRenderPlugin,
    EditorView.lineWrapping,
    isDark ? oneDark : githubLightTheme,
    EditorView.updateListener.of(update => {
      if (update.docChanged) onDocChange(update.state.doc.toString());
    }),
  ],
});
```

## Inline rendering architecture (inline-render.js)
The inline rendering layer is a CM6 `ViewPlugin` that installs a `DecorationSet` onto the editor state. It runs on every view update.

```javascript
// Simplified pattern
import { ViewPlugin, Decoration } from '@codemirror/view';

const inlineRenderPlugin = ViewPlugin.fromClass(class {
  constructor(view) { this.decorations = buildDecorations(view); }
  update(update) {
    if (update.docChanged || update.selectionSet)
      this.decorations = buildDecorations(update.view);
  }
}, { decorations: v => v.decorations });

function buildDecorations(view) {
  const { state } = view;
  const cursorLine = state.doc.lineAt(state.selection.main.head).number;
  const widgets = [];
  // Walk syntax tree, add mark/widget decorations for each token
  // SKIP any token on cursorLine — show raw syntax for editing
  return Decoration.set(widgets, true);
}
```

**Decoration types used:**
- `Decoration.mark({ class: 'cm-bold' })` — hides `**` tokens, applies bold CSS
- `Decoration.replace({})` — completely replaces `# ` with a blank (heading marker hidden)
- `Decoration.widget({ widget: new ImageWidget(src) })` — renders `<img>` for `![](path)`
- `Decoration.mark({ class: 'cm-link-text' })` — underlines link text, hides URL

**The cursor rule:** Any token that overlaps the cursor's line is excluded from decoration. This reveals the raw syntax for editing. When the cursor moves off, the decoration re-applies.

## Toolbar formatting commands
All toolbar buttons call a CM6 `command` function. Pattern:

```javascript
function wrapSelection(view, marker) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  // Check if already wrapped
  if (selected.startsWith(marker) && selected.endsWith(marker)) {
    view.dispatch({ changes: { from, to, insert: selected.slice(marker.length, -marker.length) } });
  } else {
    view.dispatch({ changes: { from, to, insert: `${marker}${selected}${marker}` } });
  }
  return true; // command handled
}
// Usage: wrapSelection(view, '**')  // bold
// Usage: wrapSelection(view, '_')   // italic
```

For heading prefixes (line-level):
```javascript
function toggleHeadingPrefix(view, level) {
  const prefix = '#'.repeat(level) + ' ';
  // get current line, check prefix, toggle
}
```

## Keyboard shortcuts — binding pattern
```javascript
keymap.of([
  { key: 'Mod-b', run: view => wrapSelection(view, '**') },
  { key: 'Mod-i', run: view => wrapSelection(view, '_') },
  { key: 'Mod-1', run: view => toggleHeadingPrefix(view, 1) },
  // Mod = Cmd on Mac, Ctrl on Win/Linux — CM6 handles this automatically
])
```

## Vim / Emacs keybindings (Pro — Sprint 2)
```javascript
// Pro gate check before loading
import { vim } from '@codemirror/vim';
if (isPro && prefs.keybindings === 'vim') {
  extensions.push(vim());
}
// :w → dispatches write-file IPC
// :q → closes current tab
// :wq → saves then closes
```

## Smart auto-pairs
```javascript
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
// Add to extensions. Handles: () [] {} "" ''
// Markdown-specific pairs added manually:
// ** → cursor between ** **
// ` → cursor between ` `
// [ → inserts [](  ) with cursor between [ ]
```

## Performance notes
- Decorations MUST be scoped to the CM6 visible viewport using `view.visibleRanges` — never iterate the full document
- On large files (>150K chars): disable inline rendering, show 'Large file' banner, fall back to edit-only mode
- Debounce `onChange` at 800ms for auto-save, 100ms for preview update

## File: renderer/editor.js
Max 400 lines. If approaching limit, extract: keymap definitions → `keymaps.js`, theme setup → `themes.js`.
