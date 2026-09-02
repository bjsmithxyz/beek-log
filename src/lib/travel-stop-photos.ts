import { haversine } from '@beek/shared/trip-runtime';
import { effectiveLocations } from '../data/locations';

export type PhotoLink = { href: string; title: string };

type StopLike = { name: string; lat: number; lon: number };

type RollLike = {
  id: string;
  data: {
    title: string;
    location: {
      name: string;
      lat: number;
      lng: number;
      region?: { name: string; lat: number; lng: number };
    };
    photos: { location?: RollLike['data']['location'] }[];
  };
};

// Word-preserving: separators collapse to spaces rather than vanishing, so
// matching below can require whole words. Stripping them outright made
// "Huacachina" contain "China", which linked every Chinese roll to a Peruvian
// desert oasis.
export const normalizePlace = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// True when one place name contains the other as a whole run of words, so
// "Chiang Mai City Municipality" still matches the stop "Chiang Mai".
export const containsWords = (haystack: string, needle: string) =>
  ` ${haystack} `.includes(` ${needle} `);

/** Keyed by index into the published stop list (what the client indexes). */
export function buildStopPhotoLinks(
  stops: StopLike[],
  photoRolls: RollLike[],
): Record<number, PhotoLink[]> {
  return Object.fromEntries(stops.map((stop, index) => {
    const stopName = normalizePlace(stop.name);
    const related = photoRolls.filter((roll) => effectiveLocations(roll).some((location) => {
      const names = [location.name, location.region?.name]
        .filter((name): name is string => Boolean(name))
        .map(normalizePlace);
      const nameMatch = names.some((name) => containsWords(name, stopName) || containsWords(stopName, name));
      const distance = haversine(stop, { lat: location.lat, lon: location.lng });
      return nameMatch || distance <= 80;
    })).map((roll) => ({
      href: `/photos/${roll.id}/`,
      title: roll.data.title,
    }));
    return [index, related];
  }));
}
