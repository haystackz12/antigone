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

### Sprint 4 — v1.1.0 (Foundation)
**Purpose:** Harden the app before adding features. Every item here is
infrastructure the Sprint 5 features (wikilinks, backlinks, git badges)
depend on.

| # | Focus | Key deliverables |
|---|-------|-----------------|
| 1 | Automated tests + CI | Playwright end-to-end suite covering the v1.0 manual checklist in TESTING.md. Priority: the three v1.0 regressions (tab title bleed BUG-042, theme persistence BUG-051, quit behaviour BUG-052) get tests first. GitHub Actions runs the suite on every push to main. Rule for the sprint: a bug fix is not done until it has a failing-then-passing test. |
| 2 | Live file watcher | Reinstate external-change detection removed in DEC-019. Content-hash comparison to ignore own writes, debounce for sync clients that rewrite in bursts, quiet reload when the buffer is clean, non-destructive conflict banner when dirty. Keeps the DEC-034 save-time check as the last line of defence. |
| 3 | Folder sidebar + quick-open | Workspace concept (open a folder, not a file). File tree in the icon rail, ⌘P fuzzy finder across the workspace, tags and TOC re-indexed against the workspace rather than the open file. Revisit trigger from DEC-023/024 is now. |

**Cancelled from this sprint:** Stripe/Paddle (DEC-035).
**Moved to Sprint 5:** DOCX export, Mermaid inline, content blocks.

Order matters: tests first, so the watcher and the sidebar — both of
which touch load, save, and tab state — get built with a safety net that
the v1.0 session didn't have.

**Tag:** v1.1.0

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
