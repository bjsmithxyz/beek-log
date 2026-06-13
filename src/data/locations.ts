export interface Location {
  name: string;
  lat: number;
  lng: number;
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
    else map.set(key, { name: loc.name, lat: loc.lat, lng: loc.lng, count: 1 });
  }
  return [...map.values()];
}
