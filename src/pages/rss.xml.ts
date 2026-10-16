import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { categoryFor, getPublishedPosts } from '../lib/blog';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPublishedPosts();
  return rss({
    title: `${SITE_TITLE} Blog`,
    description: SITE_DESCRIPTION,
    site: site!,
    // Matches trailingSlash: 'never' in astro.config.mjs.
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}`,
      categories: [categoryFor(post.data.category).name, ...post.data.tags],
    })),
    customData: '<language>en-us</language>',
  });
};
