Only two glyph icons ship on the site and they both live here (GitHub + Instagram, Simple Icons CC0), plus a Feather-style sun/moon theme toggle. The toggle is bottom-right, directly above the copyright — never in a header.

```jsx
<Footer theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
```
