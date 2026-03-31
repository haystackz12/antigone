// src/scroll-sync.js
// Line-number based scroll sync (VS Code approach).
// Preview elements have data-line attributes injected by preview.js.
// Syncs by mapping editor line numbers to preview DOM positions.
// Sync is deferred until the user's first scroll interaction.

'use strict';

let editorView = null;
let scrollerEl = null;
let previewEl  = null;
let animFrameId = null;
let lastEditorLine = -1;
let userScrollingPreview = false;
let previewScrollTimeout = null;

// Sync is disabled until user scrolls for the first time
let syncEnabled = false;

// ─── Init / Destroy ──────────────────────────────────────────────────────────

function initScrollSync(view) {
  editorView = view;
  scrollerEl = document.querySelector('.cm-scroller');
  previewEl  = document.getElementById('preview-pane');
  if (!scrollerEl || !previewEl) return;

  lastEditorLine = -1;
  syncEnabled = false;

  // Enable sync only after user's first scroll in either pane
  function enableSync() {
    syncEnabled = true;
    scrollerEl.removeEventListener('scroll', enableSync);
    previewEl.removeEventListener('scroll', enableSync);
  }
  scrollerEl.addEventListener('scroll', enableSync, { passive: true, once: true });
  previewEl.addEventListener('scroll', enableSync, { passive: true, once: true });

  startSyncLoop();
}

function destroyScrollSync() {
  stopSyncLoop();
  syncEnabled = false;
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
  }, 300);
  syncPreviewToEditor();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOffsetTop(el) {
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
  if (!syncEnabled) return;
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
  if (!syncEnabled) return;
  if (!editorView || !scrollerEl || !previewEl) return;

  const previewScrollMid = previewEl.scrollTop + previewEl.clientHeight / 3;
  const elements = Array.from(previewEl.querySelectorAll('[data-line]'));
  if (!elements.length) return;

  elements.sort((a, b) => getOffsetTop(a) - getOffsetTop(b));

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

  elements.sort((a, b) =>
    parseInt(a.dataset.line, 10) - parseInt(b.dataset.line, 10)
  );

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

// ─── API compatibility stubs ─────────────────────────────────────────────────

function buildSyncMap() {}
function scheduleRebuild() {}

module.exports = { initScrollSync, destroyScrollSync, buildSyncMap, scheduleRebuild };
