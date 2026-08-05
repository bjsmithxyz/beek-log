The site's only top-level navigation: a path, not a menu bar. Home is `~`; public pages sit under `~/beek`; the admin under `~/admin`. Leaf segments carry a file extension when they are content files.

```jsx
<Breadcrumb items={[
  { label: '~/beek', href: '/' },
  { label: 'photos', href: '/photos/' },
  { label: '2025-08-fujifilm-400-almaty.md', href: '/photos/2025-08-fujifilm-400-almaty/' },
]} />
```
