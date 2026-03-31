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

// ── IPC: Preprocessor (Pro) ─────────────────────────────────────────────────

function registerPreprocessorHandler() {
  const path = require('node:path');

  ipcMain.handle('run-preprocessor', async (_event, cmd, content, filePath) => {
    if (!cmd || typeof cmd !== 'string') return { ok: false, error: 'No command' };
    const { execFile } = require('node:child_process');
    const dir = filePath ? path.dirname(path.resolve(filePath)) : process.cwd();

    return new Promise((resolve) => {
      const parts = cmd.split(/\s+/);
      const proc = execFile(parts[0], parts.slice(1), {
        cwd: dir,
        timeout: 5000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, ANTIGONE_FILE: filePath || '' },
      }, (err, stdout, stderr) => {
        if (err) return resolve({ ok: false, error: err.message || stderr });
        resolve({ ok: true, output: stdout });
      });
      if (proc.stdin) {
        proc.stdin.write(content);
        proc.stdin.end();
      }
    });
  });
}

module.exports = { registerExportHandlers, registerPreprocessorHandler };
