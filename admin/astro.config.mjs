import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://admin.bjsmith.xyz',
  output: 'server',
  adapter: netlify(),
  build: {
    assets: '_assets',
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
      cssMinify: true,
    },
  },
});
