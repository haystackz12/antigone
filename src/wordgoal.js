// src/wordgoal.js
// Word count engine, goal tracking, progress ring SVG animation.
// Listens to editor:change events dispatched by editor.js.
// Goal ring SVG is in index.html #word-goal-ring, CSS in styles.css §6.

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
let wordGoal  = 0;    // 0 = no goal set
let wordCount = 0;

// SVG circle circumference: 2π × r=8 = 50.2655
const CIRCUMFERENCE = 2 * Math.PI * 8;

// ─── Update from editor content ──────────────────────────────────────────────

function updateFromContent(text) {
  wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 200));

  // Status bar
  const wordsEl = document.getElementById('status-words');
  const timeEl  = document.getElementById('status-readtime');
  if (wordsEl) {
    wordsEl.textContent = wordGoal > 0
      ? `${wordCount} / ${wordGoal} words`
      : `${wordCount} words`;
  }
  if (timeEl) timeEl.textContent = `${minutes} min`;

  // Goal ring
  updateRing();
}

function updateRing() {
  const arc = document.getElementById('goal-arc');
  const ring = document.getElementById('word-goal-ring');
  if (!arc || !ring) return;

  if (wordGoal <= 0) {
    arc.style.strokeDashoffset = CIRCUMFERENCE;
    ring.setAttribute('aria-valuenow', '0');
    return;
  }

  const progress = Math.min(wordCount / wordGoal, 1);
  const offset   = CIRCUMFERENCE * (1 - progress);
  arc.style.strokeDashoffset = offset;
  ring.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
}

// ─── Goal setting ────────────────────────────────────────────────────────────

function promptGoal() {
  const input = window.prompt('Set word goal:', String(wordGoal || 500));
  if (input === null) return; // cancelled
  const parsed = parseInt(input, 10);
  if (!isNaN(parsed) && parsed >= 0) {
    wordGoal = parsed;
    updateRing();
    // Re-render word count with goal
    const wordsEl = document.getElementById('status-words');
    if (wordsEl) {
      wordsEl.textContent = wordGoal > 0
        ? `${wordCount} / ${wordGoal} words`
        : `${wordCount} words`;
    }
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  // Listen for editor content changes
  window.addEventListener('editor:change', (e) => {
    updateFromContent(e.detail.content);
  });

  // ⌘⇧G to set goal
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g') {
      e.preventDefault();
      promptGoal();
    }
  });

  // Click on goal ring to set goal
  const ring = document.getElementById('word-goal-ring');
  if (ring) ring.addEventListener('click', promptGoal);
}

module.exports = { init, updateFromContent, getWordCount: () => wordCount };
