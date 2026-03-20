# features/TAGS.md
> Read when working on: tags.js, tag sidebar, tag autocomplete, tag indexing, YAML frontmatter parsing.

## Tag syntax supported
- Inline body: `#tagname` and `#namespace/subtag` (unlimited depth)
- YAML frontmatter: `tags: [legal, draft]` or `tags:\n  - legal\n  - draft`
- Case-insensitive. `#Legal` and `#legal` are the same tag.
- Tags must start with a letter (not a number). `#123` is not a tag.
- Regex: `/(?:^|\s)#([a-zA-Z][a-zA-Z0-9/_-]*)/g`

## Tag index structure
Stored in `Antigone/tags.json` (OS user data dir):
```json
{
  "tags": {
    "project/antigone": ["/Users/mike/Projects/antigone/README.md"],
    "status/draft":     ["/Users/mike/Projects/antigone/SPRINT.md"],
    "legal":            ["/Users/mike/docs/contract.md"]
  },
  "lastUpdated": "2026-03-20T14:22:00Z"
}
```
Index is rebuilt for a file whenever it is opened or saved in Antigone. Index is NOT built for files not opened in Antigone.

## Scanning flow (tags.js)
```javascript
function scanTags(content, filePath) {
  const tags = new Set();
  // 1. Parse YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = parseYAML(fmMatch[1]); // simple key: value parser
    if (fm.tags) [].concat(fm.tags).forEach(t => tags.add(t.toLowerCase()));
  }
  // 2. Scan body for inline #tags
  const tagRegex = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9/_-]*)/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.add(match[1].toLowerCase());
  }
  return [...tags];
}
// Call on: file open, file save
// Then IPC: window.antigone.updateTagIndex(filePath, tagsArray)
```

## Tag sidebar
- Lists all unique tags from `tags.json` sorted alphabetically
- Grouped by namespace if namespace exists (e.g., all `project/*` tags together)
- Click a tag → file browser filters to show only files containing that tag
- Right-click a tag → Rename (in current file only, v1.0) / Find all files with tag

## Tag autocomplete
```javascript
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';

function tagCompletions(context) {
  const match = context.matchBefore(/#[a-zA-Z0-9/_-]*/);
  if (!match) return null;
  const allTags = getTagsFromIndex(); // read from in-memory copy of tags.json
  return {
    from: match.from,
    options: allTags.map(t => ({ label: '#' + t, type: 'keyword' }))
  };
}
// Add autocompletion([tagCompletions]) to CM6 extensions
```

## Tag chip styling (inline-render.js)
When cursor is not on the #tag token:
```css
.cm-tag-chip {
  background: var(--tag-chip);       /* #EAE4F5 light / #2C2248 dark */
  border-radius: 4px;
  padding: 0 4px;
  font-size: 0.9em;
  color: var(--accent);
}
```
Apply via `Decoration.mark({ class: 'cm-tag-chip' })` on the full `#tagname` token.

## Free vs Pro limits
- Free: up to 3 tag namespaces (e.g. `#project/...`, `#status/...`, `#client/...`)
- Count distinct first namespace segments in the index. If > 3 and user is free tier, show upgrade prompt when adding a 4th namespace.
- Pro: unlimited namespaces, tag graph visualization (v1.5)
