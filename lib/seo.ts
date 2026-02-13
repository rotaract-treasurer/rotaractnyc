import type { Metadata } from 'next';
import { SITE } from './constants';

export function generateMeta(options: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const title = options.title ? `${options.title} | ${SITE.shortName}` : SITE.shortName;
  const description = options.description || SITE.description;
  const url = options.path ? `${SITE.url}${options.path}` : SITE.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      type: 'website',
      ...(options.image && { images: [{ url: options.image }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}
