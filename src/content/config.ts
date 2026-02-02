import { defineCollection, z } from 'astro:content';

const workCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['dev', 'art', 'photography']),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    // For projects
    liveUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    // For art/photography - cover image
    cover: image().optional(),
    // Gallery images
    images: z.array(z.object({
      src: image(),
      alt: z.string(),
    })).optional(),
  }),
});

export const collections = {
  work: workCollection,
};
