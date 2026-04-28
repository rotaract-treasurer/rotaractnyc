/**
 * Validation helpers for API routes.
 *
 * Provides Zod-like validation for common types without adding the Zod
 * dependency. Every API route that writes to Firestore MUST validate input
 * against the allowed enum values to prevent data corruption.
 */

// ── Enums from types/index.ts ──

export const ALLOWED_MEMBER_ROLES = ['member', 'board', 'president', 'treasurer'] as const;
export const ALLOWED_MEMBER_STATUSES = ['pending', 'active', 'inactive', 'alumni'] as const;
export const ALLOWED_MEMBER_TYPES = ['professional', 'student'] as const;
export const ALLOWED_EVENT_TYPES = ['free', 'paid', 'service', 'hybrid'] as const;
export const ALLOWED_EVENT_STATUSES = ['draft', 'published', 'cancelled'] as const;
export const ALLOWED_RSVP_STATUSES = ['going', 'maybe', 'not_going'] as const;
export const ALLOWED_DUES_STATUSES = ['UNPAID', 'PAID', 'PAID_OFFLINE', 'WAIVED'] as const;
export const ALLOWED_SERVICE_HOUR_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const ALLOWED_POST_TYPES = ['text', 'image', 'link', 'announcement', 'spotlight'] as const;
export const ALLOWED_POST_AUDIENCES = ['all', 'board', 'committee'] as const;
export const ALLOWED_PAYMENT_METHODS = ['stripe', 'zelle', 'venmo', 'cashapp', 'cash', 'check'] as const;
export const ALLOWED_OFFLINE_PAYMENT_METHODS = ['zelle', 'venmo', 'cashapp', 'cash', 'check'] as const;
export const ALLOWED_OFFLINE_PAYMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const ALLOWED_DOCUMENT_CATEGORIES = ['Minutes', 'Policies', 'Bylaws', 'Handbook', 'Reports', 'Financial', 'Templates', 'Google Drive', 'Other'] as const;
export const ALLOWED_FORM_STATUSES = ['draft', 'active', 'closed'] as const;
export const ALLOWED_ACTIVITY_TYPES = ['gala', 'social', 'volunteering', 'conference', 'excursion', 'website', 'maintenance', 'other'] as const;
export const ALLOWED_ACTIVITY_STATUSES = ['draft', 'pending_approval', 'approved', 'completed', 'cancelled'] as const;
export const ALLOWED_EXPENSE_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const ALLOWED_COMMITTEE_STATUSES = ['active', 'inactive'] as const;

// ── Validation helpers ──

export function isOneOf<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}

export function validateMemberRole(role: string): role is typeof ALLOWED_MEMBER_ROLES[number] {
  return isOneOf(role, ALLOWED_MEMBER_ROLES);
}

export function validateMemberStatus(status: string): status is typeof ALLOWED_MEMBER_STATUSES[number] {
  return isOneOf(status, ALLOWED_MEMBER_STATUSES);
}

export function validateMemberType(type: string): type is typeof ALLOWED_MEMBER_TYPES[number] {
  return isOneOf(type, ALLOWED_MEMBER_TYPES);
}

export function validateEventStatus(status: string): status is typeof ALLOWED_EVENT_STATUSES[number] {
  return isOneOf(status, ALLOWED_EVENT_STATUSES);
}

export function validateEventType(type: string): type is typeof ALLOWED_EVENT_TYPES[number] {
  return isOneOf(type, ALLOWED_EVENT_TYPES);
}

export function validateRsvpStatus(status: string): status is typeof ALLOWED_RSVP_STATUSES[number] {
  return isOneOf(status, ALLOWED_RSVP_STATUSES);
}

export function validateDuesStatus(status: string): status is typeof ALLOWED_DUES_STATUSES[number] {
  return isOneOf(status, ALLOWED_DUES_STATUSES);
}

export function validateServiceHourStatus(status: string): status is typeof ALLOWED_SERVICE_HOUR_STATUSES[number] {
  return isOneOf(status, ALLOWED_SERVICE_HOUR_STATUSES);
}

export function validatePostType(type: string): type is typeof ALLOWED_POST_TYPES[number] {
  return isOneOf(type, ALLOWED_POST_TYPES);
}

export function validatePostAudience(audience: string): audience is typeof ALLOWED_POST_AUDIENCES[number] {
  return isOneOf(audience, ALLOWED_POST_AUDIENCES);
}

export function validatePaymentMethod(method: string): method is typeof ALLOWED_PAYMENT_METHODS[number] {
  return isOneOf(method, ALLOWED_PAYMENT_METHODS);
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates that a string field is present and within max length.
 */
export function validateString(input: unknown, field: string, maxLength = 500): ValidationError | null {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return { field, message: `${field} is required` };
  }
  if (input.length > maxLength) {
    return { field, message: `${field} must be ${maxLength} characters or fewer` };
  }
  return null;
}

/**
 * Validates an email is present and reasonably formatted.
 */
export function validateEmail(input: unknown, field = 'email'): ValidationError | null {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return { field, message: `${field} is required` };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.trim())) {
    return { field, message: `${field} is not a valid email` };
  }
  return null;
}

/**
 * Validates a positive number (including 0).
 */
export function validatePositiveNumber(input: unknown, field: string): ValidationError | null {
  if (typeof input !== 'number' || isNaN(input) || input < 0) {
    return { field, message: `${field} must be a positive number` };
  }
  return null;
}

/**
 * Collects validation errors and throws on first error.
 * Returns the input as-is if valid.
 */
export function assertValid(errors: (ValidationError | null)[]): void {
  for (const err of errors) {
    if (err) {
      throw new ValidationFailedError(err.field, err.message);
    }
  }
}

export class ValidationFailedError extends Error {
  public field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationFailedError';
    this.field = field;
  }
}

/**
 * Wraps an API handler with validation error handling.
 */
export function withValidation<T>(
  handler: () => Promise<T>,
): Promise<T> {
  return handler().catch((err) => {
    if (err instanceof ValidationFailedError) {
      throw err; // Let the API route catch it
    }
    throw err;
  });
}
