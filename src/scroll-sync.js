// src/scroll-sync.js
// Line-number based scroll sync (VS Code approach).
// Preview elements have data-line attributes injected by preview.js.
// Syncs by mapping editor line numbers to preview DOM positions.

'use strict';

let editorView = null;
let scrollerEl = null;
let previewEl  = null;
let animFrameId = null;
let lastEditorLine = -1;
let lastPreviewScroll = -1;
let userScrollingPreview = false;
let previewScrollTimeout = null;

// ─── Init / Destroy ──────────────────────────────────────────────────────────

function initScrollSync(view) {
  editorView = view;
  scrollerEl = document.querySelector('.cm-scroller');
  previewEl  = document.getElementById('preview-pane');
  if (!scrollerEl || !previewEl) return;

  lastEditorLine = -1;
  lastPreviewScroll = -1;
  startSyncLoop();
}

function destroyScrollSync() {
  stopSyncLoop();
  editorView = null;
  scrollerEl = null;
  previewEl = null;
}

// ─── Sync loop ───────────────────────────────────────────────────────────────

function startSyncLoop() {
  stopSyncLoop();

  previewEl.addEventListener('scroll', onPreviewScroll, { passive: true });

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

// ─── Editor → Preview sync ──────────────────────────────────────────────────

function syncEditorToPreview() {
  if (userScrollingPreview) return;
  if (!editorView || !scrollerEl || !previewEl) return;

  // Get current top visible line in editor
  const topPos = scrollerEl.scrollTop;
  const lineBlock = editorView.lineBlockAtHeight(topPos);
  const currentLine = editorView.state.doc.lineAt(lineBlock.from).number;

  if (currentLine === lastEditorLine) return;
  lastEditorLine = currentLine;

  // Find closest data-line element in preview
  const target = findClosestLineElement(currentLine);
  if (!target) return;

  const targetY = target.offsetTop;
  if (Math.abs(previewEl.scrollTop - targetY) > 5) {
    previewEl.scrollTop = targetY;
    lastPreviewScroll = previewEl.scrollTop;
  }
}

// ─── Preview → Editor sync ──────────────────────────────────────────────────

function syncPreviewToEditor() {
  if (!editorView || !scrollerEl || !previewEl) return;

  // Find which data-line element is at top of preview viewport
  const previewScrollTop = previewEl.scrollTop;
  const elements = previewEl.querySelectorAll('[data-line]');
  if (!elements.length) return;

  let closestEl = null;
  let closestDist = Infinity;

  for (const el of elements) {
    const dist = Math.abs(el.offsetTop - previewScrollTop);
    if (dist < closestDist) {
      closestDist = dist;
      closestEl = el;
    }
  }

  if (!closestEl) return;
  const targetLine = parseInt(closestEl.dataset.line, 10);
  if (!targetLine || targetLine < 1) return;

  // Scroll editor to that line
  try {
    const totalLines = editorView.state.doc.lines;
    const line = editorView.state.doc.line(Math.min(targetLine, totalLines));
    const coords = editorView.coordsAtPos(line.from);
    if (coords) {
      const scrollerRect = scrollerEl.getBoundingClientRect();
      const newScroll = coords.top + scrollerEl.scrollTop - scrollerRect.top;
      if (Math.abs(scrollerEl.scrollTop - newScroll) > 5) {
        scrollerEl.scrollTop = newScroll;
        lastEditorLine = currentLineFromScroll();
      }
    }
  } catch {}
}

function currentLineFromScroll() {
  if (!editorView || !scrollerEl) return -1;
  const lineBlock = editorView.lineBlockAtHeight(scrollerEl.scrollTop);
  return editorView.state.doc.lineAt(lineBlock.from).number;
}

// ─── Find closest data-line element ──────────────────────────────────────────

function findClosestLineElement(lineNum) {
  if (!previewEl) return null;
  const elements = previewEl.querySelectorAll('[data-line]');
  if (!elements.length) return null;

  let closest = null;
  let closestDiff = Infinity;

  for (const el of elements) {
    const elLine = parseInt(el.dataset.line, 10);
    if (isNaN(elLine)) continue;
    const diff = Math.abs(elLine - lineNum);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = el;
    }
  }

  return closest;
}

// ─── API compatibility stubs ─────────────────────────────────────────────────

function buildSyncMap() {}
function scheduleRebuild() {}

module.exports = { initScrollSync, destroyScrollSync, buildSyncMap, scheduleRebuild };
