export function cloneTrip(trips) {
  return structuredClone(trips);
}

export function moveStop(trips, index, offset) {
  const target = index + offset;
  if (!Number.isInteger(index) || !Number.isInteger(offset) || index < 0 || target < 0 || target >= trips.stops.length) {
    return false;
  }
  const [stop] = trips.stops.splice(index, 1);
  trips.stops.splice(target, 0, stop);
  return true;
}

export function removeStop(trips, index) {
  if (!Number.isInteger(index) || index < 0 || index >= trips.stops.length || trips.stops.length === 1) return false;
  trips.stops.splice(index, 1);
  return true;
}

export function addStop(trips, afterIndex = trips.stops.length - 1) {
  const previous = trips.stops[Math.max(0, Math.min(afterIndex, trips.stops.length - 1))];
  const stop = {
    name: '',
    country: previous?.country || '',
    cc: previous?.cc || '',
    lat: previous?.lat ?? 0,
    lon: previous?.lon ?? 0,
    arrive: previous?.depart || '',
    depart: previous?.depart || '',
    note: '',
    tentative: true,
  };
  const target = Math.max(0, Math.min(afterIndex + 1, trips.stops.length));
  trips.stops.splice(target, 0, stop);
  return target;
}

export function tripsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function tripSummary(trips) {
  const first = trips.stops[0];
  const last = trips.stops.at(-1);
  return {
    stops: trips.stops.length,
    firstDate: first?.arrive || null,
    lastDate: last?.depart || null,
    tentative: trips.stops.filter((stop) => stop.tentative === true).length,
  };
}
