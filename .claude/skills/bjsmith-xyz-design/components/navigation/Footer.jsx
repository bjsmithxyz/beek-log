import React from 'react';

const CSS = `
.bjs-footer{margin-top:auto;padding:var(--space-5) 0 var(--space-4)}
.bjs-footer__inner{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:var(--space-3) var(--space-4)}
.bjs-footer__primary,.bjs-footer__secondary{display:flex;flex-direction:column;gap:var(--space-2)}
.bjs-footer__primary{align-items:flex-start}
.bjs-footer__secondary{align-items:flex-end}
.bjs-footer__tagline{font-size:var(--font-size-sm);color:var(--color-text-muted);margin:0}
.bjs-footer__social{display:flex;gap:var(--space-3)}
.bjs-social-link{display:flex;width:32px;height:32px;align-items:center;justify-content:center;padding:0;color:var(--color-text-secondary);background:transparent;border:0;cursor:pointer;transition:color var(--transition-fast)}
.bjs-social-link svg{width:20px;height:20px}
.bjs-social-link:hover{color:var(--color-accent-primary)}
.bjs-footer__copy{font-size:var(--font-size-xs);color:var(--color-text-muted);margin:0;white-space:nowrap}
`;

// Brand glyphs: Simple Icons (CC0) — the same paths the site ships.
const GITHUB = 'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z';
const INSTAGRAM = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.585-.07 4.85-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.849.069-3.26 0-3.668-.012-4.95-.073-3.232-.154-4.74-1.694-4.89-4.92-.058-1.265-.08-1.644-.08-4.849 0-3.204.013-3.583.072-4.849.149-3.227 1.664-4.771 4.919-4.919C8.35 2.175 8.73 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98C23.986 15.668 24 15.259 24 12s-.014-3.668-.073-4.948c-.2-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 1 0 12.324 6.162 6.162 0 0 1 0-12.324zM12 7.838a4.162 4.162 0 1 0 0 8.324 4.162 4.162 0 0 0 0-8.324zm6.406-1.155a1.44 1.44 0 1 1-2.881.001 1.44 1.44 0 0 1 2.881-.001z';

const SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MOON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/** Site footer: social glyphs + tagline left, theme toggle above copyright right. */
export function Footer({ tagline = '// be excellent to each other.', links = [{ href: 'https://github.com/bjsmithxyz/', label: 'github' }, { href: 'https://www.instagram.com/bjsmith.xyz/', label: 'instagram' }], year = new Date().getFullYear(), theme = 'dark', onToggleTheme }) {
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <footer className="bjs-footer">
        <div className="bjs-footer__inner container">
          <div className="bjs-footer__primary">
            <nav className="bjs-footer__social" aria-label="Social links">
              {links.map((link) => (
                <a key={link.label} className="bjs-social-link" href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={link.label === 'github' ? GITHUB : INSTAGRAM} />
                  </svg>
                </a>
              ))}
            </nav>
            <p className="bjs-footer__tagline">{tagline}</p>
          </div>
          <div className="bjs-footer__secondary">
            <button className="bjs-social-link" type="button" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>
              {theme === 'dark' ? MOON : SUN}
            </button>
            <p className="bjs-footer__copy">© {year} beek</p>
          </div>
        </div>
      </footer>
    </React.Fragment>
  );
}
