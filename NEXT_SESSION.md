# NEXT_SESSION.md — Day 12 Kick-off Prompt

We are working on the Antigone project — a cross-platform Markdown editor built on
Electron + CodeMirror 6. Repo: haystackz12/antigone | Path: ~/Projects/antigone

Today is Sprint 3, Day 12 — Performance + Accessibility.

## Step 0 — Read these files before touching any code
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/DECISIONS.md

---

## Day 12 Tasks (from SPRINT.md)

### Task 1 — Large file handling (150K char cap)
- Detect files over 150K characters on open
- Show warning banner: "Large file — inline rendering disabled"
- Disable inline-render.js for large files (performance)
- Editor still works, just without decorations

### Task 2 — Keyboard navigation audit
- Tab through all interactive elements
- Ensure logical tab order
- Add tabindex where needed

### Task 3 — ARIA labels
- All buttons, regions, landmarks properly labeled
- Screen reader can announce all UI elements

### Task 4 — Reduce motion support
- @media (prefers-reduced-motion: reduce) already exists in styles.css
- Verify all animations respect it
- Test with System Preferences → Accessibility → Reduce Motion

---

## Gate
- Open 150K+ file → warning, no crash, inline rendering off
- Tab through all UI → logical order, nothing skipped
- VoiceOver announces buttons correctly

---

## End of session
Run docs/closing_instructions.md top to bottom. Generate NEXT_SESSION.md for Day 13.
