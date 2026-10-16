import { getCollection, type CollectionEntry } from 'astro:content';
import { BLOG_CATEGORIES, type BlogCategory } from '../consts';

export type BlogPost = CollectionEntry<'blog'>;

/** Serializable post card data, shared by Astro components and the React blog island. */
export interface PostSummary {
  title: string;
  description: string;
  href: string;
  date: Date;
  image: { src: string; alt: string; width: number; height: number };
  category?: { slug: string; name: string };
  readingTime?: number;
  type?: 'article' | 'case-study';
  tags?: string[];
}

/** Posts per blog index page. Override at build time with BLOG_PAGE_SIZE=1 to preview pagination. */
export const BLOG_PAGE_SIZE = Number(import.meta.env.BLOG_PAGE_SIZE) || 6;

const WORDS_PER_MINUTE = 225;

/** Words in the raw MDX body, with imports, JSX tags, and Markdown syntax stripped. */
export function countWords(body = ''): number {
  const text = body
    .replace(/^\s*(import|export)\s.*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

/** Minutes to read at a typical reading speed. */
export const readingTime = (body = ''): number => Math.max(1, Math.ceil(countWords(body) / WORDS_PER_MINUTE));

export const categoryFor = (slug: string): BlogCategory => BLOG_CATEGORIES.find((c) => c.slug === slug)!;

/** Published posts, newest first. Drafts appear only in `astro dev`. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function toSummary(post: BlogPost): PostSummary {
  const category = categoryFor(post.data.category);
  return {
    title: post.data.title,
    description: post.data.description,
    href: `/blog/${post.id}`,
    date: post.data.pubDate,
    image: post.data.featuredImage,
    category: { slug: category.slug, name: category.name },
    readingTime: readingTime(post.body),
    type: post.data.type,
    tags: post.data.tags,
  };
}

export async function getLatestPosts(limit = 3): Promise<PostSummary[]> {
  return (await getPublishedPosts()).slice(0, limit).map(toSummary);
}

/** Newest posts in a blog category, optionally excluding one post (e.g. the current one). */
export async function getPostsByCategory(category: string, limit = 3, excludeId?: string): Promise<PostSummary[]> {
  return (await getPublishedPosts())
    .filter((p) => p.data.category === category && p.id !== excludeId)
    .slice(0, limit)
    .map(toSummary);
}

/** The pinned featured post, or the newest post when none is pinned. */
export function pickFeatured(posts: BlogPost[]): BlogPost | undefined {
  return posts.find((p) => p.data.featured) ?? posts[0];
}

export const blogPageHref = (page: number) => (page <= 1 ? '/blog' : `/blog/page/${page}`);

export function paginate<T>(items: T[], size = BLOG_PAGE_SIZE): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages.length > 0 ? pages : [[]];
}
