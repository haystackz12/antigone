// src/scroll-sync.js
// Line-number based scroll sync (VS Code approach).
// Preview elements have data-line attributes injected by preview.js.
// Syncs by mapping editor line numbers to preview DOM positions.
// Elements are sorted by data-line value, not DOM order, to handle
// out-of-order rendering by marked.js.

'use strict';

let editorView = null;
let scrollerEl = null;
let previewEl  = null;
let animFrameId = null;
let lastEditorLine = -1;
let userScrollingPreview = false;
let previewScrollTimeout = null;
let validationInterval = null;

// ─── Init / Destroy ──────────────────────────────────────────────────────────

function initScrollSync(view) {
  editorView = view;
  scrollerEl = document.querySelector('.cm-scroller');
  previewEl  = document.getElementById('preview-pane');
  if (!scrollerEl || !previewEl) return;

  lastEditorLine = -1;
  startSyncLoop();
  clearInterval(validationInterval);
  validationInterval = setInterval(validateSync, 2000);
}

function destroyScrollSync() {
  stopSyncLoop();
  clearInterval(validationInterval);
  validationInterval = null;
  editorView = null;
  scrollerEl = null;
  previewEl = null;
}

// ─── Sync loop ───────────────────────────────────────────────────────────────

function startSyncLoop() {
  stopSyncLoop();
  if (previewEl) previewEl.addEventListener('scroll', onPreviewScroll, { passive: true });

  function loop() {
    syncEditorToPreview();
    animFrameId = requestAnimationFrame(loop);
  }
  animFrameId = requestAnimationFrame(loop);
}

function stopSyncLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = null;
  if (previewEl) previewEl.removeEventListener('scroll', onPreviewScroll);
}

function onPreviewScroll() {
  userScrollingPreview = true;
  clearTimeout(previewScrollTimeout);
  previewScrollTimeout = setTimeout(() => {
    userScrollingPreview = false;
  }, 150);
  syncPreviewToEditor();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOffsetTop(el) {
  // Calculate offsetTop relative to the preview scroll container
  let top = 0;
  let current = el;
  while (current && current !== previewEl) {
    top += current.offsetTop;
    current = current.offsetParent;
  }
  return top;
}

// ─── Editor → Preview sync ──────────────────────────────────────────────────

function syncEditorToPreview() {
  if (userScrollingPreview) return;
  if (!editorView || !scrollerEl || !previewEl) return;

  const topPos = scrollerEl.scrollTop;
  const lineBlock = editorView.lineBlockAtHeight(topPos);
  const currentLine = editorView.state.doc.lineAt(lineBlock.from).number;

  if (currentLine === lastEditorLine) return;
  lastEditorLine = currentLine;

  const target = findClosestLineElement(currentLine);
  if (!target) return;

  const targetY = getOffsetTop(target);
  if (Math.abs(previewEl.scrollTop - targetY) > 5) {
    previewEl.scrollTop = targetY;
  }
}

// ─── Preview → Editor sync ──────────────────────────────────────────────────

function syncPreviewToEditor() {
  if (!editorView || !scrollerEl || !previewEl) return;

  const previewScrollMid = previewEl.scrollTop + previewEl.clientHeight / 3;
  const elements = Array.from(previewEl.querySelectorAll('[data-line]'));
  if (!elements.length) return;

  // Sort by visual position (offsetTop) to handle out-of-order DOM
  elements.sort((a, b) => getOffsetTop(a) - getOffsetTop(b));

  // Find last element whose visual position <= scroll upper-third
  let closest = elements[0];
  for (const el of elements) {
    if (getOffsetTop(el) <= previewScrollMid) {
      closest = el;
    }
  }

  if (!closest) return;
  const targetLine = parseInt(closest.dataset.line, 10);
  if (!targetLine || targetLine < 1) return;

  try {
    const totalLines = editorView.state.doc.lines;
    const line = editorView.state.doc.line(Math.min(targetLine, totalLines));
    const coords = editorView.coordsAtPos(line.from);
    if (coords) {
      const scrollerRect = scrollerEl.getBoundingClientRect();
      const newScroll = coords.top + scrollerEl.scrollTop - scrollerRect.top;
      if (Math.abs(scrollerEl.scrollTop - newScroll) > 5) {
        scrollerEl.scrollTop = newScroll;
        lastEditorLine = -1;
      }
    }
  } catch {}
}

// ─── Find closest data-line element by line number ──────────────────────────

function findClosestLineElement(targetLine) {
  if (!previewEl) return null;
  const elements = Array.from(previewEl.querySelectorAll('[data-line]'));
  if (!elements.length) return null;

  // Sort by data-line value ascending
  elements.sort((a, b) =>
    parseInt(a.dataset.line, 10) - parseInt(b.dataset.line, 10)
  );

  // Find last element whose line number <= targetLine
  let best = elements[0];
  for (const el of elements) {
    const elLine = parseInt(el.dataset.line, 10);
    if (isNaN(elLine)) continue;
    if (elLine <= targetLine) {
      best = el;
    }
  }
  return best;
}

// ─── Drift validation (runs every 2s) ────────────────────────────────────────

function validateSync() {
  if (!editorView || !scrollerEl || !previewEl) return;
  if (userScrollingPreview) return;

  const topPos = scrollerEl.scrollTop;
  const lineBlock = editorView.lineBlockAtHeight(topPos);
  const currentLine = editorView.state.doc.lineAt(lineBlock.from).number;

  const target = findClosestLineElement(currentLine);
  if (!target) return;

  const expectedY = getOffsetTop(target);
  const drift = Math.abs(expectedY - previewEl.scrollTop);

  if (drift > 100) {
    previewEl.scrollTop = expectedY;
    lastEditorLine = -1;

    const indicator = document.getElementById('sync-indicator');
    if (indicator) {
      indicator.textContent = '\u27F3 Synced';
      indicator.style.opacity = '1';
      setTimeout(() => { indicator.style.opacity = '0'; }, 1000);
    }
  }
}

// ─── API compatibility stubs ─────────────────────────────────────────────────

function buildSyncMap() {}
function scheduleRebuild() {}

module.exports = { initScrollSync, destroyScrollSync, buildSyncMap, scheduleRebuild };
