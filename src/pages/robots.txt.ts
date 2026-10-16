import type { APIRoute } from 'astro';

// /lp/ pages are NOT disallowed here: crawlers must be able to fetch them to see
// their noindex tag. They're kept out of the sitemap instead (astro.config.mjs).
export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapURL.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
