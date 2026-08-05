// Guards that the admin surface keeps the public site's page format.
// The admin renders on-demand (SSR), so this asserts the source contract
// rather than built HTML the way scripts/verify-breadcrumb-build.mjs does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const read = (relative) =>
  readFile(fileURLToPath(new URL(`../src/${relative}`, import.meta.url)), 'utf8');

const publicRead = (relative) =>
  readFile(fileURLToPath(new URL(`../../src/${relative}`, import.meta.url)), 'utf8');

test('admin layout uses the public page shell', async () => {
  const layout = await read('layouts/AdminLayout.astro');

  assert.match(layout, /class="skip-link"/, 'admin must expose a skip link');
  assert.match(layout, /<div class="page-wrapper">/, 'admin must use the shared page-wrapper shell');
  assert.match(
    layout,
    /<div class="breadcrumb-row admin-container">\s*<Breadcrumb/,
    'breadcrumb must sit in the static top row',
  );
  assert.match(layout, /<Footer user=\{user\} \/>/, 'admin must render the shared footer');
  assert.match(layout, /id="main-content"/, 'main must be the skip-link target');

  assert.doesNotMatch(layout, /admin-chrome|admin-header/, 'sticky admin chrome must be gone');
  assert.doesNotMatch(
    layout,
    /<header[^>]*>[\s\S]*<Breadcrumb/,
    'breadcrumb must not be part of a page header',
  );
});

// The two surfaces resolve the theme differently *on purpose*, and this test
// used to require otherwise. The public site is prerendered and grants
// script-src 'unsafe-inline', so it can bootstrap from localStorage before
// paint. The admin withholds 'unsafe-inline' — a deliberate hardening of the
// surface that holds GitHub tokens — which silently blocked the copied-over
// inline script and left the admin ignoring the stored preference on every
// load. Being SSR, the admin resolves it from a cookie instead.
test('the public site bootstraps its theme inline, before paint', async () => {
  const base = await publicRead('layouts/BaseLayout.astro');
  assert.match(
    base,
    /const theme = localStorage\.getItem\('theme'\) \|\| \(matchMedia\('\(prefers-color-scheme: light\)'\)\.matches \? 'light' : 'dark'\);/,
    'public bootstrap shape changed',
  );
});

test('the admin resolves its theme server-side, because its CSP blocks inline scripts', async () => {
  const layout = await read('layouts/AdminLayout.astro');
  const { ADMIN_CSP } = await import('../src/server/headers.mjs');

  assert.doesNotMatch(
    ADMIN_CSP.match(/script-src[^;]*/)?.[0] || '',
    /unsafe-inline/,
    'if the admin ever grants unsafe-inline, revisit this whole approach',
  );
  assert.doesNotMatch(layout, /<script\s+is:inline/, 'an inline script here would be blocked and silently do nothing');
  assert.match(layout, /Astro\.cookies\.get\('theme'\)/, 'admin must read the stored theme on the server');
  assert.match(layout, /data-theme=\{theme\}/, 'admin must render the resolved theme, not a fixed default');
  assert.match(layout, /name="theme-color"/, 'admin must set theme-color');

  const footer = await read('components/Footer.astro');
  assert.match(footer, /document\.cookie = /, 'the toggle must persist to the cookie the server reads');
  assert.match(footer, /localStorage\.getItem\('theme'\)/, 'a preference set before the cookie must carry over');
});

test('theme toggle lives in the admin footer, above the copyright', async () => {
  const footer = await read('components/Footer.astro');

  const secondary = footer.slice(footer.indexOf('<div class="footer-secondary">'));
  const toggleAt = secondary.indexOf('id="theme-toggle"');
  const copyrightAt = secondary.indexOf('class="copyright"');

  assert.ok(toggleAt > -1, 'footer must own the theme toggle');
  assert.ok(copyrightAt > -1, 'footer must render the copyright');
  assert.ok(toggleAt < copyrightAt, 'theme toggle must sit above the copyright');
  assert.match(secondary, /class="social-link theme-toggle"/, 'toggle must use the social icon style');
  assert.match(footer, /class="icon-sun"[\s\S]*class="icon-moon"/, 'footer must ship both theme glyphs');
});

test('admin palette shares the public token vocabulary', async () => {
  const css = await read('styles/global.css');
  const publicCss = await publicRead('styles/global.css');

  const tokens = [
    '--color-bg-primary',
    '--color-bg-secondary',
    '--color-bg-tertiary',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-text-muted',
    '--color-accent-primary',
    '--color-accent-secondary',
    '--color-accent-tertiary',
    '--color-border',
    '--color-border-strong',
    '--shadow-hard',
    '--shadow-hard-accent',
    '--space-4',
    '--transition-fast',
    '--container-max',
  ];
  for (const token of tokens) {
    assert.match(css, new RegExp(`${token}:`), `admin must define ${token}`);
    assert.match(publicCss, new RegExp(`${token}:`), `public must still define ${token}`);
  }

  // Values must agree, so both surfaces render the same dark and light themes.
  const paletteOf = (source, selector) => {
    const block = source.slice(source.indexOf(selector));
    const body = block.slice(block.indexOf('{') + 1, block.indexOf('}'));
    return Object.fromEntries(
      [...body.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
    );
  };

  const adminDark = paletteOf(css, ':root');
  const publicDark = paletteOf(publicCss, ':root');
  for (const [name, value] of Object.entries(publicDark)) {
    assert.equal(adminDark[name], value, `dark ${name} must match the public palette`);
  }

  const adminLight = paletteOf(css, "[data-theme='light']");
  const publicLight = paletteOf(publicCss, '[data-theme="light"]');
  for (const [name, value] of Object.entries(publicLight)) {
    assert.equal(adminLight[name], value, `light ${name} must match the public palette`);
  }
});

test('admin shell chrome matches the public measurements', async () => {
  const css = await read('styles/global.css');

  assert.match(css, /\.breadcrumb-row \{[^}]*height: 56px/, 'breadcrumb row must keep the 56px rhythm');
  assert.match(css, /\.page-wrapper \{[^}]*flex-direction: column/, 'page-wrapper must stack the shell');
  assert.match(css, /\.footer \{[^}]*margin-top: auto/, 'footer must be pinned to the bottom');
  assert.doesNotMatch(css, /position: sticky/, 'admin must not reintroduce sticky chrome');
  assert.doesNotMatch(css, /\.tool-grid|\.tool-tile/, 'dashboard tiles must be gone');
});

test('admin dashboard renders a filesystem tree', async () => {
  const tree = await read('components/AdminTree.astro');
  const dashboard = await read('pages/index.astro');

  assert.match(dashboard, /<AdminTree user=\{user\.login\} \/>/, 'dashboard must render the admin tree');
  assert.match(dashboard, /<PageHeader title="index\/"/, 'dashboard must use the shared page title scale');

  assert.match(tree, /aria-label="Admin index"/, 'tree must be labelled like the public site index');
  assert.match(tree, /class="tree-root"/, 'tree must render a root node');

  for (const marker of ['data-tree-toggle', 'data-tree-collapse', 'tree-prefix', 'tree-meta', 'tree-state']) {
    assert.match(tree, new RegExp(marker), `tree must use the shared ${marker} contract`);
  }

  assert.match(tree, /\[-\]/, 'expanded branches must show the collapse affordance');
  assert.match(tree, /\[\+\]/, 'collapsed branches must show the expand affordance');

  for (const href of ['/rolls/', '/rolls/new/', '/travel/']) {
    assert.ok(tree.includes(`href="${href}"`), `admin tree must link to ${href}`);
  }
  assert.match(tree, /href=\{publicSite\}/, 'admin tree must link back to the public site');
});

test('admin pages use the shared page header contract', async () => {
  const header = await read('components/PageHeader.astro');
  assert.match(header, /class="page-header"/);
  assert.match(header, /<h1 class="page-title">\{title\}<\/h1>/);
  assert.match(header, /class="page-description"/);

  const pages = [
    ['pages/index.astro', 'index/'],
    ['pages/rolls/index.astro', 'film-rolls/'],
    ['pages/travel/index.astro', 'travel-editor/'],
  ];
  for (const [page, title] of pages) {
    const source = await read(page);
    assert.match(source, /import PageHeader from/, `${page} must import PageHeader`);
    assert.ok(source.includes(`title="${title}"`), `${page} must title the page ${title}`);
    assert.doesNotMatch(source, /class="page-head\b/, `${page} must not keep the retired page-head chrome`);
  }

  const editor = await read('components/RollEditor.astro');
  assert.match(editor, /<PageHeader title=\{mode === 'create' \? 'new-roll\/' : 'edit-roll\/'\}>/);
});
