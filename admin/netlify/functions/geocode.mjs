import { json } from '../../src/server/auth.mjs';
import { mutationResponse, requireJsonMutation } from '../../src/server/request-guards.mjs';

let queue = Promise.resolve();
let nextRequestAt = 0;
const cache = new Map();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function nominatim(query, addressDetails) {
  const key = `${addressDetails ? 'place' : 'region'}:${query.toLowerCase()}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  const run = queue.then(async () => {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay) await wait(delay);
    nextRequestAt = Date.now() + 1_100;
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('accept-language', 'en');
    url.searchParams.set('limit', addressDetails ? '5' : '1');
    if (addressDetails) url.searchParams.set('addressdetails', '1');
    url.searchParams.set('q', query);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'beek-log-admin/1.0 (https://admin.bjsmith.xyz)' },
    });
    if (!response.ok) throw new Error('geocoder failed');
    const data = await response.json();
    cache.set(key, data);
    if (cache.size > 100) cache.delete(cache.keys().next().value);
    return data;
  });
  queue = run.catch(() => {});
  return run;
}

function placeName(result) {
  const address = result.address || {};
  return address.city || address.town || address.village || address.hamlet ||
    address.state || String(result.display_name || '').split(',')[0].trim();
}

export default async function geocode(request) {
  const context = await requireJsonMutation(request, { maxBytes: 8 * 1024 });
  if (context.response) return context.response;
  const body = context.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      !['kind', 'query'].every((key) => Object.hasOwn(body, key)) || Object.keys(body).length !== 2 ||
      !['place', 'region'].includes(body.kind) || typeof body.query !== 'string' ||
      !body.query.trim() || body.query.length > 160) {
    return mutationResponse(json(400, { ok: false, error: 'Geocode request is invalid' }), context);
  }
  try {
    const data = await nominatim(body.query.trim(), body.kind === 'place');
    if (body.kind === 'region') {
      const result = data[0];
      if (!result) return mutationResponse(json(200, { ok: true, region: null }), context);
      return mutationResponse(json(200, {
        ok: true,
        region: { name: body.query.trim(), lat: Number(result.lat), lng: Number(result.lon) },
      }), context);
    }
    const results = data.map((result) => ({
      name: placeName(result),
      lat: Number(result.lat),
      lng: Number(result.lon),
      regionName: result.address?.country || null,
      cc: String(result.address?.country_code || '').toUpperCase() || null,
    })).filter((result) => result.name && Number.isFinite(result.lat) && Number.isFinite(result.lng));
    return mutationResponse(json(200, { ok: true, results }), context);
  } catch {
    return mutationResponse(json(502, { ok: false, error: 'Location search is temporarily unavailable' }), context);
  }
}
