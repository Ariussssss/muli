const { merge } = require('webpack-merge')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const commonConfig = require('./webpack.common.js')
const path = require('path')

const config = merge(commonConfig, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../output'),
    clean: true,
  },
  plugins:
    process.env.NODE_ENV === 'production' ? [] : [new BundleAnalyzerPlugin()],
})

module.exports = config
