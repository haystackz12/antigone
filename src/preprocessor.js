// src/preprocessor.js
// Preprocessor: pipes Markdown through a user-configured shell command.
// Output replaces preview content. Pro feature (stub — always allowed in dev).
// Architecture: child_process runs in main.js via IPC, 5s hard timeout.

'use strict';

let getView = null;
let getCurrentPath = null;
let preprocessorCmd = null; // e.g., 'pandoc -f markdown -t html'

function configure(opts) {
  getView = opts.getView;
  getCurrentPath = opts.getCurrentPath;
}

// ─── Pro gate (stub — always allows in dev) ──────────────────────────────────

function isPro() {
  // Stub: always true in development. Real gate wired in Sprint 3 Day 14.
  return true;
}

// ─── Set preprocessor command ────────────────────────────────────────────────

function setCommand(cmd) {
  preprocessorCmd = cmd && cmd.trim() ? cmd.trim() : null;
}

function getCommand() {
  return preprocessorCmd;
}

// ─── Run preprocessor ───────────────────────────────────────────────────────

async function runPreprocessor() {
  if (!isPro()) return null;
  if (!preprocessorCmd) return null;

  const view = getView();
  if (!view) return null;

  const content = view.state.doc.toString();
  const filePath = getCurrentPath() || '';

  try {
    const result = await window.api.runPreprocessor(preprocessorCmd, content, filePath);
    if (result.ok) {
      return result.output;
    } else {
      console.error('[preprocessor] Error:', result.error);
      return null;
    }
  } catch (err) {
    console.error('[preprocessor] IPC error:', err);
    return null;
  }
}

// ─── Wire to preview ─────────────────────────────────────────────────────────
// When a preprocessor is set, intercept editor:change and replace preview
// content with preprocessor output instead of marked.js render.

function init() {
  // Load saved preprocessor command from prefs
  window.api.getPrefs().then(prefs => {
    if (prefs.preprocessorCmd) {
      setCommand(prefs.preprocessorCmd);
    }
  });

  // Listen for editor changes — if preprocessor is set, run it
  window.addEventListener('editor:change', async () => {
    if (!preprocessorCmd) return;

    const output = await runPreprocessor();
    if (output === null) return;

    const el = document.getElementById('preview-content');
    if (el) {
      // Preprocessor output is treated as HTML — sanitize it
      const DOMPurify = require('dompurify');
      el.innerHTML = DOMPurify.sanitize(output, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['target', 'data-line'],
        ADD_TAGS: ['div'],
      });
    }
  });
}

module.exports = { configure, init, setCommand, getCommand, runPreprocessor };
