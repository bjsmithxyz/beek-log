import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { filmStocks } from '../../../data/film-stocks';
import { ogCardPng, type OgCardOptions } from '../../../lib/og-card';

export const prerender = true;

// One terminal-aesthetic OG card per work entry and per film roll, generated at
// build time into dist/og/<collection>/<slug>.png. Detail pages reference these
// via the BaseLayout `image` prop.
export const getStaticPaths: GetStaticPaths = async () => {
  const work = await getCollection('work', ({ data }) => import.meta.env.DEV || !data.draft);
  const photos = await getCollection('photos', ({ data }) => import.meta.env.DEV || !data.draft);

  return [
    ...work.map((e) => ({
      params: { collection: 'work', slug: e.slug },
      props: {
        eyebrow: '~/beek/work',
        title: e.data.title,
        subtitle: `[${e.data.category}] · ${e.data.date.getFullYear()}`,
      } satisfies OgCardOptions,
    })),
    ...photos.map((e) => ({
      params: { collection: 'photos', slug: e.slug },
      props: {
        eyebrow: '~/beek/photos',
        title: e.data.title,
        subtitle: `${filmStocks[e.data.stock as keyof typeof filmStocks].name} · ${e.data.location.name}`,
      } satisfies OgCardOptions,
    })),
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const png = await ogCardPng(props as OgCardOptions);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
