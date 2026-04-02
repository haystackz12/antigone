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
  midnight: `
    html[data-theme="midnight"] {
      --color-bg-primary: #0d0d0d;
      --color-bg-secondary: #141414;
      --color-text: #e0e0e0;
      --color-text-muted: #555555;
      --color-border: #222222;
      --selection-bg: rgba(255, 255, 255, 0.15);
      --focus-dim-opacity: 0.6;
      --syntax-heading: #ffffff;
      --syntax-bold: #ffffff;
      --syntax-italic: #cccccc;
      --syntax-code: #a8d8a8;
      --syntax-code-bg: #1a1a1a;
      --syntax-link: #7eb8f7;
      --syntax-blockquote: #888888;
      --syntax-marker: #444444;
      --syntax-list-marker: #a8d8a8;
      --syntax-strikethrough: #c46060;
      --preview-heading: #ffffff;
    }
    html[data-theme="midnight"] #preview-content { color: #e0e0e0; }
    html[data-theme="midnight"] #preview-content h1,
    html[data-theme="midnight"] #preview-content h2,
    html[data-theme="midnight"] #preview-content h3,
    html[data-theme="midnight"] #preview-content h4,
    html[data-theme="midnight"] #preview-content h5,
    html[data-theme="midnight"] #preview-content h6 { color: #ffffff; }
    html[data-theme="midnight"] #preview-content a { color: #7eb8f7; }
    html[data-theme="midnight"] #preview-content strong { color: #ffffff; }
    html[data-theme="midnight"] #preview-content code { background: #1a1a1a; color: #a8d8a8; border-radius: 3px; padding: 1px 4px; }
    html[data-theme="midnight"] #preview-content pre { background: #1a1a1a; border: 1px solid #222222; border-radius: 6px; padding: 12px; }
    html[data-theme="midnight"] #preview-content pre code { background: none; color: #a8d8a8; padding: 0; }
    html[data-theme="midnight"] #preview-content table { border-color: #222222; }
    html[data-theme="midnight"] #preview-content th { background: #1a1a1a; color: #ffffff; border-color: #222222; }
    html[data-theme="midnight"] #preview-content td { background: #0d0d0d; color: #e0e0e0; border-color: #222222; }
    html[data-theme="midnight"] #preview-content tr:nth-child(even) td { background: #111111; }
    html[data-theme="midnight"] #preview-content blockquote { border-left-color: #333333; color: #aaaaaa; }
    html[data-theme="midnight"] #preview-content hr { border-color: #222222; }
    html[data-theme="midnight"] .fmt-btn { color: #555555; }
    html[data-theme="midnight"] .fmt-btn:hover { background: #1a1a1a; color: #e0e0e0; }
    html[data-theme="midnight"] .fmt-group { background: #0d0d0d; border-color: #222222; }
    html[data-theme="midnight"] .rail-btn { color: #444444; }
    html[data-theme="midnight"] .rail-btn:hover { background: #1a1a1a; color: #e0e0e0; }
    html[data-theme="midnight"] .cm-gutters { color: #333333 !important; }
    html[data-theme="midnight"] .cm-cursor { border-left-color: #e0e0e0 !important; }
    html[data-theme="midnight"] .cm-activeLine { background: rgba(255,255,255,0.03) !important; }
    html[data-theme="midnight"] .cm-activeLineGutter { background: rgba(255,255,255,0.03) !important; }
    html[data-theme="midnight"] #tabbar { background: #0a0a0a !important; border-bottom-color: #1a1a1a !important; }
    html[data-theme="midnight"] .tab { color: #555555 !important; background: transparent !important; border-color: transparent !important; }
    html[data-theme="midnight"] .tab--active { color: #e0e0e0 !important; background: #141414 !important; border-bottom: 2px solid #555555 !important; }
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
