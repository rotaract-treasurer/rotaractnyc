import type { TutorialStep } from './types';

export const adminTutorialSteps: TutorialStep[] = [
  {
    id: 'admin-welcome',
    targetSelector: '[data-tutorial="section-admin"]',
    title: 'Your Admin Tools',
    description:
      'As a board member, you have extra sections in the sidebar. Let\'s walk through your admin superpowers — from managing members to tracking club health.',
    placement: 'right',
    navigateTo: '/portal',
  },
  {
    id: 'admin-directory',
    targetSelector: '[data-tutorial="nav-directory"]',
    title: 'Approve New Members',
    description:
      'When someone signs up, they start as "pending." Visit the Directory to find pending members and approve or reject them. You can also change member roles and statuses here.',
    placement: 'right',
  },
  {
    id: 'admin-events',
    targetSelector: '[data-tutorial="nav-events"]',
    title: 'Create & Manage Events',
    description:
      'Tap "Create Event" to set up socials, service projects, or fundraisers. Add pricing tiers, set capacity limits, upload cover images, and enable recurring schedules.',
    placement: 'right',
  },
  {
    id: 'admin-service-hours',
    targetSelector: '[data-tutorial="nav-service-hours"]',
    title: 'Review Service Hours',
    description:
      'Members submit hours for your review. Switch to the Review tab to approve or reject submissions — verify the event, duration, and description before approving.',
    placement: 'right',
  },
  {
    id: 'admin-articles',
    targetSelector: '[data-tutorial="nav-articles"]',
    title: 'Publish Articles',
    description:
      'Write club news, event recaps, or member guides. Articles support rich text formatting and are visible to all portal members.',
    placement: 'right',
  },
  {
    id: 'admin-broadcasts',
    targetSelector: '[data-tutorial="nav-broadcasts"]',
    title: 'Send Broadcasts',
    description:
      'Email filtered groups of members — all active, specific committees, or custom selections. Perfect for announcements, event reminders, and important updates.',
    placement: 'right',
  },
  {
    id: 'admin-reminders',
    targetSelector: '[data-tutorial="nav-reminders"]',
    title: 'Automated Reminders',
    description:
      'Trigger pre-built email sequences: dues payment reminders, event follow-ups, and welcome emails for new members. Set it and forget it.',
    placement: 'right',
  },
  {
    id: 'admin-forms',
    targetSelector: '[data-tutorial="nav-forms"]',
    title: 'Build Forms & Surveys',
    description:
      'Create custom forms with 12 field types — text, dropdowns, checkboxes, file uploads, and more. Share them publicly or within the portal, and export responses.',
    placement: 'right',
  },
  {
    id: 'admin-analytics',
    targetSelector: '[data-tutorial="nav-analytics"]',
    title: 'Track Club Health',
    description:
      'View member growth, dues collection rates, event attendance trends, and service hour statistics. Export any data to CSV or Google Sheets from the Reports page.',
    placement: 'right',
  },
  {
    id: 'admin-site-settings',
    targetSelector: '[data-tutorial="nav-site-settings"]',
    title: 'Manage the Public Site',
    description:
      'Update homepage testimonials, impact statistics, and contact info in Site Settings. Manage the photo gallery in Media Manager and the leadership page in Board Manager.',
    placement: 'right',
  },
];
