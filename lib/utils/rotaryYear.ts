/**
 * Rotary Year Helper Functions
 * 
 * Rotary International operates on a fiscal year from July 1 to June 30.
 * This is called the "Rotary Year" and is identified by its ending year.
 * 
 * Examples:
 * - July 1, 2025 to June 30, 2026 = "Rotary Year 2026" or "RY-2026"
 * - July 1, 2026 to June 30, 2027 = "Rotary Year 2027" or "RY-2027"
 */

/**
 * Get the current Rotary Year cycle ID
 * @param date - The date to check (defaults to now)
 * @returns Cycle ID in format "RY-{endingYear}"
 * 
 * @example
 * getCurrentRotaryCycleId(new Date('2025-08-15')) // Returns "RY-2026"
 * getCurrentRotaryCycleId(new Date('2026-05-15')) // Returns "RY-2026"
 * getCurrentRotaryCycleId(new Date('2026-07-15')) // Returns "RY-2027"
 */
export function getCurrentRotaryCycleId(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-11 (0=Jan, 6=Jul)
  const year = date.getFullYear();
  
  // If month >= 7 (July or later), we're in the next Rotary Year
  // If month < 7 (Jan-Jun), we're in the current year's Rotary Year
  const endingYear = month >= 6 ? year + 1 : year;
  
  return `RY-${endingYear}`;
}

/**
 * Get the Rotary Year label for display
 * @param cycleId - Cycle ID in format "RY-{endingYear}"
 * @returns Display label like "Rotary Year 2026"
 * 
 * @example
 * getRotaryYearLabel('RY-2026') // Returns "Rotary Year 2026"
 */
export function getRotaryYearLabel(cycleId: string): string {
  const year = cycleId.replace('RY-', '');
  return `Rotary Year ${year}`;
}

/**
 * Get start and end dates for a Rotary Year
 * @param endingYear - The ending year (e.g., 2026 for RY-2026)
 * @returns Object with startDate and endDate
 * 
 * @example
 * getRotaryYearDates(2026)
 * // Returns {
 * //   startDate: new Date('2025-07-01'),
 * //   endDate: new Date('2026-06-30')
 * // }
 */
export function getRotaryYearDates(endingYear: number): {
  startDate: Date;
  endDate: Date;
} {
  const startingYear = endingYear - 1;
  
  // Start: July 1 of the previous year
  const startDate = new Date(startingYear, 6, 1); // Month is 0-indexed, so 6 = July
  
  // End: June 30 of the ending year
  const endDate = new Date(endingYear, 5, 30); // Month is 0-indexed, so 5 = June
  
  return { startDate, endDate };
}

/**
 * Create a cycle ID from an ending year
 * @param endingYear - The ending year
 * @returns Cycle ID in format "RY-{endingYear}"
 * 
 * @example
 * createCycleId(2026) // Returns "RY-2026"
 */
export function createCycleId(endingYear: number): string {
  return `RY-${endingYear}`;
}

/**
 * Extract ending year from cycle ID
 * @param cycleId - Cycle ID in format "RY-{endingYear}"
 * @returns The ending year as a number
 * 
 * @example
 * getEndingYearFromCycleId('RY-2026') // Returns 2026
 */
export function getEndingYearFromCycleId(cycleId: string): number {
  const year = cycleId.replace('RY-', '');
  return parseInt(year, 10);
}

/**
 * Check if a date is within a Rotary Year cycle
 * @param date - Date to check
 * @param cycleId - Cycle ID to check against
 * @returns true if date is within the cycle
 * 
 * @example
 * isDateInCycle(new Date('2025-08-15'), 'RY-2026') // Returns true
 * isDateInCycle(new Date('2024-08-15'), 'RY-2026') // Returns false
 */
export function isDateInCycle(date: Date, cycleId: string): boolean {
  const endingYear = getEndingYearFromCycleId(cycleId);
  const { startDate, endDate } = getRotaryYearDates(endingYear);
  
  return date >= startDate && date <= endDate;
}

/**
 * Get the next Rotary Year cycle ID
 * @param currentCycleId - Current cycle ID (optional, defaults to current)
 * @returns Next cycle ID
 * 
 * @example
 * getNextRotaryCycleId('RY-2026') // Returns "RY-2027"
 * getNextRotaryCycleId() // Returns next year from current
 */
export function getNextRotaryCycleId(currentCycleId?: string): string {
  if (!currentCycleId) {
    currentCycleId = getCurrentRotaryCycleId();
  }
  
  const currentYear = getEndingYearFromCycleId(currentCycleId);
  return createCycleId(currentYear + 1);
}

/**
 * Get the previous Rotary Year cycle ID
 * @param currentCycleId - Current cycle ID (optional, defaults to current)
 * @returns Previous cycle ID
 * 
 * @example
 * getPreviousRotaryCycleId('RY-2026') // Returns "RY-2025"
 */
export function getPreviousRotaryCycleId(currentCycleId?: string): string {
  if (!currentCycleId) {
    currentCycleId = getCurrentRotaryCycleId();
  }
  
  const currentYear = getEndingYearFromCycleId(currentCycleId);
  return createCycleId(currentYear - 1);
}

/**
 * Check if we're in the grace period after a cycle ends
 * @param cycleId - Cycle to check
 * @param graceDays - Number of grace days (default 30)
 * @param checkDate - Date to check (defaults to now)
 * @returns true if in grace period
 * 
 * @example
 * isInGracePeriod('RY-2026', 30, new Date('2026-07-15')) // Returns true (15 days after June 30)
 * isInGracePeriod('RY-2026', 30, new Date('2026-08-15')) // Returns false (45+ days after June 30)
 */
export function isInGracePeriod(
  cycleId: string,
  graceDays: number = 30,
  checkDate: Date = new Date()
): boolean {
  const endingYear = getEndingYearFromCycleId(cycleId);
  const { endDate } = getRotaryYearDates(endingYear);
  
  const graceEndDate = new Date(endDate);
  graceEndDate.setDate(graceEndDate.getDate() + graceDays);
  
  return checkDate > endDate && checkDate <= graceEndDate;
}

/**
 * Check if grace period has expired
 * @param cycleId - Cycle to check
 * @param graceDays - Number of grace days (default 30)
 * @param checkDate - Date to check (defaults to now)
 * @returns true if grace period expired
 */
export function isGracePeriodExpired(
  cycleId: string,
  graceDays: number = 30,
  checkDate: Date = new Date()
): boolean {
  const endingYear = getEndingYearFromCycleId(cycleId);
  const { endDate } = getRotaryYearDates(endingYear);
  
  const graceEndDate = new Date(endDate);
  graceEndDate.setDate(graceEndDate.getDate() + graceDays);
  
  return checkDate > graceEndDate;
}

/**
 * Format a cycle for display with date range
 * @param cycleId - Cycle ID
 * @returns Formatted string like "RY-2026 (Jul 1, 2025 - Jun 30, 2026)"
 */
export function formatCycleWithDates(cycleId: string): string {
  const endingYear = getEndingYearFromCycleId(cycleId);
  const { startDate, endDate } = getRotaryYearDates(endingYear);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return `${cycleId} (${formatDate(startDate)} - ${formatDate(endDate)})`;
}

/**
 * Get all cycle IDs within a range
 * @param startYear - Starting ending year
 * @param endYear - Ending ending year
 * @returns Array of cycle IDs
 * 
 * @example
 * getCycleRange(2024, 2026) // Returns ['RY-2024', 'RY-2025', 'RY-2026']
 */
export function getCycleRange(startYear: number, endYear: number): string[] {
  const cycles: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    cycles.push(createCycleId(year));
  }
  return cycles;
}
