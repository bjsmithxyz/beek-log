import React from 'react';

const CSS = `
.bjs-page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-4);margin-bottom:var(--space-6)}
.bjs-page-header__title{font-size:var(--font-size-page-title);font-weight:var(--font-weight-bold);line-height:var(--line-height-tight);color:var(--color-text-primary);margin-bottom:var(--space-2)}
.bjs-page-header__desc{margin:0;color:var(--color-text-muted);font-size:var(--font-size-sm)}
.bjs-page-header__actions{display:flex;flex:none;flex-wrap:wrap;align-items:end;gap:var(--space-3)}
`;

/** Page title (always a path, e.g. `work/`) plus optional description and actions. */
export function PageHeader({ title, description, actions }) {
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <header className="bjs-page-header">
        <div>
          <h1 className="bjs-page-header__title">{title}</h1>
          {description && <p className="bjs-page-header__desc">{description}</p>}
        </div>
        {actions && <div className="bjs-page-header__actions">{actions}</div>}
      </header>
    </React.Fragment>
  );
}
