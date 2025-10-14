/*
Copyright (c) 2018 Red Hat, Inc.

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const axios = require('axios').default;
const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const FederationPlugin = require('@redhat-cloud-services/frontend-components-config-utilities/federated-modules');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const { Agent } = require('https');
const { insights } = require('./package.json');
const mswMiddleware = require('./mockdata/msw/msw-middleware');

const name = insights.appname;
const moduleName = name.replace(/-(\w)/g, (_, match) => match.toUpperCase());
const reactCSS = /@patternfly\/react-styles\/css/;

const modDir = 'node_modules';
const srcDir = path.resolve(__dirname, 'src');

module.exports = async (_env, argv) => {
  const { outputPath } = argv;
  const devMode = argv.mode !== 'production';
  process.env.DEV_MODE = devMode;

  const sentryReleaseVersion = process.env.SENTRY_VERSION || argv.env['sentry-version'];

  const isDevServer = process.argv.includes('serve');

  // Check if we should use the MSW Node.js server
  // Using file-based detection since FEC doesn't pass env vars through
  const useMswServer = fs.existsSync(path.join(__dirname, '.msw-mode'));
  
  if (useMswServer) {
    console.log('[WEBPACK CONFIG] 🚀 MSW Node.js server mode ENABLED (.msw-mode file detected)');
  } else {
    console.log('[WEBPACK CONFIG] ℹ️  MSW Node.js server mode disabled (using custom middleware or Python server)');
  }

  const outDir = outputPath
    ? path.resolve(__dirname, outputPath)
    : path.resolve(__dirname, 'dist', insights.appname);

  const publicPath = `/apps/${insights.appname}/`;

  let bundleAnalyzer = null;
  if (process.env.BUNDLE_ANALYZER) {
    bundleAnalyzer = new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'report.html',
      openAnalyzer: false,
    });
  }
  const entry = path.resolve(srcDir, 'bootstrap.ts');

  const noInsightsProxy = !!argv.env.noproxy;
  // Support `logging=quiet` vs. `logging=verbose`. Default verbose (might change in future).
  const verboseLogging = argv.env.logging !== 'quiet';
  console.log(`verboseLogging: ${verboseLogging}`);
  // Variable to run assisted-ui in standalone mode. You need to take a look to README to see instructions when ai_standalone=true
  const runAIinStandalone = !!argv.env.ai_standalone;

  const chromeTemplateUrl = `https://console.redhat.com/apps/chrome/index.html`;
  const getChromeTemplate = async () => {
    try {
      const result = await axios.get(chromeTemplateUrl);
      return result.data;
    } catch (error) {
      console.warn('[webpack] Failed to fetch Chrome template (offline/VPN required). Using fallback.');
      // Return a minimal fallback template
      return '<html><head></head><body><div id="root"></div></body></html>';
    }
  };
  const chromeTemplate = await getChromeTemplate();
  
  // Read MSW pre-init script (wrap in try-catch for safety)
  let chromeTemplateWithMSW = chromeTemplate;
  try {
    const mswPreInitScript = fs.readFileSync(path.resolve(srcDir, 'msw-pre-init.js'), 'utf-8');
    
    // Inject MSW pre-init into Chrome template (before closing </head> tag)
    chromeTemplateWithMSW = chromeTemplate.replace(
      '</head>',
      `<script>${mswPreInitScript}</script></head>`
    );
    console.log('[webpack] ✅ MSW pre-init script injected into HTML');
  } catch (error) {
    console.warn('[webpack] ⚠️  Could not inject MSW pre-init script:', error.message);
    console.warn('[webpack] Continuing without MSW pre-init...');
  }

  // For hot reloads while developing, reset window's onbeforeunload event
  // to prevent browser confirmation dialogs.
  if (module.hot && typeof module.hot.dispose === 'function') {
    module.hot.dispose(() => {
      window.onbeforeunload = null;
    });
  }

  const keepAliveAgent = new Agent({
    maxSockets: 100,
    keepAlive: true,
    maxFreeSockets: 10,
    keepAliveMsecs: 1000,
    timeout: 60000,
  });

  return {
    mode: argv.mode || 'development',
    entry,

    infrastructureLogging: {
      level: verboseLogging ? 'verbose' : 'warn',
      // Logs all proxy activity. Is verbose & redundant with mockserver's own logging.
      // debug: [name => name.includes('webpack-dev-server')],
    },

    output: {
      path: outDir,
      filename: 'bundle.[name].[contenthash].js',
      hashFunction: 'xxhash64', // default md4 not allowed on recent NodeJS/OpenSSL
      publicPath,
    },
    devtool: devMode ? 'cheap-module-source-map' : 'source-map',

    plugins: [
      new ForkTsCheckerWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: devMode ? '[name].css' : '[name].[contenthash].css',
        chunkFilename: devMode ? '[id].css' : '[id].[contenthash].css',
      }),
      new HtmlWebpackPlugin({
        templateContent: chromeTemplateWithMSW,
      }),
      new webpack.DefinePlugin({
        APP_DEVMODE: devMode,
        APP_DEV_SERVER: isDevServer,
        APP_SENTRY_RELEASE_VERSION: JSON.stringify(sentryReleaseVersion),
        process: { env: {} },
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: 'public', to: outDir, toType: 'dir' }],
      }),
      FederationPlugin({
        debug: true,
        root: __dirname,
        moduleName,
        exposes: {
          './RootApp': path.resolve(srcDir, 'chrome-main.tsx'),
        },
        // These have to be excluded until the application migrates to supported versions of webpack configurations
        exclude: ['react-redux', 'react-router-dom'],
        shared: [
          {
            'react-router-dom': {
              singleton: true,
              version: '^6.2.0',
            },
          },
        ],
      }),
      bundleAnalyzer,
      new MonacoWebpackPlugin({
        languages: ['yaml'],
        customLanguages: [
          {
            label: 'yaml',
            entry: 'monaco-yaml',
            worker: {
              id: 'monaco-yaml/yamlWorker',
              entry: 'monaco-yaml/yaml.worker',
            },
          },
        ],
      }),
    ].filter(Boolean),

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: srcDir,
          use: {
            loader: 'babel-loader', // babel config is in babel.config.js
            options: {
              cacheDirectory: true,
            },
          },
        },
        {
          test: /src\/.*\.tsx?$/,
          loader: 'ts-loader',
          exclude: /(node_modules)/i,
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  includePaths: ['./node_modules/', './src'],
                },
              },
            },
          ],
        },
        {
          // eslint-disable-next-line max-len
          // Since we use Insights' upstream PatternFly, we're using null-loader to save about 1MB of CSS
          test: /\.css$/i,
          include: reactCSS,
          use: 'ocm-null-loader',
        },
        {
          test: /\.css$/,
          exclude: reactCSS,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /(webfont\.svg|\.(eot|ttf|woff|woff2))$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash].[ext]',
          },
        },
        {
          test: /(?!webfont)\.(gif|jpg|png|svg)$/,
          type: 'asset', // automatically chooses between bundling small images in JS as base64 URIs and emitting separate files based on size
          generator: {
            filename: 'images/[name].[hash].[ext]',
          },
        },
        // For react-markdown#unified#vfile
        // https://github.com/vfile/vfile/issues/38#issuecomment-683198538
        {
          test: /node_modules\/vfile\/core\.js/,
          use: [
            {
              loader: 'imports-loader',
              options: {
                type: 'commonjs',
                imports: ['single process/browser process'],
              },
            },
          ],
        },
        {
          // Monaco editor uses .ttf icons.
          test: /\.(svg|ttf)$/,
          type: 'asset/resource',
        },
      ],
    },

    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      modules: [srcDir, modDir],
      // For react-markdown#unified#vfile
      fallback: {
        path: require.resolve('path-browserify'),
        url: require.resolve('url/'),
      },
      alias: {
        '~': path.resolve(__dirname, 'src/'),
      },
    },

    resolveLoader: {
      modules: ['node_modules', path.resolve(__dirname, 'loaders')],
    },

    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      },
      historyApiFallback: {
        index: `${publicPath}index.html`,
        rewrites: [
          { from: /^\/src\/.*\.[a-zA-Z0-9]+$/, to: (context) => context.parsedUrl.pathname },
          // Add other rewrites or leave existing rewrites here
          { from: /^\/assisted-installer(.*)$/, to: '/assisted-installer-app$1' },
        ],
      },
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }

        // MSW Middleware - intercepts API requests BEFORE proxying
        // This runs when ?env=msw-mockdata is present
        // NOTE: Only used when not using MSW Node.js server (fallback mode)
        if (!useMswServer) {
          middlewares.unshift({
            name: 'msw-mock-middleware',
            middleware: mswMiddleware,
          });
          console.log('[WEBPACK] ✅ MSW middleware registered - will intercept API requests when ?env=msw-mockdata is present');
        } else {
          console.log('[WEBPACK] ℹ️  MSW Node.js server mode - using proxy to localhost:9001');
        }

        if (verboseLogging) {
          middlewares.unshift({
            name: 'logging',
            middleware: (request, response, next) => {
              console.log('Handling', request.originalUrl);
              next();
            },
          });

          // Custom middleware for logging request URLs
          middlewares.unshift({
            name: 'log-requests',
            middleware: (req, res, next) => {
              console.log('---> Request URL:', req.url); // Log the request URL
              next(); // Continue to the next middleware
            },
          });
        }

        if (devMode) {
          middlewares.unshift({
            name: 'local-source-code-loader-middleware',
            middleware: (req, res, next) => {
              if (verboseLogging) {
                console.log('Adding local-source-code-loader-middleware', req.url);
              }
              if (req.url.startsWith('/src/')) {
                const relativePath = req.url.substring('/src/'.length);
                const filePath = path.join(srcDir, relativePath);

                try {
                  if (fs.existsSync(filePath)) {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    res.setHeader('Content-Type', 'text/plain');
                    res.send(fileContent);
                  } else {
                    res.status(404).send('File not found');
                  }
                } catch (error) {
                  console.error('Error reading source code file:', error);
                  res.status(500).send('Internal Server Error');
                }
              } else {
                next();
              }
            },
          });
        }
        return middlewares;
      },
      proxy: noInsightsProxy
        ? [
          // /mockdata routes - go to MSW Node.js server OR Python server
          // When USE_MSW_SERVER=true, routes to MSW at localhost:9001
          // Otherwise, routes to legacy Python server at port 8010
          {
            context: ['/mockdata'],
            pathRewrite: { '^/mockdata': '' },
            target: useMswServer ? 'http://localhost:9001' : 'http://[::1]:8010',
            changeOrigin: true,
            logLevel: 'info',
            onProxyReq(proxyRequest, req) {
              if (useMswServer) {
                console.log('[WEBPACK] → MSW Server:', req.url);
              }
            },
          },
          runAIinStandalone
            ? {
              context: ['/apps/assisted-installer-app/**'],
              target: 'http://[::1]:8003',
              logLevel: 'debug',
              secure: false,
              changeOrigin: true,
            }
            : {},
          {
            // docs: https://github.com/chimurai/http-proxy-middleware#http-proxy-options
            // proxy everything except our own app, mimicking insights-proxy behaviour
            context: ['**', '!/mockdata/**', '!/src/**', `!/apps/${insights.appname}/**`],
            target: 'https://console.redhat.com',
            agent: keepAliveAgent,
            headers: {
              Connection: 'keep-alive',
            },
            proxyTimeout: 17000,
            // replace the "host" header's URL origin with the origin from the target URL
            changeOrigin: true,
            // change the "origin" header of the proxied request to avoid CORS
            // many APIs do not allow the requests from the foreign origin
            onProxyReq(proxyRequest) {
              proxyRequest.setHeader('origin', 'https://console.redhat.com');
              proxyRequest.setHeader('Connection', 'keep-alive');
              if (verboseLogging) {
                console.log('  proxying console.redhat.com:', proxyRequest.path);
              }
            },
          },
        ]
        : undefined,
      hot: false,
      port: noInsightsProxy ? 1337 : 8001,
      server: noInsightsProxy ? 'https' : 'http',
      host: '0.0.0.0',
      allowedHosts: 'all',
      client: {
        overlay: {
          warnings: (warning) => {
            // thrown by:
            // node_modules/@openshift/dynamic-plugin-sdk-webpack/dist/index.cjs.js (line 227)
            // fed-mods.json: Plugin has no extensions
            // A warning that will be removed in the future, it's a side effect of integrating with a
            // system compatible in the openshift console.
            if (warning.message === 'Plugin has no extensions') {
              return false;
            }
            return true;
          },
        },
      },
    },
  };
};
