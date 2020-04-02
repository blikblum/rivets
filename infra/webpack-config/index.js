// https://github.com/Microsoft/TypeScript-Babel-Starter
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const rootPath = process.cwd();
const package = require(rootPath + "/package.json");

const moduleFound = (name) => {
  try {
    return require.resolve(name)
  } catch (error) {
    return false;
  }
}

var getCopyPluginConfig = function(config) {
  var copyPluginConfig = [];

  if (package.dependencies['bootstrap'] && config.copyAssets.modules.bootstrap === true && moduleFound('bootstrap')) {
    // Copy bootstrap scss files. Note: `require.resolve('bootstrap')` resolves to `'bootstrap/dist/js/bootstrap.js'` because this is the main file in package.json
    var bootstrapConfig = {
      from: path.resolve(
        path.dirname(require.resolve("bootstrap")),
        "../../scss"
      ),
      to: path.resolve(`${rootPath}/${config.copyAssets.foldername}/scss/vendors/bootstrap/`),
      toType: "dir"
    };
    copyPluginConfig.push(bootstrapConfig);
  }

  if (package.dependencies['@ribajs/bs4'] && config.copyAssets.modules['@ribajs/bs4'] === true && moduleFound('@ribajs/bs4')) {
    // Copy @ribajs/bs4 scss files
    var ribajsBs4Config = {
      from: path.dirname(require.resolve("@ribajs/bs4")) + "/**/*.scss",
      to: path.resolve(`${rootPath}/${config.copyAssets.foldername}/scss/vendors/@ribajs/bs4`),
      toType: "dir",
      context: path.dirname(require.resolve("@ribajs/bs4"))
    };
    copyPluginConfig.push(ribajsBs4Config);
  }

  if (package.dependencies['@ribajs/photoswipe'] && config.copyAssets.modules['@ribajs/photoswipe'] === true && moduleFound('@ribajs/photoswipe')) {
    // Copy @ribajs/photoswipe scss files
    var ribajsPhotoswipeConfig = {
      from:
        path.dirname(require.resolve("@ribajs/photoswipe")) + "/**/*.scss",
      to: path.resolve(`${rootPath}/${config.copyAssets.foldername}/scss/vendors/@ribajs/photoswipe`),
      toType: "dir",
      context: path.dirname(require.resolve("@ribajs/photoswipe"))
    };
    copyPluginConfig.push(ribajsPhotoswipeConfig);
  }

  if (package.dependencies['@ribajs/iconset'] && config.copyAssets.modules['@ribajs/iconset'] === true && moduleFound('@ribajs/iconset')) {
    // Copy iconset svg's
    var ribajsIconsetConfig = {
      from: path.resolve(
        path.dirname(require.resolve("@ribajs/iconset")),
        "svg"
      ),
      to: path.resolve(`${rootPath}/${config.copyAssets.foldername}/iconset/`),
      toType: "dir",
      context: path.dirname(require.resolve("@ribajs/iconset"))
    };
    copyPluginConfig.push(ribajsIconsetConfig);
  }

  return copyPluginConfig;
}

var getStyleLoaderRule = (config) => {
  var rule = {
    test: /\.s[ac]ss$/i,
    use: []
  };

  if (config.styles.extract === true) {
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    rule.use.push({
      loader: MiniCssExtractPlugin.loader,
      options: {
        // only enable hot in development
        hmr: process.env.NODE_ENV === 'development',
        // if hmr does not work, this is a forceful method.
        reloadAll: true,
      },
    });
  }

  rule.use.push({
    loader: require.resolve('css-loader'),
    options: {
      url: false,
    }
  });

  rule.use.push({
    loader: require.resolve('postcss-loader')
  });
  
  rule.use.push({
    loader: require.resolve('sass-loader'),
    options: {
      webpackImporter: true
    }
  });
  return rule;
}

module.exports = config => {

  var plugins = [];

  var rules = [
    // typescript and javascript
    {
      test: /\.(tsx?)|\.(js)$/,
      exclude: [/node_modules\/(?!@ribajs)/, /(bower_components)/],
      loader: require.resolve('babel-loader'),
    },
    // html templates
    {
      test: /\.html$/,
      use: [ {
        loader: require.resolve('html-loader'),
        options: {
          minimize: true
        }
      }]
    },
    // pug templates
    {
      test: /\.pug$/,
      use: [ {
        loader: require.resolve('pug-loader'),
        options: {
          minimize: true
        }
      }]
    },
  ];

  // config defaults
  config.detectDuplicates = true;

  config.styles = {
    build: true,
    extract: true,
  };

  // config defaults for config templates
  switch (config.template.toLowerCase()) {
    case 'octobercms':
      config.entry = [rootPath + "/assets/ts/main.ts"];
      config.output = {
        path: path.resolve(rootPath, "assets/js")
      }

      /**
       * On October we use the build in sass compiler for the styles to make use of some october features like theme setting variables in the scss files,
       * so we do not want to build the styles using webpack
       */
      config.styles.build = false;
  
      config.copyAssets = {
        enable: true,
        foldername: 'assets',
        // Because we use october to compile the styles we copy the verndor styles to october
        modules: {
          "bootstrap": true,
          "@ribajs/bs4": true,
          "@ribajs/photoswipe": true,
          "@ribajs/iconset": true,
        }
      }
      break;
    case 'shopify':
      config.entry = [rootPath + '/src/scss/main.scss', rootPath + "/src/ts/main.ts"];
      config.output = {
        path: path.resolve(rootPath, "theme/assets/")
      }
  
      config.styles.build = true;
      config.styles.extract = true;
  
      config.copyAssets = {
        enable: true,
        foldername: 'src',
        // Looks like there is a bug on webpack 5 + yarn 2 + sass-loader
        // sass imports from modules like `@import "~bootstrap/scss/functions";` are working with NPM but not with Yarn's PnP feature.
        // Until this is fixed we use a WORKAROUND by copy the scss files to the project
        modules: {
          "bootstrap": true,
          "@ribajs/bs4": true,
          "@ribajs/photoswipe": true,
          "@ribajs/iconset": true,
        }
      }
      break;
    // E.g. used for demos 
    case 'local':
      config.entry = [rootPath + '/src/scss/main.scss', rootPath + '/src/ts/main.ts'],
      config.output = {
        path: path.resolve(rootPath, 'dist/')
      };

      config.styles.build = true;
      config.styles.extract = true;

      config.copyAssets = {
        enable: true,
        foldername: 'src',
        // Looks like there is a bug on webpack 5 + yarn 2 + sass-loader
        // sass imports from modules like `@import "~bootstrap/scss/functions";` are working with NPM but not with Yarn's PnP feature.
        // Until this is fixed we use a WORKAROUND by copy the scss files to the project
        modules: {
          "bootstrap": true,
          "@ribajs/bs4": true,
          "@ribajs/photoswipe": true,
          "@ribajs/iconset": true,
        }
      }

      config.devServer = {
        host: '0.0.0.0',
        contentBase: './src',
      };

      const HtmlWebpackPlugin = require("html-webpack-plugin");
      plugins.push(new HtmlWebpackPlugin({
        template: rootPath + "/src/index.html",
        filename: "index.html"
      }));

      break;
    default:
      break;
  }

  if (config.copyAssets && config.copyAssets.enable === true) {
    // https://github.com/webpack-contrib/copy-webpack-plugin
    const CopyPlugin = require("copy-webpack-plugin");
    var copyPluginConfig = getCopyPluginConfig(config);
    plugins.push(new CopyPlugin(copyPluginConfig));
  }

  if (config.detectDuplicates === true) {
    const { DuplicatesPlugin } = require("inspectpack/plugin");
    plugins.push(new DuplicatesPlugin());
  }

  if (config.styles.extract === true) {
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    plugins.push(new MiniCssExtractPlugin({
      filename: '[name].css',
    }));
  }

  if (config.styles.build === true) {
    rules.push(getStyleLoaderRule(config));
  }

  return env => {
    return {
      optimization: {
        minimizer: [
          new TerserPlugin({
            sourceMap: !env.production,
            terserOptions: {
              ecma: undefined,
              warnings: true,
              parse: {},
              compress: {},
              mangle: true, // Note `mangle.properties` is `false` by default.
              module: false,
              output: {
                comments: false
              },
              toplevel: false,
              nameCache: null,
              ie8: false,
              keep_classnames: undefined,
              keep_fnames: false,
              safari10: true
            }
          })
        ],
        splitChunks: {
          automaticNameDelimiter: ".",
          // TODO refactor see https://webpack.js.org/migrate/5/
          automaticNameDelimiter: '.',
          chunks: 'all',
          cacheGroups: {
            commons: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all'
            },
            styles: {
              name: 'styles',
              test: /\.css$/,
              chunks: 'all',
              enforce: true,
            },
          }
        }
      },
      // Change to your "entry-point".
      entry: config.entry,
      devtool: env.production ? undefined : "inline-source-map",
      mode: env.production ? "production" : "development",
      output: {
        filename: "[name].bundle.js",
        path: config.output.path,
      },
      resolve: {
        // modules: ["node_modules"],
        extensions: [".ts", ".tsx", ".js", ".json", ".scss", ".pug", ".html"],
        symlinks: true,
        alias: {
        },
      },
      devServer: config.devServer,
      module: {
        rules: rules,
      },
      plugins: plugins,
    };
  }; 
};

