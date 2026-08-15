// Climate normals for the published stops.
//
// The public page already names a place and the month a stay began. What the
// weather is typically like there in that month follows from those two facts
// alone — it is a property of the map, not of the itinerary — so it can be
// published without disclosing anything the privacy split withheld.
//
// It is resolved at build time from a committed cache (src/data/climate.json,
// written by scripts/fetch-climate.mjs). Nothing here runs in the browser: the
// public page makes no network requests at all, which is what retired the
// original per-stop Open-Meteo forecasts along with the road-ahead tab.

/** The reanalysis grid is coarser than a tenth of a degree, so that is the key. */
export function climateKey(lat, lon) {
  return `${Number(lat).toFixed(1)},${Number(lon).toFixed(1)}`;
}

/**
 * The normal for one point in one calendar month, or null when the cache has
 * not been regenerated since that stop was added. A missing normal is never an
 * error: the page simply renders the stop without weather.
 *
 * The four fields are copied out by name rather than spread, so whatever else a
 * hand-edited cache might carry cannot ride into the public payload.
 */
export function climateNormal(climate, lat, lon, month) {
  const normal = climate?.points?.[climateKey(lat, lon)]?.[String(month)];
  if (!normal) return null;
  const { maxC, minC, rainMm, daylightH } = normal;
  if ([maxC, minC, rainMm, daylightH].some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
    return null;
  }
  return { maxC, minC, rainMm, daylightH };
}

/**
 * The extremes of a published route: where it was hottest, coldest, wettest and
 * where the days ran longest. Each winner is a stop the page already lists, so
 * naming one adds no disclosure — only the reason it stands out.
 *
 * Returns the raw figure and the field it came from; how to print it is the
 * caller's business, since degrees round and millimetres do not.
 */
export function climateExtremes(stops) {
  const withClimate = stops.filter((stop) => stop.climate);
  if (!withClimate.length) return [];

  const best = (label, field, better) => {
    const winner = withClimate.reduce((leader, stop) => (better(stop.climate[field], leader.climate[field]) ? stop : leader));
    return { label, field, stop: winner, value: winner.climate[field] };
  };

  return [
    best('warmest', 'maxC', (a, b) => a > b),
    best('coldest', 'minC', (a, b) => a < b),
    best('wettest', 'rainMm', (a, b) => a > b),
    best('longest days', 'daylightH', (a, b) => a > b),
  ];
}
