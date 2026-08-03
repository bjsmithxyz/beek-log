/** Admin-wide constants — mirrors src/data/site.ts on the public surface. */

export const siteName = 'admin.bjsmith.xyz';
export const publicSite = 'https://bjsmith.xyz/';
export const tagline = '// private authoring surface.';

/** Matches `--color-bg-primary` in dark / light themes (used for theme-color meta). */
export const themeColors = {
  dark: '#0c0c0c',
  light: '#f4f4f0',
} as const;
