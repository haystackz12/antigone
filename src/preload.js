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

  // ── Shell ──────────────────────────────────────────────────────────────────

  /**
   * Open a URL in the user's default browser.
   * This is the ONLY way links leave the app — never navigate the editor pane.
   * @param {string} url  Must start with 'http'.
   * @returns {Promise<{ok: boolean}>}
   */
  openExternal: (url) =>
    ipcRenderer.invoke('open-external', requireString(url, 'url')),

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
