// src/prefs.js
// Preference loading, theme toggle, font size, line numbers, editor themes.
// Themes use inline <style> injection — no external CSS file loading needed.

'use strict';

// ─── Basic prefs ─────────────────────────────────────────────────────────────

async function loadPrefs() {
  const prefs = await window.api.getPrefs();
  applyFontSize(prefs.fontSize || 16);
  applyLineNumbers(prefs.lineNumbers !== false);
  return prefs;
}

function applyFontSize(size) {
  document.documentElement.style.setProperty('--editor-font-size', `${size}px`);
}

function applyLineNumbers(show) {
  document.documentElement.classList.toggle('hide-line-numbers', !show);
}

// ─── Editor themes (inline CSS) ──────────────────────────────────────────────

const THEME_CSS = {
  default: `
    html[data-theme="default"] .cm-editor, html[data-theme="default"] .cm-content,
    html[data-theme="default"] .cm-line, html[data-theme="default"] #editor-pane,
    html[data-theme="default"] #preview-pane { background:#ffffff !important; color:#1a1a1a !important; }
    html[data-theme="default"] #titlebar, html[data-theme="default"] #format-strip,
    html[data-theme="default"] #tabbar, html[data-theme="default"] #statusbar,
    html[data-theme="default"] #icon-rail { background:#f5f5f5 !important; border-color:#e8e8e8 !important; }
    html[data-theme="default"] .cm-gutters { background:#f5f5f5 !important; border-color:#e8e8e8 !important; color:#bbb !important; }
    html[data-theme="default"] .fmt-group { background:#fff; border-color:#e8e8e8; }
    html[data-theme="default"].dark .cm-editor, html[data-theme="default"].dark .cm-content,
    html[data-theme="default"].dark .cm-line, html[data-theme="default"].dark #editor-pane,
    html[data-theme="default"].dark #preview-pane { background:#0d0d0d !important; color:#e8e8e8 !important; }
    html[data-theme="default"].dark #titlebar, html[data-theme="default"].dark #format-strip,
    html[data-theme="default"].dark #tabbar, html[data-theme="default"].dark #statusbar,
    html[data-theme="default"].dark #icon-rail { background:#141414 !important; border-color:#222 !important; }
    html[data-theme="default"].dark .cm-gutters { background:#141414 !important; border-color:#222 !important; color:#333 !important; }
    html[data-theme="default"].dark .fmt-btn, html[data-theme="default"].dark .rail-btn { color:#666; }
    html[data-theme="default"].dark .fmt-btn:hover { background:#222 !important; color:#e8e8e8; }
    html[data-theme="default"].dark .fmt-group { background:#0d0d0d; border-color:#222; }
    html[data-theme="default"].dark #preview-content { color:#e8e8e8; }
    html[data-theme="default"].dark #preview-content h1, html[data-theme="default"].dark #preview-content h2,
    html[data-theme="default"].dark #preview-content h3 { color:#fff; }
    html[data-theme="default"].dark .cm-cursor { border-left-color:#e8e8e8 !important; }
  `,
  sepia: `
    html[data-theme="sepia"] .cm-editor, html[data-theme="sepia"] .cm-content,
    html[data-theme="sepia"] .cm-line, html[data-theme="sepia"] #editor-pane,
    html[data-theme="sepia"] #preview-pane { background:#f4ecd8 !important; color:#3c2a1e !important; }
    html[data-theme="sepia"] #titlebar, html[data-theme="sepia"] #format-strip,
    html[data-theme="sepia"] #tabbar, html[data-theme="sepia"] #statusbar,
    html[data-theme="sepia"] #icon-rail { background:#ece0c8 !important; border-color:#d4c8b0 !important; }
    html[data-theme="sepia"] .cm-gutters { background:#ece0c8 !important; border-color:#d4c8b0 !important; color:#c4a882 !important; }
    html[data-theme="sepia"] .fmt-btn { color:#8b7355; }
    html[data-theme="sepia"] .fmt-btn:hover { background:#ddd0b8 !important; color:#2a1a0e; }
    html[data-theme="sepia"] .fmt-group { background:#f4ecd8; border-color:#d4c8b0; }
    html[data-theme="sepia"] #preview-content { color:#3c2a1e; }
    html[data-theme="sepia"] #preview-content h1, html[data-theme="sepia"] #preview-content h2,
    html[data-theme="sepia"] #preview-content h3 { color:#2a1a0e; }
    html[data-theme="sepia"] #preview-content a { color:#8b5a2b; }
    html[data-theme="sepia"].dark .cm-editor, html[data-theme="sepia"].dark .cm-content,
    html[data-theme="sepia"].dark .cm-line, html[data-theme="sepia"].dark #editor-pane,
    html[data-theme="sepia"].dark #preview-pane { background:#1e1208 !important; color:#c8a882 !important; }
    html[data-theme="sepia"].dark #titlebar, html[data-theme="sepia"].dark #format-strip,
    html[data-theme="sepia"].dark #tabbar, html[data-theme="sepia"].dark #statusbar,
    html[data-theme="sepia"].dark #icon-rail { background:#160d04 !important; border-color:#2e1e10 !important; }
    html[data-theme="sepia"].dark .cm-gutters { background:#160d04 !important; border-color:#2e1e10 !important; color:#5a3a20 !important; }
    html[data-theme="sepia"].dark .fmt-btn { color:#6a4a30; }
    html[data-theme="sepia"].dark .fmt-btn:hover { background:#2e1e10 !important; color:#c8a882; }
    html[data-theme="sepia"].dark .fmt-group { background:#1e1208; border-color:#2e1e10; }
    html[data-theme="sepia"].dark #preview-content { color:#c8a882; }
    html[data-theme="sepia"].dark #preview-content h1, html[data-theme="sepia"].dark #preview-content h2,
    html[data-theme="sepia"].dark #preview-content h3 { color:#e0c090; }
    html[data-theme="sepia"].dark .cm-cursor { border-left-color:#c8a882 !important; }
  `,
  typewriter: `
    html[data-theme="typewriter"] .cm-editor, html[data-theme="typewriter"] .cm-content,
    html[data-theme="typewriter"] .cm-line, html[data-theme="typewriter"] #editor-pane,
    html[data-theme="typewriter"] #preview-pane {
      background:#f5f0e8 !important; color:#3d2b1f !important;
      font-family:'Courier New',Courier,monospace !important; font-size:15px !important;
    }
    html[data-theme="typewriter"] #titlebar, html[data-theme="typewriter"] #format-strip,
    html[data-theme="typewriter"] #tabbar, html[data-theme="typewriter"] #statusbar,
    html[data-theme="typewriter"] #icon-rail { background:#ede8e0 !important; border-color:#d4cfc7 !important; }
    html[data-theme="typewriter"] .cm-gutters { background:#ede8e0 !important; border-color:#d4cfc7 !important; color:#b8a898 !important; }
    html[data-theme="typewriter"] .fmt-btn { color:#8a7060; }
    html[data-theme="typewriter"] .fmt-btn:hover { background:#ddd8d0 !important; color:#2a1a0f; }
    html[data-theme="typewriter"] .fmt-group { background:#f5f0e8; border-color:#d4cfc7; }
    html[data-theme="typewriter"] #preview-content { color:#3d2b1f; font-family:'Courier New',Courier,monospace; font-size:15px; }
    html[data-theme="typewriter"] #preview-content h1, html[data-theme="typewriter"] #preview-content h2,
    html[data-theme="typewriter"] #preview-content h3 { color:#2a1a0f; font-family:'Courier New',Courier,monospace; }
    html[data-theme="typewriter"].dark .cm-editor, html[data-theme="typewriter"].dark .cm-content,
    html[data-theme="typewriter"].dark .cm-line, html[data-theme="typewriter"].dark #editor-pane,
    html[data-theme="typewriter"].dark #preview-pane {
      background:#1a1510 !important; color:#c8a878 !important;
      font-family:'Courier New',Courier,monospace !important;
    }
    html[data-theme="typewriter"].dark #titlebar, html[data-theme="typewriter"].dark #format-strip,
    html[data-theme="typewriter"].dark #tabbar, html[data-theme="typewriter"].dark #statusbar,
    html[data-theme="typewriter"].dark #icon-rail { background:#120f0a !important; border-color:#2a2018 !important; }
    html[data-theme="typewriter"].dark .cm-gutters { background:#120f0a !important; border-color:#2a2018 !important; color:#4a3828 !important; }
    html[data-theme="typewriter"].dark .fmt-btn { color:#6a5040; }
    html[data-theme="typewriter"].dark .fmt-btn:hover { background:#2a2018 !important; color:#c8a878; }
    html[data-theme="typewriter"].dark .fmt-group { background:#1a1510; border-color:#2a2018; }
    html[data-theme="typewriter"].dark #preview-content { color:#c8a878; font-family:'Courier New',Courier,monospace; }
    html[data-theme="typewriter"].dark .cm-cursor { border-left-color:#c8a878 !important; }
  `,
  forest: `
    html[data-theme="forest"] .cm-editor, html[data-theme="forest"] .cm-content,
    html[data-theme="forest"] .cm-line, html[data-theme="forest"] #editor-pane,
    html[data-theme="forest"] #preview-pane { background:#f0f4f0 !important; color:#1a3020 !important; }
    html[data-theme="forest"] #titlebar, html[data-theme="forest"] #format-strip,
    html[data-theme="forest"] #tabbar, html[data-theme="forest"] #statusbar,
    html[data-theme="forest"] #icon-rail { background:#e4ece4 !important; border-color:#c8d8c8 !important; }
    html[data-theme="forest"] .cm-gutters { background:#e4ece4 !important; border-color:#c8d8c8 !important; color:#7a9a7a !important; }
    html[data-theme="forest"] .fmt-btn { color:#4a7a4a; }
    html[data-theme="forest"] .fmt-btn:hover { background:#d4e4d4 !important; color:#1a3020; }
    html[data-theme="forest"] .fmt-group { background:#f0f4f0; border-color:#c8d8c8; }
    html[data-theme="forest"] #preview-content { color:#1a3020; }
    html[data-theme="forest"] #preview-content h1, html[data-theme="forest"] #preview-content h2,
    html[data-theme="forest"] #preview-content h3 { color:#0d2010; }
    html[data-theme="forest"] #preview-content a { color:#2d7a2d; }
    html[data-theme="forest"].dark .cm-editor, html[data-theme="forest"].dark .cm-content,
    html[data-theme="forest"].dark .cm-line, html[data-theme="forest"].dark #editor-pane,
    html[data-theme="forest"].dark #preview-pane { background:#0d1a0f !important; color:#a8c5a0 !important; }
    html[data-theme="forest"].dark #titlebar, html[data-theme="forest"].dark #format-strip,
    html[data-theme="forest"].dark #tabbar, html[data-theme="forest"].dark #statusbar,
    html[data-theme="forest"].dark #icon-rail { background:#111d12 !important; border-color:#1e3020 !important; }
    html[data-theme="forest"].dark .cm-gutters { background:#111d12 !important; border-color:#1e3020 !important; color:#2e5030 !important; }
    html[data-theme="forest"].dark .fmt-btn, html[data-theme="forest"].dark .rail-btn { color:#4a7a4a; }
    html[data-theme="forest"].dark .fmt-btn:hover { background:#1e3020 !important; color:#a8c5a0; }
    html[data-theme="forest"].dark .fmt-group { background:#0d1a0f; border-color:#1e3020; }
    html[data-theme="forest"].dark #preview-content { color:#a8c5a0; }
    html[data-theme="forest"].dark #preview-content h1, html[data-theme="forest"].dark #preview-content h2,
    html[data-theme="forest"].dark #preview-content h3 { color:#c8e0c0; }
    html[data-theme="forest"].dark #preview-content a { color:#7db87d; }
    html[data-theme="forest"].dark .cm-cursor { border-left-color:#a8c5a0 !important; }
  `,
};

let themeStyleEl = null;

async function applyEditorTheme(themeName) {
  const name = themeName || 'default';
  if (themeStyleEl) { themeStyleEl.remove(); themeStyleEl = null; }
  document.documentElement.setAttribute('data-theme', name);
  if (THEME_CSS[name]) {
    themeStyleEl = document.createElement('style');
    themeStyleEl.id = 'theme-style';
    themeStyleEl.textContent = THEME_CSS[name];
    document.head.appendChild(themeStyleEl);
  }
  await window.api.setPrefs({ editorTheme: name });
}

async function loadEditorTheme() {
  const prefs = await window.api.getPrefs();
  if (prefs.darkMode) document.documentElement.classList.add('dark');
  await applyEditorTheme(prefs.editorTheme || 'default');
}

module.exports = { loadPrefs, applyFontSize, applyLineNumbers, applyEditorTheme, loadEditorTheme };
