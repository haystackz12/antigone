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
