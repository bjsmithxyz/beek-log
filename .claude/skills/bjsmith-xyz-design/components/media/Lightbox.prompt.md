The only place in the system that uses blur and a scrim: `rgba(0,0,0,.95)` + `blur(12px)`. Controls are square 48px panels that invert to accent green on hover; the content scales in with a slight overshoot (`cubic-bezier(.34,1.56,.64,1)`) — the one springy motion in the brand.

```jsx
<Lightbox open={i !== null} items={frames} index={i} onClose={() => setI(null)}
  onNavigate={(d) => setI((i + d + frames.length) % frames.length)} />
```

Meta line is uppercase, letterspaced, `#999`.
