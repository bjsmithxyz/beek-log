const A = window.BjsmithXyzDesignSystem_042b50;
const { PageHeader, Panel, Button, SiteTree, Breadcrumb, Footer, Tag } = A;

const pageStyle = { padding: 'var(--page-content-top) 0 var(--space-16)' };
const label = { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' };
const input = { width: '100%', padding: '.52rem .6rem', border: '1px solid var(--color-border)', borderRadius: 0, background: 'var(--bg)', color: 'var(--text)', font: 'inherit' };
const field = (span) => ({ display: 'grid', gap: '.3rem', minWidth: 0, gridColumn: span ? 'span 2' : 'auto' });

function AdminIndex({ go }) {
  return (
    <section style={pageStyle}><div className="container">
      <PageHeader title="index/" description="admin.bjsmith.xyz — authenticated tools" />
      <SiteTree root="~/admin" nodes={[
        { label: 'beek/', href: '#', meta: 'public site' },
        { label: 'admin/', meta: 'beek', open: true, children: [
          { label: 'rolls/', meta: 'desktop beta', open: true, children: [
            { label: 'index/', href: '#rolls', meta: 'committed rolls' },
            { label: 'new/', href: '#new', meta: 'import scans' },
          ] },
          { label: 'travel/', href: '#travel', meta: 'itinerary' },
        ] },
      ]} />
    </div></section>
  );
}

function RollsIndex({ go }) {
  const rolls = window.KIT_DATA.rolls;
  return (
    <section style={pageStyle}><div className="container">
      <PageHeader title="rolls/" description={rolls.length + ' committed rolls'} actions={<Button variant="primary" size="sm" onClick={() => go('new')}>new roll →</Button>} />
      <div>
        {rolls.map(r => (
          <div key={r.slug} style={{ display: 'grid', gridTemplateColumns: '12rem 6.5rem 1fr auto', gap: 'var(--space-4)', alignItems: 'baseline', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)', marginTop: -1, background: 'var(--color-bg-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <Tag kind={r.stockType}>{r.stock}</Tag>
            <span style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{r.date}</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>{r.title}</span>
            <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="secondary" size="sm" onClick={() => go('edit')}>edit</Button>
            </span>
          </div>
        ))}
      </div>
    </div></section>
  );
}

function RollEditor({ mode = 'create', go }) {
  const frames = window.KIT_DATA.frames;
  const [stage, setStage] = React.useState('edit');
  const [selected, setSelected] = React.useState([]);
  const [picker, setPicker] = React.useState(null); // null | { target: 'roll' | 'frames' }
  const [rollLoc, setRollLoc] = React.useState({ name: 'Almaty', region: 'Kazakhstan', lat: 43.2364, lng: 76.9457 });
  const [frameLocs, setFrameLocs] = React.useState({});
  const toggle = (i) => setSelected(s => (s.includes(i) ? s.filter(x => x !== i) : s.concat(i)));
  const useLocation = (loc) => {
    if (picker && picker.target === 'frames') {
      setFrameLocs(prev => {
        const next = { ...prev };
        selected.forEach(i => { next[i] = loc.name; });
        return next;
      });
    } else {
      setRollLoc(loc);
    }
    setPicker(null);
  };
  return (
    <section style={pageStyle}><div className="container">
      <PageHeader
        title={mode === 'create' ? 'new-roll/' : 'edit-roll/'}
        actions={<React.Fragment>
          {mode === 'edit' && <Button variant="danger" size="sm">delete roll</Button>}
          <Button variant="primary" size="sm" onClick={() => setStage(stage === 'edit' ? 'review' : 'publish')}>
            {stage === 'edit' ? 'review changes →' : 'upload + create pull request →'}
          </Button>
        </React.Fragment>}
      />
      <p style={{ marginBottom: 'var(--space-5)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        18 scans encoded locally · quality-80 · 2048px long edge
      </p>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Panel path="source/images" title="scans" actions={<Button variant="secondary" size="sm">choose folder</Button>}>
          <p style={{ margin: '.3rem 0 .7rem', ...label }}>Folder convention: <code>YYYY-MM-DD - film-stock-slug-ISO</code>. Images are encoded locally; originals never leave the browser.</p>
          <div style={{ height: 4, overflow: 'hidden', background: 'var(--color-border)' }}><span style={{ display: 'block', width: '100%', height: '100%', background: 'var(--color-accent-primary)' }} /></div>
          <p style={{ margin: '.4rem 0 0', ...label }}>18 / 18 encoded</p>
        </Panel>
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Panel path="frontmatter" title="roll metadata" actions={<label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', ...label }}><input type="checkbox" style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent)' }} /> draft</label>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.7rem' }}>
            <label style={field(true)}><span style={label}>title</span><input style={input} defaultValue="Almaty" /></label>
            <label style={field()}><span style={label}>film stock</span><select style={input} defaultValue="fujifilm-400"><option value="fujifilm-400">Fujifilm 400</option><option value="kodak-tri-x-400">Kodak Tri-X 400</option></select></label>
            <label style={field()}><span style={label}>date</span><input style={input} type="date" defaultValue="2025-08-24" /></label>
            <label style={field()}><span style={label}>detected ISO</span><input style={{ ...input, color: 'var(--text-muted)' }} readOnly defaultValue="400" /></label>
            <label style={field(true)}><span style={label}>slug</span><input style={input} defaultValue="2025-08-fujifilm-400-almaty" /></label>
            <div style={{ ...field(true), display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '.75rem', padding: '.6rem', border: '1px solid var(--color-border)' }}>
              <div><span style={label}>primary location</span><p style={{ margin: '.2rem 0 0', color: 'var(--text-soft)', fontSize: 'var(--font-size-sm)' }}>{rollLoc.name ? rollLoc.name + ' · ' + rollLoc.region + ' · ' + rollLoc.lat + ', ' + rollLoc.lng : '(none set)'}</p></div>
              <Button variant="secondary" size="sm" onClick={() => setPicker({ target: 'roll' })}>set location</Button>
            </div>
            <label style={field(true)}><span style={label}>roll notes (Markdown)</span><textarea style={{ ...input, resize: 'vertical' }} rows="3" /></label>
          </div>
        </Panel>
      </div>

      <Panel path="photos[]" title={'frames (' + frames.length + ')'} actions={<span style={{ display: 'flex', gap: '.6rem' }}><Button variant="secondary" size="sm" onClick={() => setSelected(frames.map((_, i) => i))}>select all</Button><Button variant="secondary" size="sm" onClick={() => setPicker({ target: 'frames' })}>set selected location</Button></span>}>
        <p style={{ margin: '.3rem 0 .7rem', ...label }}>Drag frames or use arrow buttons to reorder. Setting one frame location fills forward until the next explicit location.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '.75rem' }}>
          {frames.map((fr, i) => (
            <div key={fr.src} style={{ minWidth: 0, padding: '.55rem', border: '1px solid ' + (selected.includes(i) ? 'var(--accent)' : 'var(--color-border)'), background: 'var(--bg)', boxShadow: selected.includes(i) ? '2px 2px 0 var(--accent)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.4rem', marginBottom: '.4rem' }}>
                <span style={{ color: 'var(--amber)', fontSize: 'var(--font-size-xs)' }}>{String(i + 1).padStart(3, '0')}.jpg</span>
                <span style={{ display: 'flex', gap: '.2rem' }}>
                  {['↑', '↓'].map(g => <button key={g} type="button" style={{ width: '1.7rem', height: '1.7rem', padding: 0, border: '1px solid var(--color-border)', background: 'var(--panel)', color: 'var(--text-muted)' }}>{g}</button>)}
                </span>
              </div>
              <img src={fr.src} alt="" style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }} />
              <div style={{ display: 'grid', gap: '.35rem', marginTop: '.45rem' }}>
                <input style={{ ...input, fontSize: 'var(--font-size-xs)', padding: '.35rem' }} placeholder="alt text" />
                <span style={{ ...label, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{frameLocs[i] ? frameLocs[i] : rollLoc.name + ' (inherited)'}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.3rem', ...label }}><input type="checkbox" checked={selected.includes(i)} onChange={() => toggle(i)} style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent)' }} /> select</label>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <LocationPicker
        open={!!picker}
        initial={picker && picker.target === 'roll' ? rollLoc : { name: '', region: rollLoc.region, lat: '', lng: '' }}
        onClose={() => setPicker(null)}
        onUse={useLocation}
      />

      {stage === 'review' && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Panel tone="amber" path="publication/review" title="review roll publication">
            <p style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-soft)' }}>1 markdown file · 18 images · new branch <code>admin/rolls/8f21c4</code></p>
            <p style={{ ...label, marginBottom: 'var(--space-3)' }}>New scans are stored as unreferenced GitHub blobs first. One later commit atomically applies every image, Markdown, rename, or deletion on a review branch.</p>
            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setStage('edit')}>keep editing</Button>
              <Button variant="primary" size="sm" onClick={() => setStage('publish')}>upload + create pull request →</Button>
            </div>
          </Panel>
        </div>
      )}

      {stage === 'publish' && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Panel tone="blue" path="publication/status" title="roll publication">
            <p style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-soft)' }}>Uploading blobs… 12 / 18</p>
            <div style={{ height: 4, overflow: 'hidden', background: 'var(--color-border)' }}><span style={{ display: 'block', width: '66%', height: '100%', background: 'var(--color-accent-primary)' }} /></div>
            <dl style={{ margin: 'var(--space-4) 0 0', borderTop: '1px solid var(--color-border)' }}>
              {[['pull request', 'waiting…'], ['deploy preview', 'waiting for Netlify…']].map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '9rem 1fr', gap: '.6rem', padding: '.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <dt style={label}>{k}</dt><dd style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-soft)' }}>{v}</dd>
                </div>
              ))}
            </dl>
            <div style={{ display: 'flex', gap: '.6rem', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setStage('edit')}>refresh status</Button>
              <Button variant="danger" size="sm" onClick={() => setStage('edit')}>abandon</Button>
              <Button variant="primary" size="sm" disabled>merge to main →</Button>
            </div>
          </Panel>
        </div>
      )}
    </div></section>
  );
}

function TravelAdmin() {
  const [trip, setTrip] = React.useState(null);
  const [layers, setLayers] = React.useState({ travelled: true, planned: true });
  const [focus, setFocus] = React.useState(null);
  React.useEffect(() => { fetch('../../assets/trips.json').then(r => r.json()).then(setTrip); }, []);

  if (!trip) return <section style={pageStyle}><div className="container"><p style={{ color: 'var(--text-muted)' }}>loading itinerary…</p></div></section>;

  const now = Date.now();
  const stops = trip.stops;
  const statuses = stops.map(st => window.statusOf(st, now));
  const currentIndex = statuses.indexOf('current');
  const upcoming = stops.filter((_, i) => statuses[i] === 'future').length;
  const tentative = stops.filter(st => st.tentative).length;
  const chip = (status, on) => ({
    padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-xs)', font: 'inherit',
    background: 'var(--color-bg-secondary)', cursor: 'pointer', flex: 'none', whiteSpace: 'nowrap',
    color: status === 'current' ? 'var(--amber)' : on ? 'var(--accent)' : 'var(--text-muted)',
    border: '1px solid ' + (on ? 'var(--accent)' : 'var(--color-border)'),
    boxShadow: on ? 'var(--shadow-hard-accent)' : 'none',
  });

  return (
    <section style={pageStyle}><div className="container">
      <PageHeader title="travel/" description={stops.length + ' stops · ' + upcoming + ' upcoming · ' + tentative + ' tentative'} />
      <p style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', margin: '0 0 var(--space-4)', padding: 'var(--space-2) var(--space-3)', color: 'var(--text-soft)', background: 'var(--panel)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--amber)', fontSize: 'var(--font-size-sm)' }}>
        <span style={{ width: 7, height: 7, flex: 'none', background: 'var(--amber)' }} />
        authenticated view — exact dates, forward plans and tentative stops are never published to bjsmith.xyz
      </p>

      <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>route/</h2>
          <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Solid is travelled; dashed is planned. Click a marker for dates.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['travelled', 'planned'].map(k => (
            <button key={k} type="button" aria-pressed={layers[k]} style={chip('past', layers[k])} onClick={() => setLayers(l => ({ ...l, [k]: !l[k] }))}>{k}</button>
          ))}
        </div>
      </div>
      <TravelMap stops={stops} layers={layers} focus={focus} onFocusHandled={() => setFocus(null)} detail />
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', paddingBottom: 'var(--space-2)', overflowX: 'auto' }}>
        {stops.map((st, i) => (
          <button key={st.name + i} type="button" style={chip(statuses[i], statuses[i] === 'current')} onClick={() => setFocus(i)}>{st.name}</button>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '7rem 7rem 1fr 6rem', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid var(--color-border)', background: 'var(--panel-strong)' }}>
          <span>arrive</span><span>depart</span><span>stop</span><span>state</span>
        </div>
        {stops.map((st, i) => (
          <div key={st.name + st.arrive} style={{ display: 'grid', gridTemplateColumns: '7rem 7rem 1fr 6rem', gap: 'var(--space-4)', alignItems: 'baseline', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)', marginTop: -1, background: 'var(--panel)', fontSize: 'var(--font-size-sm)' }}>
            <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{st.arrive}</span>
            <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{st.depart}</span>
            <span>
              <strong style={{ color: 'var(--text)', fontWeight: 'var(--font-weight-medium)' }}>{st.name}</strong>
              <span style={{ marginLeft: 'var(--space-2)', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>{st.country}</span>
              {st.note && <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', fontStyle: 'italic' }}>{st.note}</p>}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: statuses[i] === 'current' ? 'var(--blue)' : statuses[i] === 'future' ? 'var(--amber)' : 'var(--text-muted)' }}>
              {statuses[i] === 'future' ? (st.tentative ? 'tentative' : 'planned') : statuses[i] === 'current' ? 'here now' : 'done'}
            </span>
          </div>
        ))}
      </div>
    </div></section>
  );
}

function LoginScreen({ go }) {
  return (
    <section style={pageStyle}><div className="container">
      <div style={{ maxWidth: '42rem', padding: 'var(--space-5)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-hard)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>sign in/</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
          admin.bjsmith.xyz is protected. Authentication is GitHub App OAuth; session cookies are host-only and never reach the public origin.
        </p>
        <Button variant="primary" onClick={() => go('')}>continue with github →</Button>
      </div>
    </div></section>
  );
}

Object.assign(window, { AdminIndex, RollsIndex, RollEditor, TravelAdmin, LoginScreen });
