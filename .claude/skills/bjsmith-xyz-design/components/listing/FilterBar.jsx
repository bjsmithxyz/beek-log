import React from 'react';

const CSS = `
.bjs-filters{display:flex;gap:var(--space-2);margin-bottom:var(--space-5);flex-wrap:wrap}
.bjs-filter-btn{padding:var(--space-2) var(--space-3);font-size:var(--font-size-sm);font-family:inherit;font-weight:var(--font-weight-medium);color:var(--color-text-secondary);background:var(--color-bg-secondary);border:1px solid var(--color-border);cursor:pointer;transition:all var(--transition-fast)}
.bjs-filter-btn:hover{border-color:var(--color-border-strong);color:var(--color-text-primary)}
.bjs-filter-btn.is-active{background:var(--color-bg-tertiary);border-color:var(--color-accent-primary);color:var(--color-accent-primary);box-shadow:var(--shadow-hard-accent)}
`;

/** `[all]` + one bracketed button per option; active gains an accent hard shadow. */
export function FilterBar({ options = [], value = 'all', onChange, allLabel = 'all' }) {
  const opts = [allLabel, ...options];
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <div className="bjs-filters">
        {opts.map((opt) => (
          <button key={opt} type="button" className={'bjs-filter-btn' + (opt === value ? ' is-active' : '')} onClick={() => onChange && onChange(opt)}>
            [{opt}]
          </button>
        ))}
      </div>
    </React.Fragment>
  );
}
