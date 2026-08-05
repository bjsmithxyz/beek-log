import React from 'react';

const CSS = `
.bjs-map{width:100%;height:auto;display:block;border:1px solid var(--color-border);background:var(--color-bg-secondary);padding:var(--space-2)}
.bjs-map__dots{fill:none;stroke:var(--color-border-strong);stroke-linecap:round}
.bjs-map__pin{fill:var(--color-accent-primary);transition:filter .12s ease}
.bjs-map__halo{fill:var(--color-accent-primary);opacity:0;transition:opacity .12s ease}
.bjs-map__link{cursor:pointer}
.bjs-map__link:hover .bjs-map__halo,.bjs-map__link:focus .bjs-map__halo,.bjs-map__link.is-active .bjs-map__halo{opacity:.3}
.bjs-map__link:hover .bjs-map__pin,.bjs-map__link.is-active .bjs-map__pin{filter:brightness(.82)}
.bjs-map__tip{opacity:0;pointer-events:none;transition:opacity .12s ease}
.bjs-map__link:hover .bjs-map__tip,.bjs-map__link:focus .bjs-map__tip,.bjs-map__link.is-active .bjs-map__tip{opacity:1}
.bjs-map__box{fill:var(--color-bg-primary);stroke:var(--color-border-strong);stroke-width:.3}
.bjs-map__title{fill:var(--color-text-primary);font-family:monospace}
.bjs-map__sub{fill:var(--color-text-muted);font-family:monospace}
`;

const COLS = 240, ROWS = 120, DASH = 0.01;

/** Dot-matrix world map. Land is a precomputed row-string grid; pins are shoot locations. */
export function WorldMap({ dots = [], pins = [], activeSlug, onPinHover }) {
  const gridRows = dots.length || 1;
  const gridCols = (dots[0] || '').length || 1;
  const cellW = COLS / gridCols;
  const cellH = ROWS / gridRows;
  const dotR = +(cellW * 0.4).toFixed(2);

  const path = React.useMemo(() => dots.map((row, gy) => {
    const y = +((gy + 0.5) * cellH).toFixed(1);
    let d = '';
    for (let gx = 0; gx < row.length; gx += 1) {
      if (row[gx] !== '1') continue;
      let end = gx;
      while (end + 1 < row.length && row[end + 1] === '1') end += 1;
      d += `M${+((gx + 0.5) * cellW).toFixed(1)} ${y}H${+((end + 0.5) * cellW).toFixed(1)}`;
      gx = end;
    }
    return d;
  }).join(''), [dots]);

  const project = (lat, lng) => ({ x: +(((lng + 180) / 360) * COLS).toFixed(1), y: +(((90 - lat) / 180) * ROWS).toFixed(1) });
  const TT = { fontSize: 6, subSize: 4.6, padX: 2.6, padTop: 2.4, padBottom: 2.2, titleGap: 2.2, lineH: 5.2 };
  const titleFor = (p) => `${p.label} — ${p.count} ${p.count === 1 ? 'frame' : 'frames'}`;
  const width = pins.length ? Math.max(...pins.map((p) => Math.max(titleFor(p).length * TT.fontSize * 0.6, ...(p.members || []).map((m) => (m.length + 2) * TT.subSize * 0.6)))) + TT.padX * 2 : 0;

  return (
    <React.Fragment>
      <style>{CSS}</style>
      <svg viewBox="0 0 240 120" className="bjs-map" role="img" aria-label="Map of shoot locations">
        <path className="bjs-map__dots" d={path} strokeWidth={dotR * 2} strokeDasharray={`${DASH} ${+(cellW - DASH).toFixed(4)}`} />
        {pins.map((p) => {
          const { x, y } = project(p.lat, p.lng);
          const members = p.members || [];
          const rectH = TT.padTop + TT.fontSize + (members.length ? TT.titleGap + TT.lineH * members.length : 0) + TT.padBottom;
          const rectX = Math.min(Math.max(x - width / 2, 1), COLS - width - 1);
          const rectY = Math.max(1, y - 3 - rectH);
          const active = activeSlug && (p.slugs || []).includes(activeSlug);
          return (
            <a key={p.label} href={`#roll-${p.slug}`} className={'bjs-map__link' + (active ? ' is-active' : '')} aria-label={titleFor(p)}
               onMouseEnter={() => onPinHover && onPinHover(p)} onMouseLeave={() => onPinHover && onPinHover(null)}>
              <circle cx={x} cy={y} r="3.4" className="bjs-map__halo" />
              <circle cx={x} cy={y} r="1" className="bjs-map__pin" />
              <g className="bjs-map__tip" aria-hidden="true">
                <rect x={rectX} y={rectY} width={width} height={rectH} rx="0.8" className="bjs-map__box" />
                <text x={rectX + TT.padX} y={rectY + TT.padTop + TT.fontSize / 2} fontSize={TT.fontSize} dominantBaseline="central" className="bjs-map__title">{titleFor(p)}</text>
                {members.map((m, i) => (
                  <text key={m} x={rectX + TT.padX} y={rectY + TT.padTop + TT.fontSize + TT.titleGap + TT.lineH * i + TT.lineH / 2} fontSize={TT.subSize} dominantBaseline="central" className="bjs-map__sub">{`· ${m}`}</text>
                ))}
              </g>
            </a>
          );
        })}
      </svg>
    </React.Fragment>
  );
}
