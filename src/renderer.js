// src/renderer.js
// Webpack entry point for the renderer process.

'use strict';

require('./styles.css');
const { init: initEditor, applyTheme: applyEditorTheme } = require('./editor.js');
const { loadPrefs, toggleTheme, applyTheme } = require('./prefs.js');
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

document.addEventListener('DOMContentLoaded', async () => {
  // Apply stored theme before editor mounts to prevent flash
  const prefs = await loadPrefs();
  initEditor();
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

  // Always launch to empty state (DEC-023 — session restore is opt-in, not default)
  window.api.setPrefs({ session: null });

  // Clean up ALL stale recovery files from previous sessions on launch
  const staleRecovery = await window.api.listRecovery();
  if (staleRecovery && staleRecovery.length > 0) {
    for (const f of staleRecovery) {
      await window.api.deleteRecovery(f.tabId).catch(() => {});
    }
  }

  tabs.openNewTab();

  // Wire native menu commands
  const editor = require('./editor.js');
  window.api.onMenuNewFile(() => editor.newFile());
  window.api.onMenuOpenFile(() => editor.openFileDialog());
  window.api.onMenuSave(() => editorSave.saveFile(editor.getCurrentPath()));
  window.api.onMenuSaveAs(() => editorSave.saveFileAs());

  // Preferences UI
  prefsUi.configure({
    applyEditorTheme: applyEditorTheme,
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

  // Apply CM6 theme to match
  const isDark = document.documentElement.classList.contains('dark');
  applyEditorTheme(isDark);

  // Theme toggle button
  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', async () => {
      await toggleTheme();
      const dark = document.documentElement.classList.contains('dark');
      applyEditorTheme(dark);
    });
  }

  // Listen for OS theme changes
  window.api.onNativeThemeUpdated((data) => {
    const storedTheme = prefs.theme;
    if (!storedTheme || storedTheme === 'system') {
      applyTheme('system');
      applyEditorTheme(data.shouldUseDarkColors);
    }
  });
});
