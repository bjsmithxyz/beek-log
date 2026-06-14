// Terminal-aesthetic Open Graph card (1200x630), shared by the per-page OG
// endpoint. Same palette / grid / double-frame as scripts/generate-og-image.mjs.
import sharp from 'sharp';

const W = 1200;
const H = 630;

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Monospace word-wrap. ~22 chars fit at 60px across the usable width; cap at
// two lines and ellipsize the overflow so long titles never collide with the
// subtitle/footer.
function wrap(text: string, max = 22, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (!line) line = w;
    else if ((line + ' ' + w).length <= max) line += ' ' + w;
    else {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  const rendered = lines.join(' ');
  if (rendered.length < text.trim().length) {
    let last = lines[lines.length - 1] ?? '';
    if (last.length > max - 1) last = last.slice(0, max - 1).replace(/\s+\S*$/, '');
    lines[lines.length - 1] = last + '…';
  }
  return lines;
}

export interface OgCardOptions {
  eyebrow: string; // e.g. "~/beek/work"
  title: string;
  subtitle?: string; // e.g. "[dev] · 2025"
  accent?: string; // eyebrow colour
}

export function ogCardSvg({ eyebrow, title, subtitle = '', accent = '#33ff66' }: OgCardOptions): string {
  const grid: string[] = [];
  for (let x = 24; x < W; x += 24)
    grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#333333" stroke-width="1" opacity="0.15"/>`);
  for (let y = 24; y < H; y += 24)
    grid.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#333333" stroke-width="1" opacity="0.15"/>`);

  const titleStartY = 310;
  const lineH = 76;
  const titleLines = wrap(title);
  const titleText = titleLines
    .map(
      (ln, i) =>
        `<text x="120" y="${titleStartY + i * lineH}" font-family="monospace" font-size="60" font-weight="bold" fill="#e8e8e8">${esc(ln)}</text>`,
    )
    .join('\n  ');
  const subY = titleStartY + titleLines.length * lineH + 14;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#0c0c0c"/>
  ${grid.join('\n  ')}
  <rect x="60" y="60" width="${W - 120}" height="${H - 120}" fill="#141414" stroke="#333333" stroke-width="2"/>
  <rect x="66" y="66" width="${W - 120}" height="${H - 120}" fill="none" stroke="#555555" stroke-width="2"/>
  <text x="120" y="180" font-family="monospace" font-size="32" fill="${accent}">${esc(eyebrow)}</text>
  ${titleText}
  ${subtitle ? `<text x="120" y="${subY}" font-family="monospace" font-size="30" fill="#999999">${esc(subtitle)}</text>` : ''}
  <text x="120" y="560" font-family="monospace" font-size="24" fill="#555555">bjsmith.xyz</text>
</svg>`;
}

export async function ogCardPng(opts: OgCardOptions): Promise<Buffer> {
  return sharp(Buffer.from(ogCardSvg(opts))).png({ palette: true }).toBuffer();
}
