const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [MiniCssExtractPlugin.loader, { loader: 'css-loader' }],
});

module.exports = {
    devtool: 'source-map',
    module: {
    rules,
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'src/themes'), to: 'themes' },
      ],
    }),
  ],
};
