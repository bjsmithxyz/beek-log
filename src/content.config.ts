import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { filmStocks } from '@beek/shared/film-stocks';

// Zod's .url() accepts javascript: and data:; only allow navigable http(s) links.
const httpUrl = z.string().url().refine((value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}, { message: 'URL must use http or https' });

const workCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['dev', 'art', 'photography']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // For projects
    liveUrl: httpUrl.optional(),
    repoUrl: httpUrl.optional(),
    // For art/photography - cover image
    cover: image().optional(),
    // Gallery images
    images: z.array(z.object({
      src: image(),
      alt: z.string(),
    })).optional(),
  }),
});

// One file per film roll: src/content/photos/<roll-slug>.md
// Photos live in src/assets/photos/<roll-slug>/; markdown body = roll notes.
const pointSchema = z.object({
  name: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const locationSchema = pointSchema.extend({
  region: pointSchema.optional(),
});

const photosCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photos' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    stock: z.string().refine((s): s is keyof typeof filmStocks => s in filmStocks, {
      message: 'unknown film stock slug — add it to shared/film-stocks.ts',
    }),
    date: z.coerce.date(),
    location: locationSchema,
    draft: z.boolean().default(false),
    photos: z.array(z.object({
      src: image(),
      alt: z.string(),
      caption: z.string().optional(),
      location: locationSchema.optional(),
    })).min(1),
  }),
});

export const collections = {
  work: workCollection,
  photos: photosCollection,
};
