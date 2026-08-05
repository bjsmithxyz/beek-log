const DS = window.BjsmithXyzDesignSystem_042b50;
const { PageHeader, Panel, Button, Tag, Breadcrumb, SiteTree, Footer, FilterBar, DirListHeader, WorkRow, RollRow, FilmStrip, Lightbox, WorldMap, Stat, StatGrid } = DS;
const D = window.KIT_DATA;

const pageStyle = { padding: 'var(--page-content-top) 0 var(--space-16)' };
const sectionLabel = { fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)' };

function HomeScreen({ go }) {
  const rollsByYear = { 2025: D.rolls };
  return (
    <section style={pageStyle}><div className="container">
      <SiteTree root="~" nodes={[
        { label: 'admin/', href: '#', meta: 'protected' },
        { label: 'beek/', meta: 'public home', open: true, children: [
          { label: 'work/', meta: D.work.length + ' entries', children: [
            { label: 'index/', href: '#work', meta: 'all work' },
            { label: 'dev/', meta: '2 entries', children: D.work.filter(w => w.category === 'dev').map(w => ({ label: w.slug + '.md', href: '#work/' + w.slug })) },
            { label: 'art/', meta: '3 entries', children: D.work.filter(w => w.category !== 'dev').map(w => ({ label: w.slug + '.md', href: '#work/' + w.slug })) },
          ] },
          { label: 'photos/', meta: D.rolls.length + ' rolls', children: [
            { label: 'index/', href: '#photos', meta: 'all rolls' },
            { label: '2025/', meta: D.rolls.length + ' rolls', children: rollsByYear[2025].map(r => ({ label: r.slug + '.md', href: '#photos/' + r.slug, meta: r.date })) },
          ] },
          { label: 'travel/', href: '#travel', meta: 'journey' },
          { label: 'about.md', href: '#about', meta: 'file' },
        ] },
      ]} />
    </div></section>
  );
}

function WorkScreen({ go }) {
  const [filter, setFilter] = React.useState('all');
  const rows = filter === 'all' ? D.work : D.work.filter(w => w.category === filter);
  return (
    <section style={pageStyle}><div className="container">
      <PageHeader title="work/" description={D.work.length + ' entries — projects, art, photography'} />
      <FilterBar options={['dev', 'art', 'photography']} value={filter} onChange={setFilter} />
      <DirListHeader columns={['type', 'date', 'name', 'description', '']} cols="var(--work-cols)" />
      <div>
        {rows.map(w => (
          <div key={w.slug} onClick={(e) => { e.preventDefault(); go('work/' + w.slug); }}>
            <WorkRow slug={w.slug} category={w.category} date={w.date} description={w.description} href={'#work/' + w.slug} />
          </div>
        ))}
      </div>
    </div></section>
  );
}

const navLink = { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', minWidth: 0, padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' };
const navDir = { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' };
const navTitle = { fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

function WorkDetailScreen({ slug, go }) {
  const sorted = D.work;
  const at = Math.max(0, sorted.findIndex(w => w.slug === slug));
  const entry = sorted[at] || sorted[2];
  const newer = at > 0 ? sorted[at - 1] : null;
  const older = at < sorted.length - 1 ? sorted[at + 1] : null;
  const [lb, setLb] = React.useState(null);
  const images = (entry.images || []).map((src, i) => ({ src, alt: entry.title + ' ' + (i + 1), caption: entry.title }));
  return (
    <article style={pageStyle}><div className="container container-narrow">
      <header style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}><Tag kind={entry.category}>{entry.category}</Tag></div>
        <h1 style={{ fontSize: 'var(--font-size-page-title)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-3)' }}>{entry.title}</h1>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--space-4)' }}>{entry.description}</p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          <time style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', fontVariantNumeric: 'tabular-nums' }}>{entry.date}</time>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>{(entry.tags || []).map(t => <Tag key={t} chip>{t}</Tag>)}</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="primary" href="#">view live →</Button>
          <Button variant="secondary" href="#">source →</Button>
        </div>
      </header>
      {entry.cover && <div style={{ border: '1px solid var(--color-border)', marginBottom: 'var(--space-6)' }}><img src={entry.cover} alt={entry.title} style={{ width: '100%' }} /></div>}
      <div style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--space-8)' }}>
        {(entry.body || [entry.description]).map((p, i) => <p key={i} style={{ marginBottom: 'var(--space-4)' }}>{p}</p>)}
      </div>
      {images.length > 0 && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
          <h2 style={sectionLabel}>gallery/</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 'var(--space-3)' }}>
            {images.map((img, i) => (
              <figure key={img.src} style={{ margin: 0, border: '1px solid var(--color-border)' }}>
                <img src={img.src} alt={img.alt} style={{ width: '100%', cursor: 'pointer' }} onClick={() => setLb(i)} />
                <figcaption style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>{img.alt}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
      <nav style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }} aria-label="More work">
        {newer
          ? <a href={'#work/' + newer.slug} style={navLink}><span style={navDir}>← newer</span><span style={navTitle}>{newer.title}</span></a>
          : <span />}
        {older
          ? <a href={'#work/' + older.slug} style={{ ...navLink, textAlign: 'right' }}><span style={navDir}>older →</span><span style={navTitle}>{older.title}</span></a>
          : <span />}
      </nav>
      <Lightbox open={lb !== null} items={images} index={lb || 0} onClose={() => setLb(null)} onNavigate={(d) => setLb(v => (v + d + images.length) % images.length)} />
    </div></article>
  );
}

function PhotosScreen({ go }) {
  const [dots, setDots] = React.useState([]);
  const [hovered, setHovered] = React.useState(null);
  React.useEffect(() => { fetch('../../assets/world-dots.json').then(r => r.json()).then(setDots); }, []);
  const frames = D.rolls.reduce((n, r) => n + r.frames, 0);
  return (
    <section style={pageStyle}><div className="container">
      <PageHeader title="photos/" description={D.rolls.length + ' rolls — ' + frames + ' frames · ' + D.pins.length + ' locations'} />
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={sectionLabel}>map/</h2>
        <WorldMap dots={dots} pins={D.pins} activeSlug={hovered} onPinHover={(p) => setHovered(p ? p.slugs[0] : null)} />
      </div>
      <h2 style={sectionLabel}>rolls/</h2>
      <DirListHeader columns={['film', 'date', 'roll', 'location', '']} cols="var(--roll-cols)" />
      <div>
        {D.rolls.map(r => (
          <div key={r.slug} onMouseEnter={() => setHovered(r.slug)} onMouseLeave={() => setHovered(null)} onClick={(e) => { e.preventDefault(); go('photos/' + r.slug); }}>
            <RollRow {...r} active={hovered === r.slug} href={'#photos/' + r.slug} />
          </div>
        ))}
      </div>
    </div></section>
  );
}

function RollScreen({ slug }) {
  const roll = D.rolls.find(r => r.slug === slug) || D.rolls[0];
  const [lb, setLb] = React.useState(null);
  const frames = D.frames;
  return (
    <article style={pageStyle}><div className="container">
      <header style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}><Tag kind={roll.stockType}>{roll.stock}</Tag></div>
        <h1 style={{ fontSize: 'var(--font-size-page-title)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-3)' }}>{roll.title}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          <time style={{ fontVariantNumeric: 'tabular-nums' }}>{roll.date}</time><span aria-hidden="true">·</span>
          <span>{roll.location}</span><span aria-hidden="true">·</span><span style={{ whiteSpace: 'nowrap' }}>{roll.frames} frames</span>
        </div>
      </header>
      <h2 style={sectionLabel}>contact-sheet/</h2>
      <FilmStrip photos={frames} stockName={roll.stock} stockType={roll.stockType} startFrame={1} onSelect={setLb} />
      <FilmStrip photos={frames} stockName={roll.stock} stockType={roll.stockType} startFrame={7} onSelect={setLb} />
      <FilmStrip photos={frames.slice(0, 4)} stockName={roll.stock} stockType={roll.stockType} startFrame={13} onSelect={setLb} />
      <Lightbox open={lb !== null} items={frames} index={lb || 0} onClose={() => setLb(null)} onNavigate={(d) => setLb(v => (v + d + frames.length) % frames.length)} />
    </div></article>
  );
}

function TravelScreen() {
  // Public view is deliberately reduced: no future or tentative stops, and no dates
  // anywhere. Forward itinerary and exact dates live behind auth in the admin kit.
  const [tab, setTab] = React.useState('route');
  const [trip, setTrip] = React.useState(null);
  const [focus, setFocus] = React.useState(null);
  React.useEffect(() => { fetch('../../assets/trips.json').then(r => r.json()).then(setTrip); }, []);

  const tabs = ['stats', 'route', 'timeline'];
  const btn = (active) => ({
    flex: 'none', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)',
    color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
    background: 'var(--color-bg-secondary)',
    border: '1px solid ' + (active ? 'var(--color-accent-primary)' : 'var(--color-border)'),
    boxShadow: active ? 'var(--shadow-hard-accent)' : 'none', font: 'inherit', cursor: 'pointer',
  });
  const chip = (status) => ({
    padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-xs)', font: 'inherit',
    background: 'var(--color-bg-secondary)', cursor: 'pointer', flex: 'none', whiteSpace: 'nowrap',
    color: status === 'current' ? 'var(--color-accent-tertiary)' : 'var(--color-text-muted)',
    border: '1px solid ' + (status === 'current' ? 'var(--color-accent-tertiary)' : 'var(--color-border)'),
  });

  if (!trip) return <div style={pageStyle}><div className="container"><p style={{ color: 'var(--color-text-muted)' }}>loading journey…</p></div></div>;

  const now = Date.now();
  const all = trip.stops;
  const allStatuses = all.map(st => window.statusOf(st, now));
  // Everything the public page can see: travelled stops plus wherever I am right now.
  const stops = all.filter((st, i) => allStatuses[i] !== 'future' && !st.tentative);
  const statuses = stops.map(st => window.statusOf(st, now));
  const currentIndex = statuses.indexOf('current');
  const current = stops[currentIndex] || stops[stops.length - 1];
  const day = window.dayCount(all[0].arrive, new Date().toISOString().slice(0, 10));
  const countries = new Set(stops.map(st => st.country)).size;
  const years = [...new Set(stops.map(st => st.arrive.slice(0, 4)))];

  return (
    <div style={pageStyle}><div className="container">
      <PageHeader title="travel/" description="Places I've been, in order — no dates, no onward plans." />
      <p style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', margin: '0 0 var(--space-4)', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-accent-primary)', fontSize: 'var(--font-size-sm)' }}>
        <span className="travel-pulse" style={{ width: 7, height: 7, flex: 'none', background: 'var(--color-accent-primary)' }} />
        day <b style={{ color: 'var(--color-text-primary)' }}>{day}</b> — {currentIndex >= 0 ? 'in' : 'last seen in'} <b style={{ color: 'var(--color-text-primary)' }}>{current.name}</b>, {current.country}
      </p>
      <nav role="tablist" style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2) 0', overflowX: 'auto' }}>
        {tabs.map(x => <button key={x} type="button" role="tab" aria-selected={tab === x} style={btn(tab === x)} onClick={() => setTab(x)}>{x}/</button>)}
      </nav>

      <div style={{ marginTop: 'var(--space-6)' }}>
        {tab === 'stats' && (<div>
          <StatGrid columns={3}>
            <Stat value={day} label="days on the road" />
            <Stat value={stops.length} label="stops so far" />
            <Stat value={countries} label="countries" />
          </StatGrid>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2) var(--space-4)', marginTop: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ borderBottom: '1px dotted var(--color-border-strong)' }}>started in <b style={{ color: 'var(--color-text-secondary)' }}>{all[0].name}</b>, {all[0].country}</span>
            <span style={{ borderBottom: '1px dotted var(--color-border-strong)' }}>{currentIndex >= 0 ? 'currently in ' : 'last seen in '}<b style={{ color: 'var(--color-text-secondary)' }}>{current.name}</b></span>
            <span style={{ borderBottom: '1px dotted var(--color-border-strong)' }}>heading roughly west — next stops go up once I'm there</span>
          </div>
        </div>)}

        {tab === 'route' && (<div>
          <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Where I've been, in order, and where I am now. Onward plans aren't published.</p>
          <TravelMap stops={stops} layers={{ travelled: true, planned: false }} focus={focus} onFocusHandled={() => setFocus(null)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginTop: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            {[['been there', 'var(--color-accent-primary)'], ['here now', 'var(--color-accent-tertiary)']].map(([l, c]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}><i style={{ width: 8, height: 8, background: c }} />{l}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', paddingBottom: 'var(--space-2)', overflowX: 'auto' }}>
            {stops.map((st, i) => (
              <button key={st.name + i} type="button" style={chip(statuses[i])} onClick={() => setFocus(i)}>{st.name}</button>
            ))}
          </div>
        </div>)}

        {tab === 'timeline' && (<div style={{ borderTop: '1px solid var(--color-border)' }}>
          {years.map(year => (
            <div key={year}>
              <div style={{ padding: 'var(--space-3) 0 var(--space-2)', color: 'var(--color-accent-primary)', fontSize: 'var(--font-size-xs)', letterSpacing: '0.12em' }}>{year}</div>
              {stops.map((st, i) => (st.arrive.slice(0, 4) === year ? (
                <div key={st.name + i} style={{ display: 'grid', gridTemplateColumns: '10rem 1fr', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)', borderRight: '3px solid ' + (statuses[i] === 'current' ? 'var(--color-accent-tertiary)' : 'var(--color-accent-primary)'), fontSize: 'var(--font-size-xs)', textAlign: 'right' }}>
                    {st.country}
                  </span>
                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{st.name}</strong>
                    {statuses[i] === 'current' && <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-accent-tertiary)', fontSize: 'var(--font-size-xs)' }}>here now</span>}
                  </div>
                </div>
              ) : null))}
            </div>
          ))}
          <p style={{ margin: 'var(--space-4) 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>// no dates published — places appear once I've left them</p>
        </div>)}
      </div>
    </div></div>
  );
}

function AboutScreen() {
  return (
    <section style={pageStyle}><div className="container">
      <PageHeader title="about.md" />
      <div style={{ maxWidth: 'var(--container-narrow)', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
        <div style={{ padding: 'var(--space-6)' }}>
          <p style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            My name is <span style={{ color: 'var(--color-accent-primary)', fontWeight: 'var(--font-weight-medium)' }}>beek</span>. I'm a creative and tech guy based in Australia. I enjoy messing around with technical projects and creating art, sometimes the two intersect.
          </p>
          <p style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Links: <a href="#">github</a>, <a href="#">instagram</a>
          </p>
        </div>
      </div>
    </div></section>
  );
}

function NotFoundScreen() {
  return (
    <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', padding: 'var(--space-16) 0' }}><div className="container">
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: '5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-accent-primary)', lineHeight: 1, marginBottom: 'var(--space-3)' }}>404</h1>
        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>file not found</p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>The page you're looking for doesn't exist. Maybe you imagined it?</p>
        <Button variant="quiet" href="#">&gt; home</Button>
      </div>
    </div></section>
  );
}

Object.assign(window, { HomeScreen, WorkScreen, WorkDetailScreen, PhotosScreen, RollScreen, TravelScreen, AboutScreen, NotFoundScreen });
