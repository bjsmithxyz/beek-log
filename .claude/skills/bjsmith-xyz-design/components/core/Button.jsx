import React from 'react';

const CSS = `
.bjs-btn{display:inline-block;padding:var(--space-2) var(--space-4);font-family:var(--font-family);font-size:var(--font-size-sm);font-weight:var(--font-weight-medium);line-height:var(--line-height-base);text-decoration:none;border-width:1px;border-style:solid;border-radius:0;cursor:pointer;transition:all var(--transition-fast)}
.bjs-btn--md{font-size:var(--font-size-base)}
.bjs-btn--sm{padding:.45rem .65rem;font-size:var(--font-size-xs)}
.bjs-btn--primary{color:var(--color-accent-primary);background:var(--color-bg-tertiary);border-color:var(--color-accent-primary)}
.bjs-btn--primary:hover{color:var(--color-bg-primary);background:var(--color-accent-primary);box-shadow:var(--shadow-hard-accent)}
.bjs-btn--secondary{color:var(--color-text-secondary);background:var(--color-bg-secondary);border-color:var(--color-border)}
.bjs-btn--secondary:hover{color:var(--color-text-primary);background:var(--color-bg-tertiary);border-color:var(--color-border-strong);box-shadow:var(--shadow-hard)}
.bjs-btn--quiet{color:var(--color-text-primary);background:var(--color-bg-secondary);border-color:var(--color-border)}
.bjs-btn--quiet:hover{color:var(--color-accent-primary);border-color:var(--color-accent-primary);box-shadow:var(--shadow-hard-accent)}
.bjs-btn--danger{color:#ff8e8e;background:var(--color-bg-tertiary);border-color:#994444}
.bjs-btn--danger:hover{color:var(--color-bg-primary);background:var(--color-danger);border-color:var(--color-danger)}
.bjs-btn:disabled{cursor:not-allowed;opacity:.45;box-shadow:none}
`;

/** Terminal-style action: square, 1px border, hard offset shadow on hover. */
export function Button({ variant = 'primary', size = 'md', href, children, className = '', ...rest }) {
  const cls = ['bjs-btn', 'bjs-btn--' + variant, 'bjs-btn--' + size, className].filter(Boolean).join(' ');
  const Tag = href ? 'a' : 'button';
  const extra = href ? { href } : { type: rest.type || 'button' };
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <Tag className={cls} {...extra} {...rest}>{children}</Tag>
    </React.Fragment>
  );
}
