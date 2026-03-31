'use strict';

// ─── Antigone · preload.js ───────────────────────────────────────────────────
// This file runs in a privileged context with access to both Node.js and the
// DOM, but it exposes ONLY an explicit, typed API to the renderer via
// contextBridge. The renderer has zero direct Node/Electron access.
//
// Architecture rules (PERMANENT):
//   contextIsolation: true  — this file is the ONLY bridge. Never widen it.
//   nodeIntegration: false  — never add require() calls to renderer files.
//   Every method here is a thin wrapper over ipcRenderer.invoke().
//   Validate all arguments before forwarding — renderer input is untrusted.
// ─────────────────────────────────────────────────────────────────────────────

const { contextBridge, ipcRenderer, webUtils } = require('electron');

// ── Type guards ──────────────────────────────────────────────────────────────

/** @param {unknown} v @returns {string} */
function requireString(v, name) {
  if (typeof v !== 'string' || v.length === 0) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return v;
}

// ── Exposed API ──────────────────────────────────────────────────────────────
// All keys here become window.api.* in the renderer.
// Keep this surface minimal — only what the renderer genuinely needs.

contextBridge.exposeInMainWorld('api', {

  // ── File I/O ───────────────────────────────────────────────────────────────

  /**
   * Read a file from disk. Returns the UTF-8 string content.
   * @param {string} filePath  Absolute path.
   * @returns {Promise<string>}
   */
  readFile: (filePath) =>
    ipcRenderer.invoke('read-file', requireString(filePath, 'filePath')),

  /**
   * Write content to disk using atomic temp-then-rename.
   * @param {string} filePath  Absolute path.
   * @param {string} content   Full file content.
   * @returns {Promise<{ok: boolean, path: string}>}
   */
  writeFile: (filePath, content) =>
    ipcRenderer.invoke(
      'write-file',
      requireString(filePath, 'filePath'),
      requireString(content,  'content'),
    ),

  // ── Dialogs ────────────────────────────────────────────────────────────────

  /**
   * Show the native Open File dialog.
   * @returns {Promise<{canceled: boolean, path?: string, content?: string}>}
   */
  openDialog: () =>
    ipcRenderer.invoke('open-dialog'),

  /**
   * Show the native Save As dialog.
   * @param {string} [defaultPath]  Suggested save path (optional).
   * @returns {Promise<{canceled: boolean, path?: string}>}
   */
  saveDialog: (defaultPath) =>
    ipcRenderer.invoke('save-dialog', defaultPath ?? null),

  // ── Crash recovery ─────────────────────────────────────────────────────────

  /**
   * Write a recovery snapshot to OS temp dir.
   * @param {string} tabId    Stable identifier for the tab (UUID).
   * @param {string} content  Current document content.
   * @returns {Promise<{ok: boolean, path: string}>}
   */
  writeRecovery: (tabId, content) =>
    ipcRenderer.invoke(
      'write-recovery',
      requireString(tabId,    'tabId'),
      requireString(content,  'content'),
    ),

  /**
   * Read a recovery snapshot if one exists.
   * @param {string} tabId
   * @returns {Promise<{found: boolean, content?: string}>}
   */
  readRecovery: (tabId) =>
    ipcRenderer.invoke('read-recovery', requireString(tabId, 'tabId')),

  /**
   * Delete a recovery snapshot after a clean save.
   * @param {string} tabId
   * @returns {Promise<{ok: boolean}>}
   */
  deleteRecovery: (tabId) =>
    ipcRenderer.invoke('delete-recovery', requireString(tabId, 'tabId')),

  /**
   * List all recovery files in OS temp dir.
   * @returns {Promise<Array<{tabId: string, path: string}>>}
   */
  listRecovery: () =>
    ipcRenderer.invoke('list-recovery'),

  // ── Image save (clipboard paste) ───────────────────────────────────────────

  /**
   * Save image data to assets/ directory adjacent to the current file.
   * @param {string} filePath    Path of the current file (for directory context).
   * @param {string} filename    Target filename (e.g., 'image-1234.png').
   * @param {number[]} dataArray Image data as a byte array.
   * @returns {Promise<{ok: boolean, path?: string, relativePath?: string, error?: string}>}
   */
  saveImage: (filePath, filename, dataArray) =>
    ipcRenderer.invoke(
      'save-image',
      requireString(filePath, 'filePath'),
      requireString(filename, 'filename'),
      dataArray,
    ),

  // ── Shell ──────────────────────────────────────────────────────────────────

  /**
   * Open a URL in the user's default browser.
   * This is the ONLY way links leave the app — never navigate the editor pane.
   * @param {string} url  Must start with 'http'.
   * @returns {Promise<{ok: boolean}>}
   */
  openExternal: (url) =>
    ipcRenderer.invoke('open-external', requireString(url, 'url')),

  // ── Export ─────────────────────────────────────────────────────────────────

  /**
   * Export rendered HTML as PDF via save dialog.
   * @param {string} html         Standalone HTML content.
   * @param {string} defaultPath  Suggested filename.
   */
  exportPdf: (html, defaultPath) =>
    ipcRenderer.invoke('export-pdf', html, defaultPath),

  /**
   * Export rendered HTML as standalone .html file via save dialog.
   * @param {string} html         Standalone HTML content.
   * @param {string} defaultPath  Suggested filename.
   */
  exportHtml: (html, defaultPath) =>
    ipcRenderer.invoke('export-html', html, defaultPath),

  // ── File path resolution ───────────────────────────────────────────────────

  /**
   * Resolve a File object (from drag-and-drop) to an absolute path.
   * file.path was removed in Electron 20+. webUtils.getPathForFile() is the
   * official replacement and works with contextIsolation: true.
   * @param {File} file  A File object from a drop event dataTransfer.
   * @returns {string}   Absolute path, or '' if resolution fails.
   */
  getPathForFile: (file) => {
    try { return webUtils.getPathForFile(file) ?? ''; }
    catch { return ''; }
  },

  // ── Theme ──────────────────────────────────────────────────────────────────

  /**
   * Get the current OS-level dark/light preference.
   * @returns {Promise<{shouldUseDarkColors: boolean}>}
   */
  getNativeTheme: () =>
    ipcRenderer.invoke('get-native-theme'),

  /**
   * Subscribe to OS theme changes (e.g. user toggles macOS appearance).
   * @param {function({shouldUseDarkColors: boolean}): void} callback
   * @returns {function(): void}  Call the returned function to unsubscribe.
   */
  onNativeThemeUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('native-theme-updated', handler);
    return () => ipcRenderer.removeListener('native-theme-updated', handler);
  },

  // ── App paths ──────────────────────────────────────────────────────────────

  /**
   * Returns OS paths the renderer may need for display purposes only.
   * @returns {Promise<{userData: string, temp: string, home: string}>}
   */
  getAppPaths: () =>
    ipcRenderer.invoke('get-app-paths'),

  // ── Unsaved changes dialog ─────────────────────────────────────────────────

  /**
   * Show the native Save / Don't Save / Cancel dialog.
   * @returns {Promise<'save'|'dontsave'|'cancel'>}
   */
  showUnsavedDialog: () =>
    ipcRenderer.invoke('show-unsaved-dialog'),

  /**
   * Confirm that the window can close (after handling unsaved changes).
   */
  closeConfirmed: () =>
    ipcRenderer.invoke('close-confirmed'),

  /**
   * Subscribe to before-close events from main.
   * @param {function(): void} callback
   */
  onBeforeClose: (callback) => {
    ipcRenderer.on('before-close', () => callback());
  },

  // ── Preferences (electron-store) ──────────────────────────────────────────

  /** @returns {Promise<object>} All stored preferences. */
  getPrefs: () =>
    ipcRenderer.invoke('get-prefs'),

  /**
   * Merge a delta into stored preferences.
   * @param {object} delta  Key-value pairs to set.
   */
  setPrefs: (delta) =>
    ipcRenderer.invoke('set-prefs', delta),

  /**
   * Set the native theme source for the app.
   * @param {'light'|'dark'|'system'} source
   */
  setNativeTheme: (source) =>
    ipcRenderer.invoke('set-native-theme', requireString(source, 'source')),

  // ── Menu triggers (inbound from native menu) ───────────────────────────────

  onExportPDF:  (cb) => { ipcRenderer.on('export-pdf-trigger', () => cb()); },
  onExportHTML: (cb) => { ipcRenderer.on('export-html-trigger', () => cb()); },
  onPrint:      (cb) => { ipcRenderer.on('print-doc', () => cb()); },
  onMenuNewFile:  (cb) => { ipcRenderer.on('menu-new-file', () => cb()); },
  onMenuOpenFile: (cb) => { ipcRenderer.on('menu-open-file', () => cb()); },
  onMenuSave:     (cb) => { ipcRenderer.on('menu-save', () => cb()); },
  onMenuSaveAs:   (cb) => { ipcRenderer.on('menu-save-as', () => cb()); },
  onMenuPrefs:    (cb) => { ipcRenderer.on('menu-preferences', () => cb()); },
  onMenuViewMode: (cb) => { ipcRenderer.on('menu-view-mode', (_e, mode) => cb(mode)); },
  onMenuToggleFocus: (cb) => { ipcRenderer.on('menu-toggle-focus', () => cb()); },
  onMenuToggleLineNumbers: (cb) => { ipcRenderer.on('menu-toggle-line-numbers', () => cb()); },

  // ── Inbound from main ──────────────────────────────────────────────────────

  /**
   * Subscribe to file-open events originating from main:
   *   - macOS 'open-file' (double-click / Open With)
   *   - CLI argument
   *   - Queued pending path
   * @param {function(string): void} callback  Receives absolute file path.
   * @returns {function(): void}  Unsubscribe.
   */
  onOpenFile: (callback) => {
    const handler = (_event, filePath) => callback(filePath);
    ipcRenderer.on('open-file', handler);
    return () => ipcRenderer.removeListener('open-file', handler);
  },

});
