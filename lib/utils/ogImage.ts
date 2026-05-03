/**
 * Build a social-share-friendly Open Graph image URL.
 *
 * Why this exists:
 *   We store original (often very large) photos in Firebase Storage. When
 *   those raw URLs are used as `og:image`, social scrapers like LinkedIn,
 *   iMessage, Slack, and Facebook frequently reject them (>5 MB) or time
 *   out, falling back to the site logo. We also can't honestly claim a
 *   1200×630 size for a 4000×3000 photo.
 *
 * What it does:
 *   Routes the image through Next.js's built-in image optimizer
 *   (`/_next/image`) which uses `sharp` to produce a properly sized,
 *   compressed JPEG (~100–300 KB) at request time. Scrapers that send
 *   "Accept: any" will receive a JPEG; modern browsers get webp/avif.
 *
 * Usage:
 *   openGraph: {
 *     images: ogImage(event.imageURL, { alt: event.title }),
 *   }
 *
 * Returns an array of one OG image descriptor (or [] if no source).
 */

import { SITE } from '@/lib/constants';

interface OgImageOptions {
  alt?: string;
  /** Width in CSS pixels. Defaults to 1200 (Facebook/LinkedIn recommended). */
  width?: number;
  /** Height in CSS pixels. Defaults to 630 (1.91:1 ratio). */
  height?: number;
  /** JPEG quality 1-100. Default 80. */
  quality?: number;
}

export function ogImage(
  src: string | undefined | null,
  opts: OgImageOptions = {},
): Array<{ url: string; width: number; height: number; alt?: string }> {
  if (!src) return [];

  const width = opts.width ?? 1200;
  const height = opts.height ?? 630;
  const quality = opts.quality ?? 80;

  // Strip any trailing slash from the site URL.
  const base = SITE.url.replace(/\/$/, '');

  // Next's image optimizer chooses the closest configured `deviceSize`
  // ≥ requested width. 1200 maps to the 1200 entry by default.
  const url =
    `${base}/_next/image?url=${encodeURIComponent(src)}` +
    `&w=${width}&q=${quality}`;

  return [
    {
      url,
      width,
      height,
      ...(opts.alt ? { alt: opts.alt } : {}),
    },
  ];
}
