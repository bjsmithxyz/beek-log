import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupRollsByYear } from '../src/lib/roll-tree.mjs';

test('groups by the slug\'s leading year, newest year first given sorted input', () => {
  const rolls = [
    { slug: '2026-08-portra-400-amsterdam' },
    { slug: '2026-02-portra-400-mexico-city' },
    { slug: '2025-12-kentmere-400-nyc' },
    { slug: '2025-06-kodak-colorplus-200-chiang-mai' },
  ];
  const years = groupRollsByYear(rolls);
  assert.deepEqual(years.map((group) => group.year), ['2026', '2025']);
  assert.deepEqual(years[0].items, [rolls[0], rolls[1]]);
  assert.deepEqual(years[1].items, [rolls[2], rolls[3]]);
});

test('a year appears once even if its rolls are not contiguous', () => {
  const rolls = [
    { slug: '2026-08-a' },
    { slug: '2025-01-b' },
    { slug: '2026-01-c' },
  ];
  const years = groupRollsByYear(rolls);
  assert.deepEqual(years.map((group) => group.year), ['2026', '2025']);
  assert.deepEqual(years[0].items.map((r) => r.slug), ['2026-08-a', '2026-01-c']);
});

test('empty input yields no year groups', () => {
  assert.deepEqual(groupRollsByYear([]), []);
});
