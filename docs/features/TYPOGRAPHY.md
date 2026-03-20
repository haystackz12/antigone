# features/TYPOGRAPHY.md
> Read when working on: typeface pairings, font loading, prefs.js font switching, preview CSS.

## Bundled fonts
All fonts are in `assets/fonts/`. Loaded via @font-face in styles.css. Never fetched from a CDN.

| Font | Files | Used for |
|------|-------|---------|
| Lora | Lora-Regular.woff2, Lora-Bold.woff2, Lora-Italic.woff2 | Preview body (Literary pairing) |
| Cormorant Garamond | CormorantGaramond-Regular.woff2, -Bold.woff2, -Italic.woff2, -SmallCaps.woff2 | Preview body (Editorial, Manuscript pairings) |
| Recursive | Recursive-Regular.woff2 (variable font) | Editor monospace + Technical/Modern pairings |
| DM Sans | DMSans-Regular.woff2, DMSans-Medium.woff2, DMSans-Bold.woff2 | UI chrome + heading in Literary, Minimal pairings |

## @font-face declarations (styles.css)
```css
@font-face {
  font-family: 'Lora';
  src: url('../assets/fonts/Lora-Regular.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: block;
}
/* Repeat for each weight/style. font-display: block prevents FOUT on launch. */
```

## Typeface pairing CSS classes
Each pairing is a CSS class applied to `#preview`. Switching pairings = swap the class.

```css
/* Literary (default) */
.pairing-literary .preview-body  { font-family: 'Lora', Georgia, serif; font-size: 17px; line-height: 1.75; }
.pairing-literary h1, h2, h3     { font-family: 'DM Sans', sans-serif; }
.pairing-literary code, pre      { font-family: 'Recursive', 'Courier New', monospace; }

/* Editorial */
.pairing-editorial .preview-body { font-family: 'Cormorant Garamond', serif; font-size: 19px; line-height: 1.85; }
.pairing-editorial h1, h2, h3    { font-family: 'Cormorant Garamond', serif; font-weight: 700; }

/* Modern (Pro) */
.pairing-modern .preview-body    { font-family: 'DM Sans', sans-serif; font-size: 16px; line-height: 1.65; }

/* Technical (Pro) */
.pairing-technical .preview-body { font-family: 'Recursive', sans-serif; font-size: 15px; line-height: 1.6; }

/* Minimal (Pro) */
.pairing-minimal .preview-body   { font-family: Georgia, serif; font-size: 17px; line-height: 1.8; }
.pairing-minimal h1, h2, h3      { font-family: 'DM Sans', sans-serif; }

/* Manuscript (Pro) */
.pairing-manuscript .preview-body { font-family: 'Cormorant Garamond', serif; font-size: 20px; line-height: 2.0; }
.pairing-manuscript h1           { font-variant: small-caps; letter-spacing: 0.08em; }
```

## Switching pairings (prefs.js)
```javascript
function applyPairing(pairingName) {
  const preview = document.getElementById('preview');
  // Remove all pairing classes
  preview.className = preview.className.replace(/pairing-\w+/g, '');
  // Add new pairing class
  preview.classList.add(`pairing-${pairingName}`);
}
// Called on: prefs load, pairing change in preferences panel
// Pro gate on: modern, technical, minimal, manuscript
```

## Editor font
The editor always uses Recursive (bundled). User can override in prefs to a system monospace font:
```css
.cm-editor .cm-content {
  font-family: var(--editor-font, 'Recursive', 'Courier New', monospace);
  font-size: var(--editor-font-size, 14px);
}
```
Set `--editor-font` and `--editor-font-size` CSS variables on `:root` when prefs change.

## Free vs Pro pairing access
Free: `literary`, `editorial`
Pro: `modern`, `technical`, `minimal`, `manuscript`
Gate check in preferences panel — show lock icon on Pro pairings for free users.
Live preview in prefs panel works for all pairings (so free users can see what they'd get — this drives upgrades).
