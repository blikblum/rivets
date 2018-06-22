var webpack = require('webpack');

module.exports = function(env) {
    var entry = {
      tinybind: './src/export.js'
    }

    if (env.minimize) {
      entry['tinybind.min'] = './src/export.js';
    }

   return {
    context: __dirname,
    entry: entry,

    output: {
      path: __dirname + '/dist',
      filename: '[name].js',
      library: 'tinybind',
      libraryTarget: 'umd',
      libraryExport: 'default'
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: '/node_modules/',
          use: [{
            loader: 'babel-loader',
            options: {
              presets: [
                ['es2015', {loose: true, modules: false}]
              ]
            }
          }]
        }
      ]
    },

    plugins: [
      new webpack.optimize.ModuleConcatenationPlugin(),

      new webpack.optimize.UglifyJsPlugin({
        include: /\.min\.js$/
      })
    ],

    resolve: {
      extensions: ['.js']
    }
  }
};
