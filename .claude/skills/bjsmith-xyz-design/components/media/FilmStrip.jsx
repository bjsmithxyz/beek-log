import React from 'react';

const CSS = `
.bjs-strip{background:var(--film-base);border:1px solid var(--color-border);padding:3px 0;margin-bottom:var(--space-4)}
.bjs-strip__sprockets{height:12px;margin:3px 10px;background-image:repeating-linear-gradient(to right,transparent 0 7px,var(--color-bg-primary) 7px 17px,transparent 17px 24px)}
.bjs-strip__edge{display:flex;gap:var(--space-4);padding:1px 14px 3px;font-size:var(--font-size-xs);letter-spacing:var(--letter-spacing-edge);color:var(--bjs-edge);user-select:none;white-space:nowrap;overflow:hidden}
.bjs-strip__range{margin-left:auto}
.bjs-strip__frames{display:flex;gap:6px;padding:2px 10px 6px;overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--color-border-strong) transparent}
.bjs-strip__frames::-webkit-scrollbar{height:8px}
.bjs-strip__frames::-webkit-scrollbar-track{background:transparent}
.bjs-strip__frames::-webkit-scrollbar-thumb{background:var(--color-border-strong);border:1px solid #000}
.bjs-strip__frames::-webkit-scrollbar-thumb:hover{background:var(--bjs-edge)}
.bjs-frame{margin:0;flex:0 0 clamp(130px,18vw,200px)}
.bjs-frame img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;cursor:pointer;border:1px solid #000}
.bjs-frame__no{display:flex;justify-content:space-between;font-size:var(--font-size-xs);color:var(--bjs-edge);letter-spacing:var(--letter-spacing-frame);padding:2px 2px 0;user-select:none}
`;

/** One strip of a contact sheet: sprocket holes, edge print and up to ~6 frames. */
export function FilmStrip({ photos = [], stockName = '', stockType = 'color', startFrame = 1, onSelect }) {
  const edge = stockType === 'bw' ? 'var(--film-bw-edge)' : 'var(--film-color-edge)';
  return (
    <React.Fragment>
      <style>{CSS}</style>
      <div className="bjs-strip" style={{ '--bjs-edge': edge }}>
        <div className="bjs-strip__sprockets" aria-hidden="true" />
        <div className="bjs-strip__edge" aria-hidden="true">
          <span>{stockName.toUpperCase()}</span>
          <span>▸▸</span>
          <span className="bjs-strip__range">{startFrame}–{startFrame + photos.length - 1}</span>
        </div>
        <div className="bjs-strip__frames">
          {photos.map((p, i) => (
            <figure className="bjs-frame" key={p.src + i}>
              <img src={p.src} alt={p.alt || ''} loading="lazy" onClick={() => onSelect && onSelect(startFrame + i - 1)} />
              <figcaption className="bjs-frame__no">
                <span>{startFrame + i}</span>
                <span>{startFrame + i}A</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="bjs-strip__sprockets" aria-hidden="true" />
      </div>
    </React.Fragment>
  );
}
