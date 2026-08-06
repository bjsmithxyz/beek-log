import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollPublication } from '../src/server/roll-publish.mjs';

const M = 'a'.repeat(40);
const A = 'b'.repeat(40);
const B = 'c'.repeat(40);
const C = 'd'.repeat(40);
const requestId = '123e4567-e89b-42d3-a456-426614174000';
const slug = '2026-08-kodak-portra-400-london';
const imagePath = (value, number) => `src/assets/photos/${value}/${String(number).padStart(3, '0')}.jpg`;
const source = {
  slug,
  markdownSha: M,
  frames: [
    { path: imagePath(slug, 1), sha: A },
    { path: imagePath(slug, 2), sha: B },
  ],
};
const location = {
  name: 'London', lat: 51.5072, lng: -0.1276,
  region: { name: 'United Kingdom', lat: 54, lng: -2 },
};
const roll = {
  slug,
  title: 'London',
  stock: 'kodak-portra-400',
  date: '2026-08-02',
  location,
  draft: true,
  body: 'A test roll.',
  frames: [
    { blobSha: A, alt: '', location },
    { blobSha: B, alt: 'Street', caption: 'Evening.' },
  ],
};

test('create maps pre-uploaded image blobs and Markdown to guarded create operations', () => {
  const publication = rollPublication({ requestId, mode: 'create', roll });
  assert.equal(publication.input.operations.length, 3);
  assert.deepEqual(publication.input.operations.slice(0, 2), [
    { action: 'create', path: imagePath(slug, 1), blobSha: A },
    { action: 'create', path: imagePath(slug, 2), blobSha: B },
  ]);
  const markdown = publication.input.operations[2];
  assert.equal(markdown.action, 'create');
  assert.equal(markdown.path, `src/content/photos/${slug}.md`);
  assert.match(markdown.content, /title: London/);
  assert.match(markdown.content, new RegExp(`src: \.\./\.\./assets/photos/${slug}/001\.jpg`));
  assert.match(markdown.content, /draft: true/);
});

test('same-slug edit reorders blobs against target SHAs in one operation set', () => {
  const edited = { ...roll, frames: [
    { blobSha: B, alt: 'second first' },
    { blobSha: A, alt: 'first second' },
    { blobSha: C, alt: 'new' },
  ] };
  const publication = rollPublication({ requestId, mode: 'edit', source, roll: edited });
  assert.deepEqual(publication.input.operations.slice(0, 3), [
    { action: 'update', path: imagePath(slug, 1), expectedSha: A, blobSha: B },
    { action: 'update', path: imagePath(slug, 2), expectedSha: B, blobSha: A },
    { action: 'create', path: imagePath(slug, 3), blobSha: C },
  ]);
  assert.equal(publication.input.operations.at(-1).action, 'update');
  assert.equal(publication.input.operations.at(-1).expectedSha, M);
});

test('edit with fewer frames deletes the unused tail', () => {
  const publication = rollPublication({
    requestId, mode: 'edit', source, roll: { ...roll, frames: [{ blobSha: A, alt: '' }] },
  });
  assert.deepEqual(publication.input.operations[1], {
    action: 'delete', path: imagePath(slug, 2), expectedSha: B,
  });
});

test('slug rename creates the complete new roll then deletes the old paths', () => {
  const renamed = '2026-08-kodak-portra-400-paris';
  const publication = rollPublication({
    requestId, mode: 'edit', source, roll: { ...roll, slug: renamed },
  });
  const operations = publication.input.operations;
  assert.equal(operations.filter((operation) => operation.action === 'create').length, 3);
  assert.deepEqual(operations.slice(-3), [
    { action: 'delete', path: `src/content/photos/${slug}.md`, expectedSha: M },
    { action: 'delete', path: imagePath(slug, 1), expectedSha: A },
    { action: 'delete', path: imagePath(slug, 2), expectedSha: B },
  ]);
});

test('delete removes Markdown and every inventoried frame', () => {
  const publication = rollPublication({ requestId, mode: 'delete', source });
  assert.equal(publication.input.operations.length, 3);
  assert.equal(publication.input.operations.every((operation) => operation.action === 'delete'), true);
});

test('inventory verifier refuses an omitted source frame and occupied create target', () => {
  const edit = rollPublication({ requestId, mode: 'edit', source, roll });
  const missing = new Map([
    [`src/content/photos/${slug}.md`, M],
    [imagePath(slug, 1), A],
  ]);
  assert.throws(() => edit.policy.verifyCurrent(missing), /inventory changed/);

  const create = rollPublication({ requestId, mode: 'create', roll });
  assert.throws(() => create.policy.verifyCurrent(new Map([
    [`src/content/photos/${slug}.md`, M],
  ])), /already exists/);
});

test('strict roll input rejects unknown fields, bad inventories and invalid regions', () => {
  assert.throws(() => rollPublication({ requestId, mode: 'create', roll: { ...roll, unknown: true } }), /unknown/);
  assert.throws(() => rollPublication({
    requestId, mode: 'edit',
    source: { ...source, frames: [{ path: 'src/assets/photos/wrong/001.jpg', sha: A }] },
    roll,
  }), /inventory/);
  assert.throws(() => rollPublication({
    requestId, mode: 'create',
    roll: { ...roll, location: { ...location, region: { ...location.region, lat: 100 } } },
  }), /region/);
  assert.throws(() => rollPublication({
    requestId, mode: 'create', roll: { ...roll, date: '2026-02-31' },
  }), /date/);
  assert.throws(() => rollPublication({
    requestId, mode: 'create',
    roll: { ...roll, title: 'Hello\n\nCo-authored-by: evil <e@e.com>' },
  }), /title/);
});
