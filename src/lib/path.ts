/**
 * The page's public path, e.g. "/about" or "/blog/2".
 * build.format is 'file', so at build time Astro.url ends in ".html" (and the
 * homepage is "/index.html"); Vercel's cleanUrls serves them without it.
 */
export function pagePath(url: URL): string {
  return url.pathname.replace(/(\/index)?\.html$/, '').replace(/\/+$/, '') || '/';
}
