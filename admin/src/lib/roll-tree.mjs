// Pure grouping logic for the admin dashboard's live rolls/ branch — kept
// free of the DOM so it can be unit tested without a browser. Input is
// already sorted newest-first by rolls-data.mjs; grouping by first-seen year
// preserves that order without a separate sort.
export function groupRollsByYear(rolls) {
  const years = [];
  const byYear = new Map();
  for (const roll of rolls) {
    const year = roll.slug.slice(0, 4);
    let group = byYear.get(year);
    if (!group) {
      group = { year, items: [] };
      byYear.set(year, group);
      years.push(group);
    }
    group.items.push(roll);
  }
  return years;
}
