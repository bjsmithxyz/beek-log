The site's list primitive — everything browsable is a row in a directory, never a card grid. Rows overlap by 1px so borders collapse into single hairlines; hover lifts the background to `--color-bg-tertiary` and turns the arrow accent green.

```jsx
<DirRow cols="var(--work-cols)" href="/work/mspaint/" cells={[
  <Tag kind="art">art</Tag>, '2019-01-31', 'mspaint', 'paint.exe',
]} />
```

Use WorkRow / RollRow for the two real listings; DirRow is for new listings that follow the same shape.
