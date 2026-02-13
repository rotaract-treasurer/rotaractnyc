// Rotaract Year runs July 1 - June 30
export function getCurrentRotaryYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  if (month >= 6) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export function getRotaryYearDates(yearString: string): { start: Date; end: Date } {
  const [startYear] = yearString.split('-').map(Number);
  return {
    start: new Date(startYear, 6, 1), // July 1
    end: new Date(startYear + 1, 5, 30), // June 30
  };
}
