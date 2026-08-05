// Real Leaflet route map for /travel/ — CARTO tiles, square themed chrome.
// Mirrors src/scripts/travel-client.js: solid line = travelled, dashed = planned,
// markers coloured green (been) / cyan (here now) / amber (planned). Day counts and
// past/current/upcoming status are computed in the browser on every load, never baked in.

const CARTO = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};
const ATTR = '© OpenStreetMap contributors, © CARTO';

function statusOf(stop, now) {
  const arrive = new Date(stop.arrive + 'T00:00:00Z').getTime();
  const depart = new Date(stop.depart + 'T00:00:00Z').getTime();
  if (depart < now) return 'past';
  if (arrive <= now) return 'current';
  return 'future';
}

function colorFor(status) {
  const css = getComputedStyle(document.documentElement);
  if (status === 'current') return css.getPropertyValue('--color-accent-tertiary').trim() || '#66ccff';
  if (status === 'future') return css.getPropertyValue('--color-accent-secondary').trim() || '#ffaa00';
  return css.getPropertyValue('--color-accent-primary').trim() || '#33ff66';
}

function dayCount(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
}

function TravelMap({ stops, layers, focus, onFocusHandled, detail = false }) {
  const hostRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const now = Date.now();

  React.useEffect(() => {
    if (!hostRef.current || typeof L === 'undefined') return;
    // Leaflet is recreated after the panel becomes visible so it always gets real dimensions.
    const map = L.map(hostRef.current, { worldCopyJump: true, attributionControl: true }).setView([25, 60], 2);
    L.tileLayer(CARTO[theme] || CARTO.dark, { attribution: ATTR, subdomains: 'abcd', maxZoom: 18 }).addTo(map);
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; };
  }, [theme]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof L === 'undefined') return;
    markersRef.current.forEach((l) => map.removeLayer(l));
    markersRef.current = [];

    const travelled = [];
    const planned = [];
    stops.forEach((stop, i) => {
      const status = statusOf(stop, now);
      const point = [stop.lat, stop.lon];
      if (status === 'future') planned.push(point); else travelled.push(point);
      if (status === 'current') planned.unshift(point);

      const show = (status === 'future' && layers.planned) || (status !== 'future' && layers.travelled);
      if (!show) return;

      const marker = L.circleMarker(point, {
        radius: status === 'current' ? 7 : 4,
        color: colorFor(status),
        weight: status === 'current' ? 3 : 2,
        fillColor: colorFor(status),
        fillOpacity: status === 'past' ? 0.9 : 0.35,
      }).addTo(map);

      const cls = status === 'current' ? 'popup-current' : status === 'future' ? 'popup-future' : 'popup-muted';
      // Public map shows place only — no dates, no day counts. `detail` is opt-in
      // and only the authenticated admin itinerary view passes it.
      marker.bindPopup(
        '<b>' + stop.name + '</b><br>' +
        '<span class="' + cls + '">' + stop.country + (status === 'current' ? ' · here now' : '') + '</span>' +
        (detail ? '<br><span class="popup-muted">' + stop.arrive + ' → ' + stop.depart + ' · ' + dayCount(stop.arrive, stop.depart) + ' days</span>' : '') +
        (detail && stop.note ? '<p class="travel-popup-note">' + stop.note + '</p>' : '') +
        (detail && stop.tentative ? '<p class="travel-popup-note">tentative</p>' : '')
      );
      marker._stopIndex = i;
      markersRef.current.push(marker);
    });

    if (layers.travelled && travelled.length > 1) {
      markersRef.current.push(L.polyline(travelled, { color: colorFor('past'), weight: 2, opacity: 0.85 }).addTo(map));
    }
    if (layers.planned && planned.length > 1) {
      markersRef.current.push(L.polyline(planned, { color: colorFor('future'), weight: 2, opacity: 0.8, dashArray: '5 6' }).addTo(map));
    }
  }, [stops, layers.travelled, layers.planned, theme, detail]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || focus === null || focus === undefined) return;
    const stop = stops[focus];
    if (!stop) return;
    map.flyTo([stop.lat, stop.lon], 6, { duration: 0.6 });
    const marker = markersRef.current.find((m) => m._stopIndex === focus);
    if (marker) marker.openPopup();
    onFocusHandled && onFocusHandled();
  }, [focus]);

  return (
    <div
      ref={hostRef}
      className="travel-map"
      role="region"
      aria-label="Interactive map of the journey"
      tabIndex={0}
      style={{
        height: 'min(62vh, 540px)', minHeight: 360,
        border: '1px solid var(--color-border-strong)',
        background: 'var(--color-bg-secondary)',
        boxShadow: 'var(--shadow-hard)', zIndex: 0,
      }}
    />
  );
}

Object.assign(window, { TravelMap, statusOf, dayCount });
