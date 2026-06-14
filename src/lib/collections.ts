import { getCollection } from 'astro:content';

// Drafts never ship to production. Photo rolls additionally preview under
// `astro dev` so unpublished rolls can be eyeballed locally before release;
// work entries are not previewed (a draft project simply has no page yet).
export const getWorkEntries = () =>
  getCollection('work', ({ data }) => !data.draft);

export const getPhotoRolls = () =>
  getCollection('photos', ({ data }) => import.meta.env.DEV || !data.draft);

// Newest first — the canonical ordering for every listing on the site.
export const byDateDesc = <T extends { data: { date: Date } }>(a: T, b: T) =>
  b.data.date.valueOf() - a.data.date.valueOf();
