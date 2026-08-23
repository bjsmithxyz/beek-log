// The authenticated view of the itinerary.
//
// This is the ONLY surface in the system that renders exact dates, notes or
// tentative flags. bjsmith.xyz publishes visited places and a dateless planned
// route — see shared/trip-public.mjs for what the public build is allowed to
// keep, and scripts/verify-travel-build.mjs for the guard that holds it to that.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { computeTrip, daysBetween, isoDate } from '@beek/shared/trip-runtime';
import { escapeHtml } from '@beek/shared/escape-html';

let map = null;
let latest = null;
let observing = false;

const flag = (code) => String(code || '')
  .toUpperCase()
  .replace(/[^A-Z]/g, '')
  .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));

const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';
const colours = () => isLight()
  ? { past: '#008833', future: '#cc7700', current: '#0066aa', tile: 'light_all' }
  : { past: '#33ff66', future: '#ffaa00', current: '#66ccff', tile: 'dark_all' };

/** done / here now / planned / tentative — tentative outranks the clock. */
function stateOf(stop) {
  if (stop.tentative === true) return 'tentative';
  if (stop.status === 'current') return 'here now';
  if (stop.status === 'future') return 'planned';
  return 'done';
}

function popupFor(stop) {
  const state = stateOf(stop);
  const note = stop.note ? `<div class="overview-note">${escapeHtml(stop.note)}</div>` : '';
  return `<b>${flag(stop.cc)} ${escapeHtml(stop.name)}</b> · <span class="state-${state.replace(' ', '-')}">${state}</span>`
    + `<br>${escapeHtml(stop.arrive)} → ${escapeHtml(stop.depart)} · ${stop.nights} nights`
    + `<br><span class="overview-muted">${escapeHtml(stop.country)}</span>${note}`;
}

function renderMap(stops) {
  const element = document.getElementById('travel-overview-map');
  if (!element || !stops.length) return;
  if (map) map.remove();
  const palette = colours();
  map = L.map(element, { worldCopyJump: true, scrollWheelZoom: false, zoomSnap: 0.25 }).setView([25, 40], 2);
  L.tileLayer(`https://{s}.basemaps.cartocdn.com/${palette.tile}/{z}/{x}/{y}{r}.png`, {
    attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 19,
  }).addTo(map);

  // Both layers, unlike the public map: solid for travelled, dashed for planned.
  const travelled = stops.filter((stop) => stop.status !== 'future').map((stop) => [stop.lat, stop.lon]);
  const lastVisited = stops.findLastIndex((stop) => stop.status !== 'future');
  const planned = stops
    .filter((stop, index) => stop.status === 'future' || index === lastVisited)
    .map((stop) => [stop.lat, stop.lon]);
  if (travelled.length > 1) L.polyline(travelled, { color: palette.past, weight: 2.5, opacity: 0.88 }).addTo(map);
  if (planned.length > 1) {
    L.polyline(planned, {
      color: palette.future, weight: 2.25, opacity: 0.9, dashArray: '5 6', lineCap: 'square',
    }).addTo(map);
  }

  stops.forEach((stop) => {
    const state = stateOf(stop);
    const colour = state === 'here now' ? palette.current
      : (state === 'planned' || state === 'tentative') ? palette.future
        : palette.past;
    L.circleMarker([stop.lat, stop.lon], {
      radius: state === 'here now' ? 7 : 5,
      color: colour,
      weight: state === 'here now' ? 3 : 2,
      fillColor: colour,
      fillOpacity: state === 'planned' || state === 'tentative' ? 0.22 : 0.92,
      dashArray: state === 'tentative' ? '2 3' : undefined,
    }).bindPopup(popupFor(stop)).addTo(map);
  });

  const bounds = stops.map((stop) => [stop.lat, stop.lon]);
  requestAnimationFrame(() => {
    map?.invalidateSize();
    if (bounds.length > 1) map?.fitBounds(L.latLngBounds(bounds).pad(0.05));
  });
}

function renderTable(stops) {
  const body = document.getElementById('travel-overview-rows');
  if (!body) return;
  body.innerHTML = stops.map((stop) => {
    const state = stateOf(stop);
    return `<tr>
      <td>${escapeHtml(stop.arrive)}</td>
      <td>${escapeHtml(stop.depart)}</td>
      <td><b>${flag(stop.cc)} ${escapeHtml(stop.name)}</b><span>${escapeHtml(stop.country)}</span></td>
      <td><span class="state state-${state.replace(' ', '-')}">${state}</span></td>
    </tr>`;
  }).join('');

  const summary = document.getElementById('travel-overview-summary');
  if (!summary) return;
  const start = stops[0]?.arrive;
  const published = stops.filter((stop) => stop.status !== 'future' && stop.tentative !== true).length;
  summary.textContent = `${stops.length} stops · ${published} published · ${stops.length - published} withheld`
    + (start ? ` · day ${Math.max(0, daysBetween(start, isoDate()))}` : '');
}

/** Re-render the read-only overview from the working draft. */
export function renderOverview(trips) {
  const valid = (trips?.stops || []).filter((stop) => (
    Number.isFinite(stop.lat) && Number.isFinite(stop.lon)
    && /^\d{4}-\d{2}-\d{2}$/.test(stop.arrive) && /^\d{4}-\d{2}-\d{2}$/.test(stop.depart)
  ));
  latest = computeTrip(valid, new Date());
  renderMap(latest);
  renderTable(latest);

  if (!observing) {
    observing = true;
    new MutationObserver(() => latest && renderMap(latest))
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
}
