import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { knownLocations } from '@beek/shared/loc-utils';
import { renderFrames } from './frames.js';
import {
  displayLocation,
  endpoints,
  post,
  renderLocation,
  state,
  updateReady,
} from './state.js';

function ensureMap() {
  if (state.map) return;
  state.map = L.map('location-map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(state.map);
  state.marker = L.marker([20, 0], { draggable: true }).addTo(state.map);
  state.marker.on('dragend', () => setCoordinates(state.marker.getLatLng()));
  state.map.on('click', (event) => {
    state.marker.setLatLng(event.latlng);
    setCoordinates(event.latlng);
  });
}

function setCoordinates(value) {
  document.getElementById('location-lat').value = Number(value.lat).toFixed(6);
  document.getElementById('location-lng').value = Number(value.lng).toFixed(6);
}

function fillLocationFields(value) {
  document.getElementById('location-name').value = value?.name || '';
  document.getElementById('location-lat').value = value?.lat ?? '';
  document.getElementById('location-lng').value = value?.lng ?? '';
  document.getElementById('location-region').value = value?.region?.name || '';
  state.pickerRegion = value?.region || null;
  if (value) {
    state.marker.setLatLng([value.lat, value.lng]);
    state.map.setView([value.lat, value.lng], 8);
  }
}

function renderLocationChips() {
  const container = document.getElementById('location-chips');
  const locations = knownLocations(state.rollLocation, state.frames);
  container.replaceChildren(...locations.map((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = displayLocation(value);
    button.addEventListener('click', () => fillLocationFields(value));
    return button;
  }));
}

export function openLocationPicker(initial, apply) {
  const dialog = document.getElementById('location-dialog');
  state.locationApply = apply;
  ensureMap();
  renderLocationChips();
  document.getElementById('location-results').replaceChildren();
  document.getElementById('location-search').value = '';
  document.getElementById('location-message').textContent = '';
  fillLocationFields(initial);
  dialog.showModal();
  setTimeout(() => state.map.invalidateSize(), 0);
}

async function searchLocation() {
  const query = document.getElementById('location-search').value.trim();
  if (!query) return;
  const message = document.getElementById('location-message');
  message.textContent = 'Searching OpenStreetMap…';
  try {
    const body = await post(endpoints.geocode, { kind: 'place', query });
    const list = document.getElementById('location-results');
    list.replaceChildren(...body.results.map((result) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${result.name}${result.regionName ? ` · ${result.regionName}` : ''} (${result.lat.toFixed(2)}, ${result.lng.toFixed(2)})`;
      button.addEventListener('click', async () => {
        state.pickerRegion = null;
        fillLocationFields(result);
        try {
          if (result.regionName) {
            message.textContent = `Loading ${result.regionName} region…`;
            const regionBody = await post(endpoints.geocode, { kind: 'region', query: result.regionName });
            state.pickerRegion = regionBody.region;
            document.getElementById('location-region').value = state.pickerRegion?.name || result.regionName;
          }
          message.textContent = '';
          list.replaceChildren();
        } catch (error) {
          message.textContent = error.message;
        }
      });
      item.append(button);
      return item;
    }));
    message.textContent = body.results.length ? '' : 'No results.';
  } catch (error) {
    message.textContent = error.message;
  }
}

export function bindLocationPicker() {
  document.getElementById('search-location').addEventListener('click', searchLocation);
  document.getElementById('location-search').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); searchLocation(); }
  });
  document.getElementById('close-location').addEventListener('click', () => document.getElementById('location-dialog').close());
  document.getElementById('use-location').addEventListener('click', () => {
    const name = document.getElementById('location-name').value.trim();
    const lat = Number(document.getElementById('location-lat').value);
    const lng = Number(document.getElementById('location-lng').value);
    const regionName = document.getElementById('location-region').value.trim();
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      document.getElementById('location-message').textContent = 'A place name and valid coordinates are required.';
      return;
    }
    if (regionName && (!state.pickerRegion || state.pickerRegion.name !== regionName)) {
      document.getElementById('location-message').textContent = 'Choose a search result or known chip so the region has coordinates.';
      return;
    }
    const value = { name, lat, lng, ...(regionName ? { region: state.pickerRegion } : {}) };
    state.locationApply?.(value);
    document.getElementById('location-dialog').close();
  });

  document.getElementById('set-roll-location').addEventListener('click', () => {
    openLocationPicker(state.rollLocation, (value) => {
      state.rollLocation = value;
      renderLocation();
      renderFrames();
      updateReady();
    });
  });
}
