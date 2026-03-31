// src/export.js
// Export: PDF (via Electron printToPDF IPC), HTML (standalone file).
// Pagebreak detection: <!-- pagebreak --> → page-break-before CSS.
// Reuses marked + DOMPurify from preview.js for rendering.

'use strict';

const { marked } = require('marked');
const DOMPurify  = require('dompurify');

let getView = null;
let getCurrentPath = null;

function configure(opts) {
  getView = opts.getView;
  getCurrentPath = opts.getCurrentPath;
}

// ─── Pagebreak processing ────────────────────────────────────────────────────
// Replace <!-- pagebreak --> BEFORE marked/DOMPurify — comments get stripped
// by DOMPurify, so we convert to a <div> that survives sanitization.

function preprocessPagebreaks(markdownText) {
  return markdownText.replace(
    /<!--\s*pagebreak\s*-->/gi,
    '\n<div class="page-break"></div>\n'
  );
}

// ─── Render to standalone HTML ───────────────────────────────────────────────

function renderToHtml(markdownText) {
  const processed = preprocessPagebreaks(markdownText);
  const rawHtml = marked.parse(processed);
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    ADD_TAGS: ['div'],
  });
  return cleanHtml;
}

function buildStandaloneHtml(markdownText, title) {
  const body = renderToHtml(markdownText);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${DOMPurify.sanitize(title || 'Untitled')}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      max-width: 680px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.7;
      color: #1f1d18;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    code {
      font-family: 'SFMono-Regular', Consolas, monospace;
      background: #f0ede8;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre { background: #f0ede8; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 3px solid #d5d1c8;
      padding-left: 1em;
      color: #4a4740;
      margin-left: 0;
    }
    a { color: #0969da; }
    img { max-width: 100%; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d5d1c8; padding: 8px 12px; text-align: left; }
    th { background: #f0ede8; }
    hr { border: none; border-top: 1px solid #d5d1c8; margin: 2em 0; }
    .page-break {
      page-break-after: always;
      break-after: always;
      border-top: 2px dashed #ccc;
      margin: 24px 0;
      height: 0;
    }
    @media print {
      body { max-width: none; padding: 0; }
      .page-break { border: none; margin: 0; page-break-after: always; break-after: always; }
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

// ─── Export PDF ───────────────────────────────────────────────────────────────

async function exportPdf() {
  const view = getView();
  if (!view) return;

  const content = view.state.doc.toString();
  const currentPath = getCurrentPath();
  const defaultName = currentPath
    ? currentPath.replace(/\.[^.]+$/, '.pdf')
    : 'Untitled.pdf';

  const html = buildStandaloneHtml(content, fileNameFromPath(currentPath));
  const result = await window.api.exportPdf(html, defaultName);
  if (result && result.ok) {
    console.log('[export] PDF saved to', result.path);
  }
}

// ─── Export HTML ─────────────────────────────────────────────────────────────

async function exportHtml() {
  const view = getView();
  if (!view) return;

  const content = view.state.doc.toString();
  const currentPath = getCurrentPath();
  const defaultName = currentPath
    ? currentPath.replace(/\.[^.]+$/, '.html')
    : 'Untitled.html';

  const html = buildStandaloneHtml(content, fileNameFromPath(currentPath));
  const result = await window.api.exportHtml(html, defaultName);
  if (result && result.ok) {
    console.log('[export] HTML saved to', result.path);
  }
}

function fileNameFromPath(p) {
  if (!p) return 'Untitled';
  return p.split(/[/\\]/).pop().replace(/\.[^.]+$/, '');
}

// ─── Print ───────────────────────────────────────────────────────────────────

function printDocument() {
  window.print();
}

// ─── Init (keyboard shortcuts + menu handlers) ──────────────────────────────

function init() {
  // Menu triggers from native menu
  window.api.onExportPDF(() => exportPdf());
  window.api.onExportHTML(() => exportHtml());
  window.api.onPrint(() => printDocument());

  // Keyboard shortcuts (fallback for when menu accelerators don't fire)
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey && e.key === 'e') {
      e.preventDefault();
      exportPdf();
    }
  });
}

module.exports = { configure, init, exportPdf, exportHtml, renderToHtml, buildStandaloneHtml };
