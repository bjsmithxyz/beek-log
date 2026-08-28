// Public travel page controller.
//
// This module deliberately does NOT import trips.json. The itinerary holds
// exact dates, notes and tentative flags; bundling it here would publish all
// of that to anyone who opened the JS, however little of it we rendered.
// The page instead embeds a build-time-reduced payload (see
// shared/trip-public.mjs) and this file may only ever read that.
//
// The consequence is that "past" vs "here now" is decided at build time, not in
// the browser. Completed stops may carry their exact dates; the current stop
// and planned route do not. Only the day counter stays live, derived from the
// first published arrival, and this file must not invent dates, weather or
// "here now" for the route ahead.
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { continentOf, daysBetween, haversine, isoDate } from '@beek/shared/trip-runtime';
import { climateExtremes } from '@beek/shared/trip-climate';
import { escapeHtml } from '@beek/shared/escape-html';

let cleanup = null;

const flag = (code) => String(code || '')
  .toUpperCase()
  .replace(/[^A-Z]/g, '')
  .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));

function setupTravel() {
  cleanup?.();
  const root = document.querySelector('[data-travel-page]');
  if (!root) {
    cleanup = null;
    return;
  }

  const get = (id) => root.querySelector(`#${id}`);
  let payload = { start: null, currentIndex: -1, stops: [], planned: [], photoLinks: {} };
  try {
    payload = { ...payload, ...JSON.parse(get('travel-data')?.textContent || '{}') };
  } catch {
    // Leave the defaults; the page degrades to its empty state.
  }

  const stops = payload.stops.map((stop, index) => ({ ...stop, index }));
  const planned = (payload.planned || []).map((stop, index) => ({ ...stop, index }));
  const currentIndex = payload.currentIndex;
  const current = currentIndex >= 0 ? stops[currentIndex] : null;
  const photoLinks = payload.photoLinks || {};
  const today = isoDate(new Date());
  const abortController = new AbortController();
  let map = null;

  const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';
  const colours = () => isLight()
    ? { past: '#008833', current: '#0066aa', future: '#cc7700', tile: 'light_all' }
    : { past: '#33ff66', current: '#66ccff', future: '#ffaa00', tile: 'dark_all' };
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Typical daytime high and overnight low for the month this stop's stay began
  // — a long-run average baked in at build time, never a forecast and never
  // what the weather actually did while I was there.
  const typicalTemps = (climate) => `${Math.round(climate.maxC)}° / ${Math.round(climate.minC)}°C`;

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  function formatExactDate(value) {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return '';
    return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
  }

  function exactDateRange(stop) {
    if (!stop.arrive || !stop.depart) return '';
    return `${formatExactDate(stop.arrive)} → ${formatExactDate(stop.depart)}`;
  }

  // Past stops may show their exact stay; the stop being lived in right now
  // says "here now" instead of publishing its open-ended schedule.
  function popupFor(stop) {
    const isCurrent = stop.index === currentIndex;
    const tag = isCurrent ? ' · <span class="popup-current">here now</span>' : '';
    const exact = exactDateRange(stop);
    const when = isCurrent ? '' : `, ${escapeHtml(exact || `${stop.month} ${stop.year}`)}`;
    const climate = stop.climate
      ? `<br><span class="popup-muted">typically ${typicalTemps(stop.climate)} · ${stop.climate.daylightH.toFixed(1)}h daylight · ${stop.climate.rainMm.toFixed(1)}mm rain/day</span>`
      : '';
    return `<b>${flag(stop.cc)} ${escapeHtml(stop.name)}</b>${tag}<br><span class="popup-muted">${escapeHtml(stop.country)}${when}</span>${climate}`;
  }

  // Planned stops have no month and no weather — naming when would date the stay.
  function popupForPlanned(stop) {
    return `<b>${flag(stop.cc)} ${escapeHtml(stop.name)}</b> · <span class="popup-future">planned</span>`
      + `<br><span class="popup-muted">${escapeHtml(stop.country)}</span>`;
  }

  function markerFor(stop) {
    const palette = colours();
    const isCurrent = stop.index === currentIndex;
    const colour = isCurrent ? palette.current : palette.past;
    const marker = L.circleMarker([stop.lat, stop.lon], {
      radius: isCurrent ? 7 : 4,
      color: colour,
      weight: isCurrent ? 3 : 1.5,
      fillColor: colour,
      fillOpacity: 0.92,
    });
    marker.bindPopup(popupFor(stop));
    stop._marker = marker;
    return marker;
  }

  function markerForPlanned(stop) {
    const colour = colours().future;
    const marker = L.circleMarker([stop.lat, stop.lon], {
      radius: 4,
      color: colour,
      weight: 1.5,
      fillColor: colour,
      fillOpacity: 0.22,
    });
    marker.bindPopup(popupForPlanned(stop));
    stop._marker = marker;
    return marker;
  }

  function renderMap() {
    const mapElement = get('travel-map');
    if (!mapElement || (!stops.length && !planned.length)) return;
    if (map) map.remove();
    const palette = colours();
    map = L.map(mapElement, {
      worldCopyJump: true,
      scrollWheelZoom: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
    }).setView([25, 40], 2);
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${palette.tile}/{z}/{x}/{y}{r}.png?key=cb1_2hoi_1_b8b3b9742f2144629a3d27a1`, {
      attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    const travelled = stops.map((stop) => [stop.lat, stop.lon]);
    const lastVisited = travelled.at(-1);
    const ahead = [
      ...(lastVisited ? [lastVisited] : []),
      ...planned.map((stop) => [stop.lat, stop.lon]),
    ];
    if (travelled.length > 1) {
      L.polyline(travelled, { color: palette.past, weight: 2.5, opacity: 0.88 }).addTo(map);
    }
    if (ahead.length > 1) {
      L.polyline(ahead, {
        color: palette.future, weight: 2.25, opacity: 0.9, dashArray: '5 6', lineCap: 'square',
      }).addTo(map);
    }
    const markers = L.layerGroup().addTo(map);
    stops.forEach((stop) => markers.addLayer(markerFor(stop)));
    planned.forEach((stop) => markers.addLayer(markerForPlanned(stop)));

    const bounds = [...travelled, ...planned.map((stop) => [stop.lat, stop.lon])];
    const renderedMap = map;
    requestAnimationFrame(() => {
      if (map !== renderedMap) return;
      renderedMap.invalidateSize();
      if (bounds.length > 1) renderedMap.fitBounds(L.latLngBounds(bounds).pad(0.05));
      else if (bounds.length) renderedMap.setView(bounds[0], 4);
    });
  }

  function flyToStop(stop) {
    if (!stop || !map) return;
    if (reduceMotion()) map.setView([stop.lat, stop.lon], 6, { animate: false });
    else map.flyTo([stop.lat, stop.lon], 6, { duration: 0.6 });
    stop._marker?.openPopup();
    get('travel-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function stopChip(stop, { current = false, planned: isPlannedStop = false } = {}) {
    const entry = document.createElement('div');
    entry.className = 'map-stop-entry';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `map-stop${current ? ' current' : ''}${isPlannedStop ? ' planned' : ''}`;
    button.textContent = `${flag(stop.cc)} ${stop.name}`;
    if (isPlannedStop) button.setAttribute('aria-label', `${stop.name}, planned`);
    button.addEventListener('click', () => flyToStop(stop), { signal: abortController.signal });
    entry.append(button);
    return entry;
  }

  function renderMapStops() {
    const chips = stops.map((stop) => {
      const entry = stopChip(stop, { current: stop.index === currentIndex });
      const related = photoLinks[stop.index] || [];
      if (related.length) {
        const links = document.createElement('span');
        links.className = 'map-stop-photos';
        links.setAttribute('aria-label', `Photo rolls related to ${stop.name}`);
        related.forEach((roll, index) => {
          const link = document.createElement('a');
          link.href = roll.href;
          link.textContent = related.length === 1 ? 'photos →' : `photos ${index + 1} →`;
          link.title = roll.title;
          links.append(link);
        });
        entry.append(links);
      }
      return entry;
    });

    if (planned.length) {
      const label = document.createElement('span');
      label.className = 'map-stop-ahead';
      label.textContent = 'ahead/';
      chips.push(label, ...planned.map((stop) => stopChip(stop, { planned: true })));
    }

    get('travel-map-stops').replaceChildren(...chips);
  }

  function renderStats() {
    // Elapsed days is the one live figure on the page.
    const elapsedDays = payload.start ? Math.max(0, daysBetween(payload.start, today)) : 0;
    const countries = new Set(stops.map((stop) => stop.cc));
    const continents = new Set(stops.map((stop) => continentOf(stop.cc)));
    let totalKm = 0;
    let longestHop = null;
    for (let index = 1; index < stops.length; index += 1) {
      const km = haversine(stops[index - 1], stops[index]);
      totalKm += km;
      // Two published places and the distance between them: geography, not
      // schedule, so it says nothing the route line does not already draw.
      if (!longestHop || km > longestHop.km) longestHop = { km, from: stops[index - 1], to: stops[index] };
    }
    const stats = [
      [elapsedDays, 'Days on the road'],
      [countries.size, 'Countries & territories'],
      [stops.length, 'Stops so far'],
      [`${(totalKm / 1000).toFixed(1)}k`, 'Kilometres travelled'],
      [continents.size, 'Continents'],
      [payload.rollsOnRoute ?? 0, 'Rolls along the way'],
    ];
    get('travel-stats').innerHTML = stats.map(([number, label], index) => `
      <div class="travel-stat"><strong${index === 0 ? ' id="travel-day"' : ''}>${escapeHtml(number)}</strong><span>${escapeHtml(label)}</span></div>
    `).join('');
    get('travel-facts').innerHTML = [
      elapsedDays ? `<span>pace: <b>~${Math.round(totalKm / elapsedDays)} km / day</b></span>` : '',
      continents.size ? `<span>continents: <b>${escapeHtml([...continents].join(' · '))}</b></span>` : '',
      longestHop
        ? `<span>longest hop: <b>${flag(longestHop.from.cc)} ${escapeHtml(longestHop.from.name)} → ${flag(longestHop.to.cc)} ${escapeHtml(longestHop.to.name)} · ${Math.round(longestHop.km).toLocaleString('en-GB')} km</b></span>`
        : '',
    ].join('');

    // When the stop being lived in right now is tentative, or the journey is
    // between stops, say where I was last — never the next planned place.
    const nowLine = get('travel-now');
    const lastSeen = stops.at(-1);
    if (current) {
      nowLine.innerHTML = `now: <b>${flag(current.cc)} ${escapeHtml(current.name)}, ${escapeHtml(current.country)}</b>`;
    } else if (lastSeen) {
      nowLine.innerHTML = `last seen in: <b>${flag(lastSeen.cc)} ${escapeHtml(lastSeen.name)}, ${escapeHtml(lastSeen.country)}</b>`;
    } else {
      nowLine.textContent = '// no stops published yet';
    }
  }

  // Degrees are rounded because a tenth of a degree of decade-average air
  // temperature is noise; rain and daylight keep theirs, where a tenth is the
  // difference between a drizzle and a monsoon.
  const CLIMATE_FORMAT = {
    maxC: (value) => `${Math.round(value)}°C typical high`,
    minC: (value) => `${Math.round(value)}°C typical low`,
    rainMm: (value) => `${value.toFixed(1)} mm rain / day`,
    daylightH: (value) => `${value.toFixed(1)}h of daylight`,
  };

  // The weather the road-ahead tab used to fetch per upcoming stop, rebuilt for
  // the stops that actually happened: no forecast, no network, and no date —
  // just what each published place is normally like in the month I arrived.
  function renderClimate() {
    const element = get('travel-climate');
    if (!element) return;
    const extremes = climateExtremes(stops);
    if (!extremes.length) {
      element.replaceChildren();
      return;
    }
    element.innerHTML = `
      <h3 class="climate-title">climate/</h3>
      <p class="climate-note">typical for the month each stay began — ten-year averages from Open-Meteo (ERA5), not what the sky actually did.</p>
      <div class="climate-rows">${extremes.map(({ label, field, stop, value }) => `
        <div class="climate-row">
          <span class="climate-label">${escapeHtml(label)}</span>
          <span class="climate-value">${escapeHtml(CLIMATE_FORMAT[field](value))}</span>
          <span class="climate-where">${flag(stop.cc)} ${escapeHtml(stop.name)} · ${escapeHtml(stop.month)}</span>
        </div>`).join('')}</div>`;
  }

  function timelineRow(stop) {
    const isCurrent = stop.index === currentIndex;
    // Past stops carry exact dates; the current one says "here now" instead,
    // so the stay in progress stays open-ended. The comma belongs to the
    // country/date pair and is only drawn when a date follows it.
    const exact = exactDateRange(stop);
    const when = isCurrent
      ? '<span class="timeline-here">here now</span>'
      : exact
        ? `<span class="timeline-dates">${escapeHtml(exact)}</span>`
        : `<span class="timeline-month">${escapeHtml(stop.month)}</span>`;
    const comma = isCurrent ? '' : '<span class="timeline-comma">,</span>';
    // The timeline is the one place every stop is listed, so it doubles as the
    // per-destination weather list the road-ahead cards used to be.
    const climate = stop.climate
      ? `<span class="timeline-climate" title="Typical high and low for that month">${typicalTemps(stop.climate)}</span>`
      : '';
    return `<div class="timeline-row${isCurrent ? ' current' : ''}${exact ? ' dated' : ''}">
      <strong>${flag(stop.cc)} ${escapeHtml(stop.name)}</strong><span>${escapeHtml(stop.country)}${comma}</span>${when}${climate}
    </div>`;
  }

  function renderTimeline() {
    const element = get('travel-timeline');
    if (!stops.length) {
      element.innerHTML = '<p class="travel-empty">// no stops published yet</p>';
      return;
    }

    // One disclosure per year, open by default — the same [-]/[+] idiom the
    // homepage file tree uses, so the two indexes behave alike.
    const years = [];
    for (const stop of stops) {
      const last = years.at(-1);
      if (last && last.year === stop.year) last.stops.push(stop);
      else years.push({ year: stop.year, stops: [stop] });
    }

    element.innerHTML = years.map(({ year, stops: yearStops }) => {
      const panelId = `timeline-year-${escapeHtml(year)}`;
      return `<section class="timeline-group">
        <h3 class="timeline-year">
          <button class="timeline-year-toggle" type="button" aria-expanded="true" aria-controls="${panelId}" data-timeline-toggle>
            <span>${escapeHtml(year)}</span><span class="timeline-state" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="timeline-collapse" id="${panelId}" data-collapsed="false">
          <div class="timeline-collapse-inner">${yearStops.map(timelineRow).join('')}</div>
        </div>
      </section>`;
    }).join('');

    // Paired structurally rather than by id selector: the ids exist for
    // aria-controls, and matching on them would need escaping this runs without.
    element.querySelectorAll('.timeline-group').forEach((group) => {
      const button = group.querySelector('[data-timeline-toggle]');
      const panel = group.querySelector('.timeline-collapse');
      if (!button || !panel) return;
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        panel.dataset.collapsed = String(expanded);
        panel.inert = expanded;
      }, { signal: abortController.signal });
    });
  }

  const tabButtons = [...root.querySelectorAll('[data-travel-tab]')];
  const panels = [...root.querySelectorAll('[data-travel-panel]')];
  function selectPanel(name, moveFocus = false) {
    tabButtons.forEach((button) => {
      const selected = button.dataset.travelTab === name;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) button.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.travelPanel !== name;
    });
    if (name === 'route') requestAnimationFrame(renderMap);
  }
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectPanel(button.dataset.travelTab), { signal: abortController.signal });
    button.addEventListener('keydown', (event) => {
      let nextIndex = null;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabButtons.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      selectPanel(tabButtons[nextIndex].dataset.travelTab, true);
    }, { signal: abortController.signal });
  });

  renderStats();
  renderClimate();
  renderMapStops();
  renderTimeline();
  selectPanel('route');

  const themeObserver = new MutationObserver(() => {
    if (!get('travel-panel-route').hidden) renderMap();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  cleanup = () => {
    abortController.abort();
    themeObserver.disconnect();
    map?.remove();
    map = null;
  };
}

document.addEventListener('astro:page-load', setupTravel);
document.addEventListener('astro:before-swap', () => cleanup?.());
