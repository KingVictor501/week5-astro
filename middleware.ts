// Maintenance mode for the live site (Vercel Routing Middleware).
//
// While MAINTENANCE is true, every page on Vercel shows the maintenance page below, with a
// 503 "Service Unavailable" status and a Retry-After header. That status tells Google and other
// search engines the downtime is temporary, so they keep the site's existing listings.
//
// To bring the site back: set MAINTENANCE to false (or delete this file), then commit and push.
//
// To preview the real site while it's down: in Vercel, add an environment variable named
// MAINTENANCE_BYPASS with any secret word, redeploy, then visit /?preview=<that word> once.
// A cookie keeps you past this page on that browser for a week.
//
// This only runs on Vercel. `astro dev` and `astro preview` show the normal site.

const MAINTENANCE = true;

const BYPASS_COOKIE = 'site_preview';

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Back Soon | Doc's Digital Consulting</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  :root {
    color-scheme: light dark;
    --bg: #fbfbf7; --surface: #edf3ef; --text: #24302f; --muted: #4f5e5b;
    --heading: #1c2826; --primary: #0e6b66; --accent: #7a5713; --accent-soft: #f2e6c9;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #11201f; --surface: #162927; --text: #e3efed; --muted: #a9bfbb;
      --heading: #f2f8f7; --primary: #56cdbf; --accent: #e9c27a; --accent-soft: #33291a;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem 1rem;
    background: var(--bg); color: var(--text);
    font: 1.125rem/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  main {
    width: 100%; max-width: 34rem; padding: 2.5rem 2rem; text-align: center;
    background: var(--surface); border-radius: 1rem; border-top: 6px solid var(--primary);
  }
  .badge {
    display: inline-block; margin: 0 0 1.25rem; padding: 0.25rem 0.875rem; border-radius: 999px;
    background: var(--accent-soft); color: var(--accent); font-size: 0.875rem; font-weight: 600;
  }
  h1 { margin: 0 0 0.75rem; color: var(--heading); font-size: clamp(1.75rem, 5vw, 2.25rem); line-height: 1.2; }
  p { margin: 0 0 1rem; }
  .muted { color: var(--muted); font-size: 1rem; margin: 0; }
  .waves { display: block; width: 7rem; height: auto; margin: 0 auto 1.5rem; color: var(--primary); }
</style>
</head>
<body>
<main>
  <svg class="waves" viewBox="0 0 112 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round">
    <path d="M4 14c9-8 17-8 26 0s17 8 26 0 17-8 26 0 17 8 26 0"/>
    <path d="M4 30c9-8 17-8 26 0s17 8 26 0 17-8 26 0 17 8 26 0" opacity="0.55"/>
  </svg>
  <p class="badge">Doc's Digital Consulting</p>
  <h1>We'll Be Right Back</h1>
  <p>The site is down for a quick tune-up while we make a few improvements.</p>
  <p class="muted">Please check back soon. Thanks for your patience.</p>
</main>
</body>
</html>`;

export default function middleware(request: Request): Response | undefined {
  if (!MAINTENANCE) return undefined;

  const url = new URL(request.url);
  // Let the favicon load so the browser tab looks right.
  if (url.pathname.startsWith('/favicon')) return undefined;

  const secret = process.env.MAINTENANCE_BYPASS;
  if (secret) {
    if (url.searchParams.get('preview') === secret) {
      url.searchParams.delete('preview');
      return new Response(null, {
        status: 307,
        headers: {
          Location: url.toString(),
          'Set-Cookie': `${BYPASS_COOKIE}=${encodeURIComponent(secret)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    const cookies = request.headers.get('cookie') ?? '';
    if (cookies.split(/;\s*/).includes(`${BYPASS_COOKIE}=${encodeURIComponent(secret)}`)) return undefined;
  }

  return new Response(PAGE, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '86400',
      'Cache-Control': 'no-store',
    },
  });
}
