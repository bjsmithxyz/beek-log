// Pure folder-name parsing for the roll authoring flow.
// Convention: "YYYY-MM-DD - <film-stock-slug>-<ISO>".
export function parseFolderName(name, filmStocks = {}) {
  const result = { date: null, stockSlug: null, iso: null, country: null };
  const parts = String(name || '').split(' - ');
  if (parts.length < 2) return result;

  const datePart = parts[0].trim();
  const rest = parts.slice(1).join(' - ').trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) result.date = datePart;

  const match = rest.match(/^(.*)-([A-Z]{2,3})$/);
  if (match) {
    const [, stock, iso] = match;
    result.iso = iso;
    if (stock in filmStocks) result.stockSlug = stock;
    try {
      const displayName = new Intl.DisplayNames(['en'], { type: 'region' }).of(iso);
      result.country = displayName && displayName !== iso ? displayName : null;
    } catch {
      result.country = null;
    }
  } else if (rest in filmStocks) {
    result.stockSlug = rest;
  }
  return result;
}
