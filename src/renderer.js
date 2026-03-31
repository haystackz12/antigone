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
const toc        = require('./toc.js');
const preview    = require('./preview.js');
const tabs       = require('./tabs.js');

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

  // Always launch to empty state (DEC-023 — session restore is opt-in, not default)
  // Clear any stale session data from electron-store
  window.api.setPrefs({ session: null });
  tabs.openNewTab();

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
