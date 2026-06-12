// Film stocks shot so far. Slugs are hand-written (Cyrillic/punctuation in
// display names doesn't auto-slugify well); display names stay verbatim.
// `type` drives the film-edge marking colour on contact sheets: colour
// negative edge print is orange, B&W rebate text is grey.
export interface FilmStock {
  name: string;
  type: 'color' | 'bw';
}

export const filmStocks = {
  'fujifilm-neopan-100': { name: 'fujufulm neopan 100', type: 'bw' },
  'kodak-color-200': { name: 'kodak color 200', type: 'color' },
  'kentmere-400': { name: 'kentmere 400', type: 'bw' },
  'kodak-ultramax-400': { name: 'kodak ultramax 400', type: 'color' },
  'kodak-portra-400': { name: 'kodak portra 400', type: 'color' },
  'kodak-colorplus-200': { name: 'kodak colorplus 200', type: 'color' },
  '1hundred-800': { name: '1Hundred 800', type: 'color' },
  'kodak-gold-200': { name: 'Kodak Gold 200', type: 'color' },
  'rollei-rpx-400': { name: 'Rollei RPX 400', type: 'bw' },
  'kodacolour-200': { name: 'Kodacolour 200', type: 'color' },
  'ilford-bw-400': { name: 'Ilford B&W 400', type: 'bw' },
  'lomochrome-color-92': { name: "LomoChrome Color '92", type: 'color' },
  'fujifilm-400': { name: 'Fujifilm 400', type: 'color' },
  'bol-250d': { name: 'Боль 250D', type: 'color' },
  'lucky-200': { name: 'Lucky 200', type: 'color' },
  'fotometa-escura-400': { name: 'Fotometa x Escura 400', type: 'bw' },
} satisfies Record<string, FilmStock>;

export type FilmStockSlug = keyof typeof filmStocks;
