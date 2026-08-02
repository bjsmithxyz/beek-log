import { assertValidTrip } from '@beek/shared/trip-validation';
import { PublishError } from './publisher.mjs';

const SHA = /^[0-9a-f]{40}$/;
const STOP_KEYS = new Set(['name', 'country', 'cc', 'lat', 'lon', 'arrive', 'depart', 'note', 'tentative']);

function assertKeys(value, allowed, required, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PublishError(`${label} must be an object.`);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new PublishError(`${label} contains an unknown field.`);
  for (const key of required) if (!(key in value)) throw new PublishError(`${label} is missing ${key}.`);
}

export function travelPublication(body) {
  assertKeys(body, new Set(['requestId', 'expectedSha', 'trips']), ['requestId', 'expectedSha', 'trips'], 'Request');
  if (!SHA.test(body.expectedSha || '')) throw new PublishError('Expected travel SHA is invalid.');
  assertKeys(body.trips, new Set(['meta', 'stops']), ['meta', 'stops'], 'Trip data');
  assertKeys(body.trips.meta, new Set(['title', 'subtitle']), ['title', 'subtitle'], 'Trip metadata');
  if (!Array.isArray(body.trips.stops)) throw new PublishError('Trip stops must be an array.');
  body.trips.stops.forEach((stop, index) => {
    assertKeys(stop, STOP_KEYS, ['name', 'country', 'cc', 'lat', 'lon', 'arrive', 'depart'], `Stop ${index + 1}`);
  });
  try {
    assertValidTrip(body.trips);
  } catch (error) {
    throw new PublishError(error.message.split('\n')[0]);
  }

  const content = JSON.stringify(body.trips, null, 2);
  return {
    requestId: body.requestId,
    resource: 'travel',
    title: 'Update travel itinerary',
    message: 'Update travel itinerary via admin',
    operations: [{
      action: 'update',
      path: 'src/data/trips.json',
      expectedSha: body.expectedSha,
      content,
    }],
  };
}
