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
let stocks = [];

function log(msg) { $('log').textContent += msg + '\n'; }
function clearLog() { $('log').textContent = ''; }

(async () => {
  ({ stocks } = await api('/api/config'));
  $('stock').innerHTML = stocks.map((s) => `<option value="${s.slug}">${s.name}</option>`).join('');
  const rolls = await api('/api/rolls');
  $('roll-picker').innerHTML = '<option value="">— new roll —</option>' +
    rolls.map((r) => `<option value="${r.slug}">${r.slug} (${r.frameCount}f${r.draft ? ', draft' : ''})</option>`).join('');
  $('date').value = new Date().toISOString().slice(0, 10);
})();

function rollLoc() {
  const name = $('loc-name').value.trim();
  const lat = parseFloat($('loc-lat').value), lng = parseFloat($('loc-lng').value);
  return name && Number.isFinite(lat) && Number.isFinite(lng) ? { name, lat, lng } : null;
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
  const q = prompt('location for this frame (place name):', frameLocName(frames[i]));
  if (!q) return;
  const loc = await pickLocation(q);
  if (!loc) return;
  frames[i].location = loc;
  frames[i].explicit = true;
  for (let j = i + 1; j < frames.length && !frames[j].explicit; j++) frames[j].location = loc;
  render();
}

async function pickLocation(q) {
  try {
    const results = await api('/api/geocode', { query: q });
    if (!results.length) { alert('no results; enter lat/lng manually'); return null; }
    const idx = results.length === 1 ? 0 :
      parseInt(prompt(results.map((r, n) => `${n}: ${r.name}`).join('\n') + '\n\npick #:', '0'), 10);
    return results[idx] || null;
  } catch (e) { alert('geocode failed: ' + e.message); return null; }
}

$('bulk-loc').onclick = async () => {
  const selected = [...document.querySelectorAll('.frame')].filter((el) => el.querySelector('.sel').checked).map((el) => +el.dataset.i);
  if (!selected.length) return alert('select frames first');
  const loc = await pickLocation(prompt('location for selected frames:') || '');
  if (!loc) return;
  selected.forEach((i) => { frames[i].location = loc; frames[i].explicit = true; });
  render();
};

$('scan').onclick = async () => {
  clearLog();
  try {
    const { parsed, frames: scanned } = await api('/api/scan', { folder: $('folder').value.trim() });
    const start = frames.length;
    scanned.forEach((f, k) => frames.push({
      srcPath: f.srcPath, thumb: f.thumb,
      alt: `${($('loc-name').value || parsed.country || 'frame')} — frame ${start + k + 1}`,
      caption: '', location: null, explicit: false,
    }));
    if (parsed.date) $('date').value = parsed.date;
    if (parsed.stockSlug) $('stock').value = parsed.stockSlug;
    if (parsed.country && !$('loc-search').value) $('loc-search').value = parsed.country;
    refreshSlug();
    render();
    log(`added ${scanned.length} frames`);
  } catch (e) { log('scan error: ' + e.message); }
};

$('loc-go').onclick = async () => {
  const results = await api('/api/geocode', { query: $('loc-search').value });
  $('loc-results').innerHTML = results.map((r, i) =>
    `<li data-i="${i}">${r.name} <span class="muted">(${r.lat.toFixed(3)}, ${r.lng.toFixed(3)})</span></li>`).join('');
  [...$('loc-results').children].forEach((li, i) => {
    li.onclick = () => {
      const r = results[i];
      $('loc-name').value = r.name; $('loc-lat').value = r.lat; $('loc-lng').value = r.lng;
      $('loc-results').innerHTML = '';
      refreshSlug(); render();
    };
  });
};

function refreshSlug() {
  if (mode === 'edit') return;
  const date = $('date').value, stock = $('stock').value;
  const place = ($('loc-name').value || '').split(',')[0];
  const ym = date.slice(0, 7);
  const slugPlace = place.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  $('slug').value = [ym, stock, slugPlace].filter(Boolean).join('-');
}
$('date').onchange = refreshSlug;
$('stock').onchange = refreshSlug;

$('roll-picker').onchange = async (e) => {
  const slug = e.target.value;
  if (!slug) { mode = 'create'; frames = []; render(); return; }
  mode = 'edit';
  const roll = await api('/api/roll/' + slug);
  $('title').value = roll.meta.title;
  $('stock').value = roll.meta.stock;
  $('date').value = roll.meta.date;
  $('loc-name').value = roll.meta.location.name;
  $('loc-lat').value = roll.meta.location.lat;
  $('loc-lng').value = roll.meta.location.lng;
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
    mode, commit, slug: $('slug').value.trim(),
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
  clearLog();
  const p = payload(commit);
  if (commit) {
    const msg = `${mode === 'edit' ? 'Update' : 'Add'} ${p.title} roll (${(stocks.find((s) => s.slug === p.stock) || {}).name})`;
    if (!confirm(`commit + push?\n\n${msg}`)) return;
  }
  try {
    const res = await api('/api/publish', p);
    res.log.forEach(log);
    log(res.committed ? '✓ committed + pushed' : '✓ written (not committed)');
  } catch (e) { log('publish error: ' + e.message); }
}
$('write').onclick = () => doPublish(false);
$('publish').onclick = () => doPublish(true);
