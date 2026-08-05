// The public travel payload.
//
// bjsmith.xyz publishes places, never a schedule. A stop's dates, note, onward
// legs and tentative plans must not reach the browser *at all* — so the
// reduction happens here, at build time, and only the result is embedded in the
// page. Filtering in the client would not achieve this: the bundle would still
// carry the whole itinerary for anyone who opened it.
//
// One date does survive: the arrival of the first published stop. The public
// "day N" counter is deliberately live, and N plus today's date already gives
// that day away, so withholding it would buy nothing.
import { computeTrip } from './trip-runtime.mjs';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** A stop may be published once it has begun, and only if it is not tentative. */
export function isPublishable(stop) {
  return stop.status !== 'future' && stop.tentative !== true;
}

/**
 * Reduce a validated trip to the shape the public page is allowed to render.
 * `now` is the build clock; the browser re-derives only the day count from
 * `start`, never a stop's status.
 */
export function publicTrip(tripData, now = new Date()) {
  const published = computeTrip(tripData.stops, now).filter(isPublishable);

  // Only a published stop can be "here now". When the current stop is tentative,
  // or the journey is between stops, the page must fall back to "last seen in"
  // rather than reveal the stop that comes next.
  const currentIndex = published.findIndex((stop) => stop.status === 'current');

  return {
    start: published[0]?.arrive ?? null,
    currentIndex,
    stops: published.map((stop) => ({
      name: stop.name,
      country: stop.country,
      cc: stop.cc,
      lat: stop.lat,
      lon: stop.lon,
      // Coarse enough to head a timeline section without dating the stay.
      year: stop.arrive.slice(0, 4),
      // Same bargain one notch finer: the month a stay began, as a name rather
      // than a number, so no fragment of an ISO date can ship. A day would
      // start to reconstruct the schedule; a month does not.
      month: MONTHS[Number(stop.arrive.slice(5, 7)) - 1],
    })),
  };
}
