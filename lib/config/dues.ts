/**
 * Central configuration for membership dues
 * Update amounts here to change them throughout the application
 */

export const DUES_CONFIG = {
  // Default membership dues amount in cents
  PROFESSIONAL_AMOUNT_CENTS: 8500, // $85.00
  
  // Display amounts
  get PROFESSIONAL_AMOUNT_DOLLARS() {
    return (this.PROFESSIONAL_AMOUNT_CENTS / 100).toFixed(2);
  },
  
  // Formatted display string
  get PROFESSIONAL_AMOUNT_FORMATTED() {
    return `$${this.PROFESSIONAL_AMOUNT_DOLLARS}`;
  },
  
  // Different tier amounts (if applicable in future)
  STUDENT_AMOUNT_CENTS: 5000, // $50.00
  ALUMNI_AMOUNT_CENTS: 5000, // $50.00
  
  // Helper to get amount by tier
  getAmountByTier(tier: 'professional' | 'student' | 'alumni'): number {
    switch (tier) {
      case 'professional':
        return this.PROFESSIONAL_AMOUNT_CENTS;
      case 'student':
        return this.STUDENT_AMOUNT_CENTS;
      case 'alumni':
        return this.ALUMNI_AMOUNT_CENTS;
      default:
        return this.PROFESSIONAL_AMOUNT_CENTS;
    }
  }
} as const;

// Export individual values for convenience
export const DUES_AMOUNT_CENTS = DUES_CONFIG.PROFESSIONAL_AMOUNT_CENTS;
export const DUES_AMOUNT_DISPLAY = DUES_CONFIG.PROFESSIONAL_AMOUNT_FORMATTED;
