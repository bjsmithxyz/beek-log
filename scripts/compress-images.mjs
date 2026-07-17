// One-time/idempotent compression of source images.
// Resizes anything over MAX_EDGE on its long edge and palette-quantizes PNGs
// (libimagequant, same engine as pngquant). Overwrites in place only when the
// result is smaller; originals remain in git history.
//
// usage: node scripts/compress-images.mjs [dir]
import sharp from 'sharp';
import { readdir, stat, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { MAX_EDGE } from '../src/data/images.ts';

const dir = process.argv[2] ?? 'src/assets/images';

let before = 0;
let after = 0;

for (const file of (await readdir(dir)).sort()) {
  if (!/\.png$/i.test(file)) continue;
  const path = join(dir, file);
  const tmp = `${path}.tmp`;
  const { size: origSize } = await stat(path);
  before += origSize;

  const img = sharp(path, { limitInputPixels: false });
  const meta = await img.metadata();
  await img
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .png({ palette: true, quality: 80, effort: 10, compressionLevel: 9 })
    .toFile(tmp);

  const { size: newSize } = await stat(tmp);
  if (newSize < origSize) {
    await rename(tmp, path);
    after += newSize;
    console.log(
      `${file}: ${(origSize / 1e6).toFixed(1)}MB -> ${(newSize / 1e6).toFixed(1)}MB` +
      ` (${meta.width}x${meta.height})`
    );
  } else {
    await unlink(tmp);
    after += origSize;
    console.log(`${file}: kept original (${(origSize / 1e6).toFixed(1)}MB)`);
  }
}

console.log(`\ntotal: ${(before / 1e6).toFixed(0)}MB -> ${(after / 1e6).toFixed(0)}MB`);
