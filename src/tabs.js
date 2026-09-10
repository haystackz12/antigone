// src/tabs.js
// Multi-tab state management: open, close, switch tabs.
// Each tab has its own document content, file path, dirty flag, and scroll position.
// Session save/restore via electron-store prefs.

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
const tabs = []; // Array of { id, filePath, content, dirty, scrollTop }
let activeTabId = null;
let nextTabId = 1;

// ─── Accessors ───────────────────────────────────────────────────────────────
let getView         = null;
let getCurrentPath  = null;
let loadContent     = null;
let getIsDirty      = null;
let setDirty        = null;
let guardUnsaved    = null;

function configure(opts) {
  getView        = opts.getView;
  getCurrentPath = opts.getCurrentPath;
  loadContent    = opts.loadContent;
  getIsDirty     = opts.getIsDirty;
  setDirty       = opts.setDirty;
  guardUnsaved   = opts.guardUnsaved;
}

// ─── Tab helpers ─────────────────────────────────────────────────────────────

function fileNameFromPath(p) {
  if (!p) return 'Untitled';
  return p.split(/[/\\]/).pop();
}

function getActiveTab() {
  return tabs.find(t => t.id === activeTabId) || null;
}

function setActiveTabPath(filePath) {
  const tab = getActiveTab();
  if (tab) tab.filePath = filePath;
}

function saveCurrentTabState() {
  const tab = getActiveTab();
  if (!tab) return;
  const view = getView();
  if (view) {
    tab.content = view.state.doc.toString();
    tab.scrollTop = view.scrollDOM.scrollTop;
  }
  tab.filePath = getCurrentPath();
  tab.dirty = getIsDirty();
}

// ─── Render tab bar ──────────────────────────────────────────────────────────

function renderTabBar() {
  const tabbar = document.getElementById('tabbar');
  if (!tabbar) return;

  // Keep only the + button, remove all tab elements
  const newBtn = document.getElementById('btn-new-tab');
  tabbar.innerHTML = '';

  for (const tab of tabs) {
    const btn = document.createElement('button');
    btn.className = 'tab' + (tab.id === activeTabId ? ' tab--active' : '');
    btn.role = 'tab';
    btn.setAttribute('aria-selected', String(tab.id === activeTabId));
    btn.dataset.tabId = tab.id;

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = fileNameFromPath(tab.filePath) || 'Untitled';
    btn.appendChild(title);

    const dot = document.createElement('span');
    dot.className = 'tab-dot';
    dot.setAttribute('aria-hidden', 'true');
    btn.appendChild(dot);
    if (tab.dirty) btn.classList.add('is-unsaved');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.setAttribute('aria-label', 'Close tab');
    closeBtn.tabIndex = -1;
    closeBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">' +
      '<line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeTab(tab.id); });
    btn.appendChild(closeBtn);

    btn.addEventListener('click', () => switchTab(tab.id));
    tabbar.appendChild(btn);
  }

  // Re-append the + button (or recreate if it was removed)
  if (newBtn) {
    tabbar.appendChild(newBtn);
  } else {
    const fresh = document.createElement('button');
    fresh.id = 'btn-new-tab';
    fresh.className = 'tab-new';
    fresh.setAttribute('aria-label', 'New file');
    fresh.title = 'New file (\u2318N)';
    fresh.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">' +
      '<line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    tabbar.appendChild(fresh);
  }

  // Wire + button
  const plusBtn = document.getElementById('btn-new-tab');
  if (plusBtn) {
    const freshPlus = plusBtn.cloneNode(true);
    plusBtn.parentNode.replaceChild(freshPlus, plusBtn);
    freshPlus.addEventListener('click', () => openNewTab());
  }
}

// ─── Tab operations ──────────────────────────────────────────────────────────

function openNewTab(filePath, content) {
  saveCurrentTabState();
  const id = String(nextTabId++);
  tabs.push({
    id,
    filePath: filePath || null,
    content: content || '',
    dirty: false,
    scrollTop: 0,
  });
  activeTabId = id;
  loadContent(content || '', filePath || null);
  setDirty(false);
  renderTabBar();
  saveSession();
}

function switchTab(id) {
  if (id === activeTabId) return;
  saveCurrentTabState();
  activeTabId = id;
  const tab = getActiveTab();
  if (!tab) return;
  loadContent(tab.content, tab.filePath);
  setDirty(tab.dirty);
  // Restore scroll position after content loads
  requestAnimationFrame(() => {
    const view = getView();
    if (view) view.scrollDOM.scrollTop = tab.scrollTop;
  });
  renderTabBar();
  saveSession();
}

async function closeTab(id) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;

  // If closing the active tab, check live dirty state (tab.dirty may be stale)
  if (id === activeTabId && (tab.dirty || getIsDirty())) {
    const ok = await guardUnsaved();
    if (!ok) return;
  } else if (tab.dirty) {
    // Closing a non-active dirty tab — switch to it first to guard
    switchTab(id);
    const ok = await guardUnsaved();
    if (!ok) return;
  }

  const idx = tabs.indexOf(tab);
  tabs.splice(idx, 1);

  if (tabs.length === 0) {
    // Always have at least one tab
    openNewTab();
    return;
  }

  if (id === activeTabId) {
    // Switch to adjacent tab
    const newIdx = Math.min(idx, tabs.length - 1);
    activeTabId = tabs[newIdx].id;
    const newTab = getActiveTab();
    loadContent(newTab.content, newTab.filePath);
    setDirty(newTab.dirty);
  }
  renderTabBar();
  saveSession();
}

// ─── Open file into a tab ────────────────────────────────────────────────────

function openFileInTab(filePath, content) {
  // Check if this file is already open in a tab
  const existing = tabs.find(t => t.filePath === filePath);
  if (existing) {
    switchTab(existing.id);
    return;
  }

  // If current tab is empty and untitled, reuse it
  const active = getActiveTab();
  if (active && !active.filePath && !active.dirty && active.content === '') {
    active.filePath = filePath;
    active.content = content;
    loadContent(content, filePath);
    setDirty(false);
    renderTabBar();
    saveSession();
    return;
  }

  openNewTab(filePath, content);
}

// ─── Session save/restore ────────────────────────────────────────────────────

function saveSession() {
  saveCurrentTabState();
}

async function restoreSession() {
  const prefs = await window.api.getPrefs();
  const session = prefs.session;
  if (!session || !session.tabs || session.tabs.length === 0) {
    openNewTab();
    return;
  }

  for (const saved of session.tabs) {
    if (saved.filePath) {
      try {
        const content = await window.api.readFile(saved.filePath);
        const id = String(nextTabId++);
        tabs.push({
          id,
          filePath: saved.filePath,
          content,
          dirty: false,
          scrollTop: 0,
        });
      } catch {
        // File no longer exists — skip
      }
    } else {
      const id = String(nextTabId++);
      tabs.push({ id, filePath: null, content: '', dirty: false, scrollTop: 0 });
    }
  }

  if (tabs.length === 0) {
    openNewTab();
    return;
  }

  // Restore active tab
  const targetId = session.activeTabId;
  activeTabId = tabs.find(t => t.id === targetId)?.id || tabs[0].id;
  const active = getActiveTab();
  loadContent(active.content, active.filePath);
  setDirty(active.dirty);
  renderTabBar();
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  configure,
  openNewTab,
  switchTab,
  closeTab,
  openFileInTab,
  renderTabBar,
  saveSession,
  restoreSession,
  getActiveTab,
  setActiveTabPath,
  saveCurrentTabState,
};
