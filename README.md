# Antigone

A Markdown editor for writers. Antigone renders formatting inline as you type — headings, bold, italic, code, and links appear styled in the editor without a separate preview pane. Built with Electron and CodeMirror 6.

## Features

- **Inline rendering** — Markdown syntax hides on cursor leave; styled text appears in place (Typora-style)
- **Split view and preview** — side-by-side editor + rendered preview, or full-width preview mode
- **Focus mode** — dims all paragraphs except the one you're writing
- **Themes** — White and Sepia with serif, sans-serif, and monospace typeface pairings
- **Tags** — inline `#tags` and YAML frontmatter tags, indexed in a sidebar panel
- **Word count goal** — set a target, watch the progress ring fill as you write
- **Spell check** — OS-native spell check with per-project custom dictionaries
- **Preprocessors** — pipe your Markdown through a shell command before preview
- **Export** — PDF, HTML, and print with `<!-- pagebreak -->` support
- **Multi-tab** — open multiple files, each with its own scroll position and undo history
- **Keyboard-driven** — standard shortcuts plus optional Vim mode
- **Auto-save and crash recovery** — atomic temp-then-rename saves, recovery files on unexpected quit
- **Code signing** — macOS builds are signed, notarized, and stapled

## Installation

macOS only for now. Download the DMG from the [Releases](https://github.com/haystackz12/antigone/releases) page, open it, and drag Antigone to Applications.

To set Antigone as your default Markdown editor: right-click any `.md` file, choose Get Info, expand "Open with", select Antigone, then click "Change All".

## Usage

- Open files with `Cmd+O`, drag-and-drop, or double-click from Finder
- `Cmd+S` to save, `Cmd+Shift+S` to save as
- `Cmd+Shift+P` for split view, `Cmd+Shift+R` for preview only
- `Cmd+Shift+F` for focus mode
- `Cmd+,` to open preferences (theme, typeface, font size, Vim mode)

## Where your data lives

All configuration and app data is stored in `~/Library/Application Support/Antigone/`:

- `config.json` — preferences (theme, font size, typeface pairing)
- Recovery files — temporary, stored in the OS temp directory
- `dictionary.txt` — custom spell check words (per-project dictionaries use `.antigone-dict` in the project directory, opt-in only)

Antigone never writes hidden files to your project directories. See `docs/DECISIONS.md` (DEC-005) for the rationale.

## How it treats your files

- **Atomic saves** — writes to a `.tmp` file first, then renames. Your file is never partially written (DEC-006).
- **External change detection** — if another program modifies your file, Antigone offers to reload or keep your version.
- **Crash recovery** — a background timer saves recovery snapshots to the OS temp directory. On relaunch after a crash, Antigone offers to restore your work.

## Building from source

Requires Node.js (see `package.json` for the Electron version).

```bash
npm install
npm start          # run in development
npm run make       # build distributable for current platform
```

## License

MIT
