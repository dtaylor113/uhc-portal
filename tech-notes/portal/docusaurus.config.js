// @ts-check

const config = {
  title: 'Tech Notes',
  url: 'http://localhost',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  trailingSlash: false,
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */ (
        {
          docs: {
            // Load docs from the parent tech-notes directory
            path: '..',
            routeBasePath: '/',
            sidebarPath: require.resolve('./sidebars.js'),
            include: ['**/*.md', '**/*.mdx'],
            exclude: ['portal/**', 'node_modules/**']
          },
          blog: false,
          theme: {
            customCss: require.resolve('./src/css/custom.css'),
          },
        }
      ),
    ],
  ],
  themes: [],
};

module.exports = config;


