import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { BLOG_CATEGORIES } from './consts';

const loremflickr = (width: number, height: number) =>
  z.object({
    src: z
      .url()
      .refine((url) => url.startsWith(`https://loremflickr.com/${width}/${height}/`) && /[?&]lock=\d+/.test(url), {
        message: `Must be https://loremflickr.com/${width}/${height}/{keywords}?lock={unique number}`,
      }),
    alt: z.string().min(15, 'Write descriptive alt text.'),
    width: z.literal(width),
    height: z.literal(height),
  });

const titledText = z.object({ title: z.string(), text: z.string() });

// One YAML file per service page; the file name is the URL slug.
// Navigation-level data (name, keywords, card copy) stays in src/consts.ts.
const services = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/services' }),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().min(110).max(160),
    heading: z.string(),
    subhead: z.string(),
    /** First paragraph: must include the primary keyword (checked at build). */
    intro: z.string(),
    hero: loremflickr(1200, 900),
    ogImage: loremflickr(1200, 630),
    problem: z.object({ heading: z.string(), intro: z.string(), points: z.array(titledText).min(3).max(6) }),
    included: z.object({ heading: z.string(), items: z.array(titledText).min(4).max(8) }),
    process: z.object({ heading: z.string(), steps: z.array(titledText).min(3).max(5) }),
    audience: z.object({ heading: z.string(), intro: z.string(), items: z.array(z.string()).min(3).max(6) }),
    proof: z.object({
      heading: z.string(),
      placeholder: z.string().startsWith('[REPLACE:', 'Proof must be a [REPLACE] placeholder, never invented results.'),
    }),
    faq: z.object({
      heading: z.string(),
      items: z.array(z.object({ question: z.string(), answer: z.string() })).min(4).max(6),
    }),
    relatedServices: z.array(reference('services')).length(2),
    blogCategory: z.enum(BLOG_CATEGORIES.map((c) => c.slug) as [string, ...string[]]),
    leadMagnets: z
      .array(
        z.object({
          slug: z.string().regex(/^[a-z0-9-]+$/),
          title: z.string(),
          description: z.string(),
          /** Flip to true once the /lp/{slug} page exists (Section 10), so links never 404. */
          published: z.boolean().default(false),
        }),
      )
      .length(2),
    cta: z.object({ heading: z.string(), text: z.string() }),
  }),
});

// Blog posts: one MDX (or Markdown) file per post; the file name is the URL slug.
// Reading time is calculated from the body in src/lib/blog.ts, not stored in frontmatter.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z
    .object({
      /** SEO title: under 60 characters (used as the post's <title> with no brand suffix). */
      title: z.string().max(59),
      /** Meta description: under 155 characters. */
      description: z.string().min(70).max(154),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: z.enum(BLOG_CATEGORIES.map((c) => c.slug) as [string, ...string[]]),
      tags: z.array(z.string()).default([]),
      /** "news" posts cover dated events and emit NewsArticle structured data. */
      type: z.enum(['article', 'case-study', 'news']).default('article'),
      featuredImage: loremflickr(1200, 675),
      /** Pin as the featured post on the blog index (otherwise the newest post is featured). */
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .refine((post) => !post.updatedDate || post.updatedDate >= post.pubDate, {
      message: 'updatedDate cannot be earlier than pubDate',
      path: ['updatedDate'],
    }),
});

export const collections = { services, blog };
