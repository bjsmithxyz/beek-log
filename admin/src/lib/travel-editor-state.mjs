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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function shiftDate(value, days) {
  if (!ISO_DATE.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayDifference(from, to) {
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) return 0;
  const parse = (value) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

/**
 * Move later tentative stays by the number of days a live stop was extended.
 * The caller passes the old departure because the draft has already received
 * the new input value by the time this is called. Only a real current stop and
 * a positive extension trigger the cascade; fixed future stops are untouched.
 * Returns the number of tentative stops moved.
 */
export function pushTentativeFutureDates(trips, currentIndex, previousDepart, nextDepart, today) {
  const current = trips?.stops?.[currentIndex];
  const todayValue = today || new Date().toISOString().slice(0, 10);
  const days = dayDifference(previousDepart, nextDepart);
  if (!current || days <= 0 || !ISO_DATE.test(todayValue)) return 0;
  if (!ISO_DATE.test(current.arrive) || current.arrive > todayValue || previousDepart <= todayValue) return 0;

  let moved = 0;
  for (let index = currentIndex + 1; index < trips.stops.length; index += 1) {
    const stop = trips.stops[index];
    if (stop.tentative !== true || !ISO_DATE.test(stop.arrive) || stop.arrive <= todayValue) continue;
    const arrive = shiftDate(stop.arrive, days);
    const depart = shiftDate(stop.depart, days);
    if (!arrive || !depart) continue;
    stop.arrive = arrive;
    stop.depart = depart;
    moved += 1;
  }
  return moved;
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
