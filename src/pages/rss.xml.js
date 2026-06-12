import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const work = await getCollection('work', ({ data }) => !data.draft);

  const items = work
    .map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/work/${entry.slug}/`,
    }))
    .sort((a, b) => b.pubDate - a.pubDate);

  return rss({
    title: 'bjsmith.xyz',
    description: 'Portfolio of beek - tech guy & creative',
    site: context.site,
    items,
  });
}
