import React from 'react';

const CSS = `
.bjs-tag{font-family:var(--font-family);font-size:var(--font-size-sm);font-weight:var(--font-weight-medium);text-transform:lowercase}
.bjs-tag--dev{color:var(--color-accent-tertiary)}
.bjs-tag--art{color:var(--color-accent-secondary)}
.bjs-tag--photography{color:var(--color-accent-primary)}
.bjs-tag--color{color:var(--color-accent-secondary)}
.bjs-tag--bw{color:var(--color-text-secondary)}
.bjs-tag--neutral{color:var(--color-text-secondary)}
.bjs-chip{display:inline-block;padding:var(--space-1) var(--space-2);font-size:var(--font-size-xs);color:var(--color-text-muted);background:var(--color-bg-tertiary);border:1px solid var(--color-border)}
`;

/** Bracketed category / film-stock label, or a bordered keyword chip. */
export function Tag({ kind = 'neutral', bracket = true, chip = false, children }) {
  return (
    <React.Fragment>
      <style>{CSS}</style>
      {chip
        ? <span className="bjs-chip">{children}</span>
        : <span className={'bjs-tag bjs-tag--' + kind}>{bracket ? '[' : ''}{children}{bracket ? ']' : ''}</span>}
    </React.Fragment>
  );
}
