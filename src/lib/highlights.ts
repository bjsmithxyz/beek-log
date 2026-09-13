import type { ImageMetadata } from 'astro';
import { getFilmStock } from '@beek/shared/film-stocks';
import { getPhotoRolls, byDateDesc } from './collections';
import { formatFilmEdgeDate } from './dates';

export interface Highlight {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  rollId: string;
  rollTitle: string;
  /** 1-based position of the frame within its roll (matches lightbox ids). */
  frameNumber: number;
  filmName: string;
  filmType: ReturnType<typeof getFilmStock>['type'];
  locationName: string;
  shortDate: string;
}

// Every featured frame across all rolls, newest roll first, with film stock,
// location and film-edge date resolved once. The single source of truth for
// the highlights page and the /photos/ promo, so the two can't drift apart.
export async function getHighlights(): Promise<Highlight[]> {
  const rolls = (await getPhotoRolls()).sort(byDateDesc);
  return rolls.flatMap((roll) =>
    roll.data.photos
      .map((photo, index) => ({ photo, frameNumber: index + 1 }))
      .filter(({ photo }) => photo.featured)
      .map(({ photo, frameNumber }) => {
        const film = getFilmStock(roll.data.stock);
        return {
          src: photo.src,
          alt: photo.alt,
          caption: photo.caption,
          rollId: roll.id,
          rollTitle: roll.data.title,
          frameNumber,
          filmName: film.name,
          filmType: film.type,
          locationName: photo.location?.name ?? roll.data.location.name,
          shortDate: formatFilmEdgeDate(roll.data.date),
        };
      })
  );
}
