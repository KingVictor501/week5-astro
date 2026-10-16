// Site-wide data shared by the layout, header, footer, and route pages.

export const SITE_TITLE = "Doc's Digital Consulting";
export const SITE_DESCRIPTION =
  'Digital marketing consulting for small businesses: SEO, paid search, social media, analytics dashboards, CRM automation, AI, and website development.';

// Default social share image (1200x630 is the recommended Open Graph size).
export const DEFAULT_OG_IMAGE = {
  src: 'https://loremflickr.com/1200/630/marketing,office?lock=1001',
  alt: 'A bright, modern office workspace with a laptop open on a desk',
  width: 1200,
  height: 630,
};

export interface Service {
  slug: string;
  /** Short label used in navigation and footer links. */
  name: string;
  /** Page H1, including the primary target keyword. */
  heading: string;
  title: string;
  description: string;
  keywords: string[];
  /** One-line hook for the homepage card front. */
  hook: string;
  /** Short description for the homepage card back. */
  summary: string;
}

export const SERVICES: Service[] = [
  {
    slug: 'search-engine-optimization',
    name: 'Search Engine Optimization',
    heading: 'SEO Services for Small Businesses',
    title: 'SEO Services for Small Businesses',
    description:
      'SEO services for small businesses: technical fixes, content strategy, and local search work that helps the right customers find you.',
    keywords: ['SEO services for small businesses'],
    hook: 'Get found by customers who are already searching for you.',
    summary: 'Technical fixes, on-page optimization, and content planning so your site ranks for the searches that turn into calls, not just traffic.',
  },
  {
    slug: 'paid-search',
    name: 'Paid Search',
    heading: 'Google Ads Management Services for Small Businesses',
    title: 'Google Ads & PPC Management for Small Businesses',
    description:
      'Google Ads management services for small businesses and PPC management for lead generation, focused on qualified leads instead of wasted clicks.',
    keywords: [
      'Google Ads management services for small businesses',
      'PPC management services for lead generation',
    ],
    hook: 'Ads that bring in leads, not just clicks.',
    summary: 'Google Ads and PPC campaigns built for lead generation, with focused keyword targeting, clear landing pages, and conversion tracking you can trust.',
  },
  {
    slug: 'social-media-marketing',
    name: 'Social Media Marketing',
    heading: 'Social Media Marketing Services for Small Businesses',
    title: 'Social Media Marketing Services for Small Businesses',
    description:
      'Social media marketing services for small businesses, including social media management and advertising built around your goals.',
    keywords: [
      'social media marketing services for small businesses',
      'social media management and advertising services',
    ],
    hook: 'Show up consistently where your customers scroll.',
    summary: 'Social media management and advertising that keeps your brand active, builds trust, and sends interested people back to your site.',
  },
  {
    slug: 'marketing-analytics-and-dashboards',
    name: 'Marketing Analytics & Dashboards',
    heading: 'Marketing Analytics Dashboard Services',
    title: 'Marketing Analytics Dashboard Services',
    description:
      'Marketing analytics dashboard services and custom marketing performance dashboards that show which channels actually drive results.',
    keywords: ['marketing analytics dashboard services', 'custom marketing performance dashboards'],
    hook: 'See which marketing is actually working.',
    summary: 'Custom marketing performance dashboards that bring your channels into one view, so decisions come from data instead of guesswork.',
  },
  {
    slug: 'crm-marketing-automation',
    name: 'CRM & Marketing Automation',
    heading: 'CRM and Marketing Automation Services',
    title: 'CRM and Marketing Automation Services',
    description:
      'CRM and marketing automation services, from CRM setup to email marketing automation that follows up with leads for you.',
    keywords: ['CRM and marketing automation services', 'CRM setup and email marketing automation'],
    hook: 'Follow up with every lead, automatically.',
    summary: "CRM setup and email marketing automation that captures leads, nurtures them, and reminds you when it's time to reach out.",
  },
  {
    slug: 'ai-entrepreneurship',
    name: 'AI for Entrepreneurs',
    heading: 'AI Consulting for Small Business Entrepreneurs',
    title: 'AI Consulting for Small Business Entrepreneurs',
    description:
      'AI consulting for small business entrepreneurs and AI business automation services that save time on repetitive marketing work.',
    keywords: [
      'AI consulting for small business entrepreneurs',
      'AI business automation services for entrepreneurs',
    ],
    hook: 'Put AI to work on the busywork.',
    summary: 'Practical AI consulting and automation for entrepreneurs: content workflows, lead handling, and reporting that free up time for the work only you can do.',
  },
  {
    slug: 'website-development-and-management',
    name: 'Website Development',
    heading: 'Small Business Website Development Services',
    title: 'Small Business Website Development Services',
    description:
      'Small business website development services: custom website design and development for small businesses, plus ongoing management.',
    keywords: [
      'small business website development services',
      'custom website design and development for small businesses',
    ],
    hook: 'A website built to turn visitors into leads.',
    summary: 'Custom website design and development for small businesses: fast, accessible, search-friendly sites, plus ongoing updates and management.',
  },
];

export interface BlogCategory {
  slug: string;
  name: string;
  /** Slug of the matching service page. */
  service: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  { slug: 'technical-seo', name: 'Technical SEO', service: 'search-engine-optimization' },
  { slug: 'paid-search', name: 'Paid Search', service: 'paid-search' },
  { slug: 'social-media-marketing', name: 'Social Media Marketing', service: 'social-media-marketing' },
  {
    slug: 'marketing-analytics-and-dashboards',
    name: 'Marketing Analytics & Dashboards',
    service: 'marketing-analytics-and-dashboards',
  },
  { slug: 'crm-marketing-automation', name: 'CRM & Marketing Automation', service: 'crm-marketing-automation' },
  { slug: 'ai-entrepreneurship', name: 'AI for Entrepreneurs', service: 'ai-entrepreneurship' },
  { slug: 'web-development', name: 'Web Development', service: 'website-development-and-management' },
];

export const BOOK_A_CALL_PATH = '/book-a-call';

// [REPLACE: social profile links] e.g. { label: 'LinkedIn', href: 'https://www.linkedin.com/in/...' }
// Also add these URLs to `sameAs` in the Organization JSON-LD (BaseLayout).
export const SOCIAL_LINKS: { label: string; href: string }[] = [];
