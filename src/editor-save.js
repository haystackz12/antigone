// src/editor-save.js
// Save, auto-save, crash recovery, and external file-change detection.
// Split from editor.js to respect the 400-line cap.
// Architecture: all file I/O via window.api (contextBridge) only.

'use strict';

// ─── Module state ─────────────────────────────────────────────────────────────
let autoSaveTimer      = null;
let recoveryId         = null;
let recoveryTimer      = null;
let suppressWatchUntil = 0;

// ─── Accessors (set by editor.js via configure()) ─────────────────────────────
let getView         = null;
let getCurrentPath  = null;
let setCurrentPath  = null;
let getIsDirty      = null;
let setDirty        = null;
let updateTabBar    = null;

/**
 * Called once by editor.js to provide accessor functions.
 * Avoids circular requires — editor-save never requires editor.
 */
function configure(opts) {
  getView        = opts.getView;
  getCurrentPath = opts.getCurrentPath;
  setCurrentPath = opts.setCurrentPath;
  getIsDirty     = opts.getIsDirty;
  setDirty       = opts.setDirty;
  updateTabBar   = opts.updateTabBar;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function saveFile(targetPath) {
  const view = getView();
  if (!view) return;
  if (!targetPath) return saveFileAs();

  const content = view.state.doc.toString();
  const result  = await window.api.writeFile(targetPath, content);
  if (result.ok) {
    suppressWatchUntil = Date.now() + 1000; // suppress self-triggered watch for 1s
    setCurrentPath(targetPath);
    setDirty(false);
    updateTabBar(fileNameFromPath(targetPath), false);
    showSavedIndicator();
    window.api.startWatching(targetPath);
  }
}

async function saveFileAs() {
  const currentPath = getCurrentPath();
  const result = await window.api.saveDialog(currentPath);
  if (!result || result.canceled) return;
  if (currentPath) window.api.stopWatching(currentPath);
  await saveFile(result.path);
}

function fileNameFromPath(filePath) {
  if (!filePath) return 'Untitled';
  return filePath.split(/[/\\]/).pop();
}

// ─── Saved indicator ──────────────────────────────────────────────────────────

function showSavedIndicator() {
  const el = document.getElementById('saved-indicator');
  const statusSave = document.getElementById('status-save');
  if (el) {
    el.textContent = 'Saved \u2713';
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 1500);
  }
  if (statusSave) {
    statusSave.textContent = 'Saved \u2713';
    statusSave.dataset.state = 'saved';
  }
}

// ─── Auto-save (debounce on doc change) ───────────────────────────────────────

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  const currentPath = getCurrentPath();
  if (currentPath) {
    autoSaveTimer = setTimeout(() => saveFile(currentPath), 800);
  }
}

// ─── Crash recovery ───────────────────────────────────────────────────────────

function startRecovery() {
  recoveryId = crypto.randomUUID();
  recoveryTimer = setInterval(async () => {
    const view = getView();
    if (!getIsDirty() || !view) return;
    const content = view.state.doc.toString();
    await window.api.writeRecovery(recoveryId, content);
  }, 30_000);
}

function stopRecovery() {
  clearInterval(recoveryTimer);
  if (recoveryId) {
    window.api.deleteRecovery(recoveryId).catch(() => {});
    recoveryId = null;
  }
}

async function checkRecovery() {
  const files = await window.api.listRecovery();
  if (!files || files.length === 0) return;

  const banner = document.getElementById('recovery-banner');
  if (!banner) return;
  banner.hidden = false;

  const restoreBtn = document.getElementById('btn-restore-recovery');
  const dismissBtn = document.getElementById('btn-dismiss-recovery');

  if (restoreBtn) {
    restoreBtn.onclick = async () => {
      const entry = files[0];
      const recovery = await window.api.readRecovery(entry.tabId);
      if (recovery.found) {
        const view = getView();
        if (view) {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: recovery.content },
          });
          setDirty(true);
          updateTabBar('Recovered', true);
        }
      }
      // Clean up all recovery files
      for (const f of files) {
        await window.api.deleteRecovery(f.tabId).catch(() => {});
      }
      banner.hidden = true;
    };
  }

  if (dismissBtn) {
    dismissBtn.onclick = async () => {
      for (const f of files) {
        await window.api.deleteRecovery(f.tabId).catch(() => {});
      }
      banner.hidden = true;
    };
  }
}

// ─── External file change detection ──────────────────────────────────────────

function setupFileChangedListener() {
  window.api.onFileChanged((changedPath) => {
    const currentPath = getCurrentPath();
    if (changedPath !== currentPath) return;
    if (Date.now() < suppressWatchUntil) return; // ignore self-triggered watch
    showFileChangedBanner();
  });
}

function showFileChangedBanner() {
  const banner = document.getElementById('file-changed-banner');
  if (!banner) return;
  banner.hidden = false;

  // Pause auto-save while banner is shown
  clearTimeout(autoSaveTimer);

  const reloadBtn = document.getElementById('btn-reload-file');
  const keepBtn   = document.getElementById('btn-keep-mine');

  if (reloadBtn) {
    reloadBtn.onclick = async () => {
      const currentPath = getCurrentPath();
      if (!currentPath) return;
      const content = await window.api.readFile(currentPath);
      const view = getView();
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: content },
        });
        setDirty(false);
        updateTabBar(fileNameFromPath(currentPath), false);
      }
      banner.hidden = true;
    };
  }

  if (keepBtn) {
    keepBtn.onclick = () => {
      banner.hidden = true;
    };
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  configure,
  saveFile,
  saveFileAs,
  scheduleAutoSave,
  startRecovery,
  stopRecovery,
  checkRecovery,
  setupFileChangedListener,
  showSavedIndicator,
};
