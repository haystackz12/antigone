// src/toc.js
// Table of Contents: scans document for headings, populates TOC sidebar,
// click-to-scroll. Updates on editor:change events (debounced).

'use strict';

let getView = null;
let debounceTimer = null;

const HEADING_REGEX = /^(#{1,6})\s+(.+)$/gm;

function configure(opts) {
  getView = opts.getView;
}

// ─── Scan headings ───────────────────────────────────────────────────────────

function scanHeadings(text) {
  const headings = [];
  let match;
  HEADING_REGEX.lastIndex = 0;
  while ((match = HEADING_REGEX.exec(text)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      offset: match.index,
    });
  }
  return headings;
}

// ─── Update sidebar ─────────────────────────────────────────────────────────

function updateSidebar(headings) {
  const section = document.querySelector('.sidebar-section[data-section="toc"]');
  if (!section) return;

  const nav = section.querySelector('#toc-nav') || section;

  if (headings.length === 0) {
    nav.innerHTML = '<p class="sidebar-empty">Open a file to see its outline</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'toc-list';

  for (const h of headings) {
    const li = document.createElement('li');
    li.className = `toc-item toc-level-${h.level}`;

    const btn = document.createElement('button');
    btn.className = 'toc-btn';
    btn.textContent = h.text;
    btn.addEventListener('click', () => {
      const view = getView();
      if (!view) return;
      view.dispatch({
        selection: { anchor: h.offset },
        scrollIntoView: true,
      });
      view.focus();
    });

    li.appendChild(btn);
    list.appendChild(li);
  }

  nav.innerHTML = '';
  nav.appendChild(list);
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  window.addEventListener('editor:change', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const headings = scanHeadings(e.detail.content);
      updateSidebar(headings);
    }, 300);
  });
}

module.exports = { configure, init, scanHeadings };
