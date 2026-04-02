// src/prefs.js
// Preference loading, theme toggle, font size, line numbers, editor themes.
// Themes use inline <style> injection — no external CSS file loading needed.
// Dark mode removed for v1.0 (DEC-032). Light-only.

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

// ─── Editor themes (CSS variables only, light mode only) ────────────────────

const THEME_CSS = {
  white: `
    html[data-theme="white"] {
      --color-bg-primary: #ffffff;
      --color-bg-secondary: #f5f5f5;
      --color-text: #1a1a1a;
      --color-text-muted: #888888;
      --color-border: #e8e8e8;
      --selection-bg: rgba(0, 100, 255, 0.15);
    }
  `,
  parchment: `
    html[data-theme="parchment"] {
      --color-bg-primary: #f5f0e8;
      --color-bg-secondary: #ede8e0;
      --color-text: #3d2b1f;
      --color-text-muted: #8a7060;
      --color-border: #d4cfc7;
      --selection-bg: rgba(61, 43, 31, 0.15);
    }
  `,
  sepia: `
    html[data-theme="sepia"] {
      --color-bg-primary: #f4ecd8;
      --color-bg-secondary: #ece0c8;
      --color-text: #3c2a1e;
      --color-text-muted: #8b7355;
      --color-border: #d4c8b0;
      --selection-bg: rgba(139, 90, 43, 0.2);
    }
  `,
};

let themeStyleEl = null;

async function applyEditorTheme(themeName) {
  const name = themeName || 'white';
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
  // No dark mode — light only for v1.0 (DEC-032)
  document.documentElement.classList.remove('dark');
  await applyEditorTheme(prefs.editorTheme || 'white');
}

module.exports = { loadPrefs, applyFontSize, applyLineNumbers, applyEditorTheme, loadEditorTheme };
