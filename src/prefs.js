// src/prefs.js
// Preference loading, theme toggle, font size, line numbers.
// Reads from electron-store via window.api. Applies to DOM before first paint.

'use strict';

async function loadPrefs() {
  const prefs = await window.api.getPrefs();
  applyTheme(prefs.theme || 'system');
  applyFontSize(prefs.fontSize || 16);
  applyLineNumbers(prefs.lineNumbers !== false);
  return prefs;
}

function applyTheme(source) {
  const isDark = source === 'dark' ||
    (source === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('theme-dark', isDark);
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
}

function applyFontSize(size) {
  document.documentElement.style.setProperty('--editor-font-size', `${size}px`);
}

function applyLineNumbers(show) {
  document.documentElement.classList.toggle('hide-line-numbers', !show);
}

async function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  applyTheme(next);
  await window.api.setPrefs({ theme: next });
  await window.api.setNativeTheme(next);
}

// ─── Editor theme (academic, minimal, night, typewriter) ─────────────────────

let editorThemeLink = null;

async function applyEditorTheme(themeName) {
  if (editorThemeLink) { editorThemeLink.remove(); editorThemeLink = null; }
  const name = themeName || 'default';
  document.documentElement.setAttribute('data-theme', name);
  editorThemeLink = document.createElement('link');
  editorThemeLink.rel = 'stylesheet';
  editorThemeLink.href = `themes/${name}.css`;
  document.head.appendChild(editorThemeLink);
  await window.api.setPrefs({ editorTheme: name });
}

async function loadEditorTheme() {
  const prefs = await window.api.getPrefs();
  // Apply dark mode first
  if (prefs.darkMode) {
    document.documentElement.classList.add('dark');
  }
  // Then apply theme
  await applyEditorTheme(prefs.editorTheme || 'default');
}

module.exports = { loadPrefs, applyTheme, applyFontSize, applyLineNumbers, toggleTheme, applyEditorTheme, loadEditorTheme };
