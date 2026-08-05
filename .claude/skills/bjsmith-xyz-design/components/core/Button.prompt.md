Square, monospace action button — use for the site's few CTAs (`view live →`, `source →`, `> home`) and every admin action.

```jsx
<Button variant="primary" href="https://example.com">view live →</Button>
<Button variant="secondary" href="/repo">source →</Button>
<Button variant="quiet" href="/">&gt; home</Button>
```

Variants: `primary` (accent outline, fills accent on hover, gains a 3px hard accent shadow), `secondary` (neutral outline), `quiet` (neutral outline that turns accent — the 404 "home" and project-nav treatment), `danger` (admin destructive only). Sizes: `md`, `sm` (admin toolbars). Labels are lowercase and often end in `→`.
