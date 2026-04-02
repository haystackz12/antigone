// src/prefs-ui.js
// Preferences modal UI. Changes persist immediately to electron-store
// and apply in real-time via prefs.js + editor.js reconfiguration.

'use strict';

const { applyFontSize, applyLineNumbers } = require('./prefs.js');

let isOpen = false;
let applyEditorTheme = null;
let setVimMode = null;

function configure(opts) {
  applyEditorTheme = opts.applyEditorTheme;
  setVimMode = opts.setVimMode;
}

function toggle() {
  isOpen ? close() : open();
}

async function open() {
  if (isOpen) return;
  isOpen = true;

  const prefs = await window.api.getPrefs();

  const overlay = document.createElement('div');
  overlay.id = 'prefs-overlay';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const panel = document.createElement('div');
  panel.id = 'prefs-panel';
  panel.innerHTML = `
    <h2 class="prefs-title">Preferences</h2>
    <div class="prefs-group">
      <label class="prefs-label">Theme</label>
      <select id="pref-theme" class="prefs-select">
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
    <div class="prefs-group">
      <label class="prefs-label">Font Size</label>
      <input type="range" id="pref-font-size" min="12" max="24" step="1" class="prefs-range">
      <span id="pref-font-size-val" class="prefs-range-val"></span>
    </div>
    <div class="prefs-group">
      <label class="prefs-label">
        <input type="checkbox" id="pref-line-numbers"> Show Line Numbers
      </label>
    </div>
    <div class="prefs-group">
      <label class="prefs-label">
        <input type="checkbox" id="pref-auto-save"> Auto-Save
      </label>
    </div>
    <div class="prefs-group">
      <label class="prefs-label">Keybindings</label>
      <select id="pref-keybindings" class="prefs-select">
        <option value="normal">Normal</option>
        <option value="vim">Vim</option>
      </select>
    </div>
    <div class="prefs-group prefs-group--full">
      <label class="prefs-label">Editor Theme</label>
      <div id="theme-picker">
        <div class="theme-card" data-theme="default"><div class="theme-preview" style="background:#fff;color:#1a1a1a">Aa</div><div class="theme-name">Default</div><div class="theme-tier">Free</div></div>
        <div class="theme-card" data-theme="sepia"><div class="theme-preview" style="background:#f4ecd8;color:#3c2a1e">Aa</div><div class="theme-name">Sepia</div><div class="theme-tier">Free</div></div>
        <div class="theme-card" data-theme="typewriter"><div class="theme-preview" style="background:#f5f0e8;color:#3d2b1f;font-family:'Courier New',monospace">Aa</div><div class="theme-name">Typewriter</div><div class="theme-tier pro">Pro</div></div>
        <div class="theme-card" data-theme="forest"><div class="theme-preview" style="background:#f0f4f0;color:#1a3020">Aa</div><div class="theme-name">Forest</div><div class="theme-tier pro">Pro</div></div>
      </div>
      <p class="pref-note">Each theme adapts to light/dark mode via the ☽ toggle.</p>
    </div>
    <button id="pref-close" class="prefs-close-btn">Done</button>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Set current values
  const themeSelect = document.getElementById('pref-theme');
  const fontRange   = document.getElementById('pref-font-size');
  const fontVal     = document.getElementById('pref-font-size-val');
  const lineNumsCb  = document.getElementById('pref-line-numbers');
  const autoSaveCb  = document.getElementById('pref-auto-save');
  const keybindSel  = document.getElementById('pref-keybindings');
  const closeBtn    = document.getElementById('pref-close');

  themeSelect.value = prefs.theme || 'system';
  fontRange.value   = String(prefs.fontSize || 16);
  fontVal.textContent = `${prefs.fontSize || 16}px`;
  lineNumsCb.checked = prefs.lineNumbers !== false;
  autoSaveCb.checked = !!prefs.autoSave;
  keybindSel.value   = prefs.keybindings || 'normal';

  // Wire change handlers
  themeSelect.addEventListener('change', async () => {
    const val = themeSelect.value;
    await window.api.setPrefs({ theme: val });
    await window.api.setNativeTheme(val);
    if (applyEditorTheme) {
      applyEditorTheme(document.documentElement.classList.contains('dark'));
    }
  });

  fontRange.addEventListener('input', async () => {
    const size = parseInt(fontRange.value, 10);
    fontVal.textContent = `${size}px`;
    applyFontSize(size);
    await window.api.setPrefs({ fontSize: size });
  });

  lineNumsCb.addEventListener('change', async () => {
    applyLineNumbers(lineNumsCb.checked);
    await window.api.setPrefs({ lineNumbers: lineNumsCb.checked });
  });

  autoSaveCb.addEventListener('change', async () => {
    await window.api.setPrefs({ autoSave: autoSaveCb.checked });
    const editorSave = require('./editor-save.js');
    editorSave.initFromPrefs({ autoSave: autoSaveCb.checked });
  });

  keybindSel.addEventListener('change', async () => {
    const val = keybindSel.value;
    await window.api.setPrefs({ keybindings: val });
    if (setVimMode) setVimMode(val === 'vim');
  });

  // Theme picker
  const { applyEditorTheme: applyVisualTheme } = require('./prefs.js');
  const currentEditorTheme = prefs.editorTheme || 'typewriter';
  document.querySelectorAll('.theme-card').forEach(card => {
    if (card.dataset.theme === currentEditorTheme) card.classList.add('active');
    card.addEventListener('click', async () => {
      await applyVisualTheme(card.dataset.theme);
      document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  closeBtn.addEventListener('click', close);

  // Escape to close
  document.addEventListener('keydown', onEscape);
}

function onEscape(e) {
  if (e.key === 'Escape') close();
}

function close() {
  if (!isOpen) return;
  isOpen = false;
  const overlay = document.getElementById('prefs-overlay');
  if (overlay) overlay.remove();
  document.removeEventListener('keydown', onEscape);
}

module.exports = { configure, toggle, open, close };
