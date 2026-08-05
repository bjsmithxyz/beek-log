const AA = window.BjsmithXyzDesignSystem_042b50;

function AdminApp() {
  const [signedIn, setSignedIn] = React.useState(false);
  const [hash, setHash] = React.useState(() => (location.hash || '#').slice(1));
  const [theme, setTheme] = React.useState('dark');
  React.useEffect(() => {
    const onHash = () => setHash((location.hash || '#').slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const go = (r) => { if (r === 'login') { setSignedIn(false); location.hash = ''; } else { location.hash = '#' + r; } };
  const route = signedIn ? hash : 'login';

  const crumbs = route === 'login'
    ? [{ label: '~/admin', href: '#' }, { label: 'sign-in', href: '#' }]
    : [{ label: '~/admin', href: '#' }].concat(route ? [{ label: route, href: '#' }] : []);

  let screen;
  if (route === 'login') screen = <LoginScreen go={() => { setSignedIn(true); location.hash = ''; }} />;
  else if (route === 'rolls') screen = <RollsIndex go={go} />;
  else if (route === 'new') screen = <RollEditor mode="create" go={go} />;
  else if (route === 'edit') screen = <RollEditor mode="edit" go={go} />;
  else if (route === 'travel') screen = <TravelAdmin />;
  else screen = <AdminIndex go={go} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ display: 'flex', height: 'var(--breadcrumb-row-height)', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <AA.Breadcrumb row={false} items={crumbs} />
        {route !== 'login' && <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>beek · <a href="#" onClick={(e) => { e.preventDefault(); go('login'); }}>sign out</a></span>}
      </div>
      <main style={{ flex: 1 }}>{screen}</main>
      <AA.Footer links={[]} tagline="// admin.bjsmith.xyz" theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp />);
