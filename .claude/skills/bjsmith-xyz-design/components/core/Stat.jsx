import React from 'react';

const CSS = `
.bjs-stats{display:grid;grid-template-columns:repeat(var(--bjs-stat-cols,3),1fr);border-top:1px solid var(--color-border);border-left:1px solid var(--color-border)}
.bjs-stat{min-width:0;padding:var(--space-4);background:var(--color-bg-secondary);border-right:1px solid var(--color-border);border-bottom:1px solid var(--color-border)}
.bjs-stat strong{display:block;overflow:hidden;font-size:var(--font-size-2xl);color:var(--color-text-primary);line-height:1;font-variant-numeric:tabular-nums}
.bjs-stat span{display:block;margin-top:var(--space-2);color:var(--color-text-muted);font-size:var(--font-size-xs);text-transform:uppercase;letter-spacing:var(--letter-spacing-label)}
`;

/** One tabular-number figure with an uppercase caption. */
export function Stat({ value, label }) {
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <div className="bjs-stat"><strong>{value}</strong><span>{label}</span></div>
    </React.Fragment>
  );
}

/** Hairline grid of Stat cells (3 across on desktop). */
export function StatGrid({ columns = 3, children }) {
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <div className="bjs-stats" style={{ '--bjs-stat-cols': columns }}>{children}</div>
    </React.Fragment>
  );
}
