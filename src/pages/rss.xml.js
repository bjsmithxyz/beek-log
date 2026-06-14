import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { filmStocks } from '../data/film-stocks';

export async function GET(context) {
  const work = await getCollection('work', ({ data }) => !data.draft);
  const rolls = await getCollection('photos', ({ data }) => !data.draft);

  const items = [
    ...work.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/work/${entry.id}/`,
    })),
    ...rolls.map((entry) => ({
      title: entry.data.title,
      description: `${filmStocks[entry.data.stock].name} · ${entry.data.location.name} — ${entry.data.photos.length} frames`,
      pubDate: entry.data.date,
      link: `/photos/${entry.id}/`,
    })),
  ].sort((a, b) => b.pubDate - a.pubDate);

  return rss({
    title: 'bjsmith.xyz',
    description: 'Portfolio of beek - tech guy & creative',
    site: context.site,
    items,
  });
}
