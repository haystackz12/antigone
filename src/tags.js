// src/tags.js
// Tag scanning, sidebar display, and click-to-jump.
// Scans document for #tag patterns, populates the tag sidebar section.
// Listens to editor:change events, debounces scan.

'use strict';

let getView = null;
let debounceTimer = null;
const TAG_REGEX = /(?:^|\s)#([a-zA-Z][\w-]*)/g;

function configure(opts) {
  getView = opts.getView;
}

// ─── Scan document for tags ──────────────────────────────────────────────────

function scanTags(text) {
  const tags = new Map(); // tag name → array of char offsets
  let match;
  TAG_REGEX.lastIndex = 0;
  while ((match = TAG_REGEX.exec(text)) !== null) {
    const tag = match[1];
    const offset = match.index + match[0].indexOf('#');
    if (!tags.has(tag)) tags.set(tag, []);
    tags.get(tag).push(offset);
  }
  return tags;
}

// ─── Update sidebar ─────────────────────────────────────────────────────────

function updateSidebar(tags) {
  const section = document.querySelector('.sidebar-section[data-section="tags"]');
  if (!section) return;

  if (tags.size === 0) {
    section.innerHTML = '<p class="sidebar-empty">No tags yet</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'tag-list';

  // Sort tags alphabetically
  const sorted = [...tags.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  for (const [tag, offsets] of sorted) {
    const li = document.createElement('li');
    li.className = 'tag-item';

    const btn = document.createElement('button');
    btn.className = 'tag-btn';
    btn.textContent = `#${tag}`;
    btn.title = `${offsets.length} occurrence${offsets.length > 1 ? 's' : ''}`;

    const count = document.createElement('span');
    count.className = 'tag-count';
    count.textContent = String(offsets.length);

    btn.appendChild(count);

    // Click to jump to first occurrence
    btn.addEventListener('click', () => {
      const view = getView();
      if (!view) return;
      const pos = offsets[0];
      view.dispatch({
        selection: { anchor: pos },
        scrollIntoView: true,
      });
      view.focus();
    });

    li.appendChild(btn);
    list.appendChild(li);
  }

  section.innerHTML = '';
  section.appendChild(list);
}

// ─── Sidebar tab switching ───────────────────────────────────────────────────

function setupSidebarTabs() {
  const tabs = document.querySelectorAll('#sidebar-nav .sidebar-tab');
  const sections = document.querySelectorAll('#sidebar-content .sidebar-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.section;

      // Update active tab
      tabs.forEach(t => {
        t.classList.toggle('sidebar-tab--active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });

      // Show matching section, hide others
      sections.forEach(s => {
        s.classList.toggle('sidebar-section--hidden', s.dataset.section !== target);
      });
    });
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  setupSidebarTabs();

  // Listen for editor content changes (debounced)
  window.addEventListener('editor:change', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const tags = scanTags(e.detail.content);
      updateSidebar(tags);
    }, 300);
  });
}

module.exports = { configure, init, scanTags };
