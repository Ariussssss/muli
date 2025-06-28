const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const commonCssLoader = [
  MiniCssExtractPlugin.loader,
  'css-loader',
  'postcss-loader',
]
module.exports = {
  entry: { index: ['./src/index.tsx'] },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(path.join(__dirname, '../src')),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
	    loader: 'babel-loader',
            // loader: 'esbuild-loader',
            // options: {
            //   loader: 'jsx',
            // },
          },
        ],
      },
      {
        test: /\.(css)$/,
        use: commonCssLoader,
      },
      {
        test: /\.less$/,
        use: [...commonCssLoader, 'less-loader'],
      },
      {
        test: /\.s(a|c)ss$/,
        use: [...commonCssLoader, 'sass-loader'],
      },
      {
        test: /\.styl$/,
        use: [...commonCssLoader, 'stylus-loader'],
      },
      {
        test: /\.(ttf|eot|svg|woff|woff2)(\?.+)?$/,
        loader: 'url-loader',
        options: { limit: 1024 * 10 },
        exclude: /\.inline.svg$/,
      },
      {
        test: /\.(png|jpe?g|gif|webp)$/,
        loader: 'url-loader',
        options: { limit: 1024 * 10 },
      },
      {
        test: /\.inline.svg$/,
        use: [
          {
            loader: 'react-svg-loader',
            options: {
              svgo: {
                plugins: [
                  {
                    prefixIds: true,
                  },
                  {
                    removeDimensions: true,
                  },
                ],
              },
              jsx: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: 'auto',
      defer: ['index'],
    }),
    new MiniCssExtractPlugin(),
    new webpack.DefinePlugin({
      NODE_ENV: `"${process.env.NODE_ENV}"`,
    }),
  ],
  externals: {
    // react: 'React',
    // 'react-dom': 'ReactDOM',
  },
}
