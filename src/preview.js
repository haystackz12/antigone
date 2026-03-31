// src/preview.js
// Markdown preview rendering: marked.js + DOMPurify pipeline.
// Listens to editor:change events, renders HTML into #preview-content.
// Scroll sync uses ratio-based approach with deadband to prevent loops.

'use strict';

const { marked } = require('marked');
const DOMPurify  = require('dompurify');

let debounceTimer = null;
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

// ─── Scroll sync (deadband-based) ────────────────────────────────────────────

const SCROLL_DEADBAND_MS = 50;
let lastScrollSource = null;
let lastScrollTime = 0;

function onEditorScroll() {
  const now = Date.now();
  if (lastScrollSource === 'preview' && now - lastScrollTime < SCROLL_DEADBAND_MS) return;
  lastScrollSource = 'editor';
  lastScrollTime = now;

  const scroller = document.querySelector('.cm-scroller');
  const preview = document.getElementById('preview-pane');
  if (!scroller || !preview) return;

  const scrollerMax = scroller.scrollHeight - scroller.clientHeight;
  if (scrollerMax <= 0) return;

  const ratio = scroller.scrollTop / scrollerMax;
  const previewMax = preview.scrollHeight - preview.clientHeight;
  preview.scrollTop = ratio * Math.max(0, previewMax);
}

function onPreviewScroll() {
  const now = Date.now();
  if (lastScrollSource === 'editor' && now - lastScrollTime < SCROLL_DEADBAND_MS) return;
  lastScrollSource = 'preview';
  lastScrollTime = now;

  const scroller = document.querySelector('.cm-scroller');
  const preview = document.getElementById('preview-pane');
  if (!scroller || !preview) return;

  const previewMax = preview.scrollHeight - preview.clientHeight;
  if (previewMax <= 0) return;

  const ratio = preview.scrollTop / previewMax;
  const scrollerMax = scroller.scrollHeight - scroller.clientHeight;
  scroller.scrollTop = ratio * Math.max(0, scrollerMax);
}

function attachScrollSync() {
  if (scrollSyncAttached) return;
  const scroller = document.querySelector('.cm-scroller');
  const previewPane = document.getElementById('preview-pane');
  if (!scroller || !previewPane) return;
  scroller.addEventListener('scroll', onEditorScroll, { passive: true });
  previewPane.addEventListener('scroll', onPreviewScroll, { passive: true });
  scrollSyncAttached = true;
}

module.exports = { init, render, attachScrollSync };
