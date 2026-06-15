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
  slug: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  members: string[];
}

interface PinRoll extends RollLike {
  id: string;
}

// One pin per primary: group every roll's effective locations by region name
// (falling back to the place name). The pin sits at the region (or the place if
// none); `members` lists the distinct secondary places for the tooltip.
export function aggregatePins(rolls: PinRoll[]): Pin[] {
  const groups = new Map<string, {
    slug: string; label: string; lat: number; lng: number;
    count: number; places: Map<string, number>;
  }>();
  for (const roll of rolls) {
    for (const loc of effectiveLocations(roll)) {
      const region = loc.region;
      const label = region ? region.name : loc.name;
      const key = label.toLowerCase();
      let g = groups.get(key);
      if (!g) {
        g = {
          slug: roll.id,
          label,
          lat: region ? region.lat : loc.lat,
          lng: region ? region.lng : loc.lng,
          count: 0,
          places: new Map(),
        };
        groups.set(key, g);
      }
      g.count += loc.count;
      g.places.set(loc.name, (g.places.get(loc.name) ?? 0) + loc.count);
    }
  }
  return [...groups.values()].map((g) => {
    const labelKey = g.label.toLowerCase();
    return {
      slug: g.slug,
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
