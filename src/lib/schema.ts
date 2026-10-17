// JSON-LD builders. The Organization entity itself is emitted site-wide by BaseLayout.

export const organizationId = (site: URL) => `${new URL('/', site).href}#organization`;

export interface Crumb {
  name: string;
  /** Root-relative path, e.g. "/paid-search". */
  path: string;
}

/** BreadcrumbList per Google's requirements: ordered items with position, name, and item URL. */
export function breadcrumbSchema(crumbs: Crumb[], site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
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
  category: 'degree' | 'certification';
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
    image: string;
    alumniOf: { name: string; department?: string };
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
    image,
    worksFor: { '@id': organizationId(site) },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: alumniOf.name,
      ...(alumniOf.department && { department: { '@type': 'Organization', name: alumniOf.department } }),
    },
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
