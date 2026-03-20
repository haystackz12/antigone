const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [MiniCssExtractPlugin.loader, { loader: 'css-loader' }],
});

module.exports = {
  module: {
    rules,
  },
  plugins: [
    new MiniCssExtractPlugin(),
  ],
};
