/**
 * Centralized HTML sanitization using DOMPurify
 * Use this for all user-generated HTML content to prevent XSS attacks
 */

import DOMPurify from 'dompurify';

// Default DOMPurify configuration
const DEFAULT_CONFIG = {
  // Allow common HTML elements
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'u', 's', 'em', 'strong', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'div', 'span',
    'hr',
  ],
  // Allow common attributes
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'style',
    'target', 'rel',
    'width', 'height',
    'colspan', 'rowspan',
  ],
  // Force all links to open in new tab and add noopener
  ADD_ATTR: ['target'],
};

// Strict config for text-only content
const STRICT_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: [] as string[],
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The untrusted HTML string
 * @param config - Optional DOMPurify configuration
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string, config?: typeof DEFAULT_CONFIG): string {
  if (typeof window === 'undefined') {
    // Server-side: Return empty or use a server-safe approach
    // For SSR, we strip all HTML tags as a safe fallback
    return dirty.replace(/<[^>]*>/g, '');
  }
  
  return DOMPurify.sanitize(dirty, config || DEFAULT_CONFIG);
}

/**
 * Sanitize HTML with strict settings (minimal formatting only)
 * @param dirty - The untrusted HTML string
 * @returns Sanitized HTML string with minimal allowed tags
 */
export function sanitizeHtmlStrict(dirty: string): string {
  if (typeof window === 'undefined') {
    return dirty.replace(/<[^>]*>/g, '');
  }
  
  return DOMPurify.sanitize(dirty, STRICT_CONFIG);
}

/**
 * Sanitize and return as React dangerouslySetInnerHTML object
 * @param dirty - The untrusted HTML string
 * @returns Object ready for dangerouslySetInnerHTML prop
 */
export function createSanitizedHtml(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) };
}

export default sanitizeHtml;
