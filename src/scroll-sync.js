// src/scroll-sync.js
// Anchor-based scroll sync for split view.
// Builds a sync map from heading positions in editor (CM6) and preview (DOM),
// then interpolates scroll position between anchor pairs.
// Uses a polling loop (not scroll events) to prevent feedback loops.

'use strict';

let syncMap = [];   // Array of { editorY, previewY }
let editorView = null;
let scrollerEl = null;
let previewEl  = null;
let rebuildTimer = null;

// Polling loop state
let animFrameId = null;
let lastEditorScroll = 0;
let lastPreviewScroll = 0;

// ─── Init / Destroy ──────────────────────────────────────────────────────────

function initScrollSync(view) {
  editorView = view;
  scrollerEl = document.querySelector('.cm-scroller');
  previewEl  = document.getElementById('preview-pane');
  if (!scrollerEl || !previewEl) return;

  buildSyncMap();
  lastEditorScroll = scrollerEl.scrollTop;
  lastPreviewScroll = previewEl.scrollTop;
  startSyncLoop();
}

function destroyScrollSync() {
  stopSyncLoop();
  syncMap = [];
  editorView = null;
}

// ─── Polling loop ────────────────────────────────────────────────────────────

function startSyncLoop() {
  stopSyncLoop();
  function loop() {
    if (!scrollerEl || !previewEl) return;

    const editorScroll = scrollerEl.scrollTop;
    const previewScroll = previewEl.scrollTop;

    if (editorScroll !== lastEditorScroll) {
      // Editor moved — sync to preview
      const targetY = interpolate(editorScroll, 'editorY', 'previewY');
      if (Math.abs(previewEl.scrollTop - targetY) > 2) {
        previewEl.scrollTop = targetY;
      }
      lastEditorScroll = editorScroll;
      lastPreviewScroll = previewEl.scrollTop;
    } else if (previewScroll !== lastPreviewScroll) {
      // Preview moved — sync to editor
      const targetY = interpolate(previewScroll, 'previewY', 'editorY');
      if (Math.abs(scrollerEl.scrollTop - targetY) > 2) {
        scrollerEl.scrollTop = targetY;
      }
      lastPreviewScroll = previewScroll;
      lastEditorScroll = scrollerEl.scrollTop;
    }

    animFrameId = requestAnimationFrame(loop);
  }
  animFrameId = requestAnimationFrame(loop);
}

function stopSyncLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = null;
}

// ─── Build sync map ──────────────────────────────────────────────────────────

function buildSyncMap() {
  if (!editorView || !scrollerEl || !previewEl) return;
  syncMap = [];

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

  function stripMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.*?\)/g, '$1')
      .trim().toLowerCase();
  }

  let previewIdx = 0;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const match = line.text.match(headingRe);
    if (!match) continue;

    const headingText = stripMarkdown(match[2]);
    const coords = editorView.coordsAtPos(line.from);
    if (!coords) continue;
    const editorY = coords.top - scrollerRect.top + scrollerEl.scrollTop;

    // Try exact match first, then fuzzy (startsWith) from current position
    let previewY = null;
    for (let j = previewIdx; j < previewMap.length; j++) {
      if (previewMap[j].text === headingText ||
          previewMap[j].text.startsWith(headingText) ||
          headingText.startsWith(previewMap[j].text)) {
        previewY = previewMap[j].y;
        previewIdx = j + 1;
        break;
      }
    }

    // If sequential search missed, try full scan (handles reordering)
    if (previewY === null) {
      for (let j = 0; j < previewMap.length; j++) {
        if (previewMap[j].text === headingText) {
          previewY = previewMap[j].y;
          break;
        }
      }
    }

    if (previewY !== null) {
      syncMap.push({ editorY, previewY });
    }
  }

  const editorMax = scrollerEl.scrollHeight - scrollerEl.clientHeight;
  const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
  if (editorMax > 0 && previewMax > 0) {
    syncMap.push({ editorY: editorMax, previewY: previewMax });
  }

  syncMap.sort((a, b) => a.editorY - b.editorY);

  // Validate: remove entries where previewY didn't increase
  const validated = syncMap.filter((e, i) =>
    i === 0 || e.previewY > syncMap[i - 1].previewY
  );

  if (validated.length < 2) {
    // Map is bad — fall back to simple start+end ratio
    syncMap = [
      { editorY: 0, previewY: 0 },
      { editorY: Math.max(1, editorMax), previewY: Math.max(1, previewMax) },
    ];
  } else {
    syncMap = validated;
  }

  // Diagnostic log — remove after verifying map is correct
  console.log('[sync] map built:', syncMap.length, 'entries, editor height:', editorMax, 'preview height:', previewMax);
  syncMap.forEach((e, i) =>
    console.log(`  [${i}] editorY:${Math.round(e.editorY)} previewY:${Math.round(e.previewY)}`)
  );
}

// ─── Interpolation ───────────────────────────────────────────────────────────

function fallbackRatio(scrollTop, fromKey, toKey) {
  const fromMax = fromKey === 'editorY'
    ? scrollerEl.scrollHeight - scrollerEl.clientHeight
    : previewEl.scrollHeight - previewEl.clientHeight;
  const toMax = toKey === 'editorY'
    ? scrollerEl.scrollHeight - scrollerEl.clientHeight
    : previewEl.scrollHeight - previewEl.clientHeight;
  return (scrollTop / Math.max(1, fromMax)) * toMax;
}

function interpolate(scrollTop, fromKey, toKey) {
  if (syncMap.length < 2) {
    if (!scrollerEl || !previewEl) return 0;
    return fallbackRatio(scrollTop, fromKey, toKey);
  }

  // Find the last heading anchor we've scrolled past
  let activeIndex = 0;
  for (let i = 0; i < syncMap.length; i++) {
    if (syncMap[i][fromKey] <= scrollTop) {
      activeIndex = i;
    }
  }

  const before = syncMap[activeIndex];
  const after = syncMap[Math.min(activeIndex + 1, syncMap.length - 1)];

  if (before === after) return before[toKey];

  const range = after[fromKey] - before[fromKey];
  if (range === 0) return before[toKey];

  const t = Math.max(0, Math.min(1, (scrollTop - before[fromKey]) / range));
  return before[toKey] + t * (after[toKey] - before[toKey]);
}

// ─── Rebuild on content change (debounced) ───────────────────────────────────

function scheduleRebuild() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(buildSyncMap, 500);
}

module.exports = { initScrollSync, destroyScrollSync, buildSyncMap, scheduleRebuild };
