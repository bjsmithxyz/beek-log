Geography in this brand is dots, not tiles. Land is drawn as one `<path>` with a near-zero dash and round caps so each grid cell renders as a single `--color-border-strong` dot; pins are accent-green with a 30%-opacity halo on hover and a square monospace tooltip.

```jsx
const dots = await fetch('assets/world-dots.json').then(r => r.json());
<WorldMap dots={dots} pins={pins} activeSlug={hoveredSlug} onPinHover={p => setHovered(p?.slug)} />
```

The land mask ships with this system at `assets/world-dots.json` (240×120 equirectangular, Antarctica dropped). Pins cross-highlight with RollRow's `active` prop.
