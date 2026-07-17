/** Shared date formatters for list rows and detail pages. */

export function formatListDate(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

/** Film-edge style: "JUL 2026" */
export function formatFilmEdgeDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }).toUpperCase();
}
