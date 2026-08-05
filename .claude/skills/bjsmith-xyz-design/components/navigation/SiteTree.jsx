import React from 'react';

const CSS = `
.bjs-tree{max-width:52rem;padding:var(--space-4);overflow-x:auto;border:1px solid var(--color-border);background:var(--color-bg-secondary);box-shadow:var(--shadow-hard);font-size:var(--font-size-sm);scrollbar-width:thin}
.bjs-tree ul{list-style:none}
.bjs-tree__root,.bjs-tree__row{min-height:2rem}
.bjs-tree__root{display:inline-flex;align-items:center;color:var(--color-accent-primary);font-weight:var(--font-weight-medium)}
.bjs-tree__row{display:grid;grid-template-columns:minmax(0,1fr) auto;min-width:38rem;align-items:center}
.bjs-tree__main{display:flex;width:fit-content;min-width:0;align-items:center;color:var(--color-text-primary);font:inherit;text-align:left;text-decoration:none}
button.bjs-tree__main{padding:0;background:transparent;border:0;cursor:pointer}
.bjs-tree__main:hover,.bjs-tree__main:focus-visible{color:var(--color-accent-primary)}
.bjs-tree__prefix{flex:none;color:var(--color-text-muted);white-space:pre}
.bjs-tree__state{margin-left:var(--space-2);color:var(--color-text-muted)}
.bjs-tree__meta{padding-left:var(--space-6);color:var(--color-text-muted);font-size:var(--font-size-xs);text-align:right;white-space:nowrap}
.bjs-tree__collapse{display:grid;grid-template-rows:1fr;opacity:1;transition:grid-template-rows var(--transition-slow),opacity var(--transition-base)}
.bjs-tree__collapse[data-collapsed='true']{grid-template-rows:0fr;opacity:0}
.bjs-tree__inner{min-height:0;overflow:hidden}
`;

function Node({ node, prefix, last, depth }) {
  const [open, setOpen] = React.useState(!!node.open);
  const branch = !!(node.children && node.children.length);
  const glyph = prefix + (last ? '└── ' : '├── ');
  const childPrefix = prefix + (last ? '    ' : '│   ');
  return (
    <li>
      <div className="bjs-tree__row">
        {branch ? (
          <button className="bjs-tree__main" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="bjs-tree__prefix" aria-hidden="true">{glyph}</span>
            <span>{node.label}</span>
            <span className="bjs-tree__state" aria-hidden="true">{open ? '[-]' : '[+]'}</span>
          </button>
        ) : (
          <a className="bjs-tree__main" href={node.href || '#'}>
            <span className="bjs-tree__prefix" aria-hidden="true">{glyph}</span>
            <span>{node.label}</span>
          </a>
        )}
        {node.meta && <span className="bjs-tree__meta">{node.meta}</span>}
      </div>
      {branch && (
        <div className="bjs-tree__collapse" data-collapsed={String(!open)} inert={!open ? '' : undefined}>
          <div className="bjs-tree__inner">
            <ul>
              {node.children.map((child, i) => (
                <Node key={child.label + i} node={child} prefix={childPrefix} last={i === node.children.length - 1} depth={depth + 1} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

/** The homepage: an ASCII directory tree with collapsible branches. */
export function SiteTree({ root = '~', nodes = [] }) {
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <nav className="bjs-tree" aria-label="Site index">
        <a className="bjs-tree__root" href="/" aria-current="page">{root}</a>
        <ul>
          {nodes.map((node, i) => (
            <Node key={node.label + i} node={node} prefix="" last={i === nodes.length - 1} depth={0} />
          ))}
        </ul>
      </nav>
    </React.Fragment>
  );
}
