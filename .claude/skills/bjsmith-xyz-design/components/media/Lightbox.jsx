import React from 'react';

const CSS = `
.bjs-lightbox{position:fixed;inset:0;z-index:10000;background:var(--overlay-scrim);backdrop-filter:var(--overlay-blur);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:all .3s ease;padding:var(--space-8)}
.bjs-lightbox.is-open{opacity:1;pointer-events:auto}
.bjs-lightbox__content{position:relative;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;gap:var(--space-4);transform:scale(.95);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.bjs-lightbox.is-open .bjs-lightbox__content{transform:scale(1)}
.bjs-lightbox__content img{max-width:100%;max-height:calc(90vh - 80px);object-fit:contain;border:1px solid var(--color-border)}
.bjs-lightbox__caption{color:#fff;font-size:var(--font-size-lg);font-weight:var(--font-weight-medium);margin:0;text-align:center;text-shadow:0 2px 4px rgba(0,0,0,.5)}
.bjs-lightbox__meta{margin:0;font-size:var(--font-size-xs);color:#999;letter-spacing:0.15em;text-align:center}
.bjs-lightbox__btn{position:absolute;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text-primary);width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10001;transition:all var(--transition-fast)}
.bjs-lightbox__btn:hover{background:var(--color-accent-primary);border-color:var(--color-accent-primary);color:var(--color-bg-primary)}
.bjs-lightbox__close{top:var(--space-8);right:var(--space-8);font-size:2rem}
.bjs-lightbox__prev{top:50%;left:var(--space-8);transform:translateY(-50%)}
.bjs-lightbox__next{top:50%;right:var(--space-8);transform:translateY(-50%)}
`;

const CHEV = (points) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points={points} /></svg>
);

/** Full-screen frame viewer: blurred near-black scrim, square 48px controls. */
export function Lightbox({ open = false, items = [], index = 0, onClose, onNavigate }) {
  const item = items[index] || {};
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
      if (e.key === 'ArrowLeft') onNavigate && onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate && onNavigate(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, onNavigate]);
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <div className={'bjs-lightbox' + (open ? ' is-open' : '')} role="dialog" aria-modal="true" aria-hidden={!open} onClick={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
        <button className="bjs-lightbox__btn bjs-lightbox__close" type="button" aria-label="Close lightbox" onClick={onClose}>×</button>
        <button className="bjs-lightbox__btn bjs-lightbox__prev" type="button" aria-label="Previous image" onClick={() => onNavigate && onNavigate(-1)}>{CHEV('15 18 9 12 15 6')}</button>
        <button className="bjs-lightbox__btn bjs-lightbox__next" type="button" aria-label="Next image" onClick={() => onNavigate && onNavigate(1)}>{CHEV('9 18 15 12 9 6')}</button>
        <div className="bjs-lightbox__content">
          {item.src && <img src={item.full || item.src} alt={item.alt || ''} />}
          {item.caption && <p className="bjs-lightbox__caption">{item.caption}</p>}
          {item.meta && <p className="bjs-lightbox__meta">{item.meta}</p>}
        </div>
      </div>
    </React.Fragment>
  );
}
