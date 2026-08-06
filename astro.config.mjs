import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

// https://astro.build/config
export default defineConfig({
    site: 'https://bjsmith.xyz',
    // Netlify adapter routes astro:assets through the Netlify Image CDN in
    // production (on-demand edge transforms); dev still uses local sharp.
    adapter: netlify(),
    integrations: [sitemap()],
    // unified + sanitize so raw HTML in markdown cannot carry script/event
    // handlers. rehype-raw must run before rehype-sanitize.
    markdown: {
        processor: unified({
            remarkRehype: { allowDangerousHtml: true },
            rehypePlugins: [rehypeRaw, rehypeSanitize],
        }),
    },
    build: {
        assets: '_assets',
    },
    vite: {
        build: {
            cssMinify: true,
        },
    },
});
