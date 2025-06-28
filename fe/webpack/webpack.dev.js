const { merge } = require('webpack-merge')
const commonConfig = require('./webpack.common.js')
const path = require('path')

const config = merge(commonConfig, {
  mode: 'development',
  devServer: {
    hot: true,
    port: 5173,
    compress: true,
    host: 'localhost',
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  devtool: 'source-map',
  cache: {
    type: 'filesystem',
    allowCollectingMemory: true,
  },
})

module.exports = config
