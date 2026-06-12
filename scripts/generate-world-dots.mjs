// Regenerates src/data/world-dots.json — the land-mask dot grid behind
// the photos-index world map. Samples a public-domain equirectangular world
// image (e.g. Wikimedia "Equirectangular_projection_SW.jpg") and classifies
// land as red-channel > blue-channel (oceans are blue).
//
// usage: node scripts/generate-world-dots.mjs <world-equirect.jpg>
// Prints an ASCII preview — eyeball the continents before committing.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/generate-world-dots.mjs <world-equirect-image>');
  process.exit(1);
}

const COLS = 120;
const ROWS = 60;

const { data, info } = await sharp(src)
  .resize(COLS, ROWS, { fit: 'fill' })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const rows = [];
for (let y = 0; y < ROWS; y++) {
  let row = '';
  for (let x = 0; x < COLS; x++) {
    const i = (y * info.width + x) * 3;
    row += data[i] > data[i + 2] ? '1' : '0';
  }
  rows.push(row);
}

console.log(rows.map((r) => r.replaceAll('1', '#').replaceAll('0', '.')).join('\n'));
writeFileSync('src/data/world-dots.json', JSON.stringify(rows));
console.log('\nwrote src/data/world-dots.json');
