// Browser-safe slug helpers (no Node-only imports). Shared by lib.mjs and app.js.

// Cyrillic → Latin so non-Latin place/stock names produce valid slugs
// (the server requires slugs to match ^[a-z0-9-]+$).
const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'yi',
  є: 'ye', ґ: 'g', ў: 'w',
};

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (c) => CYRILLIC[c] ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function deriveSlug({ date, stockSlug, placeName }) {
  const ym = (date || '').slice(0, 7); // YYYY-MM
  const place = slugify((placeName || '').split(',')[0] || '');
  return [ym, stockSlug, place].filter(Boolean).join('-');
}
