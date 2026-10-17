import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { navigate } from 'astro:transitions/client';
import './CommandBar.css';

interface Props {
  services: { name: string; href: string }[];
  bookHref: string;
}

/** Page-specific suggestions, rendered by the page as JSON (see BaseLayout `commandContext`). */
interface PageContext {
  heading: string;
  items: { title: string; href: string; hint?: string }[];
}

interface Item {
  id: string;
  group: string;
  label: string;
  /** Extra words the action matches when typing (its label can change, e.g. "Link copied ✓"). */
  keywords?: string;
  hint?: string;
  excerpt?: string;
  href?: string;
  run?: () => void;
}

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: { title?: string; type?: string };
}
interface Pagefind {
  init: () => Promise<void>;
  debouncedSearch: (
    query: string,
    options?: object,
    debounceMs?: number,
  ) => Promise<{ results: { data: () => Promise<PagefindResultData> }[] } | null>;
}

// Loaded on first search, not on page load. Module scope, so it survives page navigation
// along with the persisted island.
let pagefindPromise: Promise<Pagefind> | null = null;
function loadPagefind(): Promise<Pagefind> {
  if (!pagefindPromise) {
    // ?cmdk=bad-url points at a missing index, to test the error state.
    const bad = new URLSearchParams(window.location.search).get('cmdk') === 'bad-url';
    const path = bad ? '/pagefind/missing.js' : '/pagefind/pagefind.js';
    // A runtime URL, so Vite leaves it alone: the index only exists after the build.
    const url = new URL(path, window.location.origin).href;
    pagefindPromise = import(/* @vite-ignore */ url).then(async (pf: Pagefind) => {
      await pf.init();
      return pf;
    });
    pagefindPromise.catch(() => {
      pagefindPromise = null; // allow "Try again"
    });
  }
  return pagefindPromise;
}

/** Pagefind indexes the built files (about.html); the site serves clean URLs (/about). */
const cleanUrl = (url: string) => url.replace(/(\/index)?\.html$/, '') || '/';

function readPageContext(): PageContext | null {
  const el = document.querySelector('script[data-cmdk-context]');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as PageContext;
  } catch {
    return null;
  }
}

/**
 * Site-wide "Ask or search" command bar: Pagefind search across blog posts and service pages,
 * quick actions, and suggestions for the current page. Persisted across navigation.
 */
export default function CommandBar({ services, bookHref }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const opener = useRef<HTMLElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const [context, setContext] = useState<PageContext | null>(null);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [shortcut, setShortcut] = useState('Ctrl K');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    if (mac) setShortcut('⌘K');
  }, []);

  function show() {
    if (!dialog.current || dialog.current.open) return;
    setContext(readPageContext());
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current.showModal();
    setOpen(true);
    input.current?.focus();
  }

  function hide() {
    if (dialog.current?.open) dialog.current.close();
  }

  // ⌘K / Ctrl K toggles; "/" opens unless the person is typing somewhere.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.current?.open) hide();
        else show();
        return;
      }
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]') && !dialog.current?.contains(target);
      if (typing || dialog.current?.open) return;
      event.preventDefault();
      show();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Search as the person types.
  useEffect(() => {
    const q = query.trim();
    const id = ++requestId.current;
    if (!q) {
      setStatus('idle');
      setResults([]);
      return;
    }
    setStatus('loading');
    loadPagefind()
      .then((pf) => pf.debouncedSearch(q, {}, 150))
      .then(async (search) => {
        if (!search || id !== requestId.current) return; // superseded by newer typing
        const data = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
        if (id !== requestId.current) return;
        setResults(
          data.map((d, i) => ({
            id: `cmdk-result-${i}`,
            group: 'Articles and services',
            label: d.meta.title ?? cleanUrl(d.url),
            hint: d.meta.type,
            excerpt: d.excerpt,
            href: cleanUrl(d.url),
          })),
        );
        setStatus('done');
        setAnnouncement(`${data.length} ${data.length === 1 ? 'result' : 'results'}`);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setStatus('error');
        setAnnouncement("Search couldn't load.");
      });
  }, [query, retry]);

  const actions = useMemo<Item[]>(
    () => [
      { id: 'cmdk-book', group: 'Quick actions', label: 'Book a free call', keywords: 'book call contact consultation', href: bookHref },
      {
        id: 'cmdk-theme',
        group: 'Quick actions',
        label: 'Toggle dark mode',
        keywords: 'dark light mode theme',
        run: () => {
          const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
          toggle?.click();
          setAnnouncement(document.documentElement.dataset.theme === 'dark' ? 'Dark mode on' : 'Dark mode off');
        },
      },
      {
        id: 'cmdk-copy',
        group: 'Quick actions',
        label: copied ? 'Link copied ✓' : 'Copy page link',
        keywords: 'copy page link url share',
        run: () => {
          const done = () => {
            setCopied(true);
            setAnnouncement('Link copied');
            setTimeout(() => setCopied(false), 2000);
          };
          navigator.clipboard?.writeText(window.location.href).then(done, () => setAnnouncement("Couldn't copy the link."));
        },
      },
      ...services.map((s, i) => ({
        id: `cmdk-service-${i}`,
        group: 'Go to',
        label: s.name,
        keywords: 'service',
        hint: 'Service',
        href: s.href,
      })),
    ],
    [services, bookHref, copied],
  );

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const suggested = (context?.items ?? []).map((c, i) => ({
        id: `cmdk-context-${i}`,
        group: context!.heading,
        label: c.title,
        hint: c.hint,
        href: c.href,
      }));
      return [...suggested, ...actions];
    }
    return [...results, ...actions.filter((a) => `${a.label} ${a.keywords ?? ''}`.toLowerCase().includes(q))];
  }, [query, context, actions, results]);

  useEffect(() => setActive(0), [items.length, query]);

  // Keep the highlighted option in view.
  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function activate(item: Item | undefined) {
    if (!item) return;
    if (item.run) {
      item.run();
      return;
    }
    if (item.href) {
      hide();
      void navigate(item.href);
    }
  }

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (event.key === 'Home' && event.ctrlKey) {
      setActive(0);
    } else if (event.key === 'End' && event.ctrlKey) {
      setActive(items.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      activate(items[active]);
    }
  }

  // A click on the dialog element itself (not the panel) is a click on the backdrop.
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialog.current) hide();
  }

  const groups = items.reduce<{ name: string; items: { item: Item; index: number }[] }[]>((acc, item, index) => {
    const last = acc[acc.length - 1];
    if (last?.name === item.group) last.items.push({ item, index });
    else acc.push({ name: item.group, items: [{ item, index }] });
    return acc;
  }, []);

  const q = query.trim();

  return (
    <>
      <button type="button" className="cmdk-pill" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K /" onClick={show}>
        <svg className="cmdk-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span>Ask or search…</span>
        <kbd className="cmdk-kbd">{shortcut}</kbd>
      </button>

      <dialog
        ref={dialog}
        className="cmdk-dialog"
        aria-labelledby="cmdk-title"
        onClick={onDialogClick}
        onClose={() => {
          // The close event fires a moment after close(). If the bar was reopened in between
          // (e.g. ⌘K then "/" quickly), this event is stale: leave the open bar alone.
          if (dialog.current?.open) return;
          // Return focus to where it was before opening (or off the hidden input, if that was the page).
          const back = opener.current;
          if (back && back.isConnected && back !== document.body) back.focus();
          else (document.activeElement as HTMLElement | null)?.blur();
          opener.current = null;
          setOpen(false);
          setQuery('');
          setAnnouncement('');
        }}
      >
        <div className="cmdk-panel">
          <h2 id="cmdk-title" className="visually-hidden">
            Search and quick actions
          </h2>
          <div className="cmdk-input-row">
            <svg className="cmdk-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <input
              ref={input}
              className="cmdk-input"
              type="search"
              role="combobox"
              aria-label="Search articles and services"
              aria-expanded={open}
              aria-controls="cmdk-list"
              aria-autocomplete="list"
              aria-activedescendant={items[active]?.id}
              placeholder="Search articles and services…"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
            />
            <button type="button" className="cmdk-esc" onClick={hide}>
              Esc<span className="visually-hidden"> (close)</span>
            </button>
          </div>

          {q && status === 'loading' && (
            <p className="cmdk-state" data-state="loading">
              <span className="cmdk-spinner" aria-hidden="true" />
              Searching…
            </p>
          )}
          {q && status === 'error' && (
            <div className="cmdk-state cmdk-state-error" data-state="error">
              <p>Search couldn't load. Check your connection, then try again.</p>
              <button type="button" className="btn btn-secondary cmdk-retry" onClick={() => setRetry((n) => n + 1)}>
                Try again
              </button>
            </div>
          )}
          {q && status === 'done' && results.length === 0 && (
            <p className="cmdk-state" data-state="empty">
              No articles or services match “{q}”.
            </p>
          )}
          {!q && (
            <p className="cmdk-state cmdk-state-hint" data-state="idle">
              Type to search articles and services, or pick an action.
            </p>
          )}

          {/* tabIndex -1: the arrow keys move through options, so the scrollable list needs no Tab stop. */}
          <div ref={list} id="cmdk-list" className="cmdk-list" role="listbox" aria-label="Results and actions" tabIndex={-1}>
            {groups.map((group, g) => (
              <div key={group.name} role="group" aria-labelledby={`cmdk-group-${g}`} className="cmdk-group">
                <div id={`cmdk-group-${g}`} role="presentation" className="cmdk-group-label">
                  {group.name}
                </div>
                {group.items.map(({ item, index }) => (
                  <div
                    key={item.id}
                    id={item.id}
                    role="option"
                    aria-selected={index === active}
                    data-index={index}
                    className="cmdk-option"
                    onMouseMove={() => index !== active && setActive(index)}
                    onClick={() => activate(item)}
                  >
                    <span className="cmdk-option-main">
                      <span className="cmdk-option-label">{item.label}</span>
                      {item.excerpt && (
                        <span className="cmdk-option-excerpt" dangerouslySetInnerHTML={{ __html: item.excerpt }} />
                      )}
                    </span>
                    {item.hint && <span className="cmdk-option-hint">{item.hint}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="cmdk-footer" aria-hidden="true">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> to move
            </span>
            <span>
              <kbd>Enter</kbd> to open
            </span>
            <span>
              <kbd>Esc</kbd> to close
            </span>
          </p>
          <div className="visually-hidden" role="status" aria-live="polite">
            {announcement}
          </div>
        </div>
      </dialog>
    </>
  );
}
