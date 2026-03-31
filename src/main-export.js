// src/main-export.js
// Export IPC handlers: PDF and HTML export.
// Split from main.js to respect the 400-line cap.

'use strict';

const { BrowserWindow, ipcMain, dialog } = require('electron');
const fs   = require('node:fs');

function registerExportHandlers(getMainWindow) {

  ipcMain.handle('export-pdf', async (_event, html, defaultPath) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return { ok: false, error: 'No window' };
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export PDF',
      defaultPath: defaultPath || 'Untitled.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: true },
    });
    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    const pdfBuffer = await printWin.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
    });
    printWin.close();

    await fs.promises.writeFile(result.filePath, pdfBuffer);
    return { ok: true, path: result.filePath };
  });

  ipcMain.handle('export-html', async (_event, html, defaultPath) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return { ok: false, error: 'No window' };
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export HTML',
      defaultPath: defaultPath || 'Untitled.html',
      filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };
    await fs.promises.writeFile(result.filePath, html, 'utf8');
    return { ok: true, path: result.filePath };
  });
}

module.exports = { registerExportHandlers };
