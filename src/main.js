'use strict';

// ─── Antigone · main.js ──────────────────────────────────────────────────────
// Responsibilities: BrowserWindow lifecycle, all IPC handlers, fs I/O,
// open-file (macOS), CLI argument parsing.
//
// Architecture rules (PERMANENT):
//   contextIsolation: true  /  nodeIntegration: false
//   All renderer↔main communication via contextBridge in preload.js ONLY.
//   All file I/O in this file ONLY — never in renderer or preload.
// ─────────────────────────────────────────────────────────────────────────────

const {
  app,
  BrowserWindow,
  Menu,
  clipboard,
  ipcMain,
  dialog,
  shell,
  nativeTheme,
} = require('electron');
const path = require('node:path');
const fs   = require('node:fs');
const os   = require('node:os');

// ── Forge webpack injects these globals ──────────────────────────────────────
/* global MAIN_WINDOW_WEBPACK_ENTRY, MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY */

// Simple JSON file store — replaces electron-store to avoid ESM/asar issues
let store = null;

function getStoreSync() {
  if (store) return store;
  const storePath = path.join(app.getPath('userData'), 'config.json');
  let data = {};
  try { data = JSON.parse(fs.readFileSync(storePath, 'utf8')); } catch {}

  function save() {
    const dir = path.dirname(storePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  }

  store = {
    get(key, defaultValue) {
      return key in data ? data[key] : defaultValue;
    },
    set(keyOrObj, value) {
      if (typeof keyOrObj === 'object') {
        Object.assign(data, keyOrObj);
      } else {
        data[keyOrObj] = value;
      }
      save();
    },
    delete(key) {
      delete data[key];
      save();
    },
    get store() { return { ...data }; },
  };
  return store;
}

async function getStore() {
  return getStoreSync();
}

// ── Module-level state ───────────────────────────────────────────────────────
/** @type {BrowserWindow|null} */
let mainWindow = null;

/**
 * File path queued by open-file event that fires before the window is ready.
 * Delivered to renderer once the window signals it is ready.
 * @type {string|null}
 */
let pendingOpenPath = null;

// ── Window factory ───────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1200,
    height:          800,
    minWidth:        640,
    minHeight:       480,
    titleBarStyle:   'hiddenInset',   // macOS traffic lights inset into toolbar
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a1a' : '#ffffff',
    show:            false,           // reveal after ready-to-show to avoid flash
    webPreferences: {
      preload:          MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,         // PERMANENT — never disable
      nodeIntegration:  false,        // PERMANENT — never enable
      sandbox:          true,         // PERMANENT — never disable
      spellcheck:       true,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // ── Unsaved changes: intercept close ────────────────────────────────────
  let allowClose = false;
  let isQuitting = false;
  let quitAfterClose = false;

  app.on('before-quit', (e) => {
    if (!allowClose) {
      // Cmd+Q while unsaved-changes flow hasn't completed — let the
      // close handler deal with it, but remember we want to quit after.
      isQuitting = true;
    }
  });

  mainWindow.on('close', (e) => {
    if (allowClose) return;
    e.preventDefault();
    // Snapshot whether this close was initiated by quit (Cmd+Q)
    quitAfterClose = isQuitting;
    isQuitting = false; // reset so a cancelled dialog doesn't pollute later Cmd+W
    mainWindow.webContents.send('before-close');
  });

  ipcMain.removeHandler('close-confirmed');
  ipcMain.handle('close-confirmed', () => {
    allowClose = true;
    mainWindow.close();
    // If this close was triggered by Cmd+Q, finish quitting the app
    if (quitAfterClose) app.quit();
  });

  ipcMain.removeHandler('show-unsaved-dialog');
  ipcMain.handle('show-unsaved-dialog', async () => {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2,
      message: 'Do you want to save changes?',
      detail: 'Your changes will be lost if you don\'t save them.',
    });
    return ['save', 'dontsave', 'cancel'][response];
  });

  // Reveal only when painted to avoid white flash on launch
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Deliver any file that was opened before the window existed (macOS open-file)
    if (pendingOpenPath) {
      const ext = path.extname(pendingOpenPath).toLowerCase();
      if (VALID_FILE_EXTS.includes(ext)) {
        mainWindow.webContents.send('open-file', pendingOpenPath);
      }
      pendingOpenPath = null;
    }
    // CLI argument: antigone path/to/file.md (already filtered by extension)
    const cliPath = resolveCLIPath();
    if (cliPath) mainWindow.webContents.send('open-file', cliPath);
  });

  // ── Context menu ──────────────────────────────────────────────────────
  // Selection state comes from CM6 (params.editFlags is unreliable — hit
  // test lands on CM6's selection layer, not the contenteditable node).
  // Spelling replacement uses IPC + view.dispatch (BUG-049).
  mainWindow.webContents.on('context-menu', async (_event, params) => {
    let hasSelection = false;
    let spelling = null;

    try {
      const info = await mainWindow.webContents.executeJavaScript(
        `window.__antigoneContextInfo(${params.x}, ${params.y})`
      );
      hasSelection = info.hasSelection;
      spelling = info.spelling;
    } catch (_) {}

    // Prefer Electron's params when the hit test was accurate, fall back
    // to CM6-derived spelling when the hit landed on the selection layer.
    const misspelled = params.misspelledWord
      || (spelling ? spelling.word : '');
    const suggestions = params.misspelledWord
      ? params.dictionarySuggestions.slice(0, 5)
      : (spelling ? spelling.suggestions.slice(0, 5) : []);

    const items = [];

    // Spelling suggestions + Add to Dictionary (prepended when misspelled)
    if (misspelled) {
      if (suggestions.length > 0) {
        for (const s of suggestions) {
          items.push({
            label: s,
            click: () => mainWindow.webContents.send(
              'replace-misspelling', misspelled, s, params.x, params.y
            ),
          });
        }
      } else {
        items.push({ label: 'No Suggestions', enabled: false });
      }
      items.push({ type: 'separator' });
      items.push({
        label: 'Add to Dictionary',
        click: () => {
          mainWindow.webContents.session
            .addWordToSpellCheckerDictionary(misspelled);
        },
      });
      items.push({ type: 'separator' });
    }

    // Copy as HTML (when CM6 has a non-empty selection)
    if (hasSelection) {
      items.push({
        label: 'Copy as HTML',
        click: () => mainWindow.webContents.send('edit-command', 'copyAsHtml'),
      });
      items.push({ type: 'separator' });
    }

    // Standard edit items — all routed through CM6 via IPC (roles don't
    // act on CM6's selection because the hit test misses contenteditable).
    const send = (cmd) => mainWindow.webContents.send('edit-command', cmd);
    items.push({ label: 'Cut',        enabled: hasSelection, click: () => send('cut') });
    items.push({ label: 'Copy',       enabled: hasSelection, click: () => send('copy') });
    items.push({ label: 'Paste',      click: () => send('paste') });
    items.push({ label: 'Select All', click: () => send('selectAll') });

    Menu.buildFromTemplate(items).popup();
  });

  // Open DevTools only in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── CLI argument resolution ──────────────────────────────────────────────────

/**
 * Returns the first non-flag, existing-file CLI argument, or null.
 * Handles both `npx electron . path/to/file.md` and packaged `antigone file.md`.
 * @returns {string|null}
 */
function resolveCLIPath() {
  // In development argv = [electron, ., ...rest]
  // In production argv = [antigone, ...rest]
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  const validExts = ['.md', '.markdown', '.mdown', '.mkd', '.mdx', '.txt'];
  for (const arg of args) {
    if (arg.startsWith('-')) continue;
    const resolved = path.resolve(arg);
    const ext = path.extname(resolved).toLowerCase();
    if (validExts.includes(ext) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return resolved;
    }
  }
  return null;
}

// ── macOS open-file (double-click / "Open With") ─────────────────────────────
// Only accept Markdown/text files — prevents macOS Resume from auto-opening
// the last non-Markdown file (e.g., project directories or config files).

const VALID_FILE_EXTS = ['.md', '.markdown', '.mdown', '.mkd', '.mdx', '.txt'];

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  const ext = path.extname(filePath).toLowerCase();
  if (!VALID_FILE_EXTS.includes(ext)) return;
  addRecentFile(filePath);
  if (mainWindow) {
    mainWindow.webContents.send('open-file', filePath);
  } else {
    pendingOpenPath = filePath;
  }
});

// ── Native menu ─────────────────────────────────────────────────────────────
const { setupMenu, addRecentFile } = require('./main-menu.js');
const { registerPreprocessorHandler } = require('./main-export.js');

// ── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // Clean up stale keys from removed features
  const s = await getStore();
  s.delete('darkMode');
  s.delete('theme');
  s.delete('session');

  createWindow();
  try {
    await setupMenu(() => mainWindow, getStore);
  } catch (err) {
    console.error('setupMenu failed:', err);
    // Fallback — set a basic menu so File > Open works
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open...',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }
                ]
              });
              if (!result.canceled && result.filePaths.length > 0) {
                mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
              }
            }
          }
        ]
      },
      { label: 'Edit', submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]},
      { label: 'Window', submenu: [
        { role: 'minimize' }, { role: 'zoom' }, { role: 'front' }
      ]}
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }
  registerPreprocessorHandler();
});

app.on('window-all-closed', () => {
  // macOS: keep process alive until explicit Cmd+Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // macOS: re-create window when dock icon clicked with no windows open
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── IPC: File read ───────────────────────────────────────────────────────────

ipcMain.removeHandler('read-file');
ipcMain.handle('read-file', async (_event, filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('read-file: filePath must be a non-empty string');
  }
  const resolved = path.resolve(filePath);
  return fs.promises.readFile(resolved, 'utf8');
});

// ── IPC: Stat file (mtime for save-time conflict check, DEC-034) ────────────

ipcMain.removeHandler('stat-file');
ipcMain.handle('stat-file', async (_event, filePath) => {
  if (!filePath || typeof filePath !== 'string') return { mtimeMs: null };
  try {
    const stat = await fs.promises.stat(path.resolve(filePath));
    return { mtimeMs: stat.mtimeMs };
  } catch {
    return { mtimeMs: null };
  }
});

ipcMain.removeHandler('show-overwrite-dialog');
ipcMain.handle('show-overwrite-dialog', async () => {
  if (!mainWindow) return 'cancel';
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Overwrite', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    message: 'This file has been modified externally.',
    detail: 'Another program changed this file since you opened it. Overwrite with your version?',
  });
  return response === 0 ? 'overwrite' : 'cancel';
});

// ── IPC: File write (atomic temp → rename) ───────────────────────────────────

ipcMain.removeHandler('write-file');
ipcMain.handle('write-file', async (_event, filePath, content) => {
  if (!filePath || typeof filePath !== 'string') {
    return { ok: false, error: 'write-file: filePath must be a non-empty string' };
  }
  if (typeof content !== 'string') {
    return { ok: false, error: 'write-file: content must be a string' };
  }
  const resolved = path.resolve(filePath);
  const dir      = path.dirname(resolved);
  const tmpPath  = path.join(dir, `.antigone-tmp-${Date.now()}-${process.pid}`);

  try {
    await fs.promises.writeFile(tmpPath, content, 'utf8');
    await fs.promises.rename(tmpPath, resolved);  // atomic on same filesystem
  } catch (err) {
    // Clean up temp file if rename failed
    fs.promises.unlink(tmpPath).catch(() => {});
    return { ok: false, error: err.message };
  }
  return { ok: true, path: resolved };
});

// ── IPC: Open dialog ─────────────────────────────────────────────────────────

ipcMain.removeHandler('open-dialog');
ipcMain.handle('open-dialog', async () => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, {
    title:       'Open File',
    properties:  ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mdx'] },
      { name: 'Plain Text', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };
  const filePath = result.filePaths[0];
  const content  = await fs.promises.readFile(filePath, 'utf8');
  addRecentFile(filePath);
  return { canceled: false, path: filePath, content };
});

// ── IPC: Save-as dialog ──────────────────────────────────────────────────────

ipcMain.removeHandler('save-dialog');
ipcMain.handle('save-dialog', async (_event, defaultPath) => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showSaveDialog(mainWindow, {
    title:       'Save File',
    defaultPath: defaultPath || path.join(app.getPath('documents'), 'Untitled.md'),
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Plain Text', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  return { canceled: false, path: result.filePath };
});

// ── IPC: Crash recovery write ────────────────────────────────────────────────
// Renderer calls this on a 30-second interval with the current doc content.
// Written to OS temp dir — NEVER adjacent to the source file.

ipcMain.removeHandler('write-recovery');
ipcMain.handle('write-recovery', async (_event, tabId, content) => {
  if (typeof tabId !== 'string' || typeof content !== 'string') {
    throw new Error('write-recovery: invalid arguments');
  }
  const recoveryDir  = path.join(app.getPath('temp'), 'Antigone-recovery');
  await fs.promises.mkdir(recoveryDir, { recursive: true });
  const recoveryPath = path.join(recoveryDir, `${tabId}.md`);
  await fs.promises.writeFile(recoveryPath, content, 'utf8');
  return { ok: true, path: recoveryPath };
});

ipcMain.removeHandler('read-recovery');
ipcMain.handle('read-recovery', async (_event, tabId) => {
  if (typeof tabId !== 'string') throw new Error('read-recovery: tabId must be string');
  const recoveryPath = path.join(
    app.getPath('temp'), 'Antigone-recovery', `${tabId}.md`
  );
  try {
    const content = await fs.promises.readFile(recoveryPath, 'utf8');
    return { found: true, content };
  } catch {
    return { found: false };
  }
});

ipcMain.removeHandler('delete-recovery');
ipcMain.handle('delete-recovery', async (_event, tabId) => {
  const recoveryPath = path.join(
    app.getPath('temp'), 'Antigone-recovery', `${tabId}.md`
  );
  await fs.promises.unlink(recoveryPath).catch(() => {});
  return { ok: true };
});

// ── IPC: Save image (clipboard paste) ────────────────────────────────────────
// Saves image data to an assets/ directory adjacent to the current file.
// Returns the relative path for Markdown reference.

ipcMain.removeHandler('save-image');
ipcMain.handle('save-image', async (_event, filePath, filename, dataArray) => {
  if (!filePath || !filename || !dataArray) {
    return { ok: false, error: 'save-image: missing arguments' };
  }
  const dir = path.dirname(path.resolve(filePath));
  const assetsDir = path.join(dir, 'assets');
  const imagePath = path.join(assetsDir, filename);

  try {
    await fs.promises.mkdir(assetsDir, { recursive: true });
    await fs.promises.writeFile(imagePath, Buffer.from(dataArray));
    return { ok: true, path: imagePath, relativePath: `./assets/${filename}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── IPC: Export (PDF + HTML) — split to main-export.js ──────────────────────
const { registerExportHandlers } = require('./main-export.js');
registerExportHandlers(() => mainWindow);

// ── IPC: External link ───────────────────────────────────────────────────────
// Renderer sends all external URL clicks here. Never navigates the editor pane.

ipcMain.removeHandler('open-external');
ipcMain.handle('open-external', async (_event, url) => {
  if (typeof url !== 'string' || !url.trim()) return { ok: false };
  let resolved = url;
  // Add https:// if no protocol specified (e.g., www.google.com)
  if (!resolved.match(/^[a-zA-Z]+:/)) resolved = 'https://' + resolved;
  // Only allow http, https, mailto protocols
  if (!resolved.match(/^(https?|mailto):/)) return { ok: false };
  await shell.openExternal(resolved);
  return { ok: true };
});

// ── IPC: Clipboard (HTML) ────────────────────────────────────────────────

ipcMain.removeHandler('clipboard-write-text');
ipcMain.handle('clipboard-write-text', (_event, text) => {
  if (typeof text !== 'string') return { ok: false };
  clipboard.writeText(text);
  return { ok: true };
});

ipcMain.removeHandler('clipboard-read-text');
ipcMain.handle('clipboard-read-text', () => {
  return clipboard.readText();
});

ipcMain.removeHandler('clipboard-write-html');
ipcMain.handle('clipboard-write-html', (_event, html, fallbackText) => {
  if (typeof html !== 'string') return { ok: false };
  clipboard.write({ text: fallbackText || '', html });
  return { ok: true };
});

// ── IPC: Native theme ────────────────────────────────────────────────────────

ipcMain.removeHandler('get-native-theme');
ipcMain.handle('get-native-theme', () => ({
  shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
}));

nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('native-theme-updated', {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
  });
});

// ── IPC: App paths ───────────────────────────────────────────────────────────

ipcMain.removeHandler('get-app-paths');
ipcMain.handle('get-app-paths', () => ({
  userData: app.getPath('userData'),   // ~/Library/Application Support/Antigone/
  temp:     app.getPath('temp'),
  home:     app.getPath('home'),
}));

// ── IPC: List recovery files ────────────────────────────────────────────────

ipcMain.removeHandler('list-recovery');
ipcMain.handle('list-recovery', async () => {
  const recoveryDir = path.join(app.getPath('temp'), 'Antigone-recovery');
  try {
    const files = await fs.promises.readdir(recoveryDir);
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => ({ tabId: f.replace('.md', ''), path: path.join(recoveryDir, f) }));
  } catch {
    return [];
  }
});

// ── IPC: Preferences (electron-store) ───────────────────────────────────────

ipcMain.removeHandler('get-prefs');
ipcMain.handle('get-prefs', async () => {
  const s = await getStore();
  return s.store;
});

ipcMain.removeHandler('set-prefs');
ipcMain.handle('set-prefs', async (_event, delta) => {
  const s = await getStore();
  s.set(delta);
});

ipcMain.removeHandler('set-native-theme');
ipcMain.handle('set-native-theme', (_event, source) => {
  nativeTheme.themeSource = source; // 'light' | 'dark' | 'system'
});

// ── Security: block navigation and new-window ─────────────────────────────────

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});
