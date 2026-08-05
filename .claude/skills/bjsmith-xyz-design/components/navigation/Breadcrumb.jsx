import React from 'react';

const CSS = `
.bjs-crumb-row{display:flex;height:var(--breadcrumb-row-height);flex:0 0 auto;align-items:center}
.bjs-crumb{width:100%;min-width:0;max-width:100%;flex:1;margin:0;overflow-x:auto;padding:2px 0;scrollbar-width:thin}
.bjs-crumb ol{display:flex;width:max-content;min-width:0;list-style:none;font-size:var(--font-size-sm);line-height:var(--line-height-base);white-space:nowrap}
.bjs-crumb li{display:flex;align-items:center}
.bjs-crumb a,.bjs-crumb__sep{color:var(--color-text-muted)}
.bjs-crumb a{text-decoration:none}
.bjs-crumb a:hover,.bjs-crumb a:focus-visible{color:var(--color-accent-primary)}
.bjs-crumb a[aria-current='page']{color:var(--color-text-secondary)}
.bjs-crumb a[aria-current='page']:hover{color:var(--color-accent-primary)}
`;

/** Filesystem path nav in a static 56px row at the top of the page flow. */
export function Breadcrumb({ items = [], row = true }) {
  const nav = (
    <nav className="bjs-crumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => (
          <li key={item.href + i}>
            {i > 0 && <span className="bjs-crumb__sep" aria-hidden="true">/</span>}
            <a href={item.href} aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
  return (
    <React.Fragment>
      <style>{CSS}</style>
      {row ? <div className="bjs-crumb-row container">{nav}</div> : nav}
    </React.Fragment>
  );
}
