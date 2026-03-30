// src/renderer.js
// Webpack entry point for the renderer process.

'use strict';

require('./styles.css');
const { init: initEditor, applyTheme: applyEditorTheme } = require('./editor.js');
const { loadPrefs, toggleTheme, applyTheme } = require('./prefs.js');
const editorSave = require('./editor-save.js');

document.addEventListener('DOMContentLoaded', async () => {
  // Apply stored theme before editor mounts to prevent flash
  const prefs = await loadPrefs();
  initEditor();
  editorSave.initFromPrefs(prefs);

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
