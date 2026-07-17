/** Site-wide constants — single source for layout, footer, about, and JSON-LD. */

export const siteName = 'bjsmith.xyz';
export const personName = 'beek';
export const personRole = 'tech guy & creative';
export const siteDescription = 'Portfolio of beek - tech guy & creative';
export const tagline = '// be excellent to each other.';

export const socialLinks = [
  { href: 'https://github.com/bjsmithxyz/', label: 'github' },
  { href: 'https://www.instagram.com/bjsmith.xyz/', label: 'instagram' },
] as const;

export const sameAs = socialLinks.map((l) => l.href);

/** Matches `--color-bg-primary` in dark / light themes (used for theme-color meta). */
export const themeColors = {
  dark: '#0c0c0c',
  light: '#f4f4f0',
} as const;
