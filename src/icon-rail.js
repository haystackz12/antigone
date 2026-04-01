// src/icon-rail.js
// Icon rail: left-edge 52px rail with Focus, Tags, TOC buttons.
// Opens/closes right panel sections. Focus is a toggle, not a panel.

'use strict';

let toggleFocusMode = null;

function configure(opts) {
  toggleFocusMode = opts.toggleFocusMode;
}

function init() {
  const railButtons = document.querySelectorAll('.rail-btn');
  const rightPanel = document.getElementById('right-panel');
  const panelSections = document.querySelectorAll('.panel-section');

  // Ensure panel is hidden on init
  if (rightPanel) rightPanel.hidden = true;

  function activateRailBtn(btn) {
    const panelId = btn.dataset.panel;

    // Focus mode is a toggle, not a panel
    if (btn.id === 'rail-focus') {
      btn.classList.toggle('active');
      if (toggleFocusMode) toggleFocusMode();
      return;
    }

    // If already active — close the panel
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      if (rightPanel) rightPanel.hidden = true;
      return;
    }

    // Deactivate all other rail buttons (except focus which is independent)
    railButtons.forEach(b => {
      if (b.id !== 'rail-focus') b.classList.remove('active');
    });
    btn.classList.add('active');

    // Show correct panel section
    panelSections.forEach(s => s.hidden = true);
    const targetPanel = document.getElementById(panelId);
    if (targetPanel && rightPanel) {
      targetPanel.hidden = false;
      rightPanel.hidden = false;
    }
  }

  railButtons.forEach(btn => {
    btn.addEventListener('click', () => activateRailBtn(btn));
  });

  // Close buttons inside panels
  document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
      railButtons.forEach(b => {
        if (b.id !== 'rail-focus') b.classList.remove('active');
      });
      if (rightPanel) rightPanel.hidden = true;
    });
  });
}

function openTagsPanel() {
  const tagsBtn = document.getElementById('rail-tags');
  if (tagsBtn && !tagsBtn.classList.contains('active')) {
    tagsBtn.click();
  }
}

function closeTagsPanel() {
  const tagsBtn = document.getElementById('rail-tags');
  if (tagsBtn && tagsBtn.classList.contains('active')) {
    tagsBtn.click();
  }
}

module.exports = { configure, init, openTagsPanel, closeTagsPanel };
