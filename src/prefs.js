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
  white: `
    html[data-theme="white"] {
      --color-bg-primary: #ffffff;
      --color-bg-secondary: #f5f5f5;
      --color-text: #1a1a1a;
      --color-text-muted: #888888;
      --color-border: #e8e8e8;
      --selection-bg: rgba(0, 100, 255, 0.15);
    }
    html[data-theme="white"].dark {
      --color-bg-primary: #0d0d0d;
      --color-bg-secondary: #141414;
      --color-text: #e8e8e8;
      --color-text-muted: #555555;
      --color-border: #222222;
      --selection-bg: rgba(255, 255, 255, 0.15);
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
    html[data-theme="sepia"].dark {
      --color-bg-primary: #1e1208;
      --color-bg-secondary: #160d04;
      --color-text: #d4b896;
      --color-text-muted: #7a5a3a;
      --color-border: #2e1e10;
      --selection-bg: rgba(212, 184, 150, 0.25);
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
  // Never default to dark — must be explicitly set to true
  const isDark = prefs.darkMode === true ? true : false;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  await applyEditorTheme(prefs.editorTheme || 'white');
}

module.exports = { loadPrefs, applyFontSize, applyLineNumbers, applyEditorTheme, loadEditorTheme };
