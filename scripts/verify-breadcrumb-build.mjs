// Build-time guard for the public filesystem-style breadcrumb contract.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const dist = new URL('../dist/', import.meta.url).pathname;

async function documentAt(relativePath) {
  const html = await readFile(join(dist, relativePath), 'utf8');
  return new JSDOM(html).window.document;
}

function assertBreadcrumb(document, expected) {
  const nav = document.querySelector('.site-chrome > header nav[aria-label="Breadcrumb"]');
  assert.ok(nav, 'page must place its breadcrumb in the shared top toolbar');

  const links = [...nav.querySelectorAll('a')];
  assert.deepEqual(
    links.map((link) => link.textContent?.trim()),
    expected.map((item) => item.label),
    'breadcrumb labels must match the route contract',
  );
  assert.deepEqual(
    links.map((link) => link.getAttribute('href')),
    expected.map((item) => item.href),
    'breadcrumb links must match the route contract',
  );
  assert.equal(
    links.at(-1)?.getAttribute('aria-current'),
    'page',
    'current breadcrumb segment must use aria-current="page"',
  );
  assert.equal(
    links.slice(0, -1).some((link) => link.hasAttribute('aria-current')),
    false,
    'only the current breadcrumb segment may use aria-current',
  );

  assert.equal(document.querySelector('.prompt, .file-path, .back-link'), null);
}

const staticPages = [
  ['index.html', [{ label: '~', href: '/' }]],
  ['about/index.html', [
    { label: '~/beek', href: '/' },
    { label: 'about', href: '/about/' },
  ]],
  ['work/index.html', [
    { label: '~/beek', href: '/' },
    { label: 'work', href: '/work/' },
  ]],
  ['photos/index.html', [
    { label: '~/beek', href: '/' },
    { label: 'photos', href: '/photos/' },
  ]],
  ['travel/index.html', [
    { label: '~/beek', href: '/' },
    { label: 'travel', href: '/travel/' },
  ]],
  ['404.html', [
    { label: '~/beek', href: '/' },
    { label: '404', href: '/404.html' },
  ]],
];

for (const [relativePath, expected] of staticPages) {
  assertBreadcrumb(await documentAt(relativePath), expected);
}

const sectionTitles = [
  ['index.html', 'index/'],
  ['about/index.html', 'about.md'],
  ['work/index.html', 'work/'],
  ['photos/index.html', 'photos/'],
  ['travel/index.html', 'travel'],
];
for (const [relativePath, title] of sectionTitles) {
  const document = await documentAt(relativePath);
  assert.equal(document.querySelector('h1.page-title')?.textContent?.trim(), title, `${relativePath} must use the shared page-title scale`);
}

const home = await documentAt('index.html');
assert.doesNotMatch(home.body.textContent || '', /select a path or browse recent files|beek\/recent-(?:rolls|work)\//);
assert.equal(home.querySelector('.recent-content, section[aria-label="Recent photo rolls"], section[aria-label="Recent work"]'), null);
assert.equal(home.querySelector('.site-chrome > header a[href^="https://admin.bjsmith.xyz"]'), null, 'public toolbar must not duplicate the admin destination');
assert.equal(home.querySelector('.header-inner')?.lastElementChild?.querySelector('#theme-toggle')?.id, 'theme-toggle', 'theme toggle must be the rightmost toolbar control');
const siteIndex = home.querySelector('nav[aria-label="Site index"]');
assert.ok(siteIndex, 'homepage must expose a filesystem site index');
const siteIndexLinks = [...siteIndex.querySelectorAll('a')];
const siteIndexHrefs = siteIndexLinks.map((link) => link.getAttribute('href'));
for (const href of ['/', '/work/', '/photos/', '/travel/', '/about/']) {
  assert.ok(siteIndexHrefs.includes(href), `homepage file tree must link to ${href}`);
}
assert.ok(!siteIndexHrefs.includes('#recent'), 'homepage tree must not duplicate the recent-content section');
assert.deepEqual(
  siteIndexHrefs.filter((href) => href?.startsWith('https://admin.bjsmith.xyz')),
  ['https://admin.bjsmith.xyz/'],
  'admin must appear first as one unexpanded destination',
);
assert.deepEqual(
  [...siteIndex.querySelectorAll('[data-tree-toggle]')]
    .map((button) => button.textContent?.trim().replace(/^[├└]──\s*/, '')),
  ['beek/', 'work/', 'photos/'],
  'only branches with children should expose disclosure controls',
);
assert.equal(home.querySelector('header nav[aria-label="Main navigation"]'), null);

for (const section of ['work', 'photos']) {
  const entries = (await readdir(join(dist, section), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.ok(entries.length > 0, `${section} must contain at least one detail route`);

  const slug = entries[0];
  assertBreadcrumb(await documentAt(`${section}/${slug}/index.html`), [
    { label: '~/beek', href: '/' },
    { label: section, href: `/${section}/` },
    { label: `${slug}.md`, href: `/${section}/${slug}/` },
  ]);
}

console.log('breadcrumb build guard: ok');
