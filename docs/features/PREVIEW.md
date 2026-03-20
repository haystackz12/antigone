# features/PREVIEW.md
> Read when working on: preview.js, split view, Mermaid diagrams, scroll sync, marked.js configuration.

## Preview pipeline
```
CM6 doc content (string)
  → [preprocessor if configured and Pro — see features/EXPORT.md]
  → marked.parse(content, markedOptions)    ← marked.js 9.x
  → DOMPurify.sanitize(html, purifyConfig)  ← required, no exceptions
  → document.getElementById('preview').innerHTML = sanitized
  → hljs.highlightAll()                     ← syntax highlighting
  → mermaid.run()                           ← diagram rendering
  → buildTOC()                              ← toc.js rebuilds from rendered headings
  → tags.js scans content for #tags
```

## marked.js configuration
```javascript
import { marked } from 'marked';
import hljs from 'highlight.js';

marked.setOptions({
  gfm: true,
  breaks: false,  // true adds <br> for single newlines — set in prefs
  pedantic: false,
});

// Custom renderer for code blocks (adds language label + copy button)
const renderer = new marked.Renderer();
renderer.code = (code, lang) => {
  const language = hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(code, { language }).value;
  return `<pre class="code-block" data-lang="${lang || ''}">
    <div class="code-header">
      <span class="code-lang">${lang || 'text'}</span>
      <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    </div>
    <code class="hljs language-${language}">${highlighted}</code>
  </pre>`;
};
marked.use({ renderer });
```

## DOMPurify configuration
```javascript
import DOMPurify from 'dompurify';

const purifyConfig = {
  ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','br','strong','em','del','code',
    'pre','blockquote','ul','ol','li','table','thead','tbody','tr','th','td',
    'a','img','hr','div','span','input'],
  ALLOWED_ATTR: ['href','src','alt','class','id','type','checked','data-lang',
    'onclick'],  // onclick only for copy-btn — review carefully
  FORCE_BODY: true,
};
// NEVER remove DOMPurify or expand ALLOWED_TAGS without security review
```

## Mermaid setup
```javascript
import mermaid from 'mermaid';
mermaid.initialize({
  startOnLoad: false,
  theme: isDarkMode ? 'dark' : 'default',
  securityLevel: 'strict',  // IMPORTANT: never use 'loose'
});

// After marked renders, find all .language-mermaid code blocks and render them
async function renderMermaid() {
  document.querySelectorAll('code.language-mermaid').forEach(async (el) => {
    const { svg } = await mermaid.render(`mermaid-${Date.now()}`, el.textContent);
    el.closest('pre').outerHTML = `<div class="mermaid-output">${svg}</div>`;
  });
}
```

## Scroll sync
Proportional scroll sync between editor and preview in split-view mode:
```javascript
// On editor scroll:
const editorEl = document.querySelector('.cm-scroller');
editorEl.addEventListener('scroll', throttle(() => {
  const ratio = editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight);
  const previewEl = document.getElementById('preview');
  previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
}, 16)); // ~60fps throttle
// Mirror for preview → editor scroll
// Use a flag to prevent feedback loops: `let syncing = false;`
```

## Preview update debounce
```javascript
let previewTimer;
function schedulePreviewUpdate(content) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => renderPreview(content), 100); // 100ms
}
// Called from CM6 onChange — not from auto-save debounce (they're independent)
```

## Image path resolution
Preview must resolve relative paths against the source file's directory:
```javascript
// After DOMPurify, walk all <img> tags
document.querySelectorAll('#preview img[src]').forEach(img => {
  const src = img.getAttribute('src');
  if (!src.startsWith('http') && !src.startsWith('data:')) {
    const absPath = path.resolve(path.dirname(currentFilePath), src);
    img.src = 'file://' + absPath;
  }
});
```
