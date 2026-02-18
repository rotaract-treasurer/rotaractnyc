// Default profile dropdown options — used as fallback when Firestore settings are empty.
// Admins can customise these via the settings/site doc in Firestore.

export const DEFAULT_COMMITTEES = [
  'Community Service',
  'Fellowship',
  'Professional Development',
  'International Service',
  'Social Media',
  'Fundraising',
  'Membership',
  'Events',
  'Youth Service',
  'Public Relations',
];

export const DEFAULT_OCCUPATIONS = [
  'Accountant',
  'Analyst',
  'Architect',
  'Attorney / Lawyer',
  'Consultant',
  'Designer',
  'Doctor / Physician',
  'Engineer',
  'Entrepreneur',
  'Finance / Banking',
  'Healthcare Professional',
  'Human Resources',
  'Marketing / Advertising',
  'Nonprofit / NGO',
  'Nurse',
  'Product Manager',
  'Professor / Educator',
  'Project Manager',
  'Public Policy / Government',
  'Real Estate',
  'Researcher / Scientist',
  'Sales',
  'Social Worker',
  'Software Developer',
  'Student',
  'Teacher',
  'Writer / Journalist',
];

/** Convert a string[] of option labels to the { value, label }[] format used by Select + add "Other" */
export function toSelectOptions(items: string[]) {
  return [
    ...items.map((item) => ({ value: item, label: item })),
    { value: '__other__', label: 'Other' },
  ];
}
