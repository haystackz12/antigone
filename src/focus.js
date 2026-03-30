// src/focus.js
// Focus mode: dims all CM6 lines except the active one.
// CSS is in styles.css §16 — this module just toggles body.focus-active.
// Toggle via ⌘⇧F or the #btn-focus toolbar button.

'use strict';

let focusActive = false;

function toggle() {
  focusActive = !focusActive;
  document.body.classList.toggle('focus-active', focusActive);

  // Update toolbar button pressed state
  const btn = document.getElementById('btn-focus');
  if (btn) btn.setAttribute('aria-pressed', String(focusActive));

  // Show/hide the vignette overlay
  const overlay = document.getElementById('focus-overlay');
  if (overlay) overlay.hidden = !focusActive;
}

function init() {
  // Toolbar button
  const btn = document.getElementById('btn-focus');
  if (btn) btn.addEventListener('click', toggle);

  // Global keyboard shortcut (⌘⇧F)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
      e.preventDefault();
      toggle();
    }
  });
}

module.exports = { init, toggle, isActive: () => focusActive };
