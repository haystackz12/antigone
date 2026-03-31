// src/editor-save.js
// Save, crash recovery, and unsaved-changes dialog.
// Split from editor.js to respect the 400-line cap.
// Architecture: all file I/O via window.api (contextBridge) only.

'use strict';

// ─── Module state ─────────────────────────────────────────────────────────────
let autoSaveEnabled = false;
let autoSaveTimer   = null;
let recoveryId      = null;
let recoveryTimer   = null;

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

/**
 * Called once from renderer.js after prefs are loaded.
 * @param {{ autoSave?: boolean }} prefs
 */
function initFromPrefs(prefs) {
  autoSaveEnabled = !!prefs.autoSave;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function saveFile(targetPath) {
  const view = getView();
  if (!view) return;
  if (!targetPath) return saveFileAs();

  const content = view.state.doc.toString();
  // writeFile IPC requires non-empty content — write a newline for empty docs
  const result  = await window.api.writeFile(targetPath, content || '\n');
  if (result.ok) {
    setCurrentPath(targetPath);
    setDirty(false);
    updateTabBar(fileNameFromPath(targetPath), false);
    updateSaveStatus(false);
    showSavedFlash();
  }
}

async function saveFileAs() {
  const currentPath = getCurrentPath();
  const result = await window.api.saveDialog(currentPath);
  if (!result || result.canceled) return;
  await saveFile(result.path);
}

function fileNameFromPath(filePath) {
  if (!filePath) return 'Untitled';
  return filePath.split(/[/\\]/).pop();
}

// ─── Status bar save indicator ───────────────────────────────────────────────

function updateSaveStatus(dirty) {
  const statusSave = document.getElementById('status-save');
  if (!statusSave) return;
  if (dirty) {
    statusSave.textContent = 'Unsaved';
    statusSave.dataset.state = 'unsaved';
  } else {
    statusSave.textContent = 'Saved \u2713';
    statusSave.dataset.state = 'saved';
  }
}

function showSavedFlash() {
  const el = document.getElementById('saved-indicator');
  if (!el) return;
  el.textContent = 'Saved \u2713';
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 1500);
}

// ─── Auto-save (opt-in via prefs) ────────────────────────────────────────────

function scheduleAutoSave() {
  if (!autoSaveEnabled) return;
  clearTimeout(autoSaveTimer);
  const currentPath = getCurrentPath();
  if (currentPath) {
    autoSaveTimer = setTimeout(() => saveFile(currentPath), 800);
  }
}

// ─── Doc changed hook (called from editor.js onDocChange) ────────────────────

function onDirtyChange() {
  updateSaveStatus(true);
  scheduleAutoSave();
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
  const allFiles = await window.api.listRecovery();
  // Filter out current session's recovery file
  const files = (allFiles || []).filter(f => f.tabId !== recoveryId);
  if (files.length === 0) return;

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
          updateSaveStatus(true);
        }
      }
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

// ─── Before-close unsaved check ──────────────────────────────────────────────

function setupBeforeClose() {
  window.api.onBeforeClose(async () => {
    if (!getIsDirty()) {
      stopRecovery(); // clean up recovery file on normal exit
      window.api.closeConfirmed();
      return;
    }
    const result = await window.api.showUnsavedDialog();
    if (result === 'save') {
      await saveFile(getCurrentPath());
      stopRecovery();
      window.api.closeConfirmed();
    } else if (result === 'dontsave') {
      stopRecovery();
      window.api.closeConfirmed();
    }
    // 'cancel' — do nothing, window stays open
  });
}

// ─── Guard: check unsaved changes before replacing document ─────────────────

async function guardUnsavedChanges() {
  if (!getIsDirty()) return true;

  // Don't prompt to save an empty untitled document
  const view = getView();
  if (view && !view.state.doc.toString().trim() && !getCurrentPath()) return true;

  const result = await window.api.showUnsavedDialog();
  if (result === 'save') {
    await saveFile(getCurrentPath());
    return true;
  } else if (result === 'dontsave') {
    return true;
  }
  return false; // cancel
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  configure,
  initFromPrefs,
  saveFile,
  saveFileAs,
  onDirtyChange,
  guardUnsavedChanges,
  startRecovery,
  stopRecovery,
  checkRecovery,
  setupBeforeClose,
  updateSaveStatus,
};
