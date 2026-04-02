// src/wordgoal.js
// Word count engine — displays count and reading time in status bar.
// Goal ring and inline input removed for v1.0.

'use strict';

let wordCount = 0;

function updateFromContent(text) {
  wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 200));

  const wordsEl = document.getElementById('status-words');
  const timeEl  = document.getElementById('status-readtime');
  if (wordsEl) wordsEl.textContent = `${wordCount} words`;
  if (timeEl) timeEl.textContent = `${minutes} min`;
}

function init() {
  window.addEventListener('editor:change', (e) => {
    updateFromContent(e.detail.content);
  });
}

module.exports = { init, updateFromContent, getWordCount: () => wordCount };
