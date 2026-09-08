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
    /<div class="breadcrumb-row admin-container">\s*<div class="breadcrumb-row-inner">\s*<Breadcrumb/,
    'breadcrumb must sit in the static top row',
  );
  assert.match(layout, /<Footer\s*\/>/, 'admin must render the shared footer');
  assert.match(layout, /id="main-content"/, 'main must be the skip-link target');

  assert.doesNotMatch(layout, /admin-chrome|admin-header/, 'sticky admin chrome must be gone');
  assert.doesNotMatch(
    layout,
    /<header[^>]*>[\s\S]*<Breadcrumb/,
    'breadcrumb must not be part of a page header',
  );
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

  // Values must agree, so both surfaces render the same single dark theme.
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
});

test('dark is the only theme — no toggle, no light palette, no data-theme switching', async () => {
  const css = await read('styles/global.css');
  const publicCss = await publicRead('styles/global.css');
  const adminLayout = await read('layouts/AdminLayout.astro');
  const baseLayout = await publicRead('layouts/BaseLayout.astro');
  const adminFooter = await read('components/Footer.astro');
  const publicFooter = await publicRead('components/Footer.astro');

  for (const source of [css, publicCss, adminLayout, baseLayout, adminFooter, publicFooter]) {
    assert.doesNotMatch(source, /data-theme=["']light["']/, 'no source may render a light theme');
    assert.doesNotMatch(source, /theme-toggle/, 'the theme toggle must not come back');
  }
  assert.match(adminLayout, /data-theme="dark"/, 'admin must hardcode the dark theme');
  assert.match(baseLayout, /data-theme="dark"/, 'public site must hardcode the dark theme');
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
  // The tree is the dashboard's content and the breadcrumb already names the
  // page, so it carries no title of its own — as on the public homepage.
  assert.doesNotMatch(dashboard, /<PageHeader/, 'dashboard must not repeat its own name as a title');
  assert.match(dashboard, /slot="chrome"[\s\S]*id="admin-logout"/, 'sign out must sit in the breadcrumb row');

  assert.match(tree, /aria-label="Admin index"/, 'tree must be labelled like the public site index');
  assert.match(tree, /class="tree-root"/, 'tree must render a root node');

  for (const marker of ['data-tree-toggle', 'data-tree-collapse', 'tree-prefix', 'tree-meta', 'tree-state']) {
    assert.match(tree, new RegExp(marker), `tree must use the shared ${marker} contract`);
  }

  assert.match(tree, /\[-\]/, 'expanded branches must show the collapse affordance');
  assert.match(tree, /\[\+\]/, 'collapsed branches must show the expand affordance');

  for (const href of ['/rolls/', '/rolls/new-roll/', '/travel/']) {
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
    ['pages/rolls/index.astro', 'rolls/'],
    ['pages/travel/index.astro', 'travel/'],
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
