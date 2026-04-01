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

// ─── Wrap/unwrap: stack-based toggle ─────────────────────────────────────────
// Checks if marker exists at selection boundary (inside or outside).
// If found → remove it. If not found → add it.
// This allows bold+italic stacking: **hello** + I → ***hello***,
// ***hello*** + I → **hello** (removes one * layer).

function wrapSelection(marker) {
  const view = getView();
  if (!view) return false;
  const state = view.state;
  const docLen = state.doc.length;
  const bLen = marker.length;
  const from = Math.max(0, Math.min(state.selection.main.from, docLen));
  const to   = Math.max(0, Math.min(state.selection.main.to, docLen));
  const selected = state.sliceDoc(from, to);

  // Check outside selection boundary
  const outerBefore = state.sliceDoc(Math.max(0, from - bLen), from);
  const outerAfter  = state.sliceDoc(to, Math.min(docLen, to + bLen));
  let outerMatch = outerBefore === marker && outerAfter === marker;

  // For single-char markers, check parity of surrounding marker chars
  // to distinguish * (italic) from ** (bold) outside the selection.
  // **|hello|** → 2 * before cursor = even → not an italic wrap → skip for *
  // ***|hello|*** → 3 * before cursor = odd → italic exists → match for *
  // *|hello|* → 1 * before cursor = odd → italic → match for *
  if (outerMatch && bLen === 1) {
    let outerLeadCount = 0;
    let pos = from - 1;
    while (pos >= 0 && state.sliceDoc(pos, pos + 1) === marker[0]) { outerLeadCount++; pos--; }
    if (outerLeadCount % 2 === 0) outerMatch = false;
  }

  if (outerMatch) {
    // Remove markers outside selection
    view.dispatch({
      changes: [
        { from: to, to: to + bLen, insert: '' },
        { from: from - bLen, to: from, insert: '' },
      ],
      selection: { anchor: from - bLen, head: to - bLen },
    });
    view.focus();
    return true;
  }

  // Check inside selection boundary — strip one marker layer from each end
  const innerBefore = selected.slice(0, bLen);
  const innerAfter  = selected.slice(-bLen);
  let innerMatch = innerBefore === marker && innerAfter === marker && selected.length >= bLen * 2;

  // For multi-char markers like ** or ~~: simple startsWith/endsWith is correct.
  // For single-char markers like *: check parity of leading chars.
  // **hello** has 2 leading * → even → this is bold only, * should NOT match.
  // ***hello*** has 3 leading * → odd → this is bold+italic, * SHOULD match.
  // *hello* has 1 leading * → odd → this is italic only, * SHOULD match.
  if (innerMatch && bLen === 1) {
    let leadCount = 0;
    while (leadCount < selected.length && selected[leadCount] === marker[0]) leadCount++;
    // Only match if there's an odd number of the marker char
    // (meaning a single * layer exists on top of any ** layers)
    if (leadCount % 2 === 0) innerMatch = false;
  }

  if (innerMatch) {
    // Remove markers inside selection
    view.dispatch({
      changes: { from, to, insert: selected.slice(bLen, selected.length - bLen) },
      selection: { anchor: from, head: to - bLen * 2 },
    });
    view.focus();
    return true;
  }

  // Marker not present — add it
  view.dispatch({
    changes: { from, to, insert: `${marker}${selected}${marker}` },
    selection: { anchor: from + bLen, head: from + bLen + selected.length },
  });
  view.focus();
  return true;
}

// ─── Toggle heading prefix on current line ───────────────────────────────────

function toggleHeadingPrefix(level) {
  const view = getView();
  if (!view) return false;
  const docLen = view.state.doc.length;
  const head = Math.max(0, Math.min(view.state.selection.main.head, docLen));
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

  // New format strip buttons
  document.getElementById('btn-underline')?.addEventListener('click', () => {
    const view = getView();
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    view.dispatch({
      changes: { from, to, insert: `<u>${selected}</u>` },
      selection: { anchor: from + 3, head: from + 3 + selected.length },
    });
    view.focus();
  });

  document.getElementById('btn-highlight')?.addEventListener('click', () => wrapSelection('=='));

  document.getElementById('btn-blockquote')?.addEventListener('click', () => {
    const view = getView();
    if (!view) return;
    const line = view.state.doc.lineAt(view.state.selection.main.head);
    const hasQuote = line.text.startsWith('> ');
    view.dispatch({
      changes: { from: line.from, to: line.from + (hasQuote ? 2 : 0), insert: hasQuote ? '' : '> ' },
    });
    view.focus();
  });

  document.getElementById('btn-tags-toggle')?.addEventListener('click', () => {
    const { openTagsPanel, closeTagsPanel } = require('./icon-rail.js');
    const tagsBtn = document.getElementById('rail-tags');
    if (tagsBtn && tagsBtn.classList.contains('active')) {
      closeTagsPanel();
    } else {
      openTagsPanel();
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
  document.querySelectorAll('[data-view]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.view === mode))
  );
}

function setupViewToggles() {
  document.querySelectorAll('[data-view]').forEach(btn => {
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

    // Convert fixed px widths to percentages so panes fill workspace on resize
    const workspace = document.getElementById('workspace');
    const rightPanel = document.getElementById('right-panel');
    const rpWidth = (rightPanel && !rightPanel.hidden) ? 220 : 0;
    const available = workspace.offsetWidth - 52 - 5 - rpWidth;
    if (available > 0) {
      const editorPct = (editorPane.offsetWidth / available) * 100;
      const previewPct = (previewPane.offsetWidth / available) * 100;
      editorPane.style.width = editorPct + '%';
      previewPane.style.width = previewPct + '%';
    }
  });

  resizer.addEventListener('dblclick', () => {
    editorPane.style.flex = '1';
    editorPane.style.width = '';
    previewPane.style.flex = '1';
    previewPane.style.width = '';
  });

  // Reset to 50/50 on window resize to prevent blank areas
  window.addEventListener('resize', () => {
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
