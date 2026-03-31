// src/scroll-sync.js
// Anchor-based scroll sync for split view.
// Builds a sync map from heading positions in editor (CM6) and preview (DOM),
// then interpolates scroll position between anchor pairs.

'use strict';

let syncMap = [];   // Array of { editorY, previewY }
let isSyncing = false;
let editorView = null;
let scrollerEl = null;
let previewEl  = null;
let attached = false;
let rebuildTimer = null;

// ─── Init / Destroy ──────────────────────────────────────────────────────────

function initScrollSync(view) {
  editorView = view;
  scrollerEl = document.querySelector('.cm-scroller');
  previewEl  = document.getElementById('preview-pane');
  if (!scrollerEl || !previewEl) return;

  buildSyncMap();

  if (!attached) {
    scrollerEl.addEventListener('scroll', onEditorScroll, { passive: true });
    previewEl.addEventListener('scroll', onPreviewScroll, { passive: true });
    attached = true;
  }
}

function destroyScrollSync() {
  if (scrollerEl) scrollerEl.removeEventListener('scroll', onEditorScroll);
  if (previewEl)  previewEl.removeEventListener('scroll', onPreviewScroll);
  attached = false;
  syncMap = [];
  editorView = null;
}

// ─── Build sync map ──────────────────────────────────────────────────────────
// Matches headings by text content between editor and preview.

function buildSyncMap() {
  if (!editorView || !scrollerEl || !previewEl) return;
  syncMap = [];

  // Calculate actual first-content positions for origin
  const scrollerRect = scrollerEl.getBoundingClientRect();
  const firstCoords = editorView.coordsAtPos(0);
  const editorOriginY = firstCoords
    ? firstCoords.top - scrollerRect.top + scrollerEl.scrollTop
    : 0;

  const previewContent = previewEl.querySelector('#preview-content');
  if (!previewContent) return;
  const firstPreviewEl = previewContent.firstElementChild;
  const previewOriginY = firstPreviewEl ? firstPreviewEl.offsetTop : 0;

  syncMap.push({ editorY: editorOriginY, previewY: previewOriginY });

  const doc = editorView.state.doc;
  const headingRe = /^(#{1,6})\s+(.+)$/;
  const previewHeadings = previewContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const previewMap = [];
  for (const el of previewHeadings) {
    previewMap.push({
      text: el.textContent.trim().toLowerCase(),
      y: el.offsetTop,
    });
  }

  let previewIdx = 0;

  // Walk document lines looking for headings
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const match = line.text.match(headingRe);
    if (!match) continue;

    const headingText = match[2].trim().toLowerCase();

    // Get editor Y position
    const coords = editorView.coordsAtPos(line.from);
    if (!coords) continue;
    const editorY = coords.top - scrollerRect.top + scrollerEl.scrollTop;

    // Find matching heading in preview by text (sequential search)
    let previewY = null;
    for (let j = previewIdx; j < previewMap.length; j++) {
      if (previewMap[j].text === headingText) {
        previewY = previewMap[j].y;
        previewIdx = j + 1; // advance past this match for next heading
        break;
      }
    }

    if (previewY !== null) {
      syncMap.push({ editorY, previewY });
    }
  }

  // Always add end point
  const editorMax = scrollerEl.scrollHeight - scrollerEl.clientHeight;
  const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
  if (editorMax > 0 && previewMax > 0) {
    syncMap.push({ editorY: editorMax, previewY: previewMax });
  }
}

// ─── Interpolation ───────────────────────────────────────────────────────────

function interpolate(value, fromKey, toKey) {
  if (syncMap.length < 2) {
    // Fallback to ratio
    if (!scrollerEl || !previewEl) return 0;
    const sMax = scrollerEl.scrollHeight - scrollerEl.clientHeight;
    const pMax = previewEl.scrollHeight - previewEl.clientHeight;
    if (sMax <= 0 || pMax <= 0) return 0;
    if (fromKey === 'editorY') return (value / sMax) * pMax;
    return (value / pMax) * sMax;
  }

  // Find surrounding pair
  let before = syncMap[0];
  let after = syncMap[syncMap.length - 1];

  for (let i = 0; i < syncMap.length - 1; i++) {
    if (syncMap[i][fromKey] <= value && syncMap[i + 1][fromKey] >= value) {
      before = syncMap[i];
      after = syncMap[i + 1];
      break;
    }
  }

  const range = after[fromKey] - before[fromKey];
  if (range === 0) return before[toKey];

  const t = (value - before[fromKey]) / range;
  return before[toKey] + t * (after[toKey] - before[toKey]);
}

// ─── Scroll handlers ─────────────────────────────────────────────────────────

function onEditorScroll() {
  if (isSyncing) return;
  isSyncing = true;
  if (scrollerEl && previewEl) {
    previewEl.scrollTop = interpolate(scrollerEl.scrollTop, 'editorY', 'previewY');
  }
  requestAnimationFrame(() => { isSyncing = false; });
}

function onPreviewScroll() {
  if (isSyncing) return;
  isSyncing = true;
  if (scrollerEl && previewEl) {
    scrollerEl.scrollTop = interpolate(previewEl.scrollTop, 'previewY', 'editorY');
  }
  requestAnimationFrame(() => { isSyncing = false; });
}

// ─── Rebuild on content change (debounced) ───────────────────────────────────

function scheduleRebuild() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(buildSyncMap, 500);
}

module.exports = { initScrollSync, destroyScrollSync, buildSyncMap, scheduleRebuild };
