// src/tags.js
// Tag scanning, sidebar display, click-to-jump, and tag rename.
// Scans document for #tag patterns AND YAML frontmatter tags: field.
// Listens to editor:change events, debounces scan.

'use strict';

let getView = null;
let debounceTimer = null;
const TAG_REGEX = /(?:^|\s)#([a-zA-Z][\w-]*)/g;

function configure(opts) {
  getView = opts.getView;
}

// ─── YAML frontmatter tag parsing ───────────────────────────────────────────

function parseFrontmatterTags(text) {
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return [];

  const fm = fmMatch[1];
  // Match tags: [tag1, tag2] or tags:\n  - tag1\n  - tag2
  const tagsLine = fm.match(/^tags:\s*\[(.+)\]/m);
  if (tagsLine) {
    return tagsLine[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean);
  }

  const tagsList = fm.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (tagsList) {
    return tagsList[1].split('\n')
      .map(l => l.replace(/^\s+-\s+/, '').trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }

  // Single tag: tags: mytag
  const singleTag = fm.match(/^tags:\s+(.+)$/m);
  if (singleTag) {
    return [singleTag[1].trim().replace(/['"]/g, '')];
  }

  return [];
}

// ─── Scan document for tags ──────────────────────────────────────────────────

function scanTags(text) {
  const tags = new Map(); // tag name → array of char offsets

  // Inline #tags
  let match;
  TAG_REGEX.lastIndex = 0;
  while ((match = TAG_REGEX.exec(text)) !== null) {
    const tag = match[1];
    const offset = match.index + match[0].indexOf('#');
    if (!tags.has(tag)) tags.set(tag, []);
    tags.get(tag).push(offset);
  }

  // Frontmatter tags (no char offset — they're metadata, not inline)
  const fmTags = parseFrontmatterTags(text);
  for (const tag of fmTags) {
    if (!tags.has(tag)) tags.set(tag, []);
    // Mark as frontmatter tag with offset -1
    if (!tags.get(tag).includes(-1)) tags.get(tag).push(-1);
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

  // Expand sidebar if collapsed and show tags section
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.dataset.collapsed === 'true') {
    sidebar.dataset.collapsed = 'false';
  }

  // Auto-show tags section
  section.classList.remove('sidebar-section--hidden');
  const tagsTab = document.querySelector('.sidebar-tab[data-section="tags"]');
  if (tagsTab) {
    document.querySelectorAll('.sidebar-tab').forEach(t => {
      t.classList.toggle('sidebar-tab--active', t === tagsTab);
      t.setAttribute('aria-selected', String(t === tagsTab));
    });
    document.querySelectorAll('#sidebar-content .sidebar-section').forEach(s => {
      s.classList.toggle('sidebar-section--hidden', s.dataset.section !== 'tags');
    });
  }

  const list = document.createElement('ul');
  list.className = 'tag-list';

  const sorted = [...tags.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  for (const [tag, offsets] of sorted) {
    const li = document.createElement('li');
    li.className = 'tag-item';

    const btn = document.createElement('button');
    btn.className = 'tag-btn';
    btn.textContent = `#${tag}`;

    const inlineCount = offsets.filter(o => o >= 0).length;
    const hasFrontmatter = offsets.includes(-1);
    const label = hasFrontmatter ? `${inlineCount} inline + frontmatter` : `${inlineCount} occurrence${inlineCount !== 1 ? 's' : ''}`;
    btn.title = label;

    const count = document.createElement('span');
    count.className = 'tag-count';
    count.textContent = hasFrontmatter ? `${inlineCount}+fm` : String(inlineCount);

    btn.appendChild(count);

    // Click to jump to first inline occurrence
    btn.addEventListener('click', () => {
      const view = getView();
      if (!view) return;
      const firstInline = offsets.find(o => o >= 0);
      if (firstInline === undefined) return;
      view.dispatch({ selection: { anchor: firstInline }, scrollIntoView: true });
      view.focus();
    });

    // Right-click to rename
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      renameTag(tag);
    });

    li.appendChild(btn);
    list.appendChild(li);
  }

  section.innerHTML = '';
  section.appendChild(list);
}

// ─── Tag rename ─────────────────────────────────────────────────────────────

function renameTag(oldTag) {
  const view = getView();
  if (!view) return;

  // Show inline rename input
  const overlay = document.createElement('div');
  overlay.id = 'tag-rename-overlay';
  overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:600;background:var(--color-surface-0,#faf9f7);border:1px solid var(--color-border,#d5d1c8);border-radius:8px;padding:16px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;gap:8px;align-items:center;';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldTag;
  input.style.cssText = 'padding:4px 8px;border:1px solid var(--color-border);border-radius:4px;font-size:14px;width:200px;';

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Rename';
  confirmBtn.style.cssText = 'padding:4px 12px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-accent);color:var(--color-text-inverse);cursor:pointer;font-size:13px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'padding:4px 12px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-surface-2);cursor:pointer;font-size:13px;';

  overlay.appendChild(input);
  overlay.appendChild(confirmBtn);
  overlay.appendChild(cancelBtn);
  document.body.appendChild(overlay);
  input.focus();
  input.select();

  function doRename() {
    const newTag = input.value.trim().replace(/^#/, '');
    if (newTag && newTag !== oldTag) {
      const doc = view.state.doc.toString();
      const changes = [];
      const regex = new RegExp(`#${oldTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      let m;
      while ((m = regex.exec(doc)) !== null) {
        changes.push({ from: m.index, to: m.index + m[0].length, insert: `#${newTag}` });
      }
      if (changes.length > 0) {
        view.dispatch({ changes });
      }
    }
    overlay.remove();
  }

  confirmBtn.onclick = doRename;
  cancelBtn.onclick = () => overlay.remove();
  input.onkeydown = (e) => {
    if (e.key === 'Enter') doRename();
    if (e.key === 'Escape') overlay.remove();
  };
}

// ─── Sidebar tab switching ───────────────────────────────────────────────────

function setupSidebarTabs() {
  const tabs = document.querySelectorAll('#sidebar-nav .sidebar-tab');
  const sections = document.querySelectorAll('#sidebar-content .sidebar-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.section;
      tabs.forEach(t => {
        t.classList.toggle('sidebar-tab--active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      sections.forEach(s => {
        s.classList.toggle('sidebar-section--hidden', s.dataset.section !== target);
      });
    });
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  setupSidebarTabs();

  window.addEventListener('editor:change', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const tags = scanTags(e.detail.content);
      updateSidebar(tags);
    }, 300);
  });
}

module.exports = { configure, init, scanTags };
