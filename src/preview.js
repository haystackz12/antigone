// src/preview.js
// Markdown preview rendering: marked.js + DOMPurify pipeline.
// Listens to editor:change events, renders HTML into #preview-content.
// Scroll sync delegated to scroll-sync.js.

'use strict';

const { marked } = require('marked');
const DOMPurify  = require('dompurify');
const { buildSyncMap, scheduleRebuild } = require('./scroll-sync.js');

let debounceTimer = null;

// ─── Configure marked ────────────────────────────────────────────────────────

marked.setOptions({
  gfm: true,
  breaks: false,
});

// ─── Render ──────────────────────────────────────────────────────────────────

function render(markdownText) {
  const el = document.getElementById('preview-content');
  if (!el) return;

  // Preprocess pagebreaks before marked — comments get stripped by DOMPurify
  const processed = markdownText.replace(
    /<!--\s*pagebreak\s*-->/gi,
    '\n<div class="page-break"></div>\n'
  );
  const rawHtml = marked.parse(processed);
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    ADD_TAGS: ['div'],
  });
  el.innerHTML = cleanHtml;

  const placeholder = document.getElementById('preview-placeholder');
  if (placeholder) placeholder.style.display = markdownText.trim() ? 'none' : '';

  // Defer sync map build until after browser completes layout
  // Double rAF ensures style calculation + layout are both done
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      buildSyncMap();
    });
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  window.addEventListener('editor:change', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      render(e.detail.content);
      scheduleRebuild();
    }, 150);
  });
}

module.exports = { init, render };
