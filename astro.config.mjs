// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the production domain once the Vercel deploy is live.
  // Canonical URLs, Open Graph URLs, robots.txt, and the sitemap all derive from this.
  site: 'https://docs-digital-consulting.example.com',
  // One URL form per page, so canonical tags and sitemap entries always match.
  trailingSlash: 'never',
  integrations: [
    sitemap({
      // Lead-magnet landing pages are noindex and stay out of the sitemap.
      filter: (page) => !new URL(page).pathname.startsWith('/lp/'),
    }),
  ],
});
