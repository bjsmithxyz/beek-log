// Location picker dialog from admin/src/components/RollEditor.astro — search row,
// result list, recent chips, a real Leaflet map you can click to drop a pin, and the
// four editable fields. The live admin geocodes over the network; this kit searches a
// local gazetteer built from the trip's own stops so it works offline.

function buildGazetteer() {
  const stops = (window.TRIP_STOPS || []);
  const seen = new Set();
  return stops.filter((s) => {
    const k = s.name + s.country;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).map((s) => ({ name: s.name, region: s.country, lat: s.lat, lng: s.lon }));
}

function LocationPicker({ open, initial, onClose, onUse }) {
  const hostRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [place, setPlace] = React.useState(initial || { name: '', region: '', lat: '', lng: '' });
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';

  React.useEffect(() => { if (open) setPlace(initial || { name: '', region: '', lat: '', lng: '' }); }, [open]);

  React.useEffect(() => {
    if (!open || !hostRef.current || typeof L === 'undefined') return;
    const tiles = theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const start = [Number(place.lat) || 20, Number(place.lng) || 40];
    const map = L.map(hostRef.current, { attributionControl: true }).setView(start, place.lat ? 8 : 2);
    L.tileLayer(tiles, { attribution: '© OpenStreetMap contributors, © CARTO', subdomains: 'abcd', maxZoom: 18 }).addTo(map);
    map.on('click', (e) => {
      setPlace((p) => ({ ...p, lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }));
      setMessage('Pin dropped — name it before saving.');
    });
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; markerRef.current = null; };
  }, [open, theme]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof L === 'undefined') return;
    const lat = Number(place.lat), lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || place.lat === '' || place.lng === '') return;
    if (markerRef.current) map.removeLayer(markerRef.current);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent-primary').trim() || '#33ff66';
    markerRef.current = L.circleMarker([lat, lng], { radius: 6, color: accent, weight: 3, fillColor: accent, fillOpacity: 0.35 }).addTo(map);
  }, [place.lat, place.lng]);

  const search = () => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setMessage('Type a place name.'); return; }
    const hits = buildGazetteer().filter((g) => (g.name + ' ' + g.region).toLowerCase().includes(q)).slice(0, 6);
    setResults(hits);
    setMessage(hits.length ? hits.length + ' matches' : 'No matches in the local gazetteer — drop a pin on the map instead.');
  };

  const pick = (hit) => {
    setPlace({ name: hit.name, region: hit.region, lat: hit.lat, lng: hit.lng });
    setMessage('');
    if (mapRef.current) mapRef.current.flyTo([hit.lat, hit.lng], 7, { duration: 0.5 });
  };

  if (!open) return null;

  const label = { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' };
  const input = { width: '100%', minWidth: 0, padding: '.52rem .6rem', border: '1px solid var(--color-border)', borderRadius: 0, background: 'var(--bg)', color: 'var(--text)', font: 'inherit' };
  const smallBtn = { padding: '.45rem .65rem', border: '1px solid var(--border-strong)', background: 'var(--panel-strong)', color: 'var(--text-soft)', font: 'inherit', fontSize: 'var(--font-size-xs)', cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflow: 'auto' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Set location"
           style={{ width: 'min(620px, calc(100vw - 2rem))', padding: '1rem', border: '1px solid var(--border-strong)', background: 'var(--bg)', color: 'var(--text)', boxShadow: 'var(--shadow-dialog)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '.7rem' }}>
          <div>
            <span style={label}>location/picker</span>
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-medium)' }}>set location</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ width: '2rem', height: '2rem', border: '1px solid var(--color-border)', background: 'var(--panel)', color: 'var(--text)', font: 'inherit', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: '.6rem' }}>
          <input style={{ ...input, flex: 1 }} placeholder="search place…" value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} />
          <button type="button" style={smallBtn} onClick={search}>search</button>
        </div>
        <p style={{ margin: '.4rem 0 .5rem', ...label }} role="status">{message}</p>

        {results.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '.4rem 0', display: 'grid', gap: '.25rem' }}>
            {results.map((hit) => (
              <li key={hit.name + hit.lat}>
                <button type="button" onClick={() => pick(hit)}
                        style={{ width: '100%', padding: '.45rem', textAlign: 'left', border: '1px solid var(--color-border)', background: 'var(--panel)', color: 'var(--text-soft)', font: 'inherit', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                  {hit.name} <span style={label}>· {hit.region} · {hit.lat}, {hit.lng}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', margin: '.4rem 0' }}>
          {buildGazetteer().slice(-6).map((hit) => (
            <button key={'chip' + hit.name + hit.lat} type="button" onClick={() => pick(hit)}
                    style={{ padding: '.25rem .4rem', border: '1px solid var(--color-border)', background: 'var(--panel)', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', font: 'inherit', cursor: 'pointer' }}>
              {hit.name}
            </button>
          ))}
        </div>

        <div ref={hostRef} className="travel-map" style={{ height: 270, margin: '.6rem 0', border: '1px solid var(--color-border)' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
          <label style={{ display: 'grid', gap: '.3rem', gridColumn: 'span 2' }}><span style={label}>place</span>
            <input style={input} maxLength={160} value={place.name} onChange={(e) => setPlace(p => ({ ...p, name: e.target.value }))} /></label>
          <label style={{ display: 'grid', gap: '.3rem' }}><span style={label}>latitude</span>
            <input style={input} type="number" min="-90" max="90" step="any" value={place.lat} onChange={(e) => setPlace(p => ({ ...p, lat: e.target.value }))} /></label>
          <label style={{ display: 'grid', gap: '.3rem' }}><span style={label}>longitude</span>
            <input style={input} type="number" min="-180" max="180" step="any" value={place.lng} onChange={(e) => setPlace(p => ({ ...p, lng: e.target.value }))} /></label>
          <label style={{ display: 'grid', gap: '.3rem', gridColumn: 'span 2' }}><span style={label}>region / country</span>
            <input style={input} maxLength={160} value={place.region} onChange={(e) => setPlace(p => ({ ...p, region: e.target.value }))} /></label>
        </div>

        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', marginTop: '.7rem' }}>
          <button type="button" style={{ ...smallBtn, color: 'var(--accent)', borderColor: 'var(--accent)', boxShadow: 'var(--shadow-hard-accent)' }}
                  onClick={() => onUse(place)}>use location</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LocationPicker });
