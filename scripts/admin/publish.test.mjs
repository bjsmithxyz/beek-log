import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { writeRollFiles } from './publish.mjs';
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
