// Date and distance derivation for the travel page. Nothing here runs at build
// time; callers supply the browser's current Date on each page load.
const DAY_MS = 86_400_000;

// Local-calendar ISO date. Defaults to today; callers also pass a fixed clock,
// which is how the build and the guards pin "now".
export function isoDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(value) {
  return new Date(`${value}T00:00:00`);
}

function utcDay(value) {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function daysBetween(start, end) {
  return Math.round((utcDay(end) - utcDay(start)) / DAY_MS);
}

export function statusOf(stop, now = new Date()) {
  const today = isoDate(now);
  if (today < stop.arrive) return 'future';
  if (today < stop.depart) return 'current';
  return 'past';
}

export function computeTrip(stops, now = new Date()) {
  return stops.map((stop, index) => ({
    ...stop,
    index,
    status: statusOf(stop, now),
    nights: Math.max(0, daysBetween(stop.arrive, stop.depart)),
  }));
}

export function haversine(a, b) {
  const radiusKm = 6371;
  const radians = (value) => value * Math.PI / 180;
  const latitudeDelta = radians(b.lat - a.lat);
  const longitudeDelta = radians(b.lon - a.lon);
  const latitudeA = radians(a.lat);
  const latitudeB = radians(b.lat);
  const h = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

const CONTINENTS = {
  TH: 'Asia', VN: 'Asia', CN: 'Asia', HK: 'Asia', TW: 'Asia', KG: 'Asia', KZ: 'Asia',
  UZ: 'Asia', TJ: 'Asia', KR: 'Asia', JP: 'Asia', TR: 'Asia', SY: 'Asia', IQ: 'Asia',
  GE: 'Asia', AM: 'Asia', US: 'N. America', MX: 'N. America', GT: 'N. America',
  CA: 'N. America', CO: 'S. America', PE: 'S. America', BO: 'S. America', CL: 'S. America',
  AR: 'S. America', BR: 'S. America', FR: 'Europe', NL: 'Europe', DE: 'Europe',
  DK: 'Europe', SE: 'Europe', FI: 'Europe', EE: 'Europe', LV: 'Europe', LT: 'Europe',
  PL: 'Europe', CZ: 'Europe', SK: 'Europe', AT: 'Europe', HU: 'Europe', BA: 'Europe',
  MK: 'Europe', BG: 'Europe', SI: 'Europe', HR: 'Europe', IT: 'Europe', ES: 'Europe',
  PT: 'Europe', GB: 'Europe', GR: 'Europe',
};

export function continentOf(countryCode) {
  return CONTINENTS[countryCode] || '—';
}

// Regional indicator flag emoji from an ISO 3166-1 alpha-2 code.
export function flagOf(countryCode) {
  return String(countryCode || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
}

// Whole calendar months elapsed from `start` to `end`, plus the remaining
// whole weeks that don't add up to another month. Calendar-based rather than
// a flat day/30 split, so "started on the 31st" doesn't drift a stat that is
// otherwise exact.
export function monthsWeeksBetween(start, end) {
  const from = parseLocalDate(start);
  const to = parseLocalDate(end);
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (months > 0 && new Date(from.getFullYear(), from.getMonth() + months, from.getDate()) > to) {
    months -= 1;
  }
  months = Math.max(0, months);
  const anchor = new Date(from.getFullYear(), from.getMonth() + months, from.getDate());
  const weeks = Math.max(0, Math.floor(daysBetween(isoDate(anchor), end) / 7));
  return { months, weeks };
}
