// Regenerates src/data/world-dots.json — the land-mask dot grid behind
// the photos-index world map. Samples a public-domain equirectangular world
// image (e.g. Wikimedia "Equirectangular_projection_SW.jpg") and classifies
// a cell as ocean only when it is clearly blue (blue-channel > red-channel);
// everything else — including Antarctica's white ice — is land.
//
// usage: node scripts/generate-world-dots.mjs <world-equirect.jpg> [cols] [rows]
// Prints an ASCII preview — eyeball the continents before committing.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/generate-world-dots.mjs <world-equirect-image> [cols] [rows]');
  process.exit(1);
}

const COLS = Number(process.argv[3]) || 360;
const ROWS = Number(process.argv[4]) || 180;

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
    // ocean = clearly blue (blue > red); land otherwise (incl. white ice caps)
    row += data[i + 2] > data[i] ? '0' : '1';
  }
  rows.push(row);
}

// The source image's top and left edges are thin light strips that classify as
// land. 90°N is open Arctic Ocean and the -180° column is mid-Pacific, so force
// the north-pole row and the west-edge column to ocean.
rows[0] = '0'.repeat(COLS);
for (let y = 0; y < ROWS; y++) rows[y] = '0' + rows[y].slice(1);

console.log(rows.map((r) => r.replaceAll('1', '#').replaceAll('0', '.')).join('\n'));
writeFileSync('src/data/world-dots.json', JSON.stringify(rows));
console.log('\nwrote src/data/world-dots.json');
