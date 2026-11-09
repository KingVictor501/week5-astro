// JSON-LD builders. BaseLayout emits the site-wide graph on every page (Organization, WebSite,
// this page's WebPage, its BreadcrumbList, and FAQPage questions when the page has an FAQ).
// Pages add their own main entity (Service, Person, BlogPosting, ItemList) through the head slot.

export const organizationId = (site: URL) => `${new URL('/', site).href}#organization`;
export const websiteId = (site: URL) => `${new URL('/', site).href}#website`;

/** schema.org page types used on this site. Every page is at least a WebPage. */
export type PageType = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';

export interface FaqItem {
  question: string;
  /** Plain text, identical to the answer shown on the page (Google requires the markup to match). */
  answer: string;
}

/** The WebSite entity: the site's name and publisher, referenced by every WebPage. */
export function webSiteSchema({ name, description }: { name: string; description: string }, site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(site),
    name,
    description,
    url: new URL('/', site).href,
    inLanguage: 'en-US',
    publisher: { '@id': organizationId(site) },
  };
}

/**
 * The WebPage entity for the current URL. When the page has FAQs, it is also typed FAQPage and
 * its questions become the mainEntity (answer engines and Google read them as Q&A pairs), so the
 * page's own entity is linked with `about` instead.
 */
export function webPageSchema(
  {
    type = 'WebPage',
    url,
    name,
    description,
    image,
    hasBreadcrumb,
    faq = [],
    mainEntityId,
  }: {
    type?: PageType;
    url: string;
    name: string;
    description: string;
    image?: string;
    hasBreadcrumb: boolean;
    faq?: FaqItem[];
    /** @id of the page's main entity (a Service, Person, or BlogPosting), if any. */
    mainEntityId?: string;
  },
  site: URL,
) {
  const hasFaq = faq.length > 0;
  return {
    '@context': 'https://schema.org',
    '@type': hasFaq ? [type, 'FAQPage'] : type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': websiteId(site) },
    publisher: { '@id': organizationId(site) },
    ...(image && { primaryImageOfPage: { '@type': 'ImageObject', url: image } }),
    ...(hasBreadcrumb && { breadcrumb: { '@id': `${url}#breadcrumb` } }),
    ...(hasFaq
      ? {
          mainEntity: faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
          ...(mainEntityId && { about: { '@id': mainEntityId } }),
        }
      : mainEntityId && { mainEntity: { '@id': mainEntityId } }),
  };
}

/** ItemList for blog listing pages: the posts in the order shown. */
export function itemListSchema(items: { name: string; path: string }[], site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: new URL(item.path, site).href,
    })),
  };
}

export interface Crumb {
  name: string;
  /** Root-relative path, e.g. "/paid-search". */
  path: string;
}

/** BreadcrumbList per Google's requirements: ordered items with position, name, and item URL. */
export function breadcrumbSchema(crumbs: Crumb[], site: URL) {
  // The last crumb is the current page, so its URL anchors the @id the WebPage points to.
  const pageURL = new URL(crumbs[crumbs.length - 1].path, site).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageURL}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.path, site).href,
    })),
  };
}

export function serviceSchema(
  {
    name,
    serviceType,
    description,
    path,
    image,
  }: { name: string; serviceType: string; description: string; path: string; image: string },
  site: URL,
) {
  const url = new URL(path, site).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name,
    serviceType,
    description,
    url,
    image,
    provider: { '@id': organizationId(site) },
    audience: { '@type': 'BusinessAudience', name: 'Small businesses and entrepreneurs' },
  };
}

export const personId = (site: URL) => `${new URL('/about', site).href}#person`;

export interface PersonCredential {
  name: string;
  category: 'degree' | 'certificate' | 'certification';
  /** Issuing or recognizing organization, only when it is part of the stated fact. */
  recognizedBy?: { type: 'CollegeOrUniversity' | 'Organization'; name: string };
}

/** Person entity for the About page. Only pass facts the site owner has provided. */
export function personSchema(
  {
    name,
    jobTitle,
    description,
    image,
    alumniOf,
    credentials,
    knowsAbout,
    sameAs,
  }: {
    name: string;
    jobTitle: string;
    description: string;
    image?: string;
    alumniOf: { name: string; department?: string }[];
    credentials: PersonCredential[];
    knowsAbout: string[];
    sameAs: string[];
  },
  site: URL,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId(site),
    name,
    jobTitle,
    description,
    url: new URL('/about', site).href,
    ...(image && { image }),
    worksFor: { '@id': organizationId(site) },
    alumniOf: alumniOf.map((school) => ({
      '@type': 'CollegeOrUniversity',
      name: school.name,
      ...(school.department && { department: { '@type': 'Organization', name: school.department } }),
    })),
    hasCredential: credentials.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.name,
      credentialCategory: c.category,
      ...(c.recognizedBy && { recognizedBy: { '@type': c.recognizedBy.type, name: c.recognizedBy.name } }),
    })),
    knowsAbout,
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function blogPostingSchema(
  {
    title,
    description,
    path,
    image,
    datePublished,
    dateModified,
    section,
    keywords,
    wordCount,
    authorName,
    news = false,
  }: {
    title: string;
    description: string;
    path: string;
    image: string;
    datePublished: Date;
    dateModified?: Date;
    section: string;
    keywords: string[];
    wordCount: number;
    authorName: string;
    /** NewsArticle for posts about dated events; BlogPosting otherwise. */
    news?: boolean;
  },
  site: URL,
) {
  const url = new URL(path, site).href;
  return {
    '@context': 'https://schema.org',
    '@type': news ? 'NewsArticle' : 'BlogPosting',
    '@id': `${url}#article`,
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    image: [image],
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified ?? datePublished).toISOString(),
    author: { '@type': 'Person', '@id': personId(site), name: authorName, url: new URL('/about', site).href },
    publisher: { '@id': organizationId(site) },
    articleSection: section,
    ...(keywords.length > 0 && { keywords: keywords.join(', ') }),
    wordCount,
    inLanguage: 'en-US',
  };
}
