// src/preview.js
// Markdown preview rendering: marked.js + DOMPurify pipeline.
// Listens to editor:change events, renders HTML into #preview-content.

'use strict';

const { marked } = require('marked');
const DOMPurify  = require('dompurify');

let debounceTimer = null;
let isSyncingScroll = false;
let scrollSyncAttached = false;

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

// ─── Scroll sync ─────────────────────────────────────────────────────────────

function syncScroll(source) {
  if (isSyncingScroll) return;
  isSyncingScroll = true;

  const scroller = document.querySelector('.cm-scroller');
  const previewPane = document.getElementById('preview-pane');
  if (!scroller || !previewPane) { isSyncingScroll = false; return; }

  const sourceEl = source === 'editor' ? scroller : previewPane;
  const targetEl = source === 'editor' ? previewPane : scroller;

  const maxScroll = sourceEl.scrollHeight - sourceEl.clientHeight;
  const pct = maxScroll > 0 ? sourceEl.scrollTop / maxScroll : 0;
  targetEl.scrollTop = pct * (targetEl.scrollHeight - targetEl.clientHeight);

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

module.exports = { init, render, attachScrollSync };
