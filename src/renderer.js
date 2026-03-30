// src/renderer.js
// Webpack entry point for the renderer process.

'use strict';

require('./styles.css');
const { init: initEditor } = require('./editor.js');

document.addEventListener('DOMContentLoaded', () => {
  initEditor();
});
