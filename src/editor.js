// src/editor.js
// CodeMirror 6 editor — Day 2: mount, file open, syntax highlighting.
// Architecture: contextIsolation enforced — all file I/O via window.api only.
// CommonJS module — no import/export (Forge webpack template is CJS-first).
// Max 400 lines.

'use strict';

const { EditorState, Compartment }           = require('@codemirror/state');
const { EditorView, keymap, lineNumbers,
        drawSelection }                      = require('@codemirror/view');
const { defaultKeymap, history,
        historyKeymap, indentWithTab }       = require('@codemirror/commands');
const { markdown, markdownLanguage }         = require('@codemirror/lang-markdown');
const { languages }                          = require('@codemirror/language-data');
const { oneDark }                            = require('@codemirror/theme-one-dark');
const { inlineRenderPlugin }                 = require('./inline-render.js');

// ─── Module state ─────────────────────────────────────────────────────────────
let view            = null;
let currentFilePath = null;
let isDirty         = false;
const themeCompartment = new Compartment();

// ─── GitHub Light theme ───────────────────────────────────────────────────────
const githubLightBase = EditorView.theme({
  '&': { backgroundColor: 'var(--bg-editor)', color: 'var(--fg-primary)' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-editor)', lineHeight: '1.75' },
  '.cm-content': { caretColor: 'var(--fg-primary)', padding: '20px 0', maxWidth: '72ch', margin: '0 auto' },
  '.cm-cursor': { borderLeftColor: 'var(--fg-primary)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--selection-bg, rgba(0,100,255,0.12))',
  },
  '.cm-gutters': { backgroundColor: 'var(--bg-editor)', color: 'var(--fg-muted)', border: 'none', paddingRight: '8px', minWidth: '40px' },
  '.cm-lineNumbers .cm-gutterElement': { paddingLeft: '8px' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--bg-active-line, rgba(0,0,0,0.04))' },
  '.cm-activeLine':       { backgroundColor: 'var(--bg-active-line, rgba(0,0,0,0.04))' },
  '.cm-foldPlaceholder':  { backgroundColor: 'transparent', border: 'none' },
});


// Light theme — syntax highlighting added in Day 3 via inline-render.js
const githubLightTheme = githubLightBase;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isDarkMode() {
  return document.documentElement.classList.contains('theme-dark');
}

function buildExtensions() {
  return [
    history(),
    lineNumbers(),
    drawSelection(),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    // ⌘O wired into CM6 keymap — fires even when editor has focus
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
      { key: 'Mod-o', run: () => { openFileDialog(); return true; } },
    ]),
    inlineRenderPlugin,
    themeCompartment.of(isDarkMode() ? oneDark : githubLightTheme),
    EditorView.updateListener.of(update => {
      if (update.docChanged) onDocChange(update.state.doc.toString());
    }),
  ];
}

function fileNameFromPath(filePath) {
  if (!filePath) return 'Untitled';
  return filePath.split(/[/\\]/).pop();
}

// ─── Doc change ───────────────────────────────────────────────────────────────
function onDocChange(content) {
  if (!isDirty) {
    isDirty = true;
    updateTabBar(fileNameFromPath(currentFilePath), true);
  }
  window.dispatchEvent(new CustomEvent('editor:change', { detail: { content } }));
}

// ─── Mount ────────────────────────────────────────────────────────────────────
function mount(container) {
  const state = EditorState.create({ doc: '', extensions: buildExtensions() });
  view = new EditorView({ state, parent: container });
  return view;
}

// ─── Load content ─────────────────────────────────────────────────────────────
function loadContent(content, filePath) {
  if (!view) return;
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } });
  currentFilePath = filePath;
  isDirty = false;
  updateTabBar(fileNameFromPath(filePath), false);
  setEmptyState(false);
  view.focus();
}

// ─── File open ────────────────────────────────────────────────────────────────
// main.js open-dialog handler returns { canceled, path, content }
// content is already read by main — no second readFile IPC call needed.
async function openFileDialog() {
  const result = await window.api.openDialog();
  if (!result || result.canceled) return;
  if (!result.path || result.content === undefined) return;
  loadContent(result.content, result.path);
}

// Used by macOS open-file IPC and drag-and-drop
async function openFilePath(filePath) {
  if (!filePath) return;
  const content = await window.api.readFile(filePath);
  if (content === null || content === undefined) return;
  loadContent(content, filePath);
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function updateTabBar(filename, dirty) {
  const tab = document.querySelector('.tab-item.active');
  if (!tab) return;
  const label = tab.querySelector('.tab-label') || tab;
  label.textContent = (dirty ? '● ' : '') + filename;
  tab.title = currentFilePath || filename;
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function setEmptyState(visible) {
  // Also toggle the CM6 mount point so empty state isn't covered
  const el   = document.getElementById('empty-state');
  const pane = document.getElementById('editor-pane');
  const cm  = document.getElementById('cm-editor');
  if (el)   el.style.display = visible ? 'flex' : 'none';
  if (cm)   cm.style.visibility = visible ? 'hidden' : 'visible';
  if (pane) pane.dataset.hasFile = String(!visible);
}

// ─── Drag and drop (deferred — blocked by system policy on this machine) ──────
function setupDragDrop() {
  window.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, true);
  window.addEventListener('drop', async e => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const filePath = window.api.getPathForFile(file);
    if (!filePath) return;
    await openFilePath(filePath);
  }, true);
}

// ─── Global keyboard fallback (for when editor is not focused) ────────────────
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'o') { e.preventDefault(); openFileDialog(); }
    if (mod && e.key === 'n') { e.preventDefault(); newFile(); }
  });
}

// ─── macOS open-file IPC ──────────────────────────────────────────────────────
function setupOpenFileIPC() {
  window.api.onOpenFile(async (filePath) => { await openFilePath(filePath); });
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────
function applyTheme(dark) {
  if (!view) return;
  view.dispatch({ effects: themeCompartment.reconfigure(dark ? oneDark : githubLightTheme) });
}

// ─── Open button (injected into toolbar for reliable access) ─────────────────
function setupOpenButton() {
  const btn = document.getElementById('btn-open-file');
  if (btn) btn.addEventListener('click', () => openFileDialog());
}

// ─── New file ─────────────────────────────────────────────────────────────────
function newFile() {
  loadContent('', null);
}

function setupNewFileButtons() {
  const tabBtn  = document.getElementById('btn-new-tab');
  const emptyBtn = document.getElementById('btn-new-file');
  if (tabBtn)   tabBtn.addEventListener('click', () => newFile());
  if (emptyBtn) emptyBtn.addEventListener('click', () => newFile());
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  const container = document.getElementById('cm-editor');
  if (!container) { console.error('[editor] Mount point #cm-editor not found'); return; }
  mount(container);
  setEmptyState(true);
  setupDragDrop();
  setupKeyboardShortcuts();
  setupOpenFileIPC();
  setupOpenButton();
  setupNewFileButtons();
  console.log('[editor] CodeMirror 6 mounted ✓');
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  init,
  newFile,
  loadContent,
  openFileDialog,
  openFilePath,
  applyTheme,
  getView:        () => view,
  getCurrentPath: () => currentFilePath,
  getIsDirty:     () => isDirty,
  setDirty:       (val) => { isDirty = val; },
};
