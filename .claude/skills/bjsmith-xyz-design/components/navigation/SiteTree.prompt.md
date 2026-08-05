The homepage IS this tree — box-drawing prefixes, `[+]`/`[-]` disclosures, a right-hand muted meta column. Branch open/close animates via `grid-template-rows: 1fr → 0fr` over 200ms.

```jsx
<SiteTree root="~" nodes={[
  { label: 'admin/', href: 'https://admin.bjsmith.xyz/', meta: 'protected' },
  { label: 'beek/', meta: 'public home', open: true, children: [
    { label: 'work/', meta: '24 entries', children: [{ label: 'index/', href: '/work/', meta: 'all work' }] },
    { label: 'photos/', meta: '17 rolls', children: [] },
    { label: 'travel/', href: '/travel/', meta: 'journey' },
    { label: 'about.md', href: '/about/', meta: 'file' },
  ] },
]} />
```
