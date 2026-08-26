export interface Point {
  name: string;
  lat: number;
  lng: number;
}

export interface Location extends Point {
  region?: Point;
}

interface RollLike {
  data: {
    location: Location;
    photos: { location?: Location }[];
  };
}

export type CountedLocation = Location & { count: number };

// Distinct shoot locations across a roll's photos, using each photo's override
// or the roll's primary location. De-duplicated by name (case-insensitive).
export function effectiveLocations(roll: RollLike): CountedLocation[] {
  const map = new Map<string, CountedLocation>();
  for (const photo of roll.data.photos) {
    const loc = photo.location ?? roll.data.location;
    const key = loc.name.toLowerCase();
    const existing = map.get(key);
    if (existing) existing.count += 1;
    // only attach `region` when present, so region-less locations keep their
    // exact shape (no `region: undefined` key)
    else map.set(key, {
      name: loc.name, lat: loc.lat, lng: loc.lng,
      ...(loc.region ? { region: loc.region } : {}),
      count: 1,
    });
  }
  return [...map.values()];
}

export interface Pin {
  slug: string;       // representative roll (jump target for the pin anchor)
  slugs: string[];    // every roll that contributes to this pin (for cross-highlight)
  label: string;
  lat: number;
  lng: number;
  count: number;
  members: string[];
}

interface PinRoll extends RollLike {
  id: string;
}

// By default pins are grouped by region for compact country-level summaries.
// The map opts into exact locations so a country centroid is never shown as if
// it were the place where a frame was made.
export function aggregatePins(rolls: PinRoll[], options: { groupByRegion?: boolean } = {}): Pin[] {
  const groupByRegion = options.groupByRegion ?? true;
  const groups = new Map<string, {
    slug: string; slugs: Set<string>; label: string; lat: number; lng: number;
    count: number; places: Map<string, number>;
  }>();
  for (const roll of rolls) {
    for (const loc of effectiveLocations(roll)) {
      const region = groupByRegion ? loc.region : undefined;
      const label = region ? region.name : loc.name;
      // Include coordinates in exact-location keys: two places with the same
      // name should not silently collapse into one map point.
      const key = groupByRegion
        ? label.toLowerCase()
        : `${loc.name.toLowerCase()}|${loc.lat.toFixed(4)}|${loc.lng.toFixed(4)}`;
      let g = groups.get(key);
      if (!g) {
        g = {
          slug: roll.id,
          slugs: new Set(),
          label,
          lat: region ? region.lat : loc.lat,
          lng: region ? region.lng : loc.lng,
          count: 0,
          places: new Map(),
        };
        groups.set(key, g);
      }
      g.slugs.add(roll.id);
      g.count += loc.count;
      const member = groupByRegion ? loc.name : loc.region?.name;
      if (member) g.places.set(member, (g.places.get(member) ?? 0) + loc.count);
    }
  }
  return [...groups.values()].map((g) => {
    const labelKey = g.label.toLowerCase();
    return {
      slug: g.slug,
      slugs: [...g.slugs],
      label: g.label,
      lat: g.lat,
      lng: g.lng,
      count: g.count,
      members: [...g.places.entries()]
        .filter(([name]) => name.toLowerCase() !== labelKey)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name),
    };
  });
}
