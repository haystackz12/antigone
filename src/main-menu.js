// src/main-menu.js
// Native application menu for macOS/Windows/Linux.
// Includes Recent Files submenu backed by electron-store.

'use strict';

const { Menu, app } = require('electron');
const path = require('node:path');

let getMainWindow = null;
let getStore = null;

function buildMenu(recentFiles) {
  const isMac = true; // Antigone is Mac-only
  const win = () => getMainWindow();

  // Recent Files submenu — fresh array each build to avoid shared references
  const recentSubmenu = recentFiles.length === 0
    ? [{ label: 'No Recent Files', enabled: false }]
    : [
        ...recentFiles.slice().map(fp => ({
          label: path.basename(fp),
          click: () => win()?.webContents.send('open-file', fp),
        })),
        { type: 'separator' },
        {
          label: 'Clear Recent Files',
          click: async () => {
            const s = await getStore();
            s.set('recentFiles', []);
            rebuildMenu();
          },
        },
      ];

  const template = [
    // macOS app menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => win()?.webContents.send('menu-preferences'),
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),

    // File
    {
      label: 'File',
      submenu: [
        { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => win()?.webContents.send('menu-new-file') },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => win()?.webContents.send('menu-open-file') },
        { label: 'Recent Files', submenu: recentSubmenu },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => win()?.webContents.send('menu-save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => win()?.webContents.send('menu-save-as') },
        { type: 'separator' },
        { label: 'Export as PDF...', accelerator: 'CmdOrCtrl+Shift+E', click: () => win()?.webContents.send('export-pdf-trigger') },
        { label: 'Export as HTML...', click: () => win()?.webContents.send('export-html-trigger') },
        { type: 'separator' },
        { label: 'Print...', accelerator: 'CmdOrCtrl+P', click: () => win()?.webContents.send('print-doc') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    // Edit
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find...', accelerator: 'CmdOrCtrl+F', click: () => win()?.webContents.send('menu-find') },
        { label: 'Find and Replace...', accelerator: 'CmdOrCtrl+Alt+F', click: () => win()?.webContents.send('menu-replace') },
      ],
    },

    // View
    {
      label: 'View',
      submenu: [
        { label: 'Editor Only', click: () => win()?.webContents.send('menu-view-mode', 'editor') },
        { label: 'Split View', click: () => win()?.webContents.send('menu-view-mode', 'split') },
        { label: 'Preview Only', click: () => win()?.webContents.send('menu-view-mode', 'preview') },
        { type: 'separator' },
        { label: 'Toggle Focus Mode', accelerator: 'CmdOrCtrl+Shift+F', click: () => win()?.webContents.send('menu-toggle-focus') },
        { label: 'Toggle Line Numbers', click: () => win()?.webContents.send('menu-toggle-line-numbers') },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
      ],
    },

    // Window
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

async function rebuildMenu() {
  const s = await getStore();
  const recents = s.get('recentFiles', []);
  try {
    const menu = buildMenu(recents);
    Menu.setApplicationMenu(menu);
  } catch (err) {
    console.error('Menu build failed:', err);
  }
}

async function addRecentFile(filePath) {
  const s = await getStore();
  const recents = s.get('recentFiles', []);
  const updated = [filePath, ...recents.filter(f => f !== filePath)].slice(0, 5);
  s.set('recentFiles', updated);
  await rebuildMenu();
}

async function setupMenu(getMainWindowFn, getStoreFn) {
  getMainWindow = getMainWindowFn;
  getStore = getStoreFn;
  await rebuildMenu();
}

module.exports = { setupMenu, addRecentFile, rebuildMenu };
