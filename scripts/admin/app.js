import { knownLocations, fillForward } from '/loc-utils.mjs';

const $ = (id) => document.getElementById(id);
const api = async (path, body) => {
  const opts = body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {};
  const r = await fetch(path, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
};

let frames = [];      // { srcPath?|existing, thumb, alt, caption, location|null, explicit }
let mode = 'create';  // 'create' | 'edit'
let editSlug = null;  // original slug when editing (existing frames copy from it)
let stocks = [];

function logLine(msg, cls) {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = msg;
  $('log').appendChild(line);
}
function log(msg) { logLine(msg); }          // normal line (single-arg: safe as a forEach callback)
function logErr(msg) { logLine(msg, 'err'); } // red
function logOk(msg) { logLine(msg, 'ok'); }   // green
function clearLog() { $('log').replaceChildren(); }

(async () => {
  ({ stocks } = await api('/api/config'));
  $('stock').innerHTML = stocks.map((s) => `<option value="${s.slug}">${s.name}</option>`).join('');
  const rolls = await api('/api/rolls');
  $('roll-picker').innerHTML = '<option value="">— new roll —</option>' +
    rolls.map((r) => `<option value="${r.slug}">${r.slug}${r.draft ? ' (draft)' : ''}</option>`).join('');
  $('date').value = new Date().toISOString().slice(0, 10);
})();

let rollRegion = null;
function rollLoc() {
  const name = $('loc-name').value.trim();
  const lat = parseFloat($('loc-lat').value), lng = parseFloat($('loc-lng').value);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const loc = { name, lat, lng };
  if (rollRegion) loc.region = rollRegion;
  return loc;
}
function setRollLocation(loc) {
  $('loc-name').value = loc ? loc.name : '';
  $('loc-lat').value = loc ? loc.lat : '';
  $('loc-lng').value = loc ? loc.lng : '';
  rollRegion = (loc && loc.region) || null;
  $('loc-display').textContent = loc ? (loc.name + (loc.region ? ` · ${loc.region.name}` : '')) : '(none set)';
  refreshSlug();
}
function frameLocName(f) { return (f.location || rollLoc() || {}).name || '(set roll location)'; }

function render() {
  const grid = $('frames');
  grid.innerHTML = '';
  frames.forEach((f, i) => {
    const el = document.createElement('div');
    el.className = 'frame';
    el.draggable = true;
    el.dataset.i = i;
    el.innerHTML = `
      <div class="n">#${String(i + 1).padStart(3, '0')} <input type="checkbox" class="sel" style="width:auto;"></div>
      <img src="${f.thumb}" alt="">
      <input class="alt" placeholder="alt" value="${(f.alt || '').replace(/"/g, '&quot;')}">
      <input class="cap" placeholder="caption (optional)" value="${(f.caption || '').replace(/"/g, '&quot;')}">
      <div class="loc">📍 ${frameLocName(f)}</div>
      <button class="setloc">set location</button>
      <button class="del">remove</button>`;
    el.querySelector('.alt').oninput = (e) => { f.alt = e.target.value; };
    el.querySelector('.cap').oninput = (e) => { f.caption = e.target.value; };
    el.querySelector('.del').onclick = () => { frames.splice(i, 1); render(); };
    el.querySelector('.setloc').onclick = () => setFrameLocation(i);
    el.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i));
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('dragover'); });
    el.addEventListener('dragleave', () => el.classList.remove('dragover'));
    el.addEventListener('drop', (e) => {
      e.preventDefault(); el.classList.remove('dragover');
      const from = +e.dataTransfer.getData('text/plain');
      const [moved] = frames.splice(from, 1);
      frames.splice(i, 0, moved);
      render();
    });
    grid.appendChild(el);
  });
}

async function setFrameLocation(i) {
  const loc = await openLocationPicker({
    initial: frames[i].location || rollLoc(),
    known: knownLocations(rollLoc(), frames),
  });
  if (!loc) return;
  fillForward(frames, i, loc);
  refreshSlug();
  render();
}

// toggle: select all frames, or deselect all when every frame is already selected
$('select-all').onclick = () => {
  const boxes = [...document.querySelectorAll('.frame .sel')];
  const allChecked = boxes.length > 0 && boxes.every((b) => b.checked);
  boxes.forEach((b) => { b.checked = !allChecked; });
};

$('bulk-loc').onclick = async () => {
  const selected = [...document.querySelectorAll('.frame')].filter((el) => el.querySelector('.sel').checked).map((el) => +el.dataset.i);
  if (!selected.length) return alert('select frames first');
  const loc = await openLocationPicker({ initial: null, known: knownLocations(rollLoc(), frames) });
  if (!loc) return;
  selected.forEach((i) => { frames[i].location = loc; frames[i].explicit = true; });
  refreshSlug();
  render();
};

$('scan').onclick = async () => {
  clearLog();
  try {
    const { parsed, frames: scanned } = await api('/api/scan', { folder: $('folder').value.trim() });
    const start = frames.length;
    scanned.forEach((f, k) => frames.push({
      srcPath: f.srcPath, thumb: f.thumb,
      alt: `frame ${start + k + 1}`,
      caption: '', location: null, explicit: false,
    }));
    if (parsed.date) $('date').value = parsed.date;
    if (parsed.stockSlug) $('stock').value = parsed.stockSlug;
    refreshSlug();
    render();
    log(`added ${scanned.length} frames`);
  } catch (e) { logErr('scan error: ' + e.message); }
};

// Cyrillic → Latin so non-Latin place/stock names produce valid slugs
// (the server requires slugs to match ^[a-z0-9-]+$).
const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'yi',
  є: 'ye', ґ: 'g', ў: 'w',
};
function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (c) => CYRILLIC[c] ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function refreshSlug() {
  if (mode === 'edit') return;
  const date = $('date').value, stock = $('stock').value;
  // prefer the roll primary, else the first frame that has a location, so the
  // slug carries a place even when only per-frame locations were set
  const primary = rollLoc() || (frames.find((f) => f.location) || {}).location;
  const place = (primary && primary.name ? primary.name : '').split(',')[0];
  const ym = date.slice(0, 7);
  $('slug').value = [ym, stock, slugify(place)].filter(Boolean).join('-');
}
$('date').onchange = refreshSlug;
$('stock').onchange = refreshSlug;
// sanitise a hand-edited slug when the field loses focus
$('slug').onchange = (e) => { e.target.value = slugify(e.target.value); };

function resetForm() {
  mode = 'create';
  editSlug = null;
  frames = [];
  $('folder').value = '';
  $('title').value = '';
  $('stock').selectedIndex = 0;
  $('date').value = new Date().toISOString().slice(0, 10);
  $('draft').checked = false;
  $('body').value = '';
  setRollLocation(null); // clears loc fields + display, then refreshSlug
  render();
}

$('roll-picker').onchange = async (e) => {
  const slug = e.target.value;
  if (!slug) { resetForm(); return; }
  mode = 'edit';
  const roll = await api('/api/roll/' + slug);
  editSlug = roll.slug;
  $('title').value = roll.meta.title;
  $('stock').value = roll.meta.stock;
  $('date').value = roll.meta.date;
  setRollLocation(roll.meta.location);
  $('slug').value = roll.slug;
  $('draft').checked = roll.meta.draft;
  $('body').value = roll.body;
  frames = roll.frames.map((f) => ({
    existing: f.existing, thumb: f.thumb, alt: f.alt, caption: f.caption,
    location: f.location, explicit: !!f.location,
  }));
  render();
};

function payload(commit) {
  return {
    mode, commit, slug: slugify($('slug').value),
    sourceSlug: mode === 'edit' ? editSlug : undefined,
    title: $('title').value.trim(), stock: $('stock').value, date: $('date').value,
    location: rollLoc(), draft: $('draft').checked, bodyText: $('body').value,
    frames: frames.map((f) => ({
      srcPath: f.srcPath, existing: f.existing,
      alt: f.alt, caption: f.caption || undefined,
      location: f.location || undefined,
    })),
  };
}

async function doPublish(commit) {
  const p = payload(commit);
  if (commit) {
    const msg = `${mode === 'edit' ? 'Update' : 'Add'} ${p.title} roll (${(stocks.find((s) => s.slug === p.stock) || {}).name})`;
    if (!confirm(`commit + push?\n\n${msg}`)) return;
  }
  clearLog();
  $('write').disabled = true;
  $('publish').disabled = true;
  log(commit
    ? `submitting "${p.slug}" — processing ${p.frames.length} frames, committing & pushing…`
    : `writing "${p.slug}" — processing ${p.frames.length} frames…`);
  try {
    const res = await api('/api/publish', p);
    res.log.forEach(log);
    logOk(res.committed ? '✓ committed + pushed — Netlify will deploy shortly' : '✓ written (not committed)');
  } catch (e) {
    logErr('✗ publish error: ' + e.message);
  } finally {
    $('write').disabled = false;
    $('publish').disabled = false;
  }
}
$('write').onclick = () => doPublish(false);
$('publish').onclick = () => doPublish(true);

// ---- shared location picker -------------------------------------------------
let pickerMap = null, pickerMarker = null, pickerResolve = null, pickerRegion = null;

function ensurePickerMap() {
  if (pickerMap || !window.L) return;
  pickerMap = L.map('pk-map').setView([20, 0], 1);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(pickerMap);
  pickerMarker = L.marker([20, 0], { draggable: true }).addTo(pickerMap);
  pickerMarker.on('dragend', () => {
    const { lat, lng } = pickerMarker.getLatLng();
    $('pk-lat').value = lat.toFixed(4);
    $('pk-lng').value = lng.toFixed(4);
  });
}

function setPickerPin(lat, lng, zoom) {
  if (!pickerMap) return;
  pickerMarker.setLatLng([lat, lng]);
  pickerMap.setView([lat, lng], zoom ?? 8);
}

function fillPickerFields(loc) {
  $('pk-name').value = loc ? loc.name : '';
  $('pk-lat').value = loc ? loc.lat : '';
  $('pk-lng').value = loc ? loc.lng : '';
  $('pk-region').value = (loc && loc.region) ? loc.region.name : '';
  pickerRegion = (loc && loc.region) || null;
  if (loc && window.L) setPickerPin(loc.lat, loc.lng);
}

function renderChips(known) {
  $('pk-chips').innerHTML = known
    .map((l, i) => `<button type="button" class="chip" data-i="${i}">${l.name}${l.region ? ` · ${l.region.name}` : ''}</button>`)
    .join('');
  [...$('pk-chips').children].forEach((btn, i) => { btn.onclick = () => fillPickerFields(known[i]); });
}

async function pkSearch() {
  const q = $('pk-search').value.trim();
  if (!q) return;
  $('pk-msg').textContent = 'searching…';
  try {
    const results = await api('/api/geocode', { query: q });
    if (!results.length) { $('pk-msg').textContent = 'no results — drag the pin or type coords'; $('pk-results').innerHTML = ''; return; }
    $('pk-msg').textContent = '';
    $('pk-results').innerHTML = results
      .map((r, i) => `<li data-i="${i}">${r.name}${r.region ? ` · ${r.region.name}` : ''} <span class="muted">(${r.lat.toFixed(2)}, ${r.lng.toFixed(2)})</span></li>`)
      .join('');
    [...$('pk-results').children].forEach((li, i) => {
      li.onclick = () => { fillPickerFields(results[i]); $('pk-results').innerHTML = ''; };
    });
  } catch (e) { $('pk-msg').textContent = 'geocode failed: ' + e.message; }
}

function currentPickerLocation() {
  const name = $('pk-name').value.trim();
  const lat = parseFloat($('pk-lat').value), lng = parseFloat($('pk-lng').value);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const loc = { name, lat, lng };
  const regionName = $('pk-region').value.trim();
  // region needs coords; reuse the geocoded region, applying a renamed label if edited
  if (pickerRegion && regionName) loc.region = regionName === pickerRegion.name ? pickerRegion : { ...pickerRegion, name: regionName };
  return loc;
}

function closePicker(result) {
  $('picker').hidden = true;
  const r = pickerResolve; pickerResolve = null;
  if (r) r(result);
}

function openLocationPicker({ initial, known } = {}) {
  return new Promise((resolve) => {
    pickerResolve = resolve;
    $('picker').hidden = false;
    ensurePickerMap();
    if (pickerMap) setTimeout(() => pickerMap.invalidateSize(), 0);
    $('pk-search').value = '';
    $('pk-results').innerHTML = '';
    $('pk-msg').textContent = window.L ? '' : 'map unavailable — use search + coords';
    renderChips(known || []);
    fillPickerFields(initial || null);
  });
}

$('pk-go').onclick = pkSearch;
$('pk-search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); pkSearch(); } });
$('pk-cancel').onclick = () => closePicker(null);
$('pk-ok').onclick = () => {
  const loc = currentPickerLocation();
  if (!loc) { $('pk-msg').textContent = 'need a place name + lat/lng'; return; }
  closePicker(loc);
};
$('loc-edit').onclick = async () => {
  const current = rollLoc();
  const loc = await openLocationPicker({ initial: current, known: knownLocations(current, frames) });
  if (loc) setRollLocation(loc);
};
