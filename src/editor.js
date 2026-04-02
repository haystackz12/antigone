// src/editor.js
// CodeMirror 6 editor — Day 2: mount, file open, syntax highlighting.
// Architecture: contextIsolation enforced — all file I/O via window.api only.
// CommonJS module — no import/export (Forge webpack template is CJS-first).
// Max 400 lines.

'use strict';

const { EditorState, Compartment }           = require('@codemirror/state');
const { EditorView, keymap, lineNumbers,
        drawSelection, highlightActiveLine }  = require('@codemirror/view');
const { defaultKeymap, history,
        historyKeymap, indentWithTab }       = require('@codemirror/commands');
const { markdown, markdownLanguage }         = require('@codemirror/lang-markdown');
const { languages }                          = require('@codemirror/language-data');
const { oneDark }                            = require('@codemirror/theme-one-dark');
const { searchKeymap, highlightSelectionMatches, openSearchPanel } = require('@codemirror/search');
const { autocompletion }                     = require('@codemirror/autocomplete');
const { inlineRenderPlugin }                 = require('./inline-render.js');
const editorSave                             = require('./editor-save.js');
const toolbar                                = require('./toolbar.js');
const { scanTags }                           = require('./tags.js');
const tabs                                   = require('./tabs.js');

// ─── Module state ─────────────────────────────────────────────────────────────
let view            = null;
let currentFilePath = null;
let isDirty         = false;
const themeCompartment  = new Compartment();
const vimCompartment    = new Compartment();
const inlineCompartment = new Compartment();
const LARGE_FILE_CHARS  = 150000;

// ─── Base editor theme (layout + typography, always applied in both themes) ──
const baseEditorTheme = EditorView.theme({
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

// Light theme — empty (colors come from CSS variables, layout from baseEditorTheme)
const githubLightTheme = EditorView.theme({});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isDarkMode() {
  return document.documentElement.classList.contains('dark');
}

// ─── Tag autocomplete ────────────────────────────────────────────────────────
function tagCompletion(context) {
  const word = context.matchBefore(/#[\w-]*/);
  if (!word || word.from === word.to) return null;
  const text = context.state.doc.toString();
  const tags = scanTags(text);
  const options = [...tags.keys()].map(tag => ({
    label: `#${tag}`,
    type: 'keyword',
  }));
  if (options.length === 0) return null;
  return { from: word.from, options, validFor: /#[\w-]*/ };
}

function buildExtensions() {
  return [
    history(),
    lineNumbers(),
    drawSelection(),
    highlightActiveLine(),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    // ⌘O wired into CM6 keymap — fires even when editor has focus
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      // Filter Mod-h from searchKeymap — macOS reserves ⌘H for Hide Window
      ...searchKeymap.filter(k => k.key !== 'Mod-h'),
      { key: 'Mod-Alt-f',   run: openSearchPanel },
      indentWithTab,
      { key: 'Mod-o',       run: () => { openFileDialog(); return true; } },
      { key: 'Mod-s',       run: () => { editorSave.saveFile(currentFilePath); return true; } },
      { key: 'Mod-Shift-s', run: () => { editorSave.saveFileAs(); return true; } },
      { key: 'Mod-b',       run: () => toolbar.wrapSelection('**') },
      { key: 'Mod-i',       run: () => toolbar.wrapSelection('*') },
      { key: 'Mod-k',       run: () => toolbar.insertLink() },
    ]),
    highlightSelectionMatches(),
    autocompletion({ override: [tagCompletion] }),
    inlineCompartment.of(inlineRenderPlugin),
    baseEditorTheme,
    EditorView.contentAttributes.of({ spellcheck: 'true' }),
    themeCompartment.of(githubLightTheme),
    vimCompartment.of([]),
    EditorView.updateListener.of(update => {
      if (update.docChanged) onDocChange(update.state.doc.toString());
      if (update.selectionSet || update.docChanged) {
        updateCursorPosition(update.state);
        updateFormatActiveStates(update.view);
      }
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
  editorSave.onDirtyChange();
  updateWordCount(content);
  window.dispatchEvent(new CustomEvent('editor:change', { detail: { content } }));
}

function updateWordCount(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const wordsEl = document.getElementById('status-words');
  const timeEl  = document.getElementById('status-readtime');
  if (wordsEl) wordsEl.textContent = `${words} words`;
  if (timeEl)  timeEl.textContent = words === 0 ? '0 min' : `${minutes} min`;
}

function updateCursorPosition(state) {
  const pos = state.selection.main.head;
  const line = state.doc.lineAt(pos);
  const col = pos - line.from + 1;
  const el = document.getElementById('status-cursor');
  if (el) el.textContent = `Ln ${line.number}, Col ${col}`;
}

// ─── Format strip active state tracking ──────────────────────────────────────
function updateFormatActiveStates(view) {
  const state = view.state;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);
  const lineText = line.text;
  const offset = from - line.from;

  function hasMarkerAround(marker) {
    const before = lineText.lastIndexOf(marker, offset - 1);
    if (before === -1) return false;
    const after = lineText.indexOf(marker, offset);
    return after !== -1 && after > before;
  }

  const toggle = (id, active) => document.getElementById(id)?.classList.toggle('fmt-active', active);

  toggle('btn-bold', hasMarkerAround('**'));
  toggle('btn-italic', !hasMarkerAround('**') && hasMarkerAround('*'));
  toggle('btn-strike', hasMarkerAround('~~'));
  toggle('btn-highlight', hasMarkerAround('=='));
  toggle('btn-code', hasMarkerAround('`'));
  toggle('btn-h1', lineText.startsWith('# ') && !lineText.startsWith('## '));
  toggle('btn-h2', lineText.startsWith('## ') && !lineText.startsWith('### '));
  toggle('btn-h3', lineText.startsWith('### '));
  toggle('btn-blockquote', lineText.startsWith('> '));
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
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
    selection: { anchor: 0, head: 0 },
  });
  currentFilePath = filePath;
  isDirty = false;
  updateTabBar(fileNameFromPath(filePath), false);
  editorSave.updateSaveStatus(false);
  updateWordCount(content);
  setEmptyState(false);

  // Large file handling: disable inline rendering for performance
  const isLarge = content.length > LARGE_FILE_CHARS;
  const banner = document.getElementById('large-file-banner');
  if (isLarge) {
    view.dispatch({ effects: inlineCompartment.reconfigure([]) });
    if (banner) banner.hidden = false;
  } else {
    view.dispatch({ effects: inlineCompartment.reconfigure(inlineRenderPlugin) });
    if (banner) banner.hidden = true;
  }

  view.focus();
}

// ─── File open ────────────────────────────────────────────────────────────────
// Uses tabs module to open files in new tabs or reuse existing.
async function openFileDialog() {
  const result = await window.api.openDialog();
  if (!result || result.canceled) return;
  if (!result.path || result.content === undefined) return;
  tabs.openFileInTab(result.path, result.content);
}

// Used by macOS open-file IPC and drag-and-drop
async function openFilePath(filePath) {
  if (!filePath) return;
  const content = await window.api.readFile(filePath);
  if (content === null || content === undefined) return;
  tabs.openFileInTab(filePath, content);
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function updateTabBar(filename, dirty) {
  const tab = document.querySelector('.tab.tab--active');
  if (!tab) return;
  const label = tab.querySelector('.tab-title') || tab;
  label.textContent = filename || 'Untitled';
  tab.classList.toggle('is-unsaved', dirty);
  tab.title = currentFilePath || filename || 'Untitled';
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
    if (mod && !e.shiftKey && e.key === 's') { e.preventDefault(); editorSave.saveFile(currentFilePath); }
    if (mod && e.shiftKey && e.key === 's')  { e.preventDefault(); editorSave.saveFileAs(); }
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

// ─── Vim mode toggle ─────────────────────────────────────────────────────────
function setVimMode(enabled) {
  if (!view) return;
  if (enabled) {
    const { vim } = require('@replit/codemirror-vim');
    view.dispatch({ effects: vimCompartment.reconfigure(vim()) });
  } else {
    view.dispatch({ effects: vimCompartment.reconfigure([]) });
  }
}

// ─── Open button (injected into toolbar for reliable access) ─────────────────
function setupOpenButton() {
  const btn = document.getElementById('btn-open-file');
  if (btn) btn.addEventListener('click', () => openFileDialog());
}

// ─── New file ─────────────────────────────────────────────────────────────────
function newFile() {
  tabs.openNewTab();
}

function setupNewFileButtons() {
  const emptyBtn = document.getElementById('btn-new-file');
  if (emptyBtn) emptyBtn.addEventListener('click', () => newFile());
  // + button is managed by tabs.js renderTabBar()
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function setCurrentPath(p) { currentFilePath = p; }

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

  // Wire editor-save module
  editorSave.configure({
    getView:        () => view,
    getCurrentPath: () => currentFilePath,
    setCurrentPath,
    getIsDirty:     () => isDirty,
    setDirty:       (val) => { isDirty = val; },
    updateTabBar,
  });
  editorSave.startRecovery();
  editorSave.setupBeforeClose();
  editorSave.checkRecovery();

  // Wire tabs module
  tabs.configure({
    getView:        () => view,
    getCurrentPath: () => currentFilePath,
    loadContent,
    getIsDirty:     () => isDirty,
    setDirty:       (val) => { isDirty = val; },
    guardUnsaved:   editorSave.guardUnsavedChanges,
  });

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
  setVimMode,
  getView:        () => view,
  getCurrentPath: () => currentFilePath,
  getIsDirty:     () => isDirty,
  setDirty:       (val) => { isDirty = val; },
};
