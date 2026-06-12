import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    site: 'https://bjsmith.xyz',
    // Netlify adapter routes astro:assets through the Netlify Image CDN in
    // production (on-demand edge transforms); dev still uses local sharp.
    adapter: netlify(),
    integrations: [sitemap()],
    build: {
        assets: '_assets',
    },
    vite: {
        build: {
            cssMinify: true,
        },
    },
});
