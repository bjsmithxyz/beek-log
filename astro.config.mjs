import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: 'https://bjsmith.xyz',
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
