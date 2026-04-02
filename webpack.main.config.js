module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // electron-store v11 is ESM-only — must be loaded at runtime, not bundled
  externals: {
    'electron-store': 'commonjs2 electron-store',
  },
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
};
