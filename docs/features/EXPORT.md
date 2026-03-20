# features/EXPORT.md
> Read when working on: PDF export, HTML export, DOCX export, print stylesheet, page breaks, pagebreak.js.

## Page break syntax
`<!-- pagebreak -->` on its own line (no other content on the line).

Detection regex: `/^<!--\s*pagebreak\s*-->\s*$/m`

In inline rendering: replace with a styled widget:
```css
.cm-pagebreak-widget {
  display: block; height: 2px;
  background: repeating-linear-gradient(90deg, var(--accent) 0, var(--accent) 6px, transparent 6px, transparent 10px);
  margin: 16px 0; position: relative;
}
.cm-pagebreak-widget::after {
  content: 'Page Break'; position: absolute;
  left: 50%; transform: translateX(-50%);
  background: var(--bg-editor); padding: 0 8px;
  font-size: 11px; color: var(--text-muted); top: -7px;
}
```

In print CSS: `page-break-after: always` injected dynamically before printing.

## Print stylesheet (styles.css @media print)
```css
@media print {
  #sidebar, #toolbar, #tabs, #status-bar { display: none !important; }
  #editor { display: none !important; }
  #preview { width: 100% !important; max-width: 720px; margin: 0 auto; }
  body { background: white !important; color: black !important; }
  /* Force Literary pairing */
  .preview-content { font-family: 'Lora', serif !important; font-size: 12pt; }
  h1, h2, h3 { font-family: 'DM Sans', sans-serif !important; }
  /* H1 page breaks */
  h1 { page-break-before: always; }
  h1:first-child { page-break-before: avoid; }
  /* Page break markers */
  .pagebreak-marker { page-break-after: always; height: 0; }
  a { color: black; text-decoration: underline; }
  pre, code { font-family: 'Courier New', monospace; font-size: 10pt; }
}
```

## PDF silent export
```javascript
// renderer calls: window.antigone.exportPDF(sourcePath)
// main.js handler:
ipcMain.handle('export-pdf', async (event, sourcePath) => {
  const pdfPath = sourcePath.replace(/\.[^/.]+$/, '.pdf');
  const data = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'Letter',
    margins: { marginType: 'custom', top: 0.75, bottom: 0.75, left: 1, right: 1 }
  });
  await fs.writeFile(pdfPath, data);
  return pdfPath; // renderer shows 'Exported to filename.pdf' toast
});
```

## HTML self-contained export
```javascript
// In renderer: get current preview HTML, inline the CSS
async function exportHTML(sourcePath) {
  const previewHTML = document.getElementById('preview').innerHTML;
  const css = getInlinedCSS(); // read styles.css, resolve @font-face with base64 fonts
  const output = `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <style>${css}</style>
  </head><body><div class="preview-content">${previewHTML}</div></body></html>`;
  const outputPath = sourcePath.replace(/\.[^/.]+$/, '.html');
  await window.antigone.writeFile(outputPath, output);
}
```

## DOCX export (Pro — v1.1)
Use `docx-js` (same library used in EmailVault and other projects). Pattern established.
Map: H1→Heading1, H2→Heading2, H3→Heading3, bold→TextRun bold:true, italic→italics:true, code→Courier New font.
Tables supported. Images: embed base64.
Gate: `proGate('docx-export')` before showing the option.
