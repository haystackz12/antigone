# ROADMAP.md
> Phase overview. Read when planning the next sprint. Completed sprints are archived here.

## Completed sprints
None yet.

---

## Upcoming sprints

### Sprint 2 — Complete Editor (Days 6–10)
**Goal:** Full editing feature set shipped and tested on macOS + Windows.

| Day | Focus | Key deliverables |
|-----|-------|-----------------|
| 6 | Toolbar + Image paste | All 16 toolbar buttons, clipboard image → assets/, inline reference inserted |
| 7 | Tags + Find/Replace + Spell check | #tag indexing, tag sidebar, tag autocomplete, ⌘F/⌘H, OS spellcheck, custom dictionary |
| 8 | Multi-tab + TOC + Split view | Tab state management, session restore, TOC click-nav, scroll sync |
| 9 | Export + Page breaks + Print | PDF silent export, HTML self-contained, print stylesheet, <!-- pagebreak --> |
| 10 | Preferences UI + Vim/Emacs (Pro) + Windows build | All 22 prefs wired, Vim/Emacs CM6 toggle, Windows .exe file association confirmed |

**Tag:** v0.3.0

---

### Sprint 3 — Polish & Distribution (Days 11–15)
**Goal:** Production-quality v1.0 release candidate. Signed on all platforms. Auto-updater live.

| Day | Focus | Key deliverables |
|-----|-------|-----------------|
| 11 | Preprocessors (Pro) + Tag enhancements | Shell pipe → preview, YAML frontmatter tag indexing, tag rename |
| 12 | Performance + Accessibility | Large file handling (150K cap), keyboard nav audit, ARIA labels, reduce-motion |
| 13 | Code signing + Auto-updater | Apple notarization, NSIS signing, electron-updater GitHub Releases CI |
| 14 | Freemium gates + Account stub | proGate() function, all Pro gates wired, upgrade modal, 14-day trial |
| 15 | Full test pass + v1.0 release | 21-item checklist, README, CHANGELOG, tag v1.0.0 |

**Tag:** v1.0.0

---

### Sprint 4 — v1.1.0 (Month 2, Week 1–2)
- Stripe/Paddle real payment integration (replaces v1.0 stub)
- DOCX export via docx-js
- Mermaid diagrams in inline rendering mode (currently preview-pane only)
- Content Blocks: `/path/to/file.md` embeds another file's content inline in preview

---

### Sprint 5 — v1.2.0 (Month 2, Week 3–4)
- KaTeX math: `$...$` inline and ` ```math ` block rendering
- Wikilinks: `[[File Name]]` resolves to other .md files in same directory
- Backlinks panel: shows all files linking to the current file
- Git status indicators: read-only M/A/D badges in file browser sidebar (no Git operations from Antigone)

---

### Sprint 6 — v1.5.0 (Month 3)
- Writing analytics (Pro): Flesch-Kincaid readability, passive voice highlights, filler word detection (wordlist-based, no AI), sentences > 40 words flagged
- Sentence-level focus mode (iA Writer parity) — upgrade from current paragraph-level
- Table editor: click rendered table in preview → visual grid editor opens

---

### Sprint 7 — v1.6.0 (Month 4)
- AI Summarize panel: pipe current document to Claude API, show summary in side panel (Pro)
- Document template library: blank, meeting notes, README, blog post, legal memo — stored in OS user data dir, user can add custom templates
- Global hotkey launcher: tray icon mode, system-wide hotkey opens file picker overlay

---

### Sprint 8 — v2.0.0 (Month 5–6)
- Plugin/extension API: documented hook system, published to npm
- Custom CSS theme overrides: `~/.antigone/themes/custom.css` loaded at startup
- Team tier: shared dictionary, shared template library, team seat management
- Annotation layer: highlight + sticky notes stored in sidecar, never in source files

---

## Post-v2 considerations
- Tauri v2 rewrite evaluation (smaller bundle, Rust backend, OS WebView)
- iOS companion app (read-only viewer synced via iCloud or file provider)
- Linux Flatpak distribution (in addition to AppImage + .deb)
