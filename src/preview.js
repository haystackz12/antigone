// src/preview.js
// Markdown preview rendering: marked.js + DOMPurify pipeline.
// Injects data-line attributes on block elements for line-based scroll sync.
// Split view panes scroll independently (no scroll sync).

'use strict';

const { marked } = require('marked');
const DOMPurify  = require('dompurify');

let debounceTimer = null;

// ─── Line-number tracking for data-line injection ────────────────────────────

let lineMap = new Map(); // heading/block text → source line number

function buildLineMap(markdown) {
  lineMap = new Map();
  const lines = markdown.split('\n');
  let lineNum = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      lineMap.set(headingMatch[1].trim(), i + 1);
    }
  }
  // Track paragraph start lines by finding non-empty lines after blank lines
  let afterBlank = true;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      afterBlank = true;
    } else if (afterBlank && !lines[i].match(/^[#|>-]|\s*```/)) {
      lineMap.set('__para_' + i, i + 1);
      afterBlank = false;
    }
  }
}

// ─── Custom renderer with data-line attributes ──────────────────────────────

function createRenderer() {
  const renderer = new marked.Renderer();
  let paraIndex = 0;

  renderer.heading = function({ text, depth }) {
    const cleanText = text.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim();
    const lineNum = lineMap.get(cleanText) || 0;
    return `<h${depth} data-line="${lineNum}">${text}</h${depth}>\n`;
  };

  renderer.paragraph = function({ text }) {
    const keys = [...lineMap.keys()].filter(k => k.startsWith('__para_'));
    const key = keys[paraIndex];
    const lineNum = key ? lineMap.get(key) : 0;
    paraIndex++;
    // Replace \n with <br> since custom renderer bypasses marked's breaks processing
    const withBreaks = text.replace(/\n/g, '<br>');
    return `<p data-line="${lineNum}">${withBreaks}</p>\n`;
  };

  return renderer;
}

// ─── Configure marked ────────────────────────────────────────────────────────

marked.setOptions({
  gfm: true,
  breaks: true,  // Single \n → <br> (DEC-026: matches writing app expectations)
});

// ─── Post-process inline Markdown that custom renderer didn't handle ─────────

function postProcessInline(html) {
  // Protect existing <a> tags from regex mangling
  const preserved = [];
  let safe = html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (match) => {
    preserved.push(match);
    return `\x00A${preserved.length - 1}\x00`;
  });

  // Convert raw Markdown links [text](url) → <a> tags
  safe = safe.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Apply bold/italic/strikethrough/code
  safe = safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  // Restore preserved <a> tags
  safe = safe.replace(/\x00A(\d+)\x00/g, (_, i) => preserved[parseInt(i)]);

  return safe;
}

// ─── Strip YAML frontmatter ──────────────────────────────────────────────────

function stripFrontmatter(markdown) {
  if (!markdown.startsWith('---')) return markdown;
  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return markdown;
  return markdown.slice(end + 4).trimStart();
}

// ─── Render ──────────────────────────────────────────────────────────────────

function render(markdownText) {
  const el = document.getElementById('preview-content');
  if (!el) return;

  // Strip frontmatter before rendering — tags are parsed by tags.js
  const withoutFrontmatter = stripFrontmatter(markdownText);

  // Preprocess pagebreaks before marked
  const processed = withoutFrontmatter.replace(
    /<!--\s*pagebreak\s*-->/gi,
    '\n<div class="page-break"></div>\n'
  );

  // Build line map and create renderer with data-line injection
  buildLineMap(processed);
  const renderer = createRenderer();

  const rawHtml = marked.parse(processed, { renderer });

  // Post-process: catch raw Markdown inline syntax that the custom
  // renderer passed through without rendering (heading/paragraph overrides
  // use token.text which may contain unprocessed inline markup)
  const postProcessed = postProcessInline(rawHtml);

  const cleanHtml = DOMPurify.sanitize(postProcessed, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'data-line'],
    ADD_TAGS: ['div'],
  });
  el.innerHTML = cleanHtml;

  const placeholder = document.getElementById('preview-placeholder');
  if (placeholder) placeholder.style.display = markdownText.trim() ? 'none' : '';
}

// ─── Link click interceptor ──────────────────────────────────────────────────
// Electron sandbox blocks href navigation. Route through shell.openExternal.

function setupLinkInterceptor() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    e.preventDefault();
    window.api.openExternal(href).catch(() => {});
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  setupLinkInterceptor();

  window.addEventListener('editor:change', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      render(e.detail.content);
    }, 150);
  });
}

module.exports = { init, render };
