import { StorybookConfig } from '@storybook/react-webpack5';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { DefinePlugin, NormalModuleReplacementPlugin } from 'webpack';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../src/components/clusters/wizards/rosa/ControlPlaneScreen/ControlPlaneScreen.stories.tsx',
    '../src/components/clusters/wizards/rosa/AccountsRolesScreen/AccountsRolesScreen.stories.tsx',
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-webpack5-compiler-swc',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    '@storybook/addon-docs',
    {
      name: '@storybook/addon-styling-webpack',
      options: {
        rules: [
          // Replaces any existing Sass rules with given rules
          {
            test: /\.scss$/,
            use: [
              'style-loader',
              'css-loader',
              {
                loader: 'sass-loader',
                options: {
                  sassOptions: {
                    includePaths: ['./src'],
                  },
                },
              },
            ],
          },
          {
            test: /\.css$/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                },
              },
            ],
          },
        ],
      },
    },
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  typescript: {
    check: false,
    checkOptions: {},
    skipCompiler: false,
  },
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.plugins = [
        ...((config.resolve.plugins as any) ?? []),
        new TsconfigPathsPlugin({
          extensions: config.resolve.extensions,
        }),
      ];
      config.resolve.alias = {
        ...config.resolve.alias,
        '@redhat-cloud-services/frontend-components/useChrome': path.resolve(
          __dirname,
          'mocks/useChrome.ts',
        ),
        // Mock the release hooks for VersionSelection
        '~/components/releases/hooks': path.resolve(__dirname, 'mocks/releaseHooks.ts'),
        'src/components/releases/hooks': path.resolve(__dirname, 'mocks/releaseHooks.ts'),
      };
    }
    config.plugins = [
      ...(config.plugins || []),
      new DefinePlugin({
        APP_DEV_SERVER: true,
      }) as any,
      // Mock the release hooks for VersionSelection
      new NormalModuleReplacementPlugin(
        /^~\/components\/releases\/hooks$/,
        path.resolve(__dirname, 'mocks/releaseHooks.ts')
      ),
      new NormalModuleReplacementPlugin(
        /^src\/components\/releases\/hooks$/,
        path.resolve(__dirname, 'mocks/releaseHooks.ts')
      ),
    ];
    return config;
  },
  core: {
    disableTelemetry: true,
  },
};
export default config;
