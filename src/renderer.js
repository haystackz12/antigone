// src/renderer.js
// Webpack entry point for the renderer process.

'use strict';

require('./styles.css');
const { init: initEditor } = require('./editor.js');
const { loadPrefs, loadEditorTheme } = require('./prefs.js');
const editorSave = require('./editor-save.js');
const focus      = require('./focus.js');
const wordgoal   = require('./wordgoal.js');
const toolbar    = require('./toolbar.js');
const tags       = require('./tags.js');
const exportMod  = require('./export.js');
const toc        = require('./toc.js');
const preview    = require('./preview.js');
const tabs       = require('./tabs.js');
const prefsUi    = require('./prefs-ui.js');
const iconRail   = require('./icon-rail.js');
const preprocessor = require('./preprocessor.js');

document.addEventListener('DOMContentLoaded', async () => {
  // Apply stored theme before editor mounts to prevent flash
  const prefs = await loadPrefs();

  // Recovery files are checked by checkRecovery() inside initEditor().
  // Do NOT delete them here — they are needed for crash recovery.

  initEditor();
  await loadEditorTheme();
  editorSave.initFromPrefs(prefs);
  focus.init();
  wordgoal.init();
  toolbar.configure({
    getView: require('./editor.js').getView,
    getCurrentPath: require('./editor.js').getCurrentPath,
  });
  toolbar.init();
  // Always launch to editor-only (DEC-024 — view mode resets on launch)
  toolbar.setViewMode('editor');
  tags.configure({ getView: require('./editor.js').getView });
  tags.init();
  toc.configure({ getView: require('./editor.js').getView });
  toc.init();
  preview.init();
  exportMod.configure({
    getView: require('./editor.js').getView,
    getCurrentPath: require('./editor.js').getCurrentPath,
  });
  exportMod.init();
  preprocessor.configure({
    getView: require('./editor.js').getView,
    getCurrentPath: require('./editor.js').getCurrentPath,
  });
  preprocessor.init();
  iconRail.configure({ toggleFocusMode: focus.toggle });
  iconRail.init();

  // Always launch to empty state (DEC-023 — session restore is opt-in, not default)
  window.api.setPrefs({ session: null });

  tabs.openNewTab();

  // Wire native menu commands
  const editor = require('./editor.js');

  // Context-menu info for main process (queried via executeJavaScript).
  // Returns CM6 selection state + spelling info for the word at (x, y).
  window.__antigoneContextInfo = (x, y) => {
    const v = editor.getView();
    if (!v) return { hasSelection: false, spelling: null };

    const hasSelection = !v.state.selection.main.empty;
    let spelling = null;

    // Find the word to spell-check: selected single word, or word at coords
    let wordToCheck = null;
    if (hasSelection) {
      const sel = v.state.sliceDoc(
        v.state.selection.main.from, v.state.selection.main.to);
      if (/^\S+$/.test(sel) && sel.length < 50) wordToCheck = sel;
    }
    if (!wordToCheck && x != null && y != null) {
      const pos = v.posAtCoords({ x, y });
      if (pos != null) {
        const line = v.state.doc.lineAt(pos);
        const col = pos - line.from;
        const text = line.text;
        let s = col, e = col;
        while (s > 0 && /[a-zA-Z']/.test(text[s - 1])) s--;
        while (e < text.length && /[a-zA-Z']/.test(text[e])) e++;
        if (e > s) wordToCheck = text.slice(s, e);
      }
    }

    if (wordToCheck && window.api.isWordMisspelled(wordToCheck)) {
      spelling = {
        word: wordToCheck,
        suggestions: window.api.getWordSuggestions(wordToCheck),
      };
    }
    return { hasSelection, spelling };
  };

  window.api.onMenuNewFile(() => editor.newFile());
  window.api.onMenuOpenFile(() => editor.openFileDialog());
  window.api.onMenuSave(() => editorSave.saveFile(editor.getCurrentPath()));
  window.api.onMenuSaveAs(() => editorSave.saveFileAs());

  // Preferences UI
  prefsUi.configure({
    setVimMode: editor.setVimMode,
  });
  window.api.onMenuPrefs(() => prefsUi.toggle());

  // Wire View menu commands
  window.api.onMenuViewMode((mode) => toolbar.setViewMode(mode));
  window.api.onMenuToggleFocus(() => focus.toggle());
  window.api.onMenuToggleLineNumbers(async () => {
    const current = !document.documentElement.classList.contains('hide-line-numbers');
    const { applyLineNumbers } = require('./prefs.js');
    applyLineNumbers(!current);
    await window.api.setPrefs({ lineNumbers: !current });
  });

  // Apply vim mode from stored prefs
  const storedPrefs = await window.api.getPrefs();
  if (storedPrefs.keybindings === 'vim') editor.setVimMode(true);

  // Wire Find / Replace menu items to CM6 search panel
  const { openSearchPanel } = require('@codemirror/search');
  window.api.onMenuFind(() => {
    const v = editor.getView();
    if (v) openSearchPanel(v);
  });
  window.api.onMenuReplace(() => {
    const v = editor.getView();
    if (v) openSearchPanel(v);
  });

  // Edit commands — menu bar + context menu, all routed through CM6
  const { undo: cm6Undo, redo: cm6Redo } = require('@codemirror/commands');
  window.api.onEditCommand(async (cmd) => {
    const v = editor.getView();
    if (!v) return;
    const { from, to } = v.state.selection.main;

    if (cmd === 'undo') {
      cm6Undo(v);
    } else if (cmd === 'redo') {
      cm6Redo(v);
    } else if (cmd === 'copy') {
      const text = v.state.sliceDoc(from, to);
      if (text) await window.api.clipboardWriteText(text);
    } else if (cmd === 'cut') {
      const text = v.state.sliceDoc(from, to);
      if (text) {
        await window.api.clipboardWriteText(text);
        v.dispatch({ changes: { from, to, insert: '' } });
      }
    } else if (cmd === 'paste') {
      const text = await window.api.clipboardReadText();
      if (text) v.dispatch({ changes: { from, to, insert: text } });
    } else if (cmd === 'selectAll') {
      v.dispatch({ selection: { anchor: 0, head: v.state.doc.length } });
    } else if (cmd === 'copyAsHtml') {
      const text = v.state.sliceDoc(from, to);
      if (text) {
        const html = exportMod.renderToHtml(text);
        await window.api.clipboardWriteHtml(html, text);
      }
    }
    v.focus();
  });

  // Dark mode removed for v1.0 (DEC-032)

  // Spell-check replacement via CM6 (BUG-049)
  window.api.onReplaceMisspelling((word, suggestion, x, y) => {
    const view = editor.getView();
    if (!view) return;
    // posAtCoords takes client/viewport coordinates directly
    const pos = view.posAtCoords({ x, y });
    if (pos == null) return;
    // Expand to word boundaries around the position
    const doc = view.state.doc;
    const line = doc.lineAt(pos);
    const text = line.text;
    const col = pos - line.from;
    let start = col, end = col;
    while (start > 0 && /[a-zA-Z']/.test(text[start - 1])) start--;
    while (end < text.length && /[a-zA-Z']/.test(text[end])) end++;
    const found = text.slice(start, end);
    if (found.toLowerCase() === word.toLowerCase()) {
      view.dispatch({
        changes: { from: line.from + start, to: line.from + end, insert: suggestion },
      });
    }
  });

});
