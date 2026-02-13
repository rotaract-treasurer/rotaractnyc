// Site-wide constants
export const SITE = {
  name: 'Rotaract Club of New York at the United Nations',
  shortName: 'Rotaract NYC',
  domain: 'rotaractnyc.org',
  url: 'https://rotaractnyc.org',
  email: 'rotaractnewyorkcity@gmail.com',
  address: '216 East 45th Street, New York, NY 10017',
  meetingSchedule: 'Every 2nd & 4th Thursday, 7:00–8:00 PM',
  ageRange: '18–30',
  sponsor: 'The Rotary Club of New York',
  motto: 'Service Above Self',
  description:
    'Rotaract NYC is a community of young professionals and students aged 18–30 dedicated to service, leadership development, and global fellowship in New York City.',
  dues: {
    professional: 8500, // cents
    student: 6500,
  },
  social: {
    instagram: 'https://instagram.com/rotaractnyc',
    linkedin: 'https://linkedin.com/company/rotaract-at-the-un-nyc',
    facebook: 'https://facebook.com/RotaractNewYorkCity',
  },
} as const;
