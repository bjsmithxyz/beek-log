import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import tripData from '../data/trips.json';
import {
  computeTrip,
  continentOf,
  daysBetween,
  haversine,
  parseLocalDate,
  todayIso,
} from '@beek/shared/trip-runtime';

let cleanup = null;

const flag = (code) => String(code || '')
  .toUpperCase()
  .replace(/[^A-Z]/g, '')
  .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
}[character]));
const formatDate = (value) => parseLocalDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatDateYear = (value) => parseLocalDate(value).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});
const formatIsoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function setupTravel() {
  cleanup?.();
  const root = document.querySelector('[data-travel-page]');
  if (!root) {
    cleanup = null;
    return;
  }

  const get = (id) => root.querySelector(`#${id}`);
  const now = new Date();
  const today = todayIso(now);
  const trip = computeTrip(tripData.stops, now);
  const abortController = new AbortController();
  let map = null;
  let tileLayer = null;
  let pastLayer = null;
  let futureLayer = null;
  let pastMarkers = null;
  let futureMarkers = null;
  let timelineExpanded = false;

  const distanceFromPrevious = (index) => index <= 0 ? 0 : haversine(trip[index - 1], trip[index]);
  const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';
  const colours = () => isLight()
    ? { past: '#008833', future: '#cc7700', current: '#0066aa', tile: 'light_all' }
    : { past: '#33ff66', future: '#ffaa00', current: '#66ccff', tile: 'dark_all' };

  function popupFor(stop, weather) {
    const tag = stop.status === 'current'
      ? ' · <span class="popup-current">here now</span>'
      : stop.status === 'future'
        ? ` · <span class="popup-future">${stop.tentative ? 'tentative' : 'planned'}</span>`
        : '';
    const climate = weather
      ? `<br><span class="popup-muted">Typically ${Math.round(weather.maxC)}°/${Math.round(weather.minC)}°C · ${weather.daylight.toFixed(1)}h daylight</span>`
      : '';
    const note = stop.note ? `<div class="travel-popup-note">${escapeHtml(stop.note)}</div>` : '';
    return `<b>${flag(stop.cc)} ${escapeHtml(stop.name)}</b>${tag}<br>${formatDate(stop.arrive)} – ${formatDate(stop.depart)} · ${stop.nights} nights<br><span class="popup-muted">${escapeHtml(stop.country)}</span>${climate}${note}`;
  }

  function markerFor(stop) {
    const palette = colours();
    const colour = stop.status === 'current' ? palette.current : stop.status === 'future' ? palette.future : palette.past;
    const marker = L.circleMarker([stop.lat, stop.lon], {
      radius: stop.status === 'current' ? 7 : stop.status === 'future' ? 5 : 4,
      color: colour,
      weight: stop.status === 'future' ? 2 : 1.5,
      fillColor: colour,
      fillOpacity: stop.status === 'future' ? 0.22 : 0.92,
    });
    marker.bindPopup(popupFor(stop));
    stop._marker = marker;
    return marker;
  }

  function applyLayerToggle(button, routeLayer, markerLayer) {
    // Assignment replaces the previous map instance's handler after a theme
    // change instead of stacking listeners that close over removed layers.
    button.onclick = () => {
      const enabled = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(enabled));
      button.classList.toggle('active', enabled);
      if (enabled) {
        routeLayer.addTo(map);
        markerLayer.addTo(map);
      } else {
        map.removeLayer(routeLayer);
        map.removeLayer(markerLayer);
      }
    };
  }

  function renderMap() {
    const mapElement = get('travel-map');
    if (!mapElement) return;
    if (map) map.remove();
    const palette = colours();
    map = L.map(mapElement, { worldCopyJump: true, scrollWheelZoom: false }).setView([25, 40], 2);
    tileLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${palette.tile}/{z}/{x}/{y}{r}.png`, {
      attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    const travelled = trip.filter((stop) => stop.status !== 'future').map((stop) => [stop.lat, stop.lon]);
    const lastVisited = trip.findLastIndex((stop) => stop.status !== 'future');
    const planned = trip.filter((stop, index) => stop.status === 'future' || index === lastVisited)
      .map((stop) => [stop.lat, stop.lon]);
    pastLayer = L.layerGroup([L.polyline(travelled, { color: palette.past, weight: 2.5, opacity: 0.88 })]).addTo(map);
    futureLayer = L.layerGroup([L.polyline(planned, {
      color: palette.future, weight: 2.25, opacity: 0.9, dashArray: '2 7', lineCap: 'square',
    })]).addTo(map);
    pastMarkers = L.layerGroup().addTo(map);
    futureMarkers = L.layerGroup().addTo(map);
    trip.forEach((stop) => (stop.status === 'future' ? futureMarkers : pastMarkers).addLayer(markerFor(stop)));

    if (travelled.length > 1) map.fitBounds(L.latLngBounds(travelled).pad(0.15));
    else if (trip.length) map.setView([trip[0].lat, trip[0].lon], 4);

    const pastButton = get('toggle-travelled');
    const futureButton = get('toggle-planned');
    pastButton.classList.add('active');
    futureButton.classList.add('active');
    pastButton.setAttribute('aria-pressed', 'true');
    futureButton.setAttribute('aria-pressed', 'true');
    applyLayerToggle(pastButton, pastLayer, pastMarkers);
    applyLayerToggle(futureButton, futureLayer, futureMarkers);
  }

  function showStop(index) {
    const stop = trip[index];
    if (!stop || !map) return;
    map.setView([stop.lat, stop.lon], 6, { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches });
    stop._marker?.openPopup();
    get('travel-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderMapStops() {
    const element = get('travel-map-stops');
    element.replaceChildren(...trip.map((stop) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `map-stop ${stop.status}`;
      button.textContent = `${flag(stop.cc)} ${stop.name}`;
      button.dataset.status = stop.status;
      button.addEventListener('click', () => showStop(stop.index), { signal: abortController.signal });
      return button;
    }));
  }

  function renderStats() {
    const start = trip[0].arrive;
    const elapsedDays = Math.max(0, daysBetween(start, today));
    const visited = trip.filter((stop) => stop.status !== 'future');
    const current = trip.find((stop) => stop.status === 'current');
    const countries = new Set(visited.map((stop) => stop.cc));
    const continents = new Set(visited.map((stop) => continentOf(stop.cc)));
    let totalKm = 0;
    for (let index = 1; index < trip.length; index += 1) {
      if (trip[index].status !== 'future') totalKm += distanceFromPrevious(index);
    }
    const nightsTotal = visited.reduce((total, stop) => total + stop.nights, 0);
    const longest = visited.reduce((result, stop) => stop.nights > result.nights ? stop : result, visited[0] || trip[0]);
    const stats = [
      [elapsedDays, 'Days on the road'],
      [countries.size, 'Countries & territories'],
      [visited.length, 'Stops so far'],
      [`${(totalKm / 1000).toFixed(1)}k`, 'Kilometres travelled'],
      [continents.size, 'Continents'],
      [trip.filter((stop) => stop.status === 'future').length, 'Stops still to come'],
    ];
    get('travel-stats').innerHTML = stats.map(([number, label]) => `
      <div class="travel-stat"><strong>${escapeHtml(number)}</strong><span>${escapeHtml(label)}</span></div>
    `).join('');
    get('travel-facts').innerHTML = [
      longest ? `<span>longest stay: <b>${escapeHtml(longest.name)} · ${longest.nights} nights</b></span>` : '',
      visited.length ? `<span>average: <b>${(nightsTotal / visited.length).toFixed(1)} nights / stop</b></span>` : '',
      elapsedDays ? `<span>pace: <b>~${Math.round(totalKm / elapsedDays)} km / day</b></span>` : '',
      `<span>continents: <b>${escapeHtml([...continents].join(' · '))}</b></span>`,
    ].join('');

    const nowLine = get('travel-now');
    if (current) {
      const night = Math.max(1, daysBetween(current.arrive, today) + 1);
      nowLine.innerHTML = `now: <b>${flag(current.cc)} ${escapeHtml(current.name)}, ${escapeHtml(current.country)}</b> · night ${night} of ${current.nights} · leaving ${formatDate(current.depart)}`;
    } else {
      const next = trip.find((stop) => stop.status === 'future');
      nowLine.innerHTML = next
        ? `next: <b>${flag(next.cc)} ${escapeHtml(next.name)}</b> · ${formatDateYear(next.arrive)}`
        : `journey complete · ${visited.length} stops`;
    }
    get('travel-start').textContent = formatDateYear(start);
    get('travel-day').textContent = String(elapsedDays);
  }

  function packingCue(minC, maxC, precipitation) {
    let icon;
    let message;
    if (minC < 0) [icon, message] = ['🧥', 'Serious winter kit — insulated coat, hat & gloves.'];
    else if (minC < 7) [icon, message] = ['🧣', 'Cold — warm coat and layers needed.'];
    else if (minC < 13) [icon, message] = ['🧥', 'Cool — a proper jacket for evenings.'];
    else if (minC < 19) [icon, message] = ['🧢', 'Mild — a light layer will do.'];
    else if (maxC < 28) [icon, message] = ['👕', 'Warm & pleasant — t-shirt weather.'];
    else [icon, message] = ['🩳', 'Hot — shorts and sun cover.'];
    if (precipitation >= 6) message += ' Pack a rain shell.';
    return { icon, message };
  }

  async function fetchClimate(stop) {
    const start = parseLocalDate(stop.arrive);
    const end = parseLocalDate(stop.depart);
    start.setFullYear(start.getFullYear() - 1);
    end.setFullYear(end.getFullYear() - 1);
    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.searchParams.set('latitude', stop.lat);
    url.searchParams.set('longitude', stop.lon);
    url.searchParams.set('start_date', formatIsoDate(start));
    url.searchParams.set('end_date', formatIsoDate(end));
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,daylight_duration');
    url.searchParams.set('timezone', 'auto');
    const response = await fetch(url, { signal: abortController.signal });
    if (!response.ok) throw new Error(`archive ${response.status}`);
    const daily = (await response.json()).daily;
    const average = (values) => values.reduce((sum, value) => sum + (value ?? 0), 0) / values.length;
    return {
      maxC: average(daily.temperature_2m_max),
      minC: average(daily.temperature_2m_min),
      precipitation: average(daily.precipitation_sum),
      daylight: average(daily.daylight_duration) / 3600,
    };
  }

  function renderWeather(stop, weather) {
    const element = get(`weather-${stop.index}`);
    if (!element) return;
    const cue = packingCue(weather.minC, weather.maxC, weather.precipitation);
    element.innerHTML = `
      <div class="weather-grid">
        <span>high <b>${Math.round(weather.maxC)}°C</b></span>
        <span>low <b>${Math.round(weather.minC)}°C</b></span>
        <span>daylight <b>${weather.daylight.toFixed(1)}h</b></span>
        <span>rain <b>${weather.precipitation.toFixed(1)}mm/day</b></span>
      </div>
      <p class="packing-cue"><span aria-hidden="true">${cue.icon}</span> ${escapeHtml(cue.message)}</p>`;
    stop._marker?.setPopupContent(popupFor(stop, weather));
  }

  async function loadWeather(upcoming) {
    for (const stop of upcoming) {
      try {
        renderWeather(stop, await fetchClimate(stop));
      } catch (error) {
        if (error.name === 'AbortError') return;
        const element = get(`weather-${stop.index}`);
        if (element) element.textContent = 'Weather unavailable — reload to retry.';
      }
    }
  }

  function renderUpcoming() {
    const upcoming = trip.filter((stop) => stop.status === 'future');
    const element = get('travel-legs');
    if (!upcoming.length) {
      element.innerHTML = '<p class="travel-empty">// no upcoming stops planned</p>';
      return;
    }
    element.innerHTML = upcoming.map((stop, index) => `
      <article class="travel-leg ${index === 0 ? 'next' : ''}" data-status="future">
        <button class="leg-focus" type="button" data-index="${stop.index}">
          <span class="leg-badge">${stop.tentative ? 'tentative' : index === 0 ? 'up next' : 'planned'}</span>
          <strong>${flag(stop.cc)} ${escapeHtml(stop.name)}</strong>
          <span>${formatDateYear(stop.arrive)} – ${formatDate(stop.depart)} · ${escapeHtml(stop.country)}</span>
          <span>${stop.nights} nights · ${Math.round(distanceFromPrevious(stop.index)).toLocaleString()} km from previous · starts in ${Math.max(0, daysBetween(today, stop.arrive))} days</span>
        </button>
        <div class="weather" id="weather-${stop.index}" aria-live="polite">loading seasonal weather…</div>
      </article>
    `).join('');
    element.querySelectorAll('.leg-focus').forEach((button) => {
      button.addEventListener('click', () => showStop(Number(button.dataset.index)), { signal: abortController.signal });
    });
    loadWeather(upcoming);
  }

  function renderTimeline() {
    const element = get('travel-timeline');
    const activeIndex = trip.findIndex((stop) => stop.status !== 'past');
    const startIndex = Math.max(0, (activeIndex < 0 ? trip.length : activeIndex) - 6);
    const shown = timelineExpanded ? trip : trip.slice(startIndex);
    let lastYear = null;
    element.innerHTML = shown.map((stop) => {
      const year = stop.arrive.slice(0, 4);
      const heading = year !== lastYear ? `<h3 class="timeline-year">${year}</h3>` : '';
      lastYear = year;
      return `${heading}<div class="timeline-row ${stop.status}" data-status="${stop.status}">
        <time datetime="${stop.arrive}">${formatDate(stop.arrive)}<small>${stop.nights}n</small></time>
        <div><strong>${flag(stop.cc)} ${escapeHtml(stop.name)}</strong><span>${escapeHtml(stop.country)}</span>${stop.note ? `<p>${escapeHtml(stop.note)}</p>` : ''}</div>
      </div>`;
    }).join('');
  }

  const moreButton = get('travel-more');
  moreButton.addEventListener('click', () => {
    timelineExpanded = !timelineExpanded;
    moreButton.textContent = timelineExpanded ? 'show less ↑' : 'show full journey ↓';
    moreButton.setAttribute('aria-expanded', String(timelineExpanded));
    renderTimeline();
  }, { signal: abortController.signal });

  renderStats();
  renderMap();
  renderMapStops();
  renderUpcoming();
  renderTimeline();

  const themeObserver = new MutationObserver(() => {
    if (tileLayer) renderMap();
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
