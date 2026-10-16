import type { PostSummary } from '../components/home/LatestPosts.astro';

/**
 * Newest posts in a blog category.
 * TODO(blog section): read from the blog content collection once it exists.
 * Until then there are no posts, and callers render their empty state.
 */
export async function getPostsByCategory(_category: string, _limit = 3): Promise<PostSummary[]> {
  return [];
}
