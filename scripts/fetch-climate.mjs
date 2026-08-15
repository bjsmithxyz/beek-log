// Regenerates src/data/climate.json — the committed monthly climate normals the
// travel page bakes into its payload.
//
// Weather used to be fetched in the browser, per upcoming stop, from Open-Meteo.
// The privacy split retired that: the page no longer knows a stop's dates, and
// the public CSP no longer grants connect-src to anyone. Normals bring the
// figures back without either. They are a property of a coordinate and a
// calendar month — both already published — so they can be resolved here, once,
// and committed like any other content.
//
//   npm run climate            # fill in whatever the itinerary now needs
//   npm run climate -- --force # refetch every point from scratch
//
// The run is incremental and resumable: a point already in the cache is never
// refetched, so a rate-limited run can simply be repeated.
import { readFile, writeFile } from 'node:fs/promises';
import trip from '../src/data/trips.json' with { type: 'json' };
import { climateKey } from '@beek/shared/trip-climate';

// Ten complete calendar years, fixed rather than relative, so that re-running
// this script cannot silently move figures that are already committed. Bumping
// the window is a deliberate act: change it, delete the cache, and correct the
// "ten-year averages" line the travel page prints.
const YEARS = { first: 2015, last: 2024 };
const ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive';
const DAILY = ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'daylight_duration'];
const CACHE = new URL('../src/data/climate.json', import.meta.url);
const PAUSE_MS = 250;
const RETRIES = 4;

const force = process.argv.includes('--force');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (value, places = 1) => Number(value.toFixed(places));

/**
 * Every (point, month) the itinerary needs, including stops that are still
 * withheld from the public page. Caching those too costs nothing here — the
 * committed itinerary already sits beside this file — and means a stop starts
 * showing its weather the moment the nightly rebuild publishes it, rather than
 * waiting for someone to remember to run this.
 */
function requiredMonths() {
  const wanted = new Map();
  for (const stop of trip.stops) {
    const key = climateKey(stop.lat, stop.lon);
    const entry = wanted.get(key) ?? { lat: stop.lat, lon: stop.lon, months: new Set() };
    entry.months.add(Number(stop.arrive.slice(5, 7)));
    wanted.set(key, entry);
  }
  return wanted;
}

class RateLimited extends Error {}

/**
 * One calendar month in one year. Asking for the whole decade in a single call
 * and slicing it here would be fewer requests but far more data: the archive
 * prices a call by variables × days, and ten years of daily data for every
 * point exhausts the hourly allowance a third of the way through the itinerary.
 * Only the months the itinerary actually visits are ever fetched.
 */
async function fetchMonth(lat, lon, year, month) {
  const pad = String(month).padStart(2, '0');
  const url = new URL(ENDPOINT);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('start_date', `${year}-${pad}-01`);
  url.searchParams.set('end_date', `${year}-${pad}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`);
  url.searchParams.set('daily', DAILY.join(','));
  url.searchParams.set('timezone', 'auto');

  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return (await response.json()).daily;
    const body = (await response.text()).slice(0, 200);
    // The hourly and daily allowances are not waitable at this timescale, and
    // the run is resumable, so they stop the script instead of being retried.
    if (response.status === 429 && /hourly|daily/i.test(body)) throw new RateLimited(body);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt > RETRIES) {
      throw new Error(`archive ${response.status} for ${lat},${lon} ${year}-${pad}: ${body}`);
    }
    const backoff = 5_000 * attempt;
    console.warn(`  ${response.status} — retrying in ${backoff / 1000}s (attempt ${attempt}/${RETRIES})`);
    await sleep(backoff);
  }
}

/**
 * Mean daily high, low, rainfall and daylight across every year of the window.
 * The decade's requests go out together: each is small, and the archive answers
 * slowly enough that doing them in turn dominates the whole run.
 */
async function normalFor(lat, lon, month) {
  const years = [];
  for (let year = YEARS.first; year <= YEARS.last; year += 1) years.push(year);
  const responses = await Promise.all(years.map((year) => fetchMonth(lat, lon, year, month)));

  const bucket = { maxC: [], minC: [], rainMm: [], daylightH: [] };
  for (const daily of responses) {
    daily.time.forEach((_, index) => {
      const maxC = daily.temperature_2m_max[index];
      const minC = daily.temperature_2m_min[index];
      const rain = daily.precipitation_sum[index];
      const daylight = daily.daylight_duration[index];
      if (maxC != null) bucket.maxC.push(maxC);
      if (minC != null) bucket.minC.push(minC);
      if (rain != null) bucket.rainMm.push(rain);
      if (daylight != null) bucket.daylightH.push(daylight / 3600);
    });
  }

  if (!bucket.maxC.length) return null;
  const mean = (values) => values.reduce((total, value) => total + value, 0) / values.length;
  return {
    maxC: round(mean(bucket.maxC)),
    minC: round(mean(bucket.minC)),
    rainMm: round(mean(bucket.rainMm)),
    daylightH: round(mean(bucket.daylightH)),
  };
}

/** Sorted on the way out so a regeneration diffs as the change it actually is. */
function serialise(points) {
  const sorted = {};
  for (const key of Object.keys(points).sort()) {
    sorted[key] = Object.fromEntries(
      Object.keys(points[key]).map(Number).sort((a, b) => a - b).map((month) => [month, points[key][month]]),
    );
  }
  return `${JSON.stringify({
    meta: {
      source: 'Open-Meteo ERA5 reanalysis (archive-api.open-meteo.com)',
      window: `${YEARS.first}-${YEARS.last}`,
      description: 'Mean daily high, low, rainfall and daylight per calendar month, by tenth-of-a-degree point.',
      generator: 'npm run climate',
    },
    points: sorted,
  }, null, 2)}\n`;
}

const existing = force
  ? { points: {} }
  : await readFile(CACHE, 'utf8').then(JSON.parse).catch(() => ({ points: {} }));
const points = { ...existing.points };

const outstanding = [...requiredMonths()].flatMap(([key, { lat, lon, months }]) => [...months]
  .filter((month) => !points[key]?.[month])
  .map((month) => ({ key, lat, lon, month })));
console.log(`climate cache: ${outstanding.length} point-month(s) to fetch, ${YEARS.last - YEARS.first + 1} year(s) each`);

let done = 0;
try {
  for (const { key, lat, lon, month } of outstanding) {
    done += 1;
    process.stdout.write(`[${done}/${outstanding.length}] ${key} month ${month}\n`);
    const normal = await normalFor(lat, lon, month);
    if (!normal) continue;
    points[key] = { ...points[key], [month]: normal };
    // Written after every point-month, so an interrupted run keeps what it earned.
    await writeFile(CACHE, serialise(points));
    await sleep(PAUSE_MS);
  }
} catch (error) {
  if (!(error instanceof RateLimited)) throw error;
  console.error(`\nOpen-Meteo rate limit reached after ${done - 1} point-month(s): ${error.message}`);
  console.error('The cache keeps everything already fetched — re-run `npm run climate` later to finish.');
  process.exitCode = 1;
}

if (!outstanding.length) await writeFile(CACHE, serialise(points));
console.log(`climate cache: ${Object.keys(points).length} point(s) in src/data/climate.json`);
