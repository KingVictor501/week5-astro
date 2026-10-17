import { useEffect, useMemo, useState } from 'react';
import type { PostSummary } from '../../../lib/blog';
import './BlogBrowser.css';

interface PageLink {
  number: number;
  href: string;
}

interface Props {
  /** Every published post, newest first (used when filtering). */
  posts: PostSummary[];
  /** Posts on this server-rendered page (shown when no filter is active). */
  pagePosts: PostSummary[];
  /** Featured post, on page 1 only. */
  featured: PostSummary | null;
  categories: { slug: string; name: string }[];
  pagination: { current: number; last: number; pages: PageLink[]; prev?: string; next?: string };
  pageSize: number;
}

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

function PostCard({ post, featured = false }: { post: PostSummary; featured?: boolean }) {
  const HeadingTag = featured ? 'h2' : 'h3';
  return (
    <article className={`bb-card${featured ? ' bb-card-featured' : ''}`}>
      <img
        src={post.image.src}
        alt={post.image.alt}
        width={post.image.width}
        height={post.image.height}
        loading="lazy"
        decoding="async"
      />
      <div className="bb-card-body">
        {featured && <p className="bb-featured-label">Featured</p>}
        <p className="bb-card-kicker">
          {post.category?.name}
          {post.type === 'case-study' && <span className="bb-type">Case study</span>}
          {post.type === 'news' && <span className="bb-type">News</span>}
        </p>
        <HeadingTag className="bb-card-title">
          <a href={post.href}>{post.title}</a>
        </HeadingTag>
        <p className="bb-card-desc">{post.description}</p>
        <p className="bb-card-meta">
          <time dateTime={new Date(post.date).toISOString()}>{formatDate(post.date)}</time>
          {post.readingTime ? ` · ${post.readingTime} min read` : ''}
        </p>
      </div>
    </article>
  );
}

export default function BlogBrowser({ posts, pagePosts, featured, categories, pagination, pageSize }: Props) {
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(pageSize);

  // Restore filters from the URL (?category=&q=) so filtered views can be shared.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('category');
    if (c && categories.some((x) => x.slug === c)) setCategory(c);
    setQuery(params.get('q') ?? '');
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    category ? url.searchParams.set('category', category) : url.searchParams.delete('category');
    query.trim() ? url.searchParams.set('q', query.trim()) : url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', url);
    setVisible(pageSize);
  }, [category, query]);

  const filtering = category !== '' || query.trim() !== '';
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category && p.category?.slug !== category) return false;
      if (!q) return true;
      return [p.title, p.description, p.category?.name ?? '', ...(p.tags ?? [])].join(' ').toLowerCase().includes(q);
    });
  }, [posts, category, query]);

  const categoryName = categories.find((c) => c.slug === category)?.name;
  const summary = filtering
    ? `${results.length} ${results.length === 1 ? 'article' : 'articles'}${categoryName ? ` in ${categoryName}` : ''}${
        query.trim() ? ` matching “${query.trim()}”` : ''
      }`
    : '';

  const clear = () => {
    setCategory('');
    setQuery('');
  };

  return (
    <div className="bb">
      <div className="bb-controls">
        <div className="bb-search">
          <label htmlFor="bb-search-input">Search articles</label>
          <input
            id="bb-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “Google Ads” or “GA4”"
            autoComplete="off"
          />
        </div>
        <div className="bb-chips" role="group" aria-label="Filter by category">
          <button type="button" aria-pressed={category === ''} onClick={() => setCategory('')}>
            All topics
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => setCategory((cur) => (cur === c.slug ? '' : c.slug))}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bb-status-row">
        <p className="bb-status" role="status" aria-live="polite">
          {summary}
        </p>
        {filtering && (
          <button type="button" className="bb-clear" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>

      {filtering ? (
        results.length > 0 ? (
          <>
            <h2 className="visually-hidden">Matching articles</h2>
            <ul className="bb-grid" role="list">
              {results.slice(0, visible).map((post) => (
                <li key={post.href}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
            {visible < results.length && (
              <button type="button" className="btn btn-secondary bb-more" onClick={() => setVisible((v) => v + pageSize)}>
                Show more articles
              </button>
            )}
          </>
        ) : (
          <div className="bb-empty">
            <p>No articles match yet. Try another topic or search term.</p>
            <button type="button" className="btn btn-secondary" onClick={clear}>
              Show all articles
            </button>
          </div>
        )
      ) : (
        <>
          {featured && <PostCard post={featured} featured />}
          {pagePosts.length > 0 && (
            <>
              <h2 className="bb-list-title">{pagination.current > 1 ? `Articles, page ${pagination.current}` : 'Latest articles'}</h2>
              <ul className="bb-grid" role="list">
                {pagePosts.map((post) => (
                  <li key={post.href}>
                    <PostCard post={post} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {!featured && pagePosts.length === 0 && <p className="bb-empty">Articles are on the way.</p>}
          {pagination.last > 1 && (
            <nav className="bb-pagination" aria-label="Blog pages">
              {pagination.prev ? <a href={pagination.prev}>← Newer</a> : <span aria-hidden="true" />}
              <ol role="list">
                {pagination.pages.map((p) => (
                  <li key={p.number}>
                    <a href={p.href} aria-current={p.number === pagination.current ? 'page' : undefined}>
                      <span className="visually-hidden">Page </span>
                      {p.number}
                    </a>
                  </li>
                ))}
              </ol>
              {pagination.next ? <a href={pagination.next}>Older →</a> : <span aria-hidden="true" />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
