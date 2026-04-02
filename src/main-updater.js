'use strict';

// ─── Antigone · main-updater.js ─────────────────────────────────────────────
// Auto-updater using electron-updater with GitHub Releases.
// Checks for updates on launch and every 4 hours.
// Notifies the renderer via IPC when an update is downloaded.
// ─────────────────────────────────────────────────────────────────────────────

const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');

/** @type {() => import('electron').BrowserWindow | null} */
let getWindow = null;

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Initialize the auto-updater.
 * @param {() => import('electron').BrowserWindow | null} windowGetter
 */
function setupAutoUpdater(windowGetter) {
  getWindow = windowGetter;

  // Don't auto-download — let us control the flow
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Suppress built-in dialogs — we use custom IPC
  autoUpdater.logger = null;

  autoUpdater.on('update-available', (info) => {
    const win = getWindow();
    if (win) {
      win.webContents.send('update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes || '',
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    const win = getWindow();
    if (win) {
      win.webContents.send('update-ready', {
        version: info.version,
        releaseNotes: info.releaseNotes || '',
      });
    }
  });

  autoUpdater.on('error', (err) => {
    // Silently ignore update errors — user should never be blocked
    if (process.env.NODE_ENV === 'development') {
      console.error('[updater] Error:', err.message);
    }
  });

  // IPC: renderer requests install-and-restart
  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // IPC: renderer requests a manual check
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        available: !!result?.updateInfo,
        version: result?.updateInfo?.version || null,
      };
    } catch {
      return { available: false, version: null };
    }
  });

  // Initial check — delay 10s to not slow down launch
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 10_000);

  // Periodic check
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, CHECK_INTERVAL_MS);
}

module.exports = { setupAutoUpdater };
