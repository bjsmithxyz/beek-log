Photo rolls are presented as a contact sheet, never a gallery grid. The strip is an *object*: its base stays `#161412` in both themes and sprocket holes show the page background through it.

```jsx
{chunk(photos, 6).map((strip, i) => (
  <FilmStrip key={i} photos={strip} stockName="Fujifilm 400" stockType="color" startFrame={i * 6 + 1} />
))}
```

Frame numbers read `12` / `12A` under each frame in the edge colour, letterspaced.
