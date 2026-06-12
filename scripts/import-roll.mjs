// Imports a developed film roll into the site.
// Resizes scans to <=2048px JPEG q80 and numbers them 001.jpg, 002.jpg, ...
// sharp strips all source metadata on output (including GPS) — capture
// date/location live in the roll's frontmatter instead.
//
// usage: node scripts/import-roll.mjs <roll-slug> <source-dir>
// then:  create src/content/photos/<roll-slug>.md (frontmatter is printed below)
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const [slug, srcDir] = process.argv.slice(2);
if (!slug || !srcDir) {
  console.error('usage: node scripts/import-roll.mjs <roll-slug> <source-dir>');
  process.exit(1);
}

const outDir = join('src/assets/photos', slug);
await mkdir(outDir, { recursive: true });

const files = (await readdir(srcDir))
  .filter((f) => /\.(jpe?g|png|tiff?|webp)$/i.test(f))
  .sort();
if (files.length === 0) {
  console.error(`no images found in ${srcDir}`);
  process.exit(1);
}

let frame = 0;
for (const file of files) {
  frame += 1;
  const out = join(outDir, `${String(frame).padStart(3, '0')}.jpg`);
  await sharp(join(srcDir, file))
    .rotate() // bake in EXIF orientation
    .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(out);
  console.log(`${file} -> ${out}`);
}

console.log(`\n${frame} frames imported. Now create src/content/photos/${slug}.md:\n`);
console.log(`---
title: ${slug}
stock: kodak-portra-400   # slug from src/data/film-stocks.ts
date: ${new Date().toISOString().slice(0, 10)}
location:
  name: City, Country
  lat: 0.0
  lng: 0.0
photos:
${Array.from({ length: frame }, (_, i) =>
  `  - src: ../../assets/photos/${slug}/${String(i + 1).padStart(3, '0')}.jpg\n    alt: describe frame ${i + 1}`
).join('\n')}
---

Roll notes go here (optional).`);
