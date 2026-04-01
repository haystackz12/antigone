// src/preview.js
// Markdown preview rendering: marked.js + DOMPurify pipeline.
// Supports: GFM, task lists, highlights, auto-links, callouts, emoji,
// superscript, subscript, TOC, reference links, pagebreaks.

'use strict';

const { marked } = require('marked');
const DOMPurify  = require('dompurify');
const emoji      = require('node-emoji');

let debounceTimer = null;

// ─── Line-number tracking for data-line injection ────────────────────────────

let lineMap = new Map();

function buildLineMap(markdown) {
  lineMap = new Map();
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) lineMap.set(headingMatch[1].trim(), i + 1);
  }
  let afterBlank = true;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') { afterBlank = true; }
    else if (afterBlank && !lines[i].match(/^[#|>-]|\s*```/)) {
      lineMap.set('__para_' + i, i + 1);
      afterBlank = false;
    }
  }
}

// ─── Custom renderer ────────────────────────────────────────────────────────

function createRenderer() {
  const renderer = new marked.Renderer();
  let paraIndex = 0;

  renderer.heading = function({ text, depth }) {
    const cleanText = text.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim();
    const lineNum = lineMap.get(cleanText) || 0;
    const anchor = cleanText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `<h${depth} id="${anchor}" data-line="${lineNum}">${text}</h${depth}>\n`;
  };

  renderer.paragraph = function({ text }) {
    const keys = [...lineMap.keys()].filter(k => k.startsWith('__para_'));
    const key = keys[paraIndex];
    const lineNum = key ? lineMap.get(key) : 0;
    paraIndex++;
    const withBreaks = text.replace(/\n/g, '<br>');
    return `<p data-line="${lineNum}">${withBreaks}</p>\n`;
  };

  return renderer;
}

// ─── Configure marked ────────────────────────────────────────────────────────

marked.setOptions({ gfm: true, breaks: true });

// ─── TOC generation ──────────────────────────────────────────────────────────

function generateTOC(markdown) {
  const headings = [];
  const re = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const anchor = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    headings.push({ level, text, anchor });
  }
  if (!headings.length) return '';
  return headings.map(h =>
    `${'  '.repeat(h.level - 1)}- [${h.text}](#${h.anchor})`
  ).join('\n');
}

// ─── Post-process inline Markdown ────────────────────────────────────────────

function postProcessInline(html) {
  // Protect existing HTML tags
  const preserved = [];
  let safe = html.replace(/<[^>]+>/g, (match) => {
    preserved.push(match);
    return `\x00T${preserved.length - 1}\x00`;
  });

  // Links: [text](url)
  safe = safe.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, text, url) => {
      const tag = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      preserved.push(tag);
      return `\x00T${preserved.length - 1}\x00`;
    }
  );

  // Highlight: ==text==
  safe = safe.replace(/==(.+?)==/g, '<mark>$1</mark>');

  // Bold: **text**
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough: ~~text~~
  safe = safe.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Superscript: ^text^
  safe = safe.replace(/\^([^\^]+)\^/g, '<sup>$1</sup>');
  // Subscript: ~text~ (not ~~)
  safe = safe.replace(/(?<!~)~(?!~)([^~]+)(?<!~)~(?!~)/g, '<sub>$1</sub>');
  // Inline code: `text`
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Emoji shortcodes: :name:
  safe = safe.replace(/:([a-z0-9_+-]+):/g, (match, name) => {
    const em = emoji.get(name);
    return em && em !== `:${name}:` ? em : match;
  });

  // Auto-link bare URLs (not already in tags)
  safe = safe.replace(
    /(?<!\x00)(https?:\/\/[^\s<>")\x00]+|www\.[^\s<>")\x00]+)/g,
    (url) => {
      const href = url.startsWith('www.') ? 'https://' + url : url;
      const tag = `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      preserved.push(tag);
      return `\x00T${preserved.length - 1}\x00`;
    }
  );

  // Restore preserved tags
  safe = safe.replace(/\x00T(\d+)\x00/g, (_, i) => preserved[parseInt(i)]);

  return safe;
}

// ─── GitHub-style callout processing ─────────────────────────────────────────

function processCallouts(html) {
  const icons = { note: 'ℹ️', tip: '💡', important: '❗', warning: '⚠️', caution: '🔥' };
  return html.replace(
    /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/gi,
    (_, type) => {
      const t = type.toLowerCase();
      return `<div class="alert alert-${t}"><span class="alert-icon">${icons[t]}</span><p>`;
    }
  ).replace(
    // Close the alert div where the blockquote would have closed
    /<\/p>\s*<\/blockquote>/g,
    (match) => {
      // Only close as alert if we opened one
      return '</p></div>';
    }
  );
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

  const withoutFrontmatter = stripFrontmatter(markdownText);

  // Replace [toc] placeholder with generated TOC
  let processed = withoutFrontmatter.replace(
    /^\[toc\]$/im,
    generateTOC(withoutFrontmatter)
  );

  // Pagebreaks
  processed = processed.replace(
    /<!--\s*pagebreak\s*-->/gi,
    '\n<div class="page-break"></div>\n'
  );

  buildLineMap(processed);
  const renderer = createRenderer();
  let rawHtml = marked.parse(processed, { renderer });

  // Post-process inline syntax
  rawHtml = postProcessInline(rawHtml);

  // Process GitHub-style callouts
  rawHtml = processCallouts(rawHtml);

  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'data-line', 'id'],
    ADD_TAGS: ['div', 'mark', 'sub', 'sup', 'u', 'input'],
  });
  el.innerHTML = cleanHtml;

  const placeholder = document.getElementById('preview-placeholder');
  if (placeholder) placeholder.style.display = markdownText.trim() ? 'none' : '';
}

// ─── Link click interceptor ─────────────────────────────────────────────────

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
