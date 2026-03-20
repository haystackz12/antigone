# features/SPELLCHECK.md
> Read when working on: spellcheck.js, custom dictionary, spell check preferences.

## Electron spell check setup
Electron uses the OS spell checker on each platform. Enable it on the webContents session:
```javascript
// main.js — after BrowserWindow is created
win.webContents.session.setSpellCheckerLanguages(['en-US']); // default
// Override from prefs if user has set a different language
const spellLang = getPrefs().spellCheckLanguage;
if (spellLang) win.webContents.session.setSpellCheckerLanguages([spellLang]);
```
This gives you the red-underline behavior automatically for free. The OS handles suggestions.

## Context menu for misspelled words
Electron fires `context-menu` on right-click. Check for spell check suggestions:
```javascript
win.webContents.on('context-menu', (event, params) => {
  const menu = new Menu();
  if (params.misspelledWord) {
    params.dictionaryWordSuggestions.slice(0, 5).forEach(suggestion => {
      menu.append(new MenuItem({
        label: suggestion,
        click: () => win.webContents.replaceMisspelling(suggestion)
      }));
    });
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
      label: `Add "${params.misspelledWord}" to dictionary`,
      click: () => addToCustomDictionary(params.misspelledWord)
    }));
    menu.append(new MenuItem({
      label: 'Ignore',
      click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
    }));
  }
  menu.popup();
});
```

## Custom dictionary (main.js)
```javascript
const dictPath = path.join(app.getPath('userData'), 'dictionary.txt');

function loadCustomDictionary() {
  if (!fs.existsSync(dictPath)) return;
  const words = fs.readFileSync(dictPath, 'utf8').split('\n').filter(Boolean);
  words.forEach(word => {
    win.webContents.session.addWordToSpellCheckerDictionary(word);
  });
}

function addToCustomDictionary(word) {
  const prefs = getPrefs();
  // Free tier: 500 word limit
  if (!proGate('custom-dictionary-unlimited')) {
    const existing = fs.existsSync(dictPath)
      ? fs.readFileSync(dictPath, 'utf8').split('\n').filter(Boolean)
      : [];
    if (existing.length >= 500) {
      showUpgradeModal('custom-dictionary-unlimited');
      return;
    }
  }
  win.webContents.session.addWordToSpellCheckerDictionary(word);
  fs.appendFileSync(dictPath, word + '\n', 'utf8');
}
```
Call `loadCustomDictionary()` in `app.whenReady()`.

## Suppressing spell check in code (spellcheck.js)
Electron's spell check does not know about CM6's document structure. Work around this by toggling spellcheck on the editor DOM element based on cursor position:
```javascript
// In CM6 updateListener or via a ViewPlugin:
// Detect if cursor is inside a fenced code block, inline code, URL, or YAML frontmatter
// If yes: editorElement.spellcheck = false
// If no:  editorElement.spellcheck = true
// This is a per-node approach — CM6 syntax tree gives node type at cursor position
```

## dictionary.txt format
One word per line, UTF-8, no duplicates. Portable — user can copy to another machine.
Location: `Antigone/dictionary.txt` in OS user data dir.
NEVER write this file to the source directory.
