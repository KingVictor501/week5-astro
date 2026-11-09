// Site-wide data shared by the layout, header, footer, and route pages.

export const SITE_TITLE = "Doc's Digital Consulting";
export const SITE_DESCRIPTION =
  'AI and automation consulting, full-stack web development, and AI search optimization (GEO, AEO, and SEO) for small businesses, plus Google Ads, social media, and analytics.';

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
    hook: 'Hand the repetitive work to AI agents and automations.',
    summary: 'I map how your business runs, find the tasks AI can take over, then build and deploy the automations and AI agents, with the ROI measured.',
  },
  {
    slug: 'website-development-and-management',
    name: 'Full-Stack Web Development',
    keywords: [
      'custom website development for small businesses',
      'full-stack web development services',
      'WordPress, Shopify, Squarespace, and Wix website help',
    ],
    hook: 'Custom-built sites and web apps, plus help with the platform you already use.',
    summary: 'Fast, secure, accessible websites and web apps built and deployed from the ground up, with fixes and improvements for WordPress, Shopify, Squarespace, and Wix sites.',
  },
  {
    slug: 'ai-search-optimization',
    name: 'AI Search Optimization',
    keywords: [
      'generative engine optimization services',
      'answer engine optimization services',
      'SEO services for small businesses',
    ],
    hook: 'Get found on Google and cited in AI answers.',
    summary: 'Generative engine optimization (GEO), answer engine optimization (AEO), and SEO, so ChatGPT, Gemini, Perplexity, and Google recommend your business.',
  },
  {
    slug: 'paid-search',
    name: 'Paid Search',
    keywords: [
      'Google Ads management services for small businesses',
      'PPC management services for lead generation',
    ],
    hook: 'Ads that bring in leads, not just clicks.',
    summary: "Google Ads campaigns built for lead generation. Google's AI bidding gets the right signals, keyword targeting stays focused, and conversion tracking is set up so you can trust it.",
  },
  {
    slug: 'social-media-marketing',
    name: 'Social Media Marketing',
    keywords: [
      'social media marketing services for small businesses',
      'social media management and advertising services',
    ],
    hook: 'Show up consistently where your customers scroll.',
    summary: 'Social media management and advertising, with AI-assisted content workflows, that keeps your brand active and sends interested people back to your site.',
  },
  {
    slug: 'marketing-analytics-and-dashboards',
    name: 'Marketing Analytics & Dashboards',
    keywords: ['marketing analytics dashboard services', 'custom marketing performance dashboards'],
    hook: 'See which marketing is actually working.',
    summary: 'Automated dashboards that bring your channels, including AI search traffic, into one view, so decisions come from data instead of guesswork.',
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
      'Ideas and how-tos for social media that brings in customers, from content planning and community management to social ads that reach the right people.',
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
