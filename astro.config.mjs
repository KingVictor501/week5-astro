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
    sitemap({
      // Lead-magnet landing pages are noindex and stay out of the sitemap.
      filter: (page) => !new URL(page).pathname.startsWith('/lp/'),
    }),
  ],
  env: {
    schema: {
      // Formspree form endpoint for the Book a Call and lead magnet forms. It isn't a secret:
      // the browser needs it to send the form, so it lives here instead of in Vercel's settings.
      // Setting PUBLIC_FORMSPREE_ENDPOINT overrides it. Remove the default to go back to demo mode.
      PUBLIC_FORMSPREE_ENDPOINT: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: 'https://formspree.io/f/xyekoqyl',
      }),
    },
  },
});
