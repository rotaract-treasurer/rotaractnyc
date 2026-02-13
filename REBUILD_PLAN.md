# 🔄 Rotaract NYC — Complete Rebuild Plan

## Overview
Full rebuild of the Rotaract NYC website from scratch. **Public site + Member Portal only** (no admin panel). Clean architecture, consistent design system, proper integration between public and portal sides.

---

## 🎨 Design System — Rotaract Brand Colors

| Token | Hex | Usage |
|---|---|---|
| **Cranberry** (Primary) | `#9B1B30` | Buttons, headings, links, hero overlays |
| **Gold** (Accent) | `#EBC85B` | CTAs, highlights, badges, "Service Above Self" |
| **Blue** (Secondary) | `#005dAA` | Portal accents, info badges, links |
| **Dark Cranberry** | `#771a2c` | Hover states, dark backgrounds |
| **White** | `#ffffff` | Backgrounds, text on dark |
| **Near Black** | `#111827` | Body text |

Fonts: **Manrope** (headings) + **Inter** (body)
Dark mode: Class-based toggle with full theme support

---

## 📁 New Architecture

```
app/
  layout.tsx                    ← Root layout (fonts, metadata, providers)
  page.tsx                      ← Homepage
  globals.css                   ← Design system + Tailwind layers
  error.tsx                     ← Global error boundary
  loading.tsx                   ← Global loading
  not-found.tsx                 ← 404 page
  sitemap.ts                    ← Dynamic sitemap

  (public)/                     ← Route group for public pages
    layout.tsx                  ← Public layout (Navbar + Footer)
    about/page.tsx              ← About / Mission
    events/page.tsx             ← Events listing
    events/[slug]/page.tsx      ← Event detail
    news/page.tsx               ← News articles
    news/[slug]/page.tsx        ← News detail
    gallery/page.tsx            ← Photo gallery
    leadership/page.tsx         ← Board & leadership
    contact/page.tsx            ← Contact form
    faq/page.tsx                ← FAQ accordion
    membership/page.tsx         ← Requirements + benefits + join CTA
    donate/page.tsx             ← Donation page

  portal/                       ← Member portal (protected)
    layout.tsx                  ← Portal shell (sidebar + topbar + auth)
    login/page.tsx              ← Google sign-in
    page.tsx                    ← Dashboard / Feed
    events/page.tsx             ← Portal events with RSVP
    events/[id]/page.tsx        ← Event detail with registration
    directory/page.tsx          ← Member directory
    directory/[id]/page.tsx     ← Member profile
    documents/page.tsx          ← Document library
    articles/page.tsx           ← Blog articles
    articles/[slug]/page.tsx    ← Article detail
    service-hours/page.tsx      ← Log & view service hours
    dues/page.tsx               ← Dues status & payment
    finance/page.tsx            ← Finance dashboard (treasurer+)
    profile/page.tsx            ← Profile settings
    onboarding/page.tsx         ← New member onboarding wizard
    onboarding/success/page.tsx ← Post-onboarding confirmation

  api/
    public/
      events/route.ts
      news/route.ts
      gallery/route.ts
      leadership/route.ts
      contact/route.ts
      faq/route.ts
      settings/route.ts
    portal/
      auth/session/route.ts
      members/route.ts
      events/route.ts
      posts/route.ts
      documents/route.ts
      service-hours/route.ts
      dues/route.ts
      finance/route.ts
      messages/route.ts
      upload/route.ts

components/
  ui/                           ← Shared UI primitives
    Button.tsx
    Card.tsx
    Badge.tsx
    Avatar.tsx
    Modal.tsx
    Input.tsx
    Select.tsx
    Textarea.tsx
    Toast.tsx
    Spinner.tsx
    EmptyState.tsx
    Accordion.tsx
    Tabs.tsx
    Dropdown.tsx
    FileUpload.tsx
    RichTextEditor.tsx
    Pagination.tsx
    SearchInput.tsx
    StatCard.tsx
    ProgressBar.tsx
  
  public/                       ← Public-specific components
    Navbar.tsx                  ← Main navigation
    Footer.tsx                  ← Site footer
    HeroSection.tsx            ← Reusable hero banner
    EventCard.tsx              ← Public event card
    NewsCard.tsx               ← Public news card
    GalleryGrid.tsx            ← Photo gallery grid
    TestimonialCard.tsx        ← Testimonial display
    CTASection.tsx             ← Call-to-action sections
    StatsStrip.tsx             ← Animated stats bar

  portal/                       ← Portal-specific components
    PortalShell.tsx            ← Sidebar + topbar wrapper
    Sidebar.tsx                ← Portal sidebar navigation
    Topbar.tsx                 ← Portal top bar
    FeedCard.tsx               ← Community feed card
    PostComposer.tsx           ← Create new posts
    EventRegistration.tsx      ← RSVP + Stripe checkout
    ServiceHourLogger.tsx      ← Service hour wizard
    DuesBanner.tsx             ← Dues payment reminder
    MemberCard.tsx             ← Directory member card
    MessageModal.tsx           ← Member-to-member messaging
    DocumentCard.tsx           ← Document library card
    ArticleCard.tsx            ← Blog article card
    DashboardWidgets.tsx       ← Quick stats, upcoming, spotlight
    FinanceCharts.tsx          ← Finance visualizations
    ProfileForm.tsx            ← Profile editing form
    OnboardingWizard.tsx       ← Multi-step onboarding

lib/
  firebase/
    client.ts                  ← Firebase client init
    admin.ts                   ← Firebase admin init
    auth.ts                    ← Auth context provider
    session.ts                 ← Session cookie management
  
  services/
    members.ts                 ← Member CRUD operations
    events.ts                  ← Event CRUD operations
    posts.ts                   ← Post/article CRUD
    documents.ts               ← Document CRUD
    serviceHours.ts            ← Service hour operations
    dues.ts                    ← Dues cycle & payment ops
    finance.ts                 ← Finance operations
    gallery.ts                 ← Gallery operations
    messages.ts                ← Messaging operations
  
  utils/
    cn.ts                      ← Class name utility
    formatDate.ts              ← Date formatting
    slugify.ts                 ← URL slug generation
    sanitize.ts                ← HTML sanitization
    calendar.ts                ← Google Calendar URLs
    rotaryYear.ts              ← Rotary year calculations
  
  email/
    send.ts                    ← Resend email wrapper
    templates.ts               ← Email templates
  
  stripe/
    client.ts                  ← Stripe SDK wrapper
    webhooks.ts                ← Webhook handlers
  
  defaults/
    events.ts                  ← Default events data
    news.ts                    ← Default news data
    faq.ts                     ← Default FAQ data
    leadership.ts              ← Default board data
    gallery.ts                 ← Default gallery data
  
  seo.ts                       ← SEO metadata helper
  analytics.ts                 ← GA tracking
  rateLimit.ts                 ← Rate limiter

hooks/
  useAuth.ts                   ← Auth state hook
  useFirestore.ts              ← Generic Firestore hook
  useMembers.ts                ← Members data hook
  useEvents.ts                 ← Events data hook
  usePosts.ts                  ← Posts data hook
  useServiceHours.ts           ← Service hours hook
  useDues.ts                   ← Dues status hook
  useToast.ts                  ← Toast notifications
  useMediaQuery.ts             ← Responsive breakpoints
  useDebounce.ts               ← Debounced values

types/
  index.ts                     ← All TypeScript interfaces

middleware.ts                  ← Portal route protection
```

---

## 🔗 Public ↔ Portal Integration Points

This is the KEY improvement. The public site and portal should feel like ONE platform:

1. **Shared Navigation**: Public Navbar shows "Member Login" → Portal. Portal Topbar shows "← Back to Site" → Public.
2. **Events Continuity**: Public events page shows upcoming events. Logged-in members see "RSVP" buttons. Event detail pages are THE SAME route with auth-aware content (public sees info, members see RSVP + attendees).
3. **News/Articles Flow**: Articles published in portal appear on public News page. Public visitors see excerpts → "Read more" → full article. Members see full articles + can comment.
4. **Membership CTA**: Every public page has subtle "Join Rotaract" CTAs. Membership page flows directly into onboarding.
5. **Gallery Shared**: Portal gallery uploads appear on public gallery. Members can see private albums.
6. **Consistent Design**: Same color system, same component library, same typography across public + portal.
7. **Auth-Aware Components**: Components detect auth state and render differently (e.g., event cards show RSVP only for members).

---

## 📋 Execution Order

### Phase 1: Foundation ✦
1. Clean out all existing code
2. Set up globals.css with full design system
3. Set up tailwind.config.js with Rotaract colors
4. Create types/index.ts with all interfaces
5. Create lib/utils/cn.ts and other utilities
6. Create lib/firebase/client.ts and admin.ts
7. Create lib/defaults/ with fallback data
8. Create root layout.tsx, error.tsx, loading.tsx, not-found.tsx

### Phase 2: UI Component Library ✦
9. Build all components/ui/ primitives
10. Build components/public/Navbar.tsx
11. Build components/public/Footer.tsx
12. Build components/public/HeroSection.tsx
13. Build other public components

### Phase 3: Public Pages ✦
14. Homepage (hero, stats, pillars, testimonial, CTA)
15. About/Mission page
16. Events page + detail
17. News page + detail
18. Gallery page
19. Leadership page
20. Contact page
21. FAQ page
22. Membership page
23. Donate page
24. Sitemap

### Phase 4: Auth & Portal Foundation ✦
25. lib/firebase/auth.ts — Auth context provider
26. lib/firebase/session.ts — Session management
27. middleware.ts — Route protection
28. Portal login page
29. Portal layout (PortalShell, Sidebar, Topbar)

### Phase 5: Portal Pages ✦
30. Dashboard / Community Feed
31. Portal Events with RSVP
32. Member Directory
33. Document Library
34. Articles
35. Service Hours
36. Dues
37. Finance (Treasurer+)
38. Profile Settings
39. Onboarding wizard

### Phase 6: API Routes ✦
40. Public API routes (events, news, gallery, contact, settings)
41. Portal API routes (auth, members, events, posts, docs, service-hours, dues, finance, messages, upload)

### Phase 7: Integration & Polish ✦
42. Auth-aware event cards on public side
43. News/articles flow between public and portal
44. Membership → onboarding flow
45. Dark mode toggle
46. SEO metadata on all pages
47. Mobile responsiveness audit

---

## 📊 Site Information (Constants)

| Field | Value |
|---|---|
| Name | Rotaract Club of New York at the United Nations |
| Short Name | Rotaract NYC |
| Domain | rotaractnyc.org |
| Email | rotaractnewyorkcity@gmail.com |
| Address | 216 East 45th Street, New York, NY 10017 |
| Meetings | Every 2nd & 4th Thursday, 7:00–8:00 PM |
| Age Range | 18–30 |
| Sponsor | The Rotary Club of New York |
| Dues | $85 (Professional) / $65 (Student) |
| Motto | "Service Above Self" |
| Instagram | @rotaractnyc |
| LinkedIn | Rotaract at the UN NYC |
| Facebook | Rotaract New York City |
| Member Roles | member, board, president, treasurer |
| Member Statuses | pending, active, inactive, alumni |
