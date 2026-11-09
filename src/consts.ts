// Site-wide data shared by the layout, header, footer, and route pages.

export const SITE_TITLE = "Doc's Digital Consulting";
export const SITE_DESCRIPTION =
  "Veteran-owned AI and automation consulting and web development for local businesses on Florida's Gulf Coast, from Crystal River to Sarasota.";

/** How the owner describes their role (About page, Person JSON-LD, author box). */
export const OWNER_ROLE = 'AI & Automation Consultant and Full-Stack Web Developer';

// Default social share image (1200x630 is the recommended Open Graph size).
export const DEFAULT_OG_IMAGE = {
  src: 'https://picsum.photos/id/0/1200/630',
  alt: 'A bright, modern office workspace with a laptop open on a desk',
  width: 1200,
  height: 630,
};

export interface Service {
  slug: string;
  /** Short label used in navigation and footer links. */
  name: string;
  keywords: string[];
  /** One-line hook for the homepage card front. */
  hook: string;
  /** Short description for the homepage card back. */
  summary: string;
}

// Order = navigation, footer, and homepage card order. Lead with AI, automation, and development.
export const SERVICES: Service[] = [
  {
    slug: 'ai-and-automation-consulting',
    name: 'AI & Automation Consulting',
    keywords: [
      'AI and automation consulting for small businesses',
      'AI agent and workflow automation services',
    ],
    hook: 'AI helpers that answer missed calls, book jobs, and chase invoices.',
    summary: 'I learn how your business runs, find the busywork AI can take over, then set it up and show you the hours and dollars it saves.',
  },
  {
    slug: 'website-development-and-management',
    name: 'Full-Stack Web Development',
    keywords: [
      'custom website development for small businesses',
      'full-stack web development services',
      'WordPress, Shopify, Squarespace, and Wix website help',
    ],
    hook: 'A website that brings in customers, built from scratch or fixed up.',
    summary: 'Fast, easy-to-use websites built from the ground up, or help with the WordPress, Shopify, Squarespace, or Wix site you already have.',
  },
  {
    slug: 'ai-search-optimization',
    name: 'AI Search Optimization',
    keywords: [
      'generative engine optimization services',
      'answer engine optimization services',
      'SEO services for small businesses',
    ],
    hook: 'Show up when locals ask Google or ChatGPT who to call.',
    summary: 'GEO, AEO, and SEO in plain English: making sure Google, ChatGPT, Gemini, and Perplexity know your business and recommend it.',
  },
  {
    slug: 'paid-search',
    name: 'Paid Search',
    keywords: [
      'Google Ads management services for small businesses',
      'PPC management services for lead generation',
    ],
    hook: 'Google Ads that bring in calls, not just clicks.',
    summary: 'Google Ads set up and managed so your budget goes to the searches that turn into calls and booked jobs, with tracking that shows what each dollar brings in.',
  },
  {
    slug: 'social-media-marketing',
    name: 'Social Media Marketing',
    keywords: [
      'social media marketing services for small businesses',
      'social media consulting and advertising services',
    ],
    hook: 'Stay in front of your neighbors on Facebook and Instagram.',
    summary: 'A curated posting plan and simple ads that keep your business top of mind and bring people through the door.',
  },
  {
    slug: 'marketing-analytics-and-dashboards',
    name: 'Marketing Analytics & Dashboards',
    keywords: ['marketing analytics dashboard services', 'custom marketing performance dashboards'],
    hook: 'See where your customers and clients actually come from.',
    summary: 'One simple dashboard that shows which ads, searches, referrals, and AI tools bring in calls and signed clients, updated automatically.',
  },
];

export interface BlogCategory {
  slug: string;
  name: string;
  /** Slug of the matching service page. */
  service: string;
  /** Intro paragraph for the category page. */
  intro: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: 'ai-and-automation',
    name: 'AI & Automation',
    service: 'ai-and-automation-consulting',
    intro:
      'Practical guides to putting AI to work in a small business: automations, AI agents, the latest models and what they cost, and how to measure the return.',
  },
  {
    slug: 'web-development',
    name: 'Web Development',
    service: 'website-development-and-management',
    intro:
      'Building and running a small business website that turns visitors into leads: speed, accessibility, security, platforms like WordPress and Shopify, and custom builds.',
  },
  {
    slug: 'ai-search-optimization',
    name: 'AI Search Optimization',
    service: 'ai-search-optimization',
    intro:
      'How to get your business found on Google and cited by AI answer engines: GEO, AEO, technical SEO, structured data, crawling and indexing, and local search.',
  },
  {
    slug: 'paid-search',
    name: 'Paid Search',
    service: 'paid-search',
    intro:
      'How to get more leads from Google Ads without wasting budget: keyword strategy, negative keywords, landing pages, and conversion tracking for small businesses.',
  },
  {
    slug: 'social-media-marketing',
    name: 'Social Media Marketing',
    service: 'social-media-marketing',
    intro:
      'Ideas and how-tos for social media that brings in customers, from platform choice and content planning to social ads that reach the right people.',
  },
  {
    slug: 'marketing-analytics-and-dashboards',
    name: 'Marketing Analytics & Dashboards',
    service: 'marketing-analytics-and-dashboards',
    intro:
      'Make sense of your marketing data: Google Analytics 4, conversion tracking, KPIs worth watching, and dashboards that show which channels actually work.',
  },
];

export const BOOK_A_CALL_PATH = '/book-a-call';

/** Lead magnet formats, and how each reads in a sentence ("Get the free checklist"). */
export const MAGNET_TYPES = ['checklist', 'scorecard', 'template', 'swipe-file', 'calculator', 'playbook'] as const;
export type MagnetType = (typeof MAGNET_TYPES)[number];
export const MAGNET_TYPE_LABELS: Record<MagnetType, string> = {
  checklist: 'checklist',
  scorecard: 'scorecard',
  template: 'template',
  'swipe-file': 'swipe file',
  calculator: 'calculator',
  playbook: 'playbook',
};

/** Landing page URL for a lead magnet. */
export const magnetPath = (service: string, magnet: string) => `/lp/${service}/${magnet}`;

// Book a Call details. [CONFIRM] these match how you actually work.
export const CALL_LENGTH = '30 minutes';
export const REPLY_TIME = 'one business day';
// [REPLACE: contact email] Fallback contact shown when the form can't send. null = placeholder text.
export const CONTACT_EMAIL: string | null = null;

// [REPLACE: full name] Used in the About page copy and the Person JSON-LD.
export const OWNER_NAME = 'Doc';

// [REPLACE: social profile links] e.g. { label: 'LinkedIn', href: 'https://www.linkedin.com/in/...' }
// Also add these URLs to `sameAs` in the Organization JSON-LD (BaseLayout).
export const SOCIAL_LINKS: { label: string; href: string }[] = [];

/** A service or category name for mid-sentence use: "AI Search Optimization" → "AI search optimization". Keeps acronyms. */
export const lowerName = (name: string) => name.replace(/\b[A-Z][a-z]+/g, (word) => word.toLowerCase());

/**
 * Service area: coastal towns on Florida's Gulf Coast, from Crystal River down to Sarasota,
 * plus remote clients anywhere. Shown on the page (homepage, About, footer) and in the
 * Organization JSON-LD `areaServed`, so the markup always matches the visible text.
 */
export const SERVICE_AREA = {
  region: "Florida's Gulf Coast",
  span: 'Crystal River to Sarasota',
  counties: ['Citrus', 'Hernando', 'Pasco', 'Pinellas', 'Manatee', 'Sarasota'],
  towns: [
    'Crystal River',
    'Homosassa',
    'Weeki Wachee',
    'Hernando Beach',
    'Hudson',
    'Port Richey',
    'New Port Richey',
    'Holiday',
    'Tarpon Springs',
    'Palm Harbor',
    'Dunedin',
    'Clearwater',
    'St. Petersburg',
    'Bradenton',
    'Anna Maria Island',
    'Sarasota',
  ],
  remote: true,
} as const;

/** "Citrus, Hernando, …, and Sarasota" style list for sentences. */
export const listJoin = (items: readonly string[]) =>
  items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
