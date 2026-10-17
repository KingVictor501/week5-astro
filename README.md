# Doc's Digital Consulting

The website for Doc's Digital Consulting, a marketing consultancy for small businesses. It covers six services (SEO, Google Ads, social media, analytics dashboards, AI, and web development), a 38-post blog, a Book a Call form, and 12 free lead magnet landing pages.

**Live site:** https://week5-astro.vercel.app

Built with [Astro 7](https://docs.astro.build) (TypeScript strict), React and Preact islands, and [Pagefind](https://pagefind.app) search. Deployed as a static site on Vercel.

## Commands

Run these from the project root. The site needs Node 24.

| Command           | What it does                                                   |
| :---------------- | :------------------------------------------------------------- |
| `npm install`     | Install dependencies                                           |
| `npm run dev`     | Start the dev server at `localhost:4321`                       |
| `npm run build`   | Build the site to `./dist/` and write the Pagefind search index |
| `npm run preview` | Serve the built site locally                                   |

Search only works after `npm run build`, because the index is created from the built pages.

## Pages

| URL                         | What it is                                          | Source                                  |
| :-------------------------- | :-------------------------------------------------- | :-------------------------------------- |
| `/`                         | Homepage with the ROI calculator                    | `src/pages/index.astro`                 |
| `/about`                    | About page                                          | `src/pages/about.astro`                 |
| `/[service]`                | 6 service pages, e.g. `/paid-search`                | `src/pages/[service].astro`             |
| `/blog`                     | Blog index with filter and search                   | `src/pages/blog/index.astro`            |
| `/blog/[slug]`              | 38 blog posts                                       | `src/pages/blog/[slug].astro`           |
| `/blog/category/[category]` | One page per category                               | `src/pages/blog/category/`              |
| `/book-a-call`              | Book a Call form                                    | `src/pages/book-a-call.astro`           |
| `/lp/[service]/[magnet]`    | 12 lead magnet landing pages (not in the sitemap)   | `src/pages/lp/[service]/[magnet].astro` |
| `/404`                      | Not found page with a link back home                | `src/pages/404.astro`                   |

Content lives in two collections defined in `src/content.config.ts` (Zod schemas):

- `src/content/blog/`: blog posts (Markdown and MDX)
- `src/content/services/`: one YAML file per service, including its two lead magnets

Every page uses `src/layouts/BaseLayout.astro`, which holds the shared `<head>` (SEO tags, JSON-LD, theme script), header, footer and command bar. Landing pages use it in `minimal` mode, with no site navigation.

## Islands and how they load

Most of the site is plain HTML with no JavaScript. Only six interactive parts ship JavaScript, and each one loads when it's needed.

| Island                     | Where                 | Framework | Directive      | What it does                                         |
| :------------------------- | :-------------------- | :-------- | :------------- | :--------------------------------------------------- |
| `BookCallForm`             | `/book-a-call`        | React     | `client:load`    | Lead form with validation                            |
| `LeadMagnetForm`           | `/lp/...` pages       | React     | `client:load`    | Email signup for a free download                     |
| `CommandBar`               | Every page except `/lp` | React   | `client:idle`    | Site search and quick actions (⌘K, Ctrl K or `/`)    |
| `BlogBrowser`              | `/blog`               | React     | `client:idle`    | Category filter and search over the post cards       |
| `ListenPlayer`             | Every blog post       | React     | `client:idle`    | "Listen to this post" text-to-speech player          |
| `RoiCalculator`            | Homepage              | Preact    | `client:visible` | Estimates return on ad spend                         |

Island source files are in `src/components/islands/react/` and `src/components/islands/preact/`.

### Why each directive

- **`client:load` (right away): the two forms.** On `/book-a-call` and the landing pages, the form is the reason the page exists. People often start typing within a second or two, so the validation, error messages and success state have to work as soon as the page opens. Both forms also use `method="post"`, so a submit that happens before JavaScript loads can never put an email address in the URL.
- **`client:idle` (once the browser is free): command bar, blog filter, listen player.** None of these are needed to read the page, and the page is already fully readable without them. The blog index renders all 38 post cards as static HTML, and the filter only hides and shows them. Waiting for idle keeps their JavaScript out of the way of the first paint. The command bar also uses `transition:persist`, so it stays loaded, and keeps any open search, as you move between pages.
- **`client:visible` (when scrolled into view): ROI calculator.** It sits below the fold on the homepage, and many visitors never scroll that far. Its code only downloads when it comes into view. It's written in Preact instead of React because Preact is much smaller, which suits a widget that might never load.

To see the difference: open DevTools → Network and load `/book-a-call`. The form's script loads right away. On the homepage, `RoiCalculator` doesn't load until you scroll down to it.

## Command bar: the fetch island with four states

The command bar searches every blog post and service page. When you first type, it fetches the [Pagefind](https://pagefind.app) search library and index over the network (`/pagefind/pagefind.js` and its index files). Pagefind builds that index from the built pages when `npm run build` finishes (see the `pagefindIndex` integration in `astro.config.mjs`).

Each state has its own UI. Here's how to trigger them:

| State   | What you see                                                   | How to trigger it                                                                 |
| :------ | :------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| Loading | Spinner and "Searching…"                                       | DevTools → Network → throttle to **Slow 3G**, open the bar, and type `seo`        |
| Error   | "Search couldn't load. Check your connection, then try again." with a **Try again** button | Open any page with `?cmdk=bad-url` (e.g. `/?cmdk=bad-url`), then type a search. This points the fetch at a missing file. |
| Empty   | "No articles or services match “…”"                            | Type something that matches nothing, e.g. `zzzzqx`                                |
| Success | A list of matching posts and services, with a short excerpt for each | Type a real term, e.g. `google ads`                                               |

With nothing typed, the bar shows quick actions (book a call, jump to a service, copy the page link, toggle the theme) and, on posts and service pages, related links for that page.

## Forms

Both forms share the same validation and error handling (`src/lib/lead.ts`). An empty submit shows an error next to each field that needs one and moves focus to the first one. A valid submit shows a success message.

The forms are meant to send through [Formspree](https://formspree.io). Until the `PUBLIC_FORMSPREE_ENDPOINT` environment variable is set, they run in **demo mode**: nothing is sent, and the page says so. Landing pages show a placeholder in place of the download link. In demo mode you can test failures with `?simulate=` in the URL (the values are in `SIMULATIONS` in `src/lib/lead.ts`).

## Third-party script audit

**No third-party scripts load on any page.** The built HTML has no external `<script>` tags, no iframes, no analytics, no ad tags and no tracking pixels. Every script comes from this site's own domain.

| Item | What it's used for | Decision | Why |
| :--- | :--- | :--- | :--- |
| Google Analytics, Tag Manager, Meta Pixel | Tracking | **Removed** (never added) | The site doesn't need tracking yet. These are often the slowest scripts on a small-business site, and they would need a cookie notice. If analytics are added later, use a lightweight, cookie-free tool that loads with `defer`. |
| Google Fonts and other web font hosts | Fonts | **Removed** (never added) | The site uses system fonts, so there's no font download and no extra connection. |
| Embedded video, maps and social widgets | Media | **Removed** (never added) | Each embed loads a large third-party script. Link out instead. |
| picsum.photos | Placeholder photos | **Kept, at build time only** | `<Image>` from `astro:assets` downloads each photo during the build and turns it into small, resized WebP files on this site. Visitors' browsers never contact picsum. The only picsum URLs left are the `og:image` tags, which social sites fetch when a link is shared. These are placeholders until real photos replace them. |
| Pagefind | Command bar search | **Kept, deferred** | It's self-hosted (first-party), not a third party. It isn't in the page at all until someone types in the search box, and only then is it fetched. |
| Astro `ClientRouter` (view transitions and link prefetch) | Smooth page changes; keeps the command bar open | **Kept** | First-party and small. With `ClientRouter`, Astro prefetches every same-site link using the `hover` strategy: a page is fetched only when a visitor hovers over or focuses its link, never on page load. |
| React and Preact runtimes | Islands | **Kept, deferred** | First-party. Loaded only on pages that have an island, and only when that island's directive fires (see above). |
| Formspree | Form submissions | **Kept for later, no script** | When it's connected, the forms send a `fetch` to Formspree only on submit. There's no Formspree script on the page. |

How to check this yourself: run `npm run build`, then search `dist/` for `<script src="http`. There are no matches.

## Performance

- Images: every photo goes through `astro:assets` `<Image>` (WebP at quality 60, with responsive `srcset`/`sizes`). The image that's largest on screen loads with `priority`.
- CSS: inlined into each page (`build.inlineStylesheets: 'always'`), so the first paint doesn't wait on stylesheet requests.
- Fonts: system fonts only, so there's nothing to download.

Lighthouse (mobile) on the live site scores 100 for Performance on the homepage, `/about` and `/blog`.

## Before launch: placeholders to replace

The site never invents clients, testimonials or results. Anything not yet known is marked `[REPLACE: …]` in the code or on the page:

- `CONTACT_EMAIL`, `OWNER_NAME` and `SOCIAL_LINKS` in `src/consts.ts`
- The headshot on the About page
- The lead magnet download files (`file` in each `src/content/services/*.yaml`)
- `PUBLIC_FORMSPREE_ENDPOINT` (set it in Vercel's environment variables)
- The placeholder photos, including the `og:image` share images
