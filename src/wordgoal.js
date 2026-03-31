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

// ─── Goal setting via inline input ───────────────────────────────────────────

function setWordGoal(val) {
  wordGoal = val;
  updateRing();
  const wordsEl = document.getElementById('status-words');
  if (wordsEl) {
    wordsEl.textContent = wordGoal > 0
      ? `${wordCount} / ${wordGoal} words`
      : `${wordCount} words`;
  }
}

function showGoalInput() {
  // Toggle: remove existing input if open
  const existing = document.getElementById('goal-input-overlay');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'goal-input-overlay';

  const input = document.createElement('input');
  input.type = 'number';
  input.id = 'goal-input';
  input.placeholder = 'Word goal';
  input.min = '0';
  input.max = '999999';
  input.value = String(wordGoal || '');

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Set';
  confirmBtn.id = 'goal-confirm';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '\u2715';
  cancelBtn.id = 'goal-cancel';

  overlay.appendChild(input);
  overlay.appendChild(confirmBtn);
  overlay.appendChild(cancelBtn);

  // Position near the word goal button, appended to body to avoid layout issues
  document.body.appendChild(overlay);
  const ring = document.getElementById('word-goal-ring');
  if (ring) {
    const rect = ring.getBoundingClientRect();
    overlay.style.position = 'fixed';
    overlay.style.top = (rect.bottom + 4) + 'px';
    overlay.style.right = (window.innerWidth - rect.right) + 'px';
    overlay.style.zIndex = '600';
  }
  input.focus();
  input.select();

  const confirm = () => {
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val >= 0) setWordGoal(val);
    overlay.remove();
  };

  confirmBtn.onclick = confirm;
  cancelBtn.onclick = () => overlay.remove();
  input.onkeydown = (e) => {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') overlay.remove();
  };
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
      showGoalInput();
    }
  });

  // Click on goal ring to set goal
  const ring = document.getElementById('word-goal-ring');
  if (ring) ring.addEventListener('click', showGoalInput);
}

module.exports = { init, updateFromContent, getWordCount: () => wordCount };
