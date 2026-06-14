import rss from '@astrojs/rss';
import { getFilmStock } from '../data/film-stocks';
import { getWorkEntries, getPhotoRolls } from '../lib/collections';

export async function GET(context) {
  const work = await getWorkEntries();
  const rolls = await getPhotoRolls();

  const items = [
    ...work.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/work/${entry.id}/`,
    })),
    ...rolls.map((entry) => ({
      title: entry.data.title,
      description: `${getFilmStock(entry.data.stock).name} · ${entry.data.location.name} — ${entry.data.photos.length} frames`,
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
