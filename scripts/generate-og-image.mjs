// Generates public/og-image.png (1200x630) in the site's terminal aesthetic.
// usage: node scripts/generate-og-image.mjs
import sharp from 'sharp';

const W = 1200;
const H = 630;

// 24px grid lines mirror the site's body::before texture
const gridLines = [];
for (let x = 24; x < W; x += 24) {
  gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#333333" stroke-width="1" opacity="0.15"/>`);
}
for (let y = 24; y < H; y += 24) {
  gridLines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#333333" stroke-width="1" opacity="0.15"/>`);
}

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#0c0c0c"/>
  ${gridLines.join('\n  ')}
  <rect x="60" y="60" width="${W - 120}" height="${H - 120}" fill="#141414" stroke="#333333" stroke-width="2"/>
  <rect x="66" y="66" width="${W - 120}" height="${H - 120}" fill="none" stroke="#555555" stroke-width="2"/>
  <text x="120" y="180" font-family="monospace" font-size="36" fill="#33ff66">~/beek</text>
  <text x="120" y="320" font-family="monospace" font-size="110" font-weight="bold">
    <tspan fill="#555555">[</tspan><tspan fill="#e8e8e8">beek</tspan><tspan fill="#555555">]</tspan>
  </text>
  <text x="120" y="410" font-family="monospace" font-size="38" fill="#999999">tech guy &amp; creative</text>
  <text x="120" y="500" font-family="monospace" font-size="30">
    <tspan fill="#66ccff">dev</tspan><tspan fill="#555555"> / </tspan><tspan fill="#ffaa00">art</tspan><tspan fill="#555555"> / </tspan><tspan fill="#33ff66">photography</tspan>
  </text>
  <text x="120" y="560" font-family="monospace" font-size="24" fill="#555555">bjsmith.xyz</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ palette: true }).toFile('public/og-image.png');
console.log('wrote public/og-image.png');
