import React from 'react';

const CSS = `
.bjs-list-header{display:grid;grid-template-columns:var(--bjs-cols);gap:var(--space-4);padding:var(--space-2) var(--space-4);font-size:var(--font-size-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:var(--letter-spacing-label);border:1px solid var(--color-border);background:var(--color-bg-tertiary)}
.bjs-row{display:grid;grid-template-columns:var(--bjs-cols);gap:var(--space-4);align-items:baseline;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border);margin-top:-1px;background:var(--color-bg-secondary);color:var(--color-text-primary);text-decoration:none;font-size:var(--font-size-sm);transition:background var(--transition-fast)}
.bjs-row:first-child{margin-top:0}
.bjs-row:hover{background:var(--color-bg-tertiary);color:var(--color-text-primary)}
.bjs-row:hover .bjs-row__arrow{color:var(--color-accent-primary)}
.bjs-row__date{color:var(--color-text-muted);font-variant-numeric:tabular-nums}
.bjs-row__arrow{color:var(--color-text-muted);text-align:right;transition:color var(--transition-fast)}
.bjs-row__name{color:var(--color-text-primary);font-weight:var(--font-weight-medium)}
.bjs-row__desc{color:var(--color-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bjs-row__loc{color:var(--color-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bjs-row--active{border-color:var(--color-accent-primary);outline:1px solid var(--color-accent-primary)}
@media (max-width:768px){.bjs-list-header{display:none}}
`;

/** Generic directory row: a bordered grid link with a trailing → arrow. */
export function DirRow({ cols, href, cells = [], arrow = '→', active = false, id, children, ...rest }) {
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <a id={id} className={'bjs-row' + (active ? ' bjs-row--active' : '')} style={{ '--bjs-cols': cols }} href={href} {...rest}>
        {children || cells.map((cell, i) => <span key={i} className={cell && cell.className}>{cell && cell.content !== undefined ? cell.content : cell}</span>)}
        {arrow && <span className="bjs-row__arrow" aria-hidden="true">{arrow}</span>}
      </a>
    </React.Fragment>
  );
}
