const DSA = window.BjsmithXyzDesignSystem_042b50;

// Leaf labels match what the site index calls the same thing: directories keep a bare
// name, single-file routes keep their extension. The crumb is the path; the page title
// is the heading — on detail pages they differ on purpose (slug vs. real title).
const FILE_ROUTES = { about: 'about.md', 404: '404.html' };

function crumbsFor(route) {
  const [top, slug] = route.split('/');
  if (!top) return [{ label: '~', href: '#' }];
  const base = [{ label: '~/beek', href: '#' }];
  if (!slug) return base.concat([{ label: FILE_ROUTES[top] || top, href: '#' + top }]);
  return base.concat([{ label: top, href: '#' + top }, { label: slug + '.md', href: '#' + route }]);
}

function App() {
  const [route, setRoute] = React.useState(() => (location.hash || '#').slice(1));
  const [theme, setTheme] = React.useState('dark');
  React.useEffect(() => {
    const onHash = () => setRoute((location.hash || '#').slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const go = (r) => { location.hash = '#' + r; };
  const [top, slug] = route.split('/');

  let screen;
  if (top === 'work') screen = slug ? <WorkDetailScreen slug={slug} go={go} /> : <WorkScreen go={go} />;
  else if (top === 'photos') screen = slug ? <RollScreen slug={slug} /> : <PhotosScreen go={go} />;
  else if (top === 'travel') screen = <TravelScreen />;
  else if (top === 'about') screen = <AboutScreen />;
  else if (top === '404') screen = <NotFoundScreen />;
  else screen = <HomeScreen go={go} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <DSA.Breadcrumb items={crumbsFor(route)} />
      <main style={{ flex: 1 }}>{screen}</main>
      <DSA.Footer theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
