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
