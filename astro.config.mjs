import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    site: 'https://bjsmith.xyz',
    integrations: [sitemap()],
    build: {
        assets: '_assets',
    },
    image: {
        // Enable built-in image optimization
        service: {
            entrypoint: 'astro/assets/services/sharp',
        },
    },
    vite: {
        build: {
            cssMinify: true,
        },
    },
});
