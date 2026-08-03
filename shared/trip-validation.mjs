// Pure validation shared by the public travel build and the hosted editor.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_STOPS = 500;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isText(value, maxLength, allowEmpty = false) {
  return typeof value === 'string' && value.length <= maxLength && (allowEmpty || value.trim().length > 0);
}

export function validateTrip(data) {
  const errors = [];
  if (!isPlainObject(data)) return ['Trip data must be an object.'];

  if (!isPlainObject(data.meta)) {
    errors.push('Trip metadata is required.');
  } else {
    if (!isText(data.meta.title, 100)) errors.push('Trip title is required (100 characters max).');
    if (!isText(data.meta.subtitle, 240, true)) errors.push('Trip subtitle must be 240 characters or fewer.');
  }

  if (!Array.isArray(data.stops) || data.stops.length === 0) {
    errors.push('At least one stop is required.');
    return errors;
  }
  if (data.stops.length > MAX_STOPS) errors.push(`Trips are limited to ${MAX_STOPS} stops.`);

  data.stops.slice(0, MAX_STOPS).forEach((stop, index) => {
    const label = `Stop ${index + 1}`;
    if (!isPlainObject(stop)) {
      errors.push(`${label} must be an object.`);
      return;
    }
    if (!isText(stop.name, 120)) errors.push(`${label} needs a place name.`);
    if (!isText(stop.country, 120)) errors.push(`${label} needs a country.`);
    if (typeof stop.cc !== 'string' || !/^[A-Za-z]{2}$/.test(stop.cc)) {
      errors.push(`${label} needs a two-letter country code.`);
    }
    if (typeof stop.lat !== 'number' || !Number.isFinite(stop.lat) || stop.lat < -90 || stop.lat > 90) {
      errors.push(`${label} has an invalid latitude.`);
    }
    if (typeof stop.lon !== 'number' || !Number.isFinite(stop.lon) || stop.lon < -180 || stop.lon > 180) {
      errors.push(`${label} has an invalid longitude.`);
    }
    if (!isValidDate(stop.arrive)) errors.push(`${label} has an invalid arrival date.`);
    if (!isValidDate(stop.depart)) errors.push(`${label} has an invalid departure date.`);
    if (isValidDate(stop.arrive) && isValidDate(stop.depart) && stop.depart < stop.arrive) {
      errors.push(`${label} departs before it arrives.`);
    }
    if (stop.note !== undefined && !isText(stop.note, 500, true)) {
      errors.push(`${label} note must be 500 characters or fewer.`);
    }
    if (stop.tentative !== undefined && typeof stop.tentative !== 'boolean') {
      errors.push(`${label} has an invalid tentative flag.`);
    }
  });

  return errors;
}

export function assertValidTrip(data) {
  const errors = validateTrip(data);
  if (errors.length) throw new Error(errors.join('\n'));
  return data;
}
