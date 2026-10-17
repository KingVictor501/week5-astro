// @ts-check
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';

/**
 * Builds the Pagefind search index for the command bar after every `astro build`, whatever
 * build command runs it (locally or on Vercel). Only pages marked `data-pagefind-body`
 * (blog posts and service pages) are indexed. Output: dist/pagefind/.
 */
/** @type {import('astro').AstroIntegration} */
const pagefindIndex = {
  name: 'pagefind-index',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const { index, errors } = await pagefind.createIndex();
      if (!index) throw new Error(`Pagefind: ${errors.join(', ')}`);
      const added = await index.addDirectory({ path: fileURLToPath(dir) });
      const written = await index.writeFiles({ outputPath: fileURLToPath(new URL('pagefind/', dir)) });
      const problems = [...added.errors, ...written.errors];
      if (problems.length > 0) throw new Error(`Pagefind: ${problems.join(', ')}`);
      logger.info(`Search index written (scanned ${added.page_count} pages; only data-pagefind-body pages are indexed)`);
      await pagefind.close();
    },
  },
};

// https://astro.build/config
export default defineConfig({
  // Canonical URLs, Open Graph URLs, robots.txt, and the sitemap all derive from this.
  site: 'https://week5-astro.vercel.app',
  // One URL form per page, so canonical tags and sitemap entries always match.
  // Astro pairs 'never' with file output (about.html); vercel.json serves it at /about
  // and redirects /about/ there.
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Inline all CSS into each page (about 7 KB gzipped) so the first paint never waits on
    // separate stylesheet requests. PageSpeed flagged them as render-blocking on mobile.
    inlineStylesheets: 'always',
  },
  // Placeholder photos come from picsum.photos (which redirects to its fastly CDN). Allowing
  // both lets <Image> download them at build time and serve small, resized WebP files from
  // this site, instead of making phones fetch full-size JPEGs through a redirect.
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
    ],
  },
  integrations: [
    // Two JSX frameworks, so each gets its own folder via `include`.
    // tsconfig defaults JSX types to React; Preact files add a jsxImportSource pragma.
    preact({ include: ['**/preact/**/*.{jsx,tsx}'] }),
    react({ include: ['**/react/**/*.{jsx,tsx}'] }),
    // Blog posts are MDX so they can hold images and components.
    mdx(),
    pagefindIndex,
    sitemap({
      // Lead-magnet landing pages are noindex and stay out of the sitemap.
      filter: (page) => !new URL(page).pathname.startsWith('/lp/'),
    }),
  ],
  env: {
    schema: {
      // Formspree form endpoint, e.g. https://formspree.io/f/abcdwxyz.
      // Unset = the Book a Call form runs in demo mode (nothing is sent).
      PUBLIC_FORMSPREE_ENDPOINT: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
