// @ts-check
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical URLs, Open Graph URLs, robots.txt, and the sitemap all derive from this.
  site: 'https://week5-astro.vercel.app',
  // One URL form per page, so canonical tags and sitemap entries always match.
  // Astro pairs 'never' with file output (about.html); vercel.json serves it at /about
  // and redirects /about/ there.
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    // Two JSX frameworks, so each gets its own folder via `include`.
    // tsconfig defaults JSX types to React; Preact files add a jsxImportSource pragma.
    preact({ include: ['**/preact/**/*.{jsx,tsx}'] }),
    react({ include: ['**/react/**/*.{jsx,tsx}'] }),
    // Blog posts are MDX so they can hold images and components.
    mdx(),
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
