import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { writeRollFiles, checkGitHubAuth } from './publish.mjs';
import { parseRollMarkdown } from './lib.mjs';

async function makeImage(path, color) {
  await sharp({ create: { width: 100, height: 100, channels: 3, background: color } })
    .jpeg().toFile(path);
}

test('writeRollFiles processes new frames, numbers them, writes .md', async () => {
  const root = await mkdtemp(join(tmpdir(), 'roll-'));
  const srcDir = join(root, 'scans');
  await mkdir(srcDir, { recursive: true });
  await mkdir(join(root, 'src/content/photos'), { recursive: true });
  await makeImage(join(srcDir, 'a.jpg'), '#ff0000');
  await makeImage(join(srcDir, 'b.jpg'), '#00ff00');

  const meta = {
    title: 't', stock: 'kodak-portra-400', date: '2026-06-02',
    location: { name: 'Lisbon, Portugal', lat: 38.7, lng: -9.1 }, draft: true,
  };
  const res = await writeRollFiles({
    repoRoot: root,
    slug: '2026-06-test',
    meta,
    body: '',
    frames: [
      { srcPath: join(srcDir, 'b.jpg'), alt: 'second' },
      { srcPath: join(srcDir, 'a.jpg'), alt: 'first' },
    ],
  });

  assert.equal(res.frameCount, 2);
  const files = (await readdir(join(root, 'src/assets/photos/2026-06-test'))).sort();
  assert.deepEqual(files, ['001.jpg', '002.jpg']);

  const md = await readFile(join(root, 'src/content/photos/2026-06-test.md'), 'utf8');
  const { data } = parseRollMarkdown(md);
  assert.equal(data.photos[0].alt, 'second');
  assert.equal(data.photos[0].src, '../../assets/photos/2026-06-test/001.jpg');

  await rm(root, { recursive: true, force: true });
});

test('writeRollFiles copies existing frames by number during an edit', async () => {
  const root = await mkdtemp(join(tmpdir(), 'roll-'));
  const photosDir = join(root, 'src/assets/photos/2026-06-edit');
  await mkdir(photosDir, { recursive: true });
  await mkdir(join(root, 'src/content/photos'), { recursive: true });
  await makeImage(join(photosDir, '001.jpg'), '#0000ff');
  const srcDir = join(root, 'scans');
  await mkdir(srcDir, { recursive: true });
  await makeImage(join(srcDir, 'new.jpg'), '#ffff00');

  const meta = {
    title: 't', stock: 'kodak-portra-400', date: '2026-06-02',
    location: { name: 'X', lat: 1, lng: 2 }, draft: true,
  };
  const res = await writeRollFiles({
    repoRoot: root, slug: '2026-06-edit', meta, body: '',
    frames: [
      { srcPath: join(srcDir, 'new.jpg'), alt: 'new' },
      { existing: 1, alt: 'kept' },
    ],
  });
  assert.equal(res.frameCount, 2);
  const files = (await readdir(photosDir)).sort();
  assert.deepEqual(files, ['001.jpg', '002.jpg']);

  await rm(root, { recursive: true, force: true });
});

test('writeRollFiles renames the slug during an edit, removing the old roll', async () => {
  const root = await mkdtemp(join(tmpdir(), 'roll-'));
  const oldDir = join(root, 'src/assets/photos/2026-06-old');
  await mkdir(oldDir, { recursive: true });
  await mkdir(join(root, 'src/content/photos'), { recursive: true });
  await makeImage(join(oldDir, '001.jpg'), '#0000ff');
  await writeFile(join(root, 'src/content/photos/2026-06-old.md'), 'x', 'utf8');

  const meta = {
    title: 't', stock: 'kodak-portra-400', date: '2026-06-02',
    location: { name: 'X', lat: 1, lng: 2 }, draft: true,
  };
  const res = await writeRollFiles({
    repoRoot: root, slug: '2026-06-new', sourceSlug: '2026-06-old', meta, body: '',
    frames: [{ existing: 1, alt: 'kept' }],
  });

  assert.equal(res.frameCount, 1);
  assert.deepEqual(res.removed, ['src/assets/photos/2026-06-old', 'src/content/photos/2026-06-old.md']);
  assert.deepEqual((await readdir(join(root, 'src/assets/photos/2026-06-new'))).sort(), ['001.jpg']);
  await assert.rejects(() => readdir(oldDir));

  await rm(root, { recursive: true, force: true });
});

// checkGitHubAuth classifies the result of the injected `run` (which mirrors
// node execFile semantics: resolves on exit 0, rejects otherwise with err.code
// = exit number, or 'ENOENT' when the gh binary is missing).
test('checkGitHubAuth: run resolves (exit 0) → authed', async () => {
  const r = await checkGitHubAuth({ run: async () => {} });
  assert.equal(r.ok, true);
  assert.equal(r.state, 'authed');
  assert.match(r.detail, /github\.com/);
});

test('checkGitHubAuth: non-zero exit → unauthed', async () => {
  const r = await checkGitHubAuth({
    run: async () => { const e = new Error('exit 1'); e.code = 1; throw e; },
  });
  assert.equal(r.ok, false);
  assert.equal(r.state, 'unauthed');
  assert.match(r.detail, /gh auth login/);
});

test('checkGitHubAuth: ENOENT (gh not installed) → gh-missing', async () => {
  const r = await checkGitHubAuth({
    run: async () => { const e = new Error('spawn gh ENOENT'); e.code = 'ENOENT'; throw e; },
  });
  assert.equal(r.ok, false);
  assert.equal(r.state, 'gh-missing');
  assert.match(r.detail, /gh not installed/);
});

test('checkGitHubAuth: other failure → error', async () => {
  const r = await checkGitHubAuth({
    run: async () => { throw new Error('weird'); },
  });
  assert.equal(r.ok, false);
  assert.equal(r.state, 'error');
  assert.match(r.detail, /weird/);
});
