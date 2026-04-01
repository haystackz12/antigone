// src/toolbar.js
// Toolbar formatting commands: bold, italic, strike, code, link, headings.
// Image paste from clipboard.
// All commands operate on the CM6 EditorView obtained via getView().

'use strict';

let getView = null;
let getCurrentPath = null;

function configure(opts) {
  getView = opts.getView;
  getCurrentPath = opts.getCurrentPath;
}

// ─── Wrap/unwrap selection with symmetric markers ────────────────────────────

function wrapSelection(marker) {
  const view = getView();
  if (!view) return false;
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);

  if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= marker.length * 2) {
    // Unwrap
    view.dispatch({
      changes: { from, to, insert: selected.slice(marker.length, -marker.length) },
      selection: { anchor: from, head: from + selected.length - marker.length * 2 },
    });
  } else {
    // Wrap
    view.dispatch({
      changes: { from, to, insert: `${marker}${selected}${marker}` },
      selection: { anchor: from + marker.length, head: to + marker.length },
    });
  }
  view.focus();
  return true;
}

// ─── Toggle heading prefix on current line ───────────────────────────────────

function toggleHeadingPrefix(level) {
  const view = getView();
  if (!view) return false;
  const { head } = view.state.selection.main;
  const line = view.state.doc.lineAt(head);
  const prefix = '#'.repeat(level) + ' ';
  const lineText = line.text;

  // Check if line already has this heading level
  if (lineText.startsWith(prefix)) {
    // Remove prefix
    view.dispatch({
      changes: { from: line.from, to: line.from + prefix.length, insert: '' },
    });
  } else {
    // Remove any existing heading prefix first
    const match = lineText.match(/^#{1,6}\s/);
    const removeLen = match ? match[0].length : 0;
    view.dispatch({
      changes: { from: line.from, to: line.from + removeLen, insert: prefix },
    });
  }
  view.focus();
  return true;
}

// ─── Insert link ─────────────────────────────────────────────────────────────

function insertLink() {
  const view = getView();
  if (!view) return false;
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);

  if (selected.startsWith('[') && selected.includes('](')) {
    // Already a link — unwrap to just the text
    const textMatch = selected.match(/^\[(.+?)\]\(.*\)$/);
    if (textMatch) {
      view.dispatch({
        changes: { from, to, insert: textMatch[1] },
      });
      view.focus();
      return true;
    }
  }

  const linkText = selected || 'link text';
  const insert = `[${linkText}](url)`;
  view.dispatch({
    changes: { from, to, insert },
    // Place cursor inside the url placeholder
    selection: { anchor: from + linkText.length + 3, head: from + linkText.length + 6 },
  });
  view.focus();
  return true;
}

// ─── Image paste from clipboard ──────────────────────────────────────────────

function setupImagePaste() {
  document.addEventListener('paste', async (e) => {
    const view = getView();
    if (!view) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (!item.type.startsWith('image/')) continue;

      e.preventDefault();
      const blob = item.getAsFile();
      if (!blob) return;

      const filePath = getCurrentPath();
      if (!filePath) return; // Can't save image without a file path context

      const buffer = await blob.arrayBuffer();
      const ext = item.type.split('/')[1] === 'jpeg' ? 'jpg' : item.type.split('/')[1];
      const timestamp = Date.now();
      const filename = `image-${timestamp}.${ext}`;

      const result = await window.api.saveImage(filePath, filename, Array.from(new Uint8Array(buffer)));
      if (!result || !result.ok) return;

      // Insert markdown image reference at cursor
      const pos = view.state.selection.main.head;
      const ref = `![](${result.relativePath})`;
      view.dispatch({
        changes: { from: pos, to: pos, insert: ref },
        selection: { anchor: pos + 2, head: pos + 2 }, // cursor inside alt text brackets
      });
      view.focus();
      return; // Only handle first image
    }
  });
}

// ─── Wire toolbar buttons ────────────────────────────────────────────────────

function setupButtons() {
  const actions = {
    bold:   () => wrapSelection('**'),
    italic: () => wrapSelection('*'),
    strike: () => wrapSelection('~~'),
    code:   () => wrapSelection('`'),
    link:   () => insertLink(),
    h1:     () => toggleHeadingPrefix(1),
    h2:     () => toggleHeadingPrefix(2),
    h3:     () => toggleHeadingPrefix(3),
  };

  document.querySelectorAll('[data-action]').forEach(btn => {
    const action = btn.dataset.action;
    if (actions[action]) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        actions[action]();
      });
    }
  });
}

// ─── Keyboard shortcuts (global fallback for when CM6 doesn't have focus) ───

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    if (e.key === 'b') { e.preventDefault(); wrapSelection('**'); }
    if (e.key === 'i') { e.preventDefault(); wrapSelection('*'); }
    if (e.key === 'k') { e.preventDefault(); insertLink(); }
  });
}

// ─── View mode toggles ──────────────────────────────────────────────────────

function setViewMode(mode) {
  const workspace = document.getElementById('workspace');
  const editor  = document.getElementById('editor-pane');
  const preview = document.getElementById('preview-pane');
  const resizer = document.getElementById('split-resize');

  if (mode === 'editor') {
    if (editor)  { editor.style.display = ''; editor.style.flex = '1'; editor.style.width = ''; }
    if (preview) preview.style.display = 'none';
    if (resizer) resizer.style.display = 'none';
  } else if (mode === 'preview') {
    if (editor)  editor.style.display = 'none';
    if (preview) { preview.style.display = ''; preview.style.flex = '1'; preview.style.width = ''; }
    if (resizer) resizer.style.display = 'none';
  } else {
    // Split — reset to flex:1 for 50/50
    if (editor)  { editor.style.display = ''; editor.style.flex = '1'; editor.style.width = ''; }
    if (preview) { preview.style.display = ''; preview.style.flex = '1'; preview.style.width = ''; }
    if (resizer) resizer.style.display = '';
  }

  document.documentElement.dataset.panel = mode;
  const buttons = document.querySelectorAll('#toolbar-view-toggles .toolbar-btn');
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === mode)));
}

function setupViewToggles() {
  document.querySelectorAll('#toolbar-view-toggles .toolbar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.view;
      if (!mode) return;
      setViewMode(mode);
      window.api.setPrefs({ viewMode: mode });
    });
  });
}

// ─── Split pane resizer ──────────────────────────────────────────────────────

function setupResizer() {
  const resizer = document.getElementById('split-resize');
  const editorPane = document.getElementById('editor-pane');
  const previewPane = document.getElementById('preview-pane');
  if (!resizer || !editorPane || !previewPane) return;

  let isResizing = false;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const workspace = document.getElementById('workspace');
    const rect = workspace.getBoundingClientRect();
    const iconRailWidth = 52;
    const rightPanel = document.getElementById('right-panel');
    const rpWidth = (rightPanel && !rightPanel.hidden) ? 220 : 0;
    const available = rect.width - iconRailWidth - rpWidth - 5;
    const offset = e.clientX - rect.left - iconRailWidth;
    const editorW = Math.max(200, Math.min(available - 200, offset));
    const previewW = available - editorW;
    editorPane.style.flex = 'none';
    editorPane.style.width = editorW + 'px';
    previewPane.style.flex = 'none';
    previewPane.style.width = previewW + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  resizer.addEventListener('dblclick', () => {
    editorPane.style.flex = '1';
    editorPane.style.width = '';
    previewPane.style.flex = '1';
    previewPane.style.width = '';
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  setupButtons();
  setupKeyboardShortcuts();
  setupImagePaste();
  setupViewToggles();
  setupResizer();
}

module.exports = { configure, init, setViewMode, wrapSelection, toggleHeadingPrefix, insertLink };
