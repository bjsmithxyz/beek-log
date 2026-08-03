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
  const nav = document.querySelector('main nav[aria-label="Breadcrumb"]');
  assert.ok(nav, 'page must contain a breadcrumb navigation landmark');

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
