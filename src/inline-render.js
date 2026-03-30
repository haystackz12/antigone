// src/inline-render.js
// Inline rendering decoration layer — hides Markdown syntax tokens when the
// cursor is on a different line, applying styled mark/widget decorations.
// Architecture: ViewPlugin + DecorationSet, scoped to visible ranges only.
// Max 400 lines.

'use strict';

const { ViewPlugin, Decoration, WidgetType } = require('@codemirror/view');
const { syntaxTree }                         = require('@codemirror/language');

// ─── Heading class lookup ────────────────────────────────────────────────────
const HEADING_CLASS = {
  ATXHeading1: 'cm-heading-1',
  ATXHeading2: 'cm-heading-2',
  ATXHeading3: 'cm-heading-3',
  ATXHeading4: 'cm-heading-4',
  ATXHeading5: 'cm-heading-5',
  ATXHeading6: 'cm-heading-6',
};

// ─── Image widget ────────────────────────────────────────────────────────────
class ImageWidget extends WidgetType {
  constructor(src, alt) {
    super();
    this.src = src;
    this.alt = alt;
  }

  eq(other) { return this.src === other.src && this.alt === other.alt; }

  toDOM() {
    const img = document.createElement('img');
    img.src = this.src;
    img.alt = this.alt;
    img.title = this.alt;
    img.className = 'cm-image-widget';
    img.style.maxWidth = '100%';
    img.style.display = 'block';
    img.style.margin = '8px 0';
    img.style.borderRadius = '4px';
    img.onerror = () => {
      img.style.display = 'none';
      const span = document.createElement('span');
      span.className = 'cm-image-error';
      span.textContent = `[image: ${this.alt || this.src}]`;
      img.parentNode?.insertBefore(span, img);
    };
    return img;
  }

  ignoreEvent() { return false; }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get child nodes of a given type from a syntax node. */
function children(node, type) {
  const result = [];
  let child = node.firstChild;
  while (child) {
    if (child.name === type) result.push(child);
    child = child.nextSibling;
  }
  return result;
}

/** Get the first child of a given type. */
function firstChild(node, type) {
  let child = node.firstChild;
  while (child) {
    if (child.name === type) return child;
    child = child.nextSibling;
  }
  return null;
}

/** Extract text between two positions from the document. */
function sliceDoc(state, from, to) {
  return state.sliceDoc(from, to);
}

// ─── Build decorations ──────────────────────────────────────────────────────
function buildDecorations(view) {
  const { state } = view;
  const doc = state.doc;
  const cursorHead = state.selection.main.head;
  const cursorLine = doc.lineAt(cursorHead).number;
  const decos = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({ from, to, enter(node) {
      // Skip nodes on the cursor line — reveal raw syntax for editing
      const nodeLineFrom = doc.lineAt(node.from).number;
      const nodeLineTo   = doc.lineAt(node.to).number;
      if (nodeLineFrom <= cursorLine && cursorLine <= nodeLineTo) return;

      try {
        switch (node.name) {

          // ── Bold (**text**) ──────────────────────────────────────────────
          case 'StrongEmphasis': {
            const marks = children(node.node, 'EmphasisMark');
            for (const m of marks) {
              decos.push({ from: m.from, to: m.to, deco: Decoration.replace({}) });
            }
            if (marks.length >= 2) {
              decos.push({
                from: marks[0].to,
                to:   marks[marks.length - 1].from,
                deco: Decoration.mark({ class: 'cm-bold' }),
              });
            }
            return false; // don't descend — we handled children
          }

          // ── Italic (*text* or _text_) ──────────────────────────────────
          case 'Emphasis': {
            const marks = children(node.node, 'EmphasisMark');
            for (const m of marks) {
              decos.push({ from: m.from, to: m.to, deco: Decoration.replace({}) });
            }
            if (marks.length >= 2) {
              decos.push({
                from: marks[0].to,
                to:   marks[marks.length - 1].from,
                deco: Decoration.mark({ class: 'cm-italic' }),
              });
            }
            return false;
          }

          // ── Strikethrough (~~text~~) ───────────────────────────────────
          case 'Strikethrough': {
            const marks = children(node.node, 'StrikethroughMark');
            for (const m of marks) {
              decos.push({ from: m.from, to: m.to, deco: Decoration.replace({}) });
            }
            if (marks.length >= 2) {
              decos.push({
                from: marks[0].to,
                to:   marks[marks.length - 1].from,
                deco: Decoration.mark({ class: 'cm-strikethrough' }),
              });
            }
            return false;
          }

          // ── Inline code (`text`) ───────────────────────────────────────
          case 'InlineCode': {
            const marks = children(node.node, 'CodeMark');
            for (const m of marks) {
              decos.push({ from: m.from, to: m.to, deco: Decoration.replace({}) });
            }
            if (marks.length >= 2) {
              decos.push({
                from: marks[0].to,
                to:   marks[marks.length - 1].from,
                deco: Decoration.mark({ class: 'cm-code' }),
              });
            }
            return false;
          }

          // ── Headings (# text) ──────────────────────────────────────────
          case 'ATXHeading1':
          case 'ATXHeading2':
          case 'ATXHeading3':
          case 'ATXHeading4':
          case 'ATXHeading5':
          case 'ATXHeading6': {
            const cls = HEADING_CLASS[node.name];
            const hMark = firstChild(node.node, 'HeaderMark');
            if (hMark) {
              // Hide the # markers and the trailing space
              let replEnd = hMark.to;
              if (replEnd < node.to && sliceDoc(state, replEnd, replEnd + 1) === ' ') {
                replEnd += 1;
              }
              decos.push({ from: hMark.from, to: replEnd, deco: Decoration.replace({}) });
            }
            // Style the full heading range
            decos.push({
              from: hMark ? hMark.to : node.from,
              to:   node.to,
              deco: Decoration.mark({ class: cls }),
            });
            return false;
          }

          // ── Blockquote (> text) ────────────────────────────────────────
          case 'QuoteMark': {
            decos.push({
              from: node.from,
              to:   node.to,
              deco: Decoration.mark({ class: 'cm-syntax-marker' }),
            });
            break;
          }

          case 'Blockquote': {
            decos.push({
              from: node.from,
              to:   node.to,
              deco: Decoration.mark({ class: 'cm-blockquote' }),
            });
            break; // descend to catch QuoteMarks
          }

          // ── List markers (-, *, 1.) ────────────────────────────────────
          case 'ListMark': {
            decos.push({
              from: node.from,
              to:   node.to,
              deco: Decoration.mark({ class: 'cm-list-marker' }),
            });
            break;
          }

          // ── Links [text](url) ──────────────────────────────────────────
          case 'Link': {
            const linkMarks = children(node.node, 'LinkMark');
            const urlNode   = firstChild(node.node, 'URL');
            if (linkMarks.length >= 3 && urlNode) {
              // Hide [ and ]( and )
              for (const lm of linkMarks) {
                decos.push({ from: lm.from, to: lm.to, deco: Decoration.replace({}) });
              }
              // Hide URL
              decos.push({ from: urlNode.from, to: urlNode.to, deco: Decoration.replace({}) });
              // Style the text between [ and ]
              const textFrom = linkMarks[0].to;
              const textTo   = linkMarks[1].from;
              if (textFrom < textTo) {
                decos.push({
                  from: textFrom,
                  to:   textTo,
                  deco: Decoration.mark({ class: 'cm-link-text' }),
                });
              }
            }
            return false;
          }

          // ── Images ![alt](path) ────────────────────────────────────────
          case 'Image': {
            const urlNode = firstChild(node.node, 'URL');
            if (!urlNode) break;
            const src = sliceDoc(state, urlNode.from, urlNode.to);
            // Extract alt text: between first [ and first ]
            const linkMarks = children(node.node, 'LinkMark');
            let alt = '';
            if (linkMarks.length >= 2) {
              alt = sliceDoc(state, linkMarks[0].to, linkMarks[1].from);
            }
            decos.push({
              from: node.from,
              to:   node.to,
              deco: Decoration.replace({
                widget: new ImageWidget(src, alt),
              }),
            });
            return false;
          }
        }
      } catch (_) {
        // Malformed syntax — skip this node silently
      }
    }});
  }

  // Sort by position (required by RangeSetBuilder)
  decos.sort((a, b) => a.from - b.from || a.to - b.to);

  // Build the decoration set, skipping any overlapping replace decorations
  const builder = [];
  for (const d of decos) {
    if (d.from < d.to || d.deco.spec?.widget) {
      builder.push(d.deco.range(d.from, d.to));
    }
  }

  try {
    return Decoration.set(builder, true);
  } catch (_) {
    return Decoration.none;
  }
}

// ─── ViewPlugin ──────────────────────────────────────────────────────────────
const inlineRenderPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = buildDecorations(view);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: v => v.decorations },
);

module.exports = { inlineRenderPlugin };
