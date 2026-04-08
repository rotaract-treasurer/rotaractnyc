import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from '@react-pdf/renderer';

/* ─── Brand colours ─── */
const C = {
  cranberry: '#9b1b30',
  cranberryLight: '#f9e4e8',
  gold: '#ebc85b',
  goldLight: '#fdf8e8',
  dark: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  gray50: '#f9fafb',
  white: '#ffffff',
  amber: '#92400e',
  amberBg: '#fef3c7',
  green: '#065f46',
  greenBg: '#d1fae5',
  blue: '#1e40af',
  blueBg: '#dbeafe',
};

/* ─── Styles ─── */
const s = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.dark,
    lineHeight: 1.5,
  },
  /* Header / Footer */
  header: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
    paddingBottom: 6,
  },
  headerText: { fontSize: 7, color: C.gray400, fontFamily: 'Helvetica' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.gray400 },

  /* Cover */
  coverPage: {
    paddingHorizontal: 50,
    paddingVertical: 0,
    fontFamily: 'Helvetica',
    backgroundColor: C.cranberry,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBadge: {
    backgroundColor: C.gold,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
  },
  coverBadgeText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: C.dark,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  coverTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 36,
    color: C.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 13,
    color: '#f9c4cc',
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 1.6,
  },
  coverDate: {
    fontSize: 9,
    color: '#e8a0ab',
    marginTop: 40,
  },
  coverUrl: {
    fontSize: 9,
    color: C.gold,
    marginTop: 6,
  },

  /* Sections */
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: C.cranberry,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.cranberry,
    paddingBottom: 4,
  },
  sectionNumber: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: C.white,
    backgroundColor: C.cranberry,
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 1,
    paddingTop: 5,
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: C.cranberry,
  },

  /* Typography */
  h3: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.dark, marginBottom: 4, marginTop: 10 },
  body: { fontSize: 10, color: C.gray700, lineHeight: 1.6 },
  bodySmall: { fontSize: 9, color: C.gray500, lineHeight: 1.5 },
  bold: { fontFamily: 'Helvetica-Bold' },
  link: { color: C.cranberry, textDecoration: 'underline' },

  /* Lists */
  listItem: { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  listBullet: { width: 14, fontSize: 10, color: C.cranberry },
  listNumber: { width: 14, fontSize: 10, color: C.cranberry, fontFamily: 'Helvetica-Bold' },
  listText: { flex: 1, fontSize: 10, color: C.gray700, lineHeight: 1.5 },

  /* Cards */
  card: {
    backgroundColor: C.gray50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.gray200,
    padding: 10,
    marginBottom: 6,
  },
  cardTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.dark, marginBottom: 3 },
  cardBody: { fontSize: 9, color: C.gray500, lineHeight: 1.5 },

  /* Tables */
  table: { borderWidth: 1, borderColor: C.gray200, borderRadius: 4, marginBottom: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.gray200 },
  tableRowLast: { flexDirection: 'row' },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: C.gray100,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  tableCellHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.gray700,
    padding: 6,
  },
  tableCell: { fontSize: 9, color: C.gray700, padding: 6 },

  /* Badges */
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  badgeAmber: { backgroundColor: C.amberBg, color: C.amber },
  badgeGreen: { backgroundColor: C.greenBg, color: C.green },
  badgeBlue: { backgroundColor: C.blueBg, color: C.blue },
  badgeGray: { backgroundColor: C.gray100, color: C.gray700 },

  /* Tip box */
  tip: {
    flexDirection: 'row',
    backgroundColor: C.goldLight,
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  tipIcon: { fontSize: 10, width: 18 },
  tipText: { flex: 1, fontSize: 9, color: C.amber, lineHeight: 1.5 },

  /* Grid helpers */
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  col2: { width: '48%' },
  col3: { width: '31%' },

  /* TOC */
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tocLabel: { fontSize: 11, color: C.dark },
  tocPage: { fontSize: 11, color: C.gray400 },
});

/* ─── Helpers ─── */
function PageHeader({ title }: { title: string }) {
  return (
    <View style={s.header} fixed>
      <Text style={s.headerText}>Rotaract NYC</Text>
      <Text style={s.headerText}>{title}</Text>
    </View>
  );
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>rotaractnyc.org/guide</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function SectionHead({ num, title }: { num: number; title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionNumber}>{num}</Text>
      <Text style={s.sectionHeaderTitle}>{title}</Text>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.listItem}>
      <Text style={s.listBullet}>•</Text>
      <Text style={s.listText}>{children}</Text>
    </View>
  );
}

function NumberedItem({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={s.listItem}>
      <Text style={s.listNumber}>{n}.</Text>
      <Text style={s.listText}>{children}</Text>
    </View>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.tip}>
      <Text style={s.tipIcon}>💡</Text>
      <Text style={s.tipText}>{children}</Text>
    </View>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardBody}>{body}</Text>
    </View>
  );
}

/* ─── Document ─── */

export default function MemberGuidePDF() {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document
      title="Rotaract NYC — New Member Guide"
      author="Rotaract NYC"
      subject="Complete guide for new members"
    >
      {/* ── Cover Page ── */}
      <Page size="LETTER" style={s.coverPage}>
        <View style={s.coverBadge}>
          <Text style={s.coverBadgeText}>Rotaract NYC</Text>
        </View>
        <Text style={s.coverTitle}>New Member{'\n'}Guide</Text>
        <Text style={s.coverSubtitle}>
          Everything you need to know about using the Rotaract NYC website and member portal — sign-in, events, dues, service hours, and more.
        </Text>
        <Text style={s.coverDate}>{today}</Text>
        <Text style={s.coverUrl}>rotaractnyc.org/guide</Text>
      </Page>

      {/* ── Table of Contents ── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader title="Table of Contents" />
        <PageFooter />
        <Text style={[s.sectionHeaderTitle, { marginBottom: 16 }]}>Table of Contents</Text>
        {[
          'Getting Started',
          'Onboarding Wizard',
          'Your Dashboard',
          'Portal Features',
          'Forms & Surveys',
          'The Public Website',
          'Tips & FAQ',
        ].map((label, i) => (
          <View key={i} style={s.tocItem}>
            <Text style={s.tocLabel}>{i + 1}. {label}</Text>
          </View>
        ))}
      </Page>

      {/* ── 1. Getting Started ── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader title="Getting Started" />
        <PageFooter />
        <SectionHead num={1} title="Getting Started" />

        <Text style={s.h3}>How to Sign In</Text>
        <NumberedItem n={1}>Go to rotaractnyc.org/portal/login</NumberedItem>
        <NumberedItem n={2}>Click &quot;Sign in with Google&quot;</NumberedItem>
        <NumberedItem n={3}>Choose the Google account linked to your Rotaract membership</NumberedItem>
        <NumberedItem n={4}>You&apos;ll be redirected into the member portal</NumberedItem>

        <Tip>
          First time? If you were invited by a board member, your account will be auto-approved. Otherwise you&apos;ll see a &quot;Pending Approval&quot; screen until a board member activates your membership.
        </Tip>

        <Text style={[s.h3, { marginTop: 14 }]}>Account Statuses</Text>
        <View style={s.table}>
          <View style={s.tableRowHeader}>
            <Text style={[s.tableCellHeader, { width: '25%' }]}>Status</Text>
            <Text style={[s.tableCellHeader, { width: '75%' }]}>What It Means</Text>
          </View>
          {[
            ['Pending', 'Awaiting board approval — you\'ll see a waiting screen.'],
            ['Active', 'Full access to all member features.'],
            ['Inactive', 'Account deactivated. Contact the board.'],
            ['Alumni', 'You\'ve graduated and appear in the alumni directory.'],
          ].map(([status, desc], i, arr) => (
            <View key={i} style={i < arr.length - 1 ? s.tableRow : s.tableRowLast}>
              <Text style={[s.tableCell, { width: '25%' }, s.bold]}>{status}</Text>
              <Text style={[s.tableCell, { width: '75%' }]}>{desc}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* ── 2. Onboarding Wizard ── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader title="Onboarding Wizard" />
        <PageFooter />
        <SectionHead num={2} title="Onboarding Wizard" />
        <Text style={s.body}>
          After your first sign-in you&apos;ll go through a quick 4-step onboarding to set up your profile.
        </Text>
        <View style={[s.row, { marginTop: 10 }]}>
          {[
            { step: 1, title: 'Profile Basics', desc: 'Enter your name, phone number, and address.' },
            { step: 2, title: 'About You', desc: 'Add your bio, occupation, interests, and member type.' },
            { step: 3, title: 'Photo Upload', desc: 'Upload a profile photo for the directory. You can skip this.' },
            { step: 4, title: 'Review & Submit', desc: 'Confirm everything looks good and submit to finish onboarding.' },
          ].map((item) => (
            <View key={item.step} style={[s.card, s.col2]}>
              <Text style={s.cardTitle}>Step {item.step}: {item.title}</Text>
              <Text style={s.cardBody}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* ── 3. Your Dashboard ── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader title="Your Dashboard" />
        <PageFooter />
        <SectionHead num={3} title="Your Dashboard" />
        <Text style={[s.body, { marginBottom: 10 }]}>
          The Dashboard is your home base. Here&apos;s what you&apos;ll find when you sign in:
        </Text>
        <View style={s.row}>
          {[
            { title: 'Quick Actions', desc: 'One-click shortcuts to RSVP, log hours, pay dues, and edit your profile.' },
            { title: 'Community Feed', desc: 'Live club activity — announcements, spotlights, and posts. Like and comment!' },
            { title: 'Upcoming Events', desc: 'Your next 3 events with date, time, location, and RSVP status.' },
            { title: 'Service Progress', desc: 'A progress ring showing hours toward the 40-hour annual goal.' },
            { title: 'Profile Completion', desc: 'See how complete your profile is and fill in missing fields.' },
            { title: 'Onboarding Checklist', desc: 'New-member steps — first RSVP, join a committee, pay dues, and more.' },
          ].map((c) => (
            <View key={c.title} style={[s.card, s.col3]}>
              <Text style={s.cardTitle}>{c.title}</Text>
              <Text style={s.cardBody}>{c.desc}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* ── 4. Portal Features ── */}
      <Page size="LETTER" style={s.page} wrap>
        <PageHeader title="Portal Features" />
        <PageFooter />
        <SectionHead num={4} title="Portal Features" />
        <Text style={[s.body, { marginBottom: 10 }]}>Detailed look at every section of the member portal.</Text>

        {[
          {
            title: 'Events',
            desc: 'Browse upcoming and past events. Filter by type (Free, Paid, Service, Hybrid). Click any event to see full details, then RSVP as Going, Maybe, or Not Going.',
            tips: ['RSVP early — some events have limited capacity.', 'For paid events, checkout is powered by Stripe.', 'At the event, your QR code can be scanned for check-in.'],
          },
          {
            title: 'Member Directory',
            desc: 'Find fellow members by name, email, or committee. Switch between Grid and Table views, and filter by Active, Alumni, or All.',
            tips: ['Click any member card to view their full profile.'],
          },
          {
            title: 'Messages',
            desc: 'Send and receive private messages. View your Inbox and Sent tabs. On mobile, swipe left to archive.',
            tips: ['Use messages to coordinate with committee members or reach the board directly.'],
          },
          {
            title: 'Committees',
            desc: 'View all committees, their chairs, meeting schedules, and member counts. Click "Join" to become a member — or join the waitlist if it\'s full.',
            tips: ['Joining a committee is one of the best ways to get involved and build friendships.'],
          },
          {
            title: 'Gallery',
            desc: 'Browse photo albums from club events and activities. The portal gallery includes private albums not visible on the public website.',
            tips: [],
          },
        ].map((section) => (
          <View key={section.title} style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{section.title}</Text>
            <Text style={s.cardBody}>{section.desc}</Text>
            {section.tips.map((t, i) => (
              <View key={i} style={[s.listItem, { marginTop: 2 }]}>
                <Text style={s.listBullet}>•</Text>
                <Text style={[s.listText, { fontSize: 9 }]}>{t}</Text>
              </View>
            ))}
          </View>
        ))}
      </Page>

      {/* Portal Features continued */}
      <Page size="LETTER" style={s.page} wrap>
        <PageHeader title="Portal Features (cont.)" />
        <PageFooter />

        {[
          {
            title: 'Service Hours',
            desc: 'Log volunteer hours after service events. Select the event, enter hours, and add a description. A board member will review and approve them.',
            tips: ['Log hours within a few days while details are fresh.', 'Check your progress on the Service Analytics page — includes a leaderboard!'],
          },
          {
            title: 'Dues & Billing',
            desc: 'View your dues status for the current cycle. Pay online via Stripe, or submit proof of an offline payment (Zelle, Venmo, CashApp).',
            tips: ['Professional: $85/year · Student: $65/year (Rotary year July 1 – June 30).', 'A banner will appear at the top of the portal if dues are unpaid.'],
          },
          {
            title: 'Articles',
            desc: 'Read club news and feature articles written by board members, categorized by Service, Leadership, International, and Fellowship.',
            tips: [],
          },
          {
            title: 'Documents',
            desc: 'Access meeting minutes, bylaws, handbooks, reports, and other club files — organized by category and custom folders.',
            tips: ['Pinned documents appear at the top for quick access.'],
          },
          {
            title: 'My Profile',
            desc: 'Keep your profile up to date — name, phone, bio, occupation, interests, LinkedIn, photo, and more.',
            tips: ['A complete profile shows up better in the directory and helps you connect with members.'],
          },
        ].map((section) => (
          <View key={section.title} style={s.card} wrap={false}>
            <Text style={s.cardTitle}>{section.title}</Text>
            <Text style={s.cardBody}>{section.desc}</Text>
            {section.tips.map((t, i) => (
              <View key={i} style={[s.listItem, { marginTop: 2 }]}>
                <Text style={s.listBullet}>•</Text>
                <Text style={[s.listText, { fontSize: 9 }]}>{t}</Text>
              </View>
            ))}
          </View>
        ))}
      </Page>

      {/* ── 5. Forms & Surveys ── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader title="Forms & Surveys" />
        <PageFooter />
        <SectionHead num={5} title="Forms & Surveys" />

        <Text style={s.body}>
          The board may share forms or surveys for event feedback, volunteer sign-ups, interest polls, and more. You&apos;ll receive a link like rotaractnyc.org/f/post-gala-survey.
        </Text>

        <Text style={s.h3}>How to Submit</Text>
        <NumberedItem n={1}>Click the link to open the form</NumberedItem>
        <NumberedItem n={2}>Fill in the fields — text, ratings, scales, dropdowns, checkboxes, dates, etc.</NumberedItem>
        <NumberedItem n={3}>Click &quot;Submit&quot;</NumberedItem>

        <Text style={s.h3}>Login-Required Forms</Text>
        <Text style={s.body}>
          Some forms require sign-in. You&apos;ll see a &quot;Login Required&quot; screen. After signing in, your name and email are auto-filled and a green badge shows &quot;Submitting as Your Name.&quot;
        </Text>

        <Text style={s.h3}>Anonymous Forms</Text>
        <Text style={s.body}>
          Other forms allow anonymous responses — name and email are optional.
        </Text>
      </Page>

      {/* ── 6. The Public Website ── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader title="The Public Website" />
        <PageFooter />
        <SectionHead num={6} title="The Public Website" />
        <Text style={[s.body, { marginBottom: 10 }]}>
          The public site at rotaractnyc.org is visible to everyone. Here&apos;s what&apos;s there:
        </Text>
        <View style={s.table}>
          <View style={s.tableRowHeader}>
            <Text style={[s.tableCellHeader, { width: '25%' }]}>Page</Text>
            <Text style={[s.tableCellHeader, { width: '75%' }]}>What&apos;s There</Text>
          </View>
          {[
            ['Home', 'Hero slideshow, impact stats, events, testimonials, gallery, news'],
            ['About', 'Mission, Rotary focus areas, impact statistics'],
            ['Events', 'Public event listings'],
            ['News', 'Published articles & announcements'],
            ['Gallery', 'Public photo albums'],
            ['Leadership', 'Board member photos & bios'],
            ['Membership', 'How to join, benefits, dues info'],
            ['Contact', 'Contact form, address, socials'],
            ['Donate', 'Support the club via Stripe'],
            ['FAQ', 'Common questions & answers'],
          ].map(([page, desc], i, arr) => (
            <View key={i} style={i < arr.length - 1 ? s.tableRow : s.tableRowLast}>
              <Text style={[s.tableCell, { width: '25%' }, s.bold]}>{page}</Text>
              <Text style={[s.tableCell, { width: '75%' }]}>{desc}</Text>
            </View>
          ))}
        </View>
        <Tip>
          Press Cmd/Ctrl + K anywhere on the site to open the quick search modal.
        </Tip>
      </Page>

      {/* ── 7. Tips & FAQ ── */}
      <Page size="LETTER" style={s.page} wrap>
        <PageHeader title="Tips & FAQ" />
        <PageFooter />
        <SectionHead num={7} title="Tips & FAQ" />

        {[
          { q: 'I signed up but see "Pending Approval" — what do I do?', a: 'A board member needs to approve your account. This usually happens within 24–48 hours.' },
          { q: 'I used a different Google account — can I switch?', a: 'Sign out, then sign back in with the correct Google account. Contact the board to merge accounts.' },
          { q: 'How do I RSVP to an event?', a: 'Go to Portal → Events, click the event, and select Going / Maybe / Not Going.' },
          { q: 'My service hours show "Pending" — is that normal?', a: 'Yes! A board member will review and approve your hours. This is standard procedure.' },
          { q: 'Can I pay dues later?', a: 'Dues are expected within the grace period. Contact the treasurer if you need an extension.' },
          { q: 'The portal is not loading / I\'m getting errors.', a: 'Refresh the page, clear your browser cache, try another browser, or contact the board.' },
        ].map((faq, i) => (
          <View key={i} style={[s.card, { marginBottom: 6 }]} wrap={false}>
            <Text style={[s.cardTitle, { color: C.cranberry }]}>Q: {faq.q}</Text>
            <Text style={s.cardBody}>{faq.a}</Text>
          </View>
        ))}

        <Text style={[s.h3, { marginTop: 12 }]}>Keyboard Shortcuts</Text>
        <View style={s.table}>
          <View style={s.tableRowHeader}>
            <Text style={[s.tableCellHeader, { width: '35%' }]}>Shortcut</Text>
            <Text style={[s.tableCellHeader, { width: '65%' }]}>Action</Text>
          </View>
          {[
            ['Cmd/Ctrl + K', 'Open search modal'],
            ['Pull down (mobile)', 'Refresh the portal'],
            ['Swipe left (mobile)', 'Archive messages'],
          ].map(([shortcut, action], i, arr) => (
            <View key={i} style={i < arr.length - 1 ? s.tableRow : s.tableRowLast}>
              <Text style={[s.tableCell, { width: '35%' }, s.bold]}>{shortcut}</Text>
              <Text style={[s.tableCell, { width: '65%' }]}>{action}</Text>
            </View>
          ))}
        </View>

        {/* Final note */}
        <View style={{ marginTop: 20, padding: 14, backgroundColor: C.cranberryLight, borderRadius: 8, alignItems: 'center' }}>
          <Text style={[s.bold, { fontSize: 12, color: C.cranberry, marginBottom: 4 }]}>
            Need help?
          </Text>
          <Text style={{ fontSize: 10, color: C.gray700, textAlign: 'center' }}>
            Reach out to the board through Portal → Messages, or email us via the Contact page at rotaractnyc.org/contact.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
