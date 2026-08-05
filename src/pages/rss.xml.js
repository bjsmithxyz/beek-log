import rss from '@astrojs/rss';
import { getFilmStock } from '@beek/shared/film-stocks';
import { getWorkEntries, getPhotoRolls } from '../lib/collections';
import { siteDescription, siteName } from '../data/site';

export async function GET(context) {
  const work = await getWorkEntries();
  const rolls = await getPhotoRolls();

  const items = [
    ...work.map((entry) => ({
      title: entry.data.title,
      // A piece may carry no description; fall back rather than syndicate an
      // empty element.
      description: entry.data.description || `${entry.data.category} — ${entry.data.title}`,
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
    title: siteName,
    description: siteDescription,
    site: context.site,
    items,
  });
}
