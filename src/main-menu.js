// src/main-menu.js
// Native application menu for macOS/Windows/Linux.
// Split from main.js to respect the 400-line cap.

'use strict';

const { Menu, app } = require('electron');

function buildMenu(getMainWindow) {
  const isMac = process.platform === 'darwin';

  const template = [
    // macOS app menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
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
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => getMainWindow()?.webContents.send('menu-new-file'),
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => getMainWindow()?.webContents.send('menu-open-file'),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => getMainWindow()?.webContents.send('menu-save'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => getMainWindow()?.webContents.send('menu-save-as'),
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as PDF...',
              accelerator: 'CmdOrCtrl+Shift+E',
              click: () => getMainWindow()?.webContents.send('export-pdf-trigger'),
            },
            {
              label: 'Export as HTML...',
              click: () => getMainWindow()?.webContents.send('export-html-trigger'),
            },
          ],
        },
        { type: 'separator' },
        {
          label: 'Print...',
          accelerator: 'CmdOrCtrl+P',
          click: () => getMainWindow()?.webContents.send('print-doc'),
        },
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
        {
          label: 'Find...',
          accelerator: 'CmdOrCtrl+F',
          click: () => getMainWindow()?.webContents.send('menu-find'),
        },
        {
          label: 'Find and Replace...',
          accelerator: 'CmdOrCtrl+Alt+F',
          click: () => getMainWindow()?.webContents.send('menu-replace'),
        },
      ],
    },

    // View
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },

    // Window
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [
          { role: 'close' },
        ]),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

function setupMenu(getMainWindow) {
  const menu = buildMenu(getMainWindow);
  Menu.setApplicationMenu(menu);
}

module.exports = { setupMenu };
