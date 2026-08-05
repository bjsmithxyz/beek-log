import React from 'react';

const CSS = `
.bjs-panel{background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:0}
.bjs-panel--shadow{box-shadow:var(--shadow-hard)}
.bjs-panel--accent{border-color:var(--color-accent-primary);box-shadow:var(--shadow-hard-accent)}
.bjs-panel--amber{border-color:var(--color-accent-secondary);box-shadow:var(--shadow-hard-amber)}
.bjs-panel--blue{border-color:var(--color-accent-tertiary);box-shadow:var(--shadow-hard-blue)}
.bjs-panel__head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);margin-bottom:var(--space-3)}
.bjs-panel__path{display:block;color:var(--color-text-muted);font-size:var(--font-size-xs)}
.bjs-panel__title{font-size:var(--font-size-base);font-weight:var(--font-weight-medium);color:var(--color-text-primary)}
`;

/** Bordered content panel — the site's only container shape. */
export function Panel({ tone = 'default', shadow = true, path, title, actions, padding, children, style, ...rest }) {
  const cls = ['bjs-panel', tone !== 'default' ? 'bjs-panel--' + tone : (shadow ? 'bjs-panel--shadow' : '')].filter(Boolean).join(' ');
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <section className={cls} style={{ padding: padding || 'var(--space-4)', ...style }} {...rest}>
        {(path || title || actions) && (
          <div className="bjs-panel__head">
            <div>
              {path && <span className="bjs-panel__path">{path}</span>}
              {title && <h2 className="bjs-panel__title">{title}</h2>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </section>
    </React.Fragment>
  );
}
