/**
 * Google Analytics helper.
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && !!GA_ID;
}

/** Track a page view */
export function trackPageView(url: string): void {
  if (!isAnalyticsEnabled()) return;
  window.gtag('config', GA_ID!, { page_path: url });
}

/** Track a custom event */
export function trackEvent(
  action: string,
  params?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  },
): void {
  if (!isAnalyticsEnabled()) return;
  window.gtag('event', action, {
    event_category: params?.category,
    event_label: params?.label,
    value: params?.value,
    ...params,
  });
}

// ── Predefined events ──

export function trackContactFormSubmit(): void {
  trackEvent('contact_form_submit', { category: 'engagement' });
}

export function trackMembershipInterest(): void {
  trackEvent('membership_interest', { category: 'conversion' });
}

export function trackDonation(amount: number): void {
  trackEvent('donation', { category: 'conversion', value: amount });
}

export function trackRSVP(eventId: string): void {
  trackEvent('event_rsvp', { category: 'engagement', label: eventId });
}

export function trackDuesPayment(amount: number): void {
  trackEvent('dues_payment', { category: 'conversion', value: amount });
}

export function trackSignIn(): void {
  trackEvent('sign_in', { category: 'auth' });
}

export function trackSignOut(): void {
  trackEvent('sign_out', { category: 'auth' });
}
