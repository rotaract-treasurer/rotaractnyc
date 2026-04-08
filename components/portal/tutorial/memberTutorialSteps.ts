import type { TutorialStep } from './types';

export const memberTutorialSteps: TutorialStep[] = [
  {
    id: 'member-welcome',
    targetSelector: '[data-tutorial="sidebar-nav"]',
    title: 'Welcome to Your Portal!',
    description:
      'This sidebar is your hub for everything Rotaract. Navigate between sections here. On mobile, tap the menu icon or swipe right to open it.',
    placement: 'right',
    navigateTo: '/portal',
  },
  {
    id: 'member-dashboard',
    targetSelector: '[data-tutorial="nav-dashboard"]',
    title: 'Your Dashboard',
    description:
      'Your home base. See club announcements, upcoming events, your service hour progress, and a getting-started checklist. Use quick actions to jump to common tasks.',
    placement: 'right',
    navigateTo: '/portal',
  },
  {
    id: 'member-events',
    targetSelector: '[data-tutorial="nav-events"]',
    title: 'Find & Join Events',
    description:
      'Browse upcoming events — socials, service projects, fundraisers. RSVP with one tap, purchase tickets for paid events via Stripe, and show your QR code at the door for check-in.',
    placement: 'right',
  },
  {
    id: 'member-service-hours',
    targetSelector: '[data-tutorial="nav-service-hours"]',
    title: 'Log Your Service Hours',
    description:
      'After volunteering, log your hours here. Select the event, enter your time, and submit for board approval. Track your progress toward the 40-hour annual goal in Service Analytics.',
    placement: 'right',
  },
  {
    id: 'member-dues',
    targetSelector: '[data-tutorial="nav-dues"]',
    title: 'Pay Your Dues',
    description:
      'Check your membership dues status and pay online with Stripe, or offline via Zelle, Venmo, or CashApp. A gold banner will appear across the portal until your dues are current.',
    placement: 'right',
  },
  {
    id: 'member-directory',
    targetSelector: '[data-tutorial="nav-directory"]',
    title: 'Member Directory',
    description:
      'Find and connect with fellow members. Switch between grid and table views, filter by active members or alumni, and view full profiles.',
    placement: 'right',
  },
  {
    id: 'member-messages',
    targetSelector: '[data-tutorial="nav-messages"]',
    title: 'Direct Messages',
    description:
      'Send private messages to other members. View your inbox and sent messages. On mobile, swipe left on a message to archive it.',
    placement: 'right',
  },
  {
    id: 'member-profile',
    targetSelector: '[data-tutorial="nav-profile"]',
    title: 'Complete Your Profile',
    description:
      'Add your photo, bio, LinkedIn, occupation, and interests to boost your profile completeness score. A complete profile helps other members connect with you!',
    placement: 'right',
  },
];
