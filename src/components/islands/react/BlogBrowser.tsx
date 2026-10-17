import { useEffect, useMemo, useState } from 'react';
import './BlogBrowser.css';

interface Props {
  /** id of the element holding the static post cards rendered by Astro. */
  targetId: string;
  categories: { slug: string; name: string }[];
}

/**
 * Search and category filter for the /blog index. The cards are pre-rendered static HTML;
 * this island never renders them. It toggles `hidden` on each `[data-post]` element
 * based on its `data-category` and `data-search` attributes.
 */
export default function BlogBrowser({ targetId, categories }: Props) {
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<{ el: HTMLElement; category: string; search: string }[]>([]);

  // Read the static cards once; their data attributes drive filtering.
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    setCards(
      [...target.querySelectorAll<HTMLElement>('[data-post]')].map((el) => ({
        el,
        category: el.dataset.category ?? '',
        search: el.dataset.search ?? '',
      })),
    );

    // Restore filters from the URL (?category=&q=) so filtered views can be shared.
    const params = new URLSearchParams(window.location.search);
    const c = params.get('category');
    if (c && categories.some((x) => x.slug === c)) setCategory(c);
    setQuery(params.get('q') ?? '');
  }, [targetId]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => new Set(cards.filter((c) => (!category || c.category === category) && (!q || c.search.includes(q))).map((c) => c.el)),
    [cards, category, q],
  );
  const shown = matches.size;

  // Show or hide the existing cards; they are never re-rendered.
  useEffect(() => {
    if (cards.length === 0) return;
    cards.forEach(({ el }) => {
      el.hidden = !matches.has(el);
    });
    document
      .getElementById(targetId)
      ?.querySelectorAll<HTMLElement>('[data-filter-heading]')
      .forEach((el) => {
        el.hidden = category !== '' || q !== '';
      });

    const url = new URL(window.location.href);
    category ? url.searchParams.set('category', category) : url.searchParams.delete('category');
    q ? url.searchParams.set('q', query.trim()) : url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', url);
  }, [cards, matches]);

  const filtering = category !== '' || query.trim() !== '';
  const categoryName = categories.find((c) => c.slug === category)?.name;
  const summary = filtering
    ? `${shown} ${shown === 1 ? 'article' : 'articles'}${categoryName ? ` in ${categoryName}` : ''}${
        query.trim() ? ` matching “${query.trim()}”` : ''
      }`
    : '';

  const clear = () => {
    setCategory('');
    setQuery('');
  };

  return (
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
          aria-controls={targetId}
        />
      </div>
      <div className="bb-chips" role="group" aria-label="Filter by category">
        <button type="button" aria-pressed={category === ''} aria-controls={targetId} onClick={() => setCategory('')}>
          All topics
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            aria-pressed={category === c.slug}
            aria-controls={targetId}
            onClick={() => setCategory((cur) => (cur === c.slug ? '' : c.slug))}
          >
            {c.name}
          </button>
        ))}
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

      {filtering && shown === 0 && (
        <div className="bb-empty">
          <p>No articles match yet. Try another topic or search term.</p>
          <button type="button" className="btn btn-secondary" onClick={clear}>
            Show all articles
          </button>
        </div>
      )}
    </div>
  );
}
