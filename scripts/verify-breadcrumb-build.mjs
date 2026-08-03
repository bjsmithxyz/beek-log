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
assert.equal(home.querySelector('.site-chrome #theme-toggle'), null, 'theme toggle must not remain in the top toolbar');
const footerSecondary = home.querySelector('footer .footer-secondary');
assert.equal(footerSecondary?.firstElementChild?.id, 'theme-toggle', 'theme toggle must sit above the copyright');
assert.ok(footerSecondary?.firstElementChild?.classList.contains('social-link'), 'theme toggle must use the social icon style');
assert.ok(home.querySelector('footer a[aria-label="instagram"] svg.brand-icon path'));
assert.equal(home.querySelector('footer a[aria-label="instagram"] rect'), null, 'Instagram must use the sourced brand glyph, not the filled box icon');
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
const treeToggleLabels = [...siteIndex.querySelectorAll('[data-tree-toggle]')]
  .map((button) => button.querySelector(':scope > span:nth-child(2)')?.textContent?.trim());
assert.deepEqual(treeToggleLabels.slice(0, 5), ['beek/', 'work/', 'dev/', 'art/', 'photos/']);
assert.ok(treeToggleLabels.slice(5).every((label) => /^\d{4}\/$/.test(label || '')), 'photo subsections must be years');

const groupedWorkHrefs = ['tree-work-dev', 'tree-work-art']
  .flatMap((id) => [...siteIndex.querySelectorAll(`#${id} a`)].map((link) => link.getAttribute('href')))
  .sort();
const workHrefs = siteIndexHrefs.filter((href) => href?.startsWith('/work/') && href !== '/work/').sort();
assert.deepEqual(groupedWorkHrefs, workHrefs, 'dev and art subsections must contain every work entry once');
const groupedRollHrefs = [...siteIndex.querySelectorAll('[id^="tree-photos-"] a')]
  .map((link) => link.getAttribute('href'))
  .sort();
const rollHrefs = siteIndexHrefs.filter((href) => href?.startsWith('/photos/') && href !== '/photos/').sort();
assert.deepEqual(groupedRollHrefs, rollHrefs, 'year subsections must contain every photo roll once');
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
