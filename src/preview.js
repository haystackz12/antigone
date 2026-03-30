// src/preview.js
// Markdown preview rendering: marked.js + DOMPurify pipeline.
// Listens to editor:change events, renders HTML into #preview-content.
// Scroll sync uses CM6 line-based positioning for accuracy.

'use strict';

const { marked } = require('marked');
const DOMPurify  = require('dompurify');

let debounceTimer = null;
let isSyncingScroll = false;
let scrollSyncAttached = false;
let getView = null;

function configure(opts) {
  getView = opts.getView;
}

// ─── Configure marked ────────────────────────────────────────────────────────

marked.setOptions({
  gfm: true,
  breaks: false,
});

// ─── Render ──────────────────────────────────────────────────────────────────

function render(markdownText) {
  const el = document.getElementById('preview-content');
  if (!el) return;

  const rawHtml = marked.parse(markdownText);
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
  el.innerHTML = cleanHtml;

  // Hide placeholder when content is rendered
  const placeholder = document.getElementById('preview-placeholder');
  if (placeholder) placeholder.style.display = markdownText.trim() ? 'none' : '';
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  window.addEventListener('editor:change', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      render(e.detail.content);
    }, 150);
  });
}

// ─── Scroll sync (line-based) ────────────────────────────────────────────────

function syncScroll(source) {
  if (isSyncingScroll) return;
  isSyncingScroll = true;

  const scroller = document.querySelector('.cm-scroller');
  const preview = document.getElementById('preview-pane');
  if (!scroller || !preview) { isSyncingScroll = false; return; }

  try {
    if (source === 'editor') {
      const view = getView && getView();
      if (view) {
        // Get the top visible line number using CM6 API
        const topBlock = view.lineBlockAtHeight(scroller.scrollTop);
        const lineNum = view.state.doc.lineAt(topBlock.from).number;
        const totalLines = view.state.doc.lines;
        if (totalLines <= 1) { isSyncingScroll = false; return; }
        const ratio = (lineNum - 1) / (totalLines - 1);
        const previewMax = preview.scrollHeight - preview.clientHeight;
        if (previewMax > 0) preview.scrollTop = ratio * previewMax;
      }
    } else {
      const previewMax = preview.scrollHeight - preview.clientHeight;
      if (previewMax <= 0) { isSyncingScroll = false; return; }
      const view = getView && getView();
      if (view) {
        const ratio = preview.scrollTop / previewMax;
        const totalLines = view.state.doc.lines;
        const targetLine = Math.max(1, Math.min(
          Math.round(ratio * (totalLines - 1)) + 1,
          totalLines
        ));
        const lineInfo = view.state.doc.line(targetLine);
        const coords = view.coordsAtPos(lineInfo.from);
        if (coords) {
          scroller.scrollTop = coords.top + scroller.scrollTop
            - scroller.getBoundingClientRect().top;
        }
      }
    }
  } catch {
    // Fallback to simple ratio if line-based fails
    const sourceEl = source === 'editor' ? scroller : preview;
    const targetEl = source === 'editor' ? preview : scroller;
    const sourceMax = sourceEl.scrollHeight - sourceEl.clientHeight;
    if (sourceMax > 0) {
      const targetMax = targetEl.scrollHeight - targetEl.clientHeight;
      if (targetMax > 0) {
        targetEl.scrollTop = (sourceEl.scrollTop / sourceMax) * targetMax;
      }
    }
  }

  requestAnimationFrame(() => { isSyncingScroll = false; });
}

function attachScrollSync() {
  if (scrollSyncAttached) return;
  const scroller = document.querySelector('.cm-scroller');
  const previewPane = document.getElementById('preview-pane');
  if (!scroller || !previewPane) return;
  scroller.addEventListener('scroll', () => syncScroll('editor'), { passive: true });
  previewPane.addEventListener('scroll', () => syncScroll('preview'), { passive: true });
  scrollSyncAttached = true;
}

module.exports = { configure, init, render, attachScrollSync };
