# DocDiff — Session State

> **Purpose:** Point-in-time snapshot of deployed infrastructure, pending work, and handoff context. Update this file at the end of every session. A new implementing session should read this file first.
>
> Last updated: 2026-03-08 | End of Session 39

---

## Infrastructure State

### Railway — Gotenberg

| Field | Value |
|-------|-------|
| Status | ✅ ACTIVE |
| Service name | gotenberg |
| Docker image | `gotenberg/gotenberg:8` |
| Public URL | `https://[your-gotenberg-url].up.railway.app` |
| Env var set | `LIBREOFFICE_AUTO_START=true` |
| Networking | Public domain active on port 3000 |
| Health endpoint | `GET /health` → `{"status":"up","details":{"chromium":{"status":"up"},"libreoffice":{"status":"up"}}}` |
| Cost | Covered by Railway's $5/month free credit |

### Vercel — DocDiff

| Field | Value |
|-------|-------|
| Status | ✅ LIVE and fully operational |
| Project name | `doc-diff` |
| Team | `haystackz12's projects` (Hobby plan) |
| GitHub repo | `haystackz12/DocDiff` |
| Branch | `main` (auto-deploy on push) |
| Live URL | `https://doc-diff.vercel.app` |
| Env var: `GOTENBERG_URL` | ✅ `https://[your-gotenberg-url].up.railway.app` (must include https://) |
| Env var: `DOCDIFF_ORIGIN` | ✅ `https://doc-diff.vercel.app` |

---

## Deployed File Structure

```
haystackz12/DocDiff (main)
├── DocDiff.html              # Single-file app — ~8,403 lines after Session 39 edits
├── index.html                # Redirect to DocDiff.html
├── api/
│   ├── convert.js            # Vercel Edge Function — proxies DOCX→PDF to Gotenberg
│   └── parse-docx.js         # Vercel serverless function — DOCX→structured paragraph maps
├── vercel.json               # Vercel config — outputDirectory "." + functions timeout
├── package.json              # Dependencies: mammoth, cheerio
├── CLAUDE.txt
├── roadmap.txt
├── CLOSING_INSTRUCTIONS.md
├── session_state.md
├── USER_GUIDE.md
├── DocDiff_Gotenberg_Integration_Brief.md
├── manifest.json
├── sw.js
├── icons/
└── docs/
    ├── DocDiff-MVP-Roadmap.docx
    └── progressive-render-spec.docx
```

---

## Sessions 31–39 — What Was Completed

### ✅ Sessions 31–38 — Option C: Unified Diff Architecture (Jump-to-Change Root Fix)

**Root cause identified:** Two independent diff pipelines with independent group counters caused jump-to-change desync in Redline and Formatted views. Pipeline 1 (`twoLevelDiff` → global `diffResults`) fed Sidebar + SBS + Text; Pipeline 2 (`paragraphFirstDiff` → local `rDiff`) fed Redline only — completely decoupled.

**Solution — Option C:** Promoted `paragraphFirstDiff` to write `diffResults` as the single source of truth. All views walk `diffResults` directly.

**9 Sprints completed:**
- S32 Sprint 1: Token format contract — equal blocks emit one joined token per paragraph + `\n` separator
- S32 Sprint 8: `computeStats` word count fix
- S33 Sprint 7: Loading overlay step labels (`id="loadingStep"`)
- S33 Sprint 2: `runComparison()` reordering — `fetchServerMaps()` before diff; Path A (structural) vs Path B (twoLevel); `diffSourceType` global
- S34 Sprint 3: PRIMARY BUG FIX — `renderRedline()` simplified to walk `diffResults` directly (removed independent `rDiff` pipeline)
- S35 Sprint 4: `renderFormatted()` cleanup — removed independent `fmtDiff` pipeline
- S36 Sprint 5: Formatted HTML walker equal-token advance bug fix — `_ffIsWord` regex replaced with word-count advance
- S37 Sprint 6: PDF+PDF navigation sync — `applyPdfGroupsByWordDiff` writes `diffResults`; re-render SBS+Text after formatted if `diffSourceType === 'pdf'`
- S38 Sprint 9: Integration audit — fixed `_pdfGroupMap` and plain-text redline group counters for whitespace-transparent rule

**Final result:** All 7 group-counter sites confirmed consistent with `buildChangeGroups` reference.

### ✅ Session 39 — Jump-to Drift Fix (Formatted SbS) + Amber Ring

**Bug 1 — Jump-to drift in formatted Side-by-Side view:**
- **Root cause:** Equal-token span counter advance used `/\S+/g` (any non-whitespace), counting punctuation tokens (`.`, `,`) as spans — but `wrapWordsWithIndex` never creates DOM spans for punctuation. One span of drift per punctuation mark, compounding across the document.
- **Fix:** Changed regex to `/[\w'\u2019]+/g` (word chars only, mirroring `wrapWordsWithIndex`) and default from `1` to `0` (pure-punctuation tokens have no span). Two lines changed at ~line 5747.
- **Verification:** Jump-to now correctly lands on paired words in Side-by-Side formatted view.

**Bug 2 — Jump-to ring barely visible:**
- **Root cause:** `.change-active` used a thin 2px blue outline with `rgba(74,108,247,0.06)` shadow — nearly invisible against red/green diff highlights.
- **Fix (Option B — Amber Ring):** Changed to `3px solid #f59e0b` (amber/gold) with `box-shadow: 0 0 0 6px rgba(245,158,11,0.22)`. Animation pulse updated to match. Amber sits completely outside the red/green/blue palette — no color conflict with diff highlights. Applied globally to all views (Redline, Side-by-Side, Text) via shared `.change-active` / `changePulse` CSS.

---

## What's Pending — Session 40 Start Checklist

### P0 — Start here

1. **RedlineIQ rename**
   - GitHub: `haystackz12/DocDiff` → `haystackz12/RedlineIQ`
   - Vercel project rename + URL
   - `DocDiff.html` → `RedlineIQ.html`
   - ~102 internal `DocDiff` references → `RedlineIQ`
   - `manifest.json`, `sw.js` cache name
   - localStorage key: `docdiff-theme` read fallback must survive
   - All 5 project docs
   - Export filenames: `DocDiff-Report.txt/.doc`, `DocDiff-Redline.docx` → `RedlineIQ-*`
   - Rename brief at: `RedlineIQ-Rename-Brief.md` in repo root

2. **Phase 2 Item 5 — Similarity-based block alignment fallback** in `paragraphFirstDiff()`: when structural key doesn't match, add second pass over unmatched blocks using text similarity (~60% threshold) to pair them as modifications instead of delete+insert.

3. **Full multi-page scroll-through verification** with server engine.

4. **Phase 3 Items 7+8 — Formatting diff layer + Fmt filter button**

---

## Lessons Learned (Sessions 31–39)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Jump-to desync (Redline + Formatted) | Two independent diff pipelines with independent group counters | Option C: `paragraphFirstDiff` writes `diffResults` as single source of truth |
| Formatted SbS jump drift | Equal-token advance used `/\S+/g` — counted punct tokens that have no DOM span | Changed to `/[\w'\u2019]+/g` + default 0 (mirrors `wrapWordsWithIndex`) |
| Jump-to ring invisible | 2px blue outline with 0.06 opacity shadow — lost against red/green highlights | Amber ring: `3px solid #f59e0b`, stronger glow, no color conflict |
| PDF+PDF jump-to broken | `applyPdfGroupsByWordDiff` never wrote to `diffResults` | Sprint 6: function now writes `diffResults = wordDiff` + re-renders SBS/Text |
| `_pdfGroupMap` counter drift | Reset `_pgInChange` on ALL equals including whitespace | Sprint 9: only reset on substantive equals (mirrors `buildChangeGroups`) |
