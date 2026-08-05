// Content lifted from bjsmith.xyz's own collections (src/content/**) so the kit
// reads like the real site. Abbreviated: a few rows stand in for the full set.
window.KIT_DATA = {
  work: [
    { slug: 'loot-sheet', category: 'dev', date: '2024-11-02', title: 'Loot Sheet', description: 'a sheet, for loot', tags: ['svelte', 'dnd', 'tools'], cover: '../../assets/artwork/loot_sheet.png' },
    { slug: 'planguage', category: 'dev', date: '2024-06-18', title: 'Planguage', description: 'planning, in language', tags: ['typescript', 'tools'] },
    { slug: 'dudes', category: 'art', date: '2025-01-01', title: 'Dudes', description: 'Just dudes being guys tbh', tags: ['illustration', 'watercolour', 'acrylics'], cover: '../../assets/artwork/3blokes.png',
      body: ['Watercolours and acrylics on paper.', 'Painted most of these in sets/pairs at various times over the last year.'],
      images: ['../../assets/artwork/3blokes.png', '../../assets/artwork/anotherday.png', '../../assets/artwork/frog.png', '../../assets/artwork/littlefella.png'] },
    { slug: 'mspaint', category: 'art', date: '2019-01-31', title: 'MS Paint', description: 'paint.exe', tags: ['illustration', 'digital', 'mspaint'], cover: '../../assets/artwork/hakimashita.png',
      body: ['About a decade ago I was working in a job where I had considerable downtime in front of a computer. Naturally, I decided that the best way to spend my time was to draw things in MS Paint.'],
      images: ['../../assets/artwork/hakimashita.png', '../../assets/artwork/licklick.png', '../../assets/artwork/mcp.png', '../../assets/artwork/fire.png'] },
    { slug: 'another-day', category: 'art', date: '2024-09-14', title: 'Another Day', description: 'sun comes up, sun goes down', tags: ['illustration'] },
    { slug: 'one-star-maccas', category: 'photography', date: '2023-03-02', title: 'One Star Maccas', description: 'the worst golden arches in the country', tags: ['digital'] },
  ],
  rolls: [
    { slug: '2025-08-fujifilm-400-almaty', stock: 'Fujifilm 400', stockType: 'color', date: '2025-08-24', title: 'Almaty', location: 'Almaty', region: 'Kazakhstan', frames: 18 },
    { slug: '2025-08-kodak-colorplus-200-bishkek-song-kol', stock: 'Kodak ColorPlus 200', stockType: 'color', date: '2025-08-11', title: 'Bishkek → Song Köl', location: 'Bishkek +2', region: 'Kyrgyzstan', frames: 24 },
    { slug: '2025-07-kodak-tri-x-400-chiang-mai', stock: 'Kodak Tri-X 400', stockType: 'bw', date: '2025-07-11', title: 'Chiang Mai', location: 'Chiang Mai', region: 'Thailand', frames: 12 },
    { slug: '2025-07-kodak-ultramax-400-ha-giang-sapa-kunming', stock: 'Kodak Ultramax 400', stockType: 'color', date: '2025-07-29', title: 'Ha Giang → Sapa → Kunming', location: 'Ha Giang +2', region: 'Vietnam', frames: 36 },
    { slug: '2025-09-lucky-200-charyn-canyon', stock: 'Lucky 200', stockType: 'color', date: '2025-09-06', title: 'Charyn Canyon', location: 'Charyn Canyon', region: 'Kazakhstan', frames: 9 },
  ],
  pins: [
    { label: 'Kazakhstan', lat: 48.1012954, lng: 66.7780818, count: 27, members: ['Almaty', 'Charyn Canyon'], slug: '2025-08-fujifilm-400-almaty', slugs: ['2025-08-fujifilm-400-almaty', '2025-09-lucky-200-charyn-canyon'] },
    { label: 'Kyrgyzstan', lat: 41.5089324, lng: 74.724091, count: 24, members: ['Bishkek', 'Song Köl'], slug: '2025-08-kodak-colorplus-200-bishkek-song-kol', slugs: ['2025-08-kodak-colorplus-200-bishkek-song-kol'] },
    { label: 'Thailand', lat: 14.8971921, lng: 100.83273, count: 12, members: ['Chiang Mai'], slug: '2025-07-kodak-tri-x-400-chiang-mai', slugs: ['2025-07-kodak-tri-x-400-chiang-mai'] },
    { label: 'Vietnam', lat: 14.0583, lng: 108.2772, count: 36, members: ['Ha Giang', 'Sapa'], slug: '2025-07-kodak-ultramax-400-ha-giang-sapa-kunming', slugs: ['2025-07-kodak-ultramax-400-ha-giang-sapa-kunming'] },
  ],
  frames: [1, 2, 3, 4, 5, 6].map((n) => ({
    src: '../../assets/photos/almaty-00' + n + '.jpg',
    alt: 'Almaty, frame ' + n,
    caption: 'Almaty',
    meta: 'FUJIFILM 400 · ' + n + 'A · 08 25 · ALMATY',
  })),
  trip: {
    title: 'travel/',
    subtitle: 'A long way east, mostly overland, on film.',
    stats: [['184', 'days on the road'], ['27', 'stops'], ['9', 'countries']],
    timeline: [
      { date: '2025-07-04', place: 'Chiang Mai', note: 'Thailand', kind: 'past' },
      { date: '2025-07-22', place: 'Ha Noi', note: 'Vietnam', kind: 'past' },
      { date: '2025-08-11', place: 'Bishkek', note: 'Kyrgyzstan', kind: 'past' },
      { date: '2025-08-24', place: 'Almaty', note: 'Kazakhstan', kind: 'current' },
      { date: '2025-09-14', place: 'Samarkand', note: 'Uzbekistan', kind: 'future' },
    ],
  },
};
