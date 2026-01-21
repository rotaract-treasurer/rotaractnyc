# Annual Dues with Rotary Year Cycles

This guide explains the annual dues system for Rotaract NYC, including Rotary year cycles, admin workflows, member experience, automation, and setup instructions.

## Overview

The annual dues system manages recurring yearly membership dues aligned with Rotary International's fiscal year (July 1 - June 30). This system extends the onboarding payment to support ongoing membership renewal.

### Key Features

- **Rotary Year Cycles**: Dues cycles aligned with Rotary International's fiscal year (Jul 1 - Jun 30)
- **Cycle Management**: Admins can create multiple cycles, but only one can be active at a time
- **Payment Options**: Online (Stripe), offline (cash/check), or waived by admin
- **Member Portal**: Banner notification when dues are unpaid with one-click payment
- **Automation**: Reminder emails, overdue notices, and grace period enforcement
- **Grace Period**: 30 days after cycle end before auto-inactivating members

## Rotary Year Cycle Format

### Cycle ID Format
```
RY-{endingYear}
```

**Examples:**
- `RY-2026` = July 1, 2025 to June 30, 2026
- `RY-2027` = July 1, 2026 to June 30, 2027

### Calculation Logic

```typescript
function getCurrentRotaryCycleId(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  
  // If July or later, ending year is next year
  // If January-June, ending year is current year
  const endingYear = month >= 7 ? year + 1 : year;
  
  return `RY-${endingYear}`;
}
```

**Examples:**
- Date: March 15, 2025 → Cycle: `RY-2025` (Jul 1, 2024 - Jun 30, 2025)
- Date: September 10, 2025 → Cycle: `RY-2026` (Jul 1, 2025 - Jun 30, 2026)

## Data Model

### Firestore Collections

#### 1. `dues_cycles/{cycleId}`
```typescript
{
  id: "RY-2026",
  startDate: Date,      // July 1, 2025
  endDate: Date,        // June 30, 2026
  amount: 85.00,        // Dues amount in USD
  isActive: true,       // Only one cycle can be active
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. `member_dues/{memberId}/cycles/{cycleId}`
```typescript
{
  memberId: "abc123",
  cycleId: "RY-2026",
  status: "UNPAID" | "PAID" | "PAID_OFFLINE" | "WAIVED",
  
  // For PAID status
  paidAt?: Date,
  paymentId?: string,   // Reference to dues_payments doc
  stripeSessionId?: string,
  
  // For PAID_OFFLINE status
  paidOfflineAt?: Date,
  paidOfflineBy?: string,  // Admin user ID
  paidOfflineNotes?: string,
  
  // For WAIVED status
  waivedAt?: Date,
  waivedBy?: string,    // Admin user ID
  waivedReason?: string,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. `dues_payments/{paymentId}`
```typescript
{
  id: string,
  memberId: string,
  cycleId: "RY-2026",
  amount: 85.00,
  status: "PENDING" | "PAID" | "FAILED",
  stripeSessionId: string,
  stripePaymentIntentId?: string,
  createdAt: Date,
  paidAt?: Date
}
```

## Admin Workflow

### 1. Create a New Dues Cycle

Navigate to `/admin/finance/dues` and use the "Create New Dues Cycle" form:

1. **Ending Year**: Enter the ending year (e.g., 2026 for RY-2026)
2. **Dues Amount**: Enter amount in dollars (default: $85.00)
3. Click **Create Cycle**

The system will automatically:
- Calculate the correct start/end dates (Jul 1 - Jun 30)
- Create the cycle with `isActive: false`
- Generate cycle ID in format `RY-{endingYear}`

### 2. Activate a Dues Cycle

Once ready to collect dues for a cycle:

1. Find the cycle in the "Dues Cycles" table
2. Click **Activate** button
3. Confirm the action

**Important:** Activating a cycle will automatically deactivate all other cycles. Only one cycle can be active at a time.

### 3. View Member Dues Status

1. Select a cycle from the "Dues Cycles" table (click "View Members")
2. The "Member Dues" table shows all members with their payment status:
   - **UNPAID**: Red badge - member hasn't paid
   - **PAID**: Green badge - paid online via Stripe
   - **PAID_OFFLINE**: Blue badge - marked as paid by admin (cash/check)
   - **WAIVED**: Yellow badge - dues waived by admin

### 4. Mark Dues as Paid Offline

For cash, check, Venmo, or other offline payments:

1. Find the member in the "Member Dues" table
2. Click **Mark Paid** button
3. Enter optional notes (e.g., "Check #1234", "Cash at meeting")
4. Click **Mark as Paid**

### 5. Waive Member Dues

To waive dues (board members, honorary members, financial hardship):

1. Find the member in the "Member Dues" table
2. Click **Waive** button
3. **Required**: Enter reason for waiving (e.g., "Board member", "Financial hardship")
4. Click **Waive Dues**

**Note:** The reason is stored and visible to other admins for audit purposes.

## Member Experience

### Dues Banner

When a member has unpaid dues for the active cycle, a banner appears at the top of the portal:

**States:**
1. **Normal** (Blue): 31+ days until due
2. **Urgent** (Yellow): 1-30 days until due
3. **Overdue** (Red): Past due date

**Banner Content:**
- Dues amount
- Cycle ID (e.g., RY-2026)
- Due date
- Days remaining/overdue
- **Pay Now** button → redirects to Stripe checkout

### Payment Flow

1. Member clicks **Pay Now** button on banner
2. System validates:
   - Member is active
   - Cycle exists and is active
   - Dues not already paid
3. Redirects to Stripe Checkout
4. After payment:
   - Webhook updates Firestore
   - Member dues marked as PAID
   - Banner disappears
   - Member receives confirmation email (optional)

### Grace Period

- Members have **30 days** after the cycle end date to pay before auto-inactivation
- During grace period, member status remains ACTIVE but banner shows overdue
- After grace period, automation job sets member status to INACTIVE

## Automation

The system includes three automated jobs that should be run via cron/scheduled tasks.

### Setup Automation API Key

Add to `.env.local`:
```bash
AUTOMATION_API_KEY=your-secret-api-key-here
```

### Endpoint

All automation jobs use the same endpoint with different actions:

```
POST /api/admin/dues/automation
Authorization: Bearer {AUTOMATION_API_KEY}
Content-Type: application/json

{
  "action": "send-reminders" | "send-overdue" | "enforce-grace"
}
```

### 1. Send Reminder Emails

**Action:** `send-reminders`

**When to run:** Daily at 9am

**Trigger:** Sends emails when exactly 14 days before cycle end date (±1 day tolerance)

**Email content:**
- Friendly reminder
- Days remaining
- Dues amount
- Link to pay

**Example cron (Vercel Cron):**
```json
{
  "crons": [
    {
      "path": "/api/admin/dues/automation",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Manual test:**
```bash
curl -X POST https://your-domain.com/api/admin/dues/automation \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"action":"send-reminders"}'
```

### 2. Send Overdue Notices

**Action:** `send-overdue`

**When to run:** Daily at 10am

**Trigger:** Sends emails when cycle end date has passed and dues are unpaid

**Email content:**
- Warning: dues overdue
- Days overdue
- 30-day grace period reminder
- Link to pay

**Manual test:**
```bash
curl -X POST https://your-domain.com/api/admin/dues/automation \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"action":"send-overdue"}'
```

### 3. Enforce Grace Period

**Action:** `enforce-grace`

**When to run:** Daily at 11am

**Trigger:** Auto-inactivates members when 30 days past cycle end date

**Actions:**
1. Updates member status from ACTIVE → INACTIVE
2. Sends notification email explaining:
   - Membership now inactive
   - Reason (unpaid dues)
   - How to reactivate (pay outstanding dues)
3. Logs action to console

**Manual test:**
```bash
curl -X POST https://your-domain.com/api/admin/dues/automation \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"action":"enforce-grace"}'
```

### Vercel Cron Configuration

Create or update `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/dues/automation",
      "schedule": "0 9 * * *",
      "headers": {
        "Authorization": "Bearer your-api-key"
      }
    }
  ]
}
```

**Note:** Vercel Cron doesn't support dynamic headers, so you may need to use an external service like:
- GitHub Actions
- Render Cron Jobs
- EasyCron
- Cron-job.org

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:

```bash
# Existing variables
NEXT_PUBLIC_BASE_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# New for automation
AUTOMATION_API_KEY=your-secret-api-key-here
```

### 2. Firestore Security Rules

Update `firestore.rules` to include dues collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Dues Cycles - Admin write, members read
    match /dues_cycles/{cycleId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Member Dues - Member can read own, admin can write
    match /member_dues/{memberId}/cycles/{cycleId} {
      allow read: if request.auth.uid == memberId || isAdmin();
      allow write: if isAdmin();
    }
    
    // Dues Payments - Member can read own, system can write
    match /dues_payments/{paymentId} {
      allow read: if request.auth != null && 
                     resource.data.memberId == request.auth.uid;
      allow write: if false; // System only via Admin SDK
    }
    
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.admin == true;
    }
  }
}
```

### 3. Firestore Indexes

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "dues_cycles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "cycles",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

### 4. Create First Cycle

1. Navigate to `/admin/finance/dues`
2. Create cycle for current Rotary year:
   - If today is Jul 1, 2025 - Jun 30, 2026 → Create RY-2026
3. Set amount to $85.00 (or your club's dues amount)
4. Click **Create Cycle**
5. Click **Activate** to make it the active cycle

### 5. Setup Automation

Choose one of these options:

#### Option A: Vercel Cron (simplest, but limited)
See Vercel Cron Configuration section above

#### Option B: GitHub Actions (recommended)

Create `.github/workflows/dues-automation.yml`:

```yaml
name: Dues Automation

on:
  schedule:
    - cron: '0 9 * * *'  # 9am UTC daily - reminders
    - cron: '0 10 * * *' # 10am UTC daily - overdue
    - cron: '0 11 * * *' # 11am UTC daily - grace
  workflow_dispatch:      # Manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 9 * * *'
    steps:
      - name: Send Reminder Emails
        run: |
          curl -X POST ${{ secrets.BASE_URL }}/api/admin/dues/automation \
            -H "Authorization: Bearer ${{ secrets.AUTOMATION_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"action":"send-reminders"}'
  
  send-overdue:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 10 * * *'
    steps:
      - name: Send Overdue Notices
        run: |
          curl -X POST ${{ secrets.BASE_URL }}/api/admin/dues/automation \
            -H "Authorization: Bearer ${{ secrets.AUTOMATION_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"action":"send-overdue"}'
  
  enforce-grace:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 11 * * *'
    steps:
      - name: Enforce Grace Period
        run: |
          curl -X POST ${{ secrets.BASE_URL }}/api/admin/dues/automation \
            -H "Authorization: Bearer ${{ secrets.AUTOMATION_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"action":"enforce-grace"}'
```

Add secrets in GitHub repository settings:
- `BASE_URL`: https://your-domain.com
- `AUTOMATION_API_KEY`: your-secret-api-key

#### Option C: External Cron Service

Use services like:
- **EasyCron**: https://www.easycron.com/
- **Cron-job.org**: https://cron-job.org/
- **Render Cron Jobs**: https://render.com/docs/cronjobs

Configure 3 separate jobs with the same endpoint but different action payloads.

### 6. Add DuesBanner to Portal Layout

Update your portal layout to show the dues banner:

```typescript
// app/portal/layout.tsx
import DuesBanner from '@/components/portal/DuesBanner';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const member = await getMemberByEmail(session.user.email);
  
  return (
    <div>
      {/* Existing navbar */}
      
      {member && (
        <DuesBanner memberId={member.id} />
      )}
      
      {children}
    </div>
  );
}
```

## Testing

### Test Payment Flow

1. Create a test cycle (future year, small amount like $1.00)
2. Activate the cycle
3. Login to portal as a member
4. Verify banner appears with correct messaging
5. Click "Pay Now"
6. Complete Stripe checkout (use test card `4242 4242 4242 4242`)
7. Verify webhook processes payment
8. Verify banner disappears
9. Check admin page shows member as PAID

### Test Manual Actions

1. Create test member with unpaid dues
2. Test "Mark Paid Offline" with notes
3. Verify status updates to PAID_OFFLINE
4. Test "Waive" with reason
5. Verify status updates to WAIVED

### Test Automation (Manual Trigger)

Run each automation action manually:

```bash
# Reminders
curl -X POST http://localhost:3000/api/admin/dues/automation \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"action":"send-reminders"}'

# Overdue
curl -X POST http://localhost:3000/api/admin/dues/automation \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"action":"send-overdue"}'

# Grace enforcement
curl -X POST http://localhost:3000/api/admin/dues/automation \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"action":"enforce-grace"}'
```

Check console logs for results.

## Troubleshooting

### Banner Not Showing

**Check:**
1. Is there an active cycle? (Check `/admin/finance/dues`)
2. Is member status ACTIVE?
3. Are dues already paid for this cycle?
4. Check browser console for errors

### Payment Not Processing

**Check:**
1. Stripe webhook configured correctly?
2. Webhook secret matches environment variable?
3. Check Stripe dashboard for webhook events
4. Check Vercel/server logs for errors

### Automation Not Running

**Check:**
1. Is `AUTOMATION_API_KEY` set in environment variables?
2. Is cron service configured correctly?
3. Check cron service logs
4. Test manually with curl to verify endpoint works
5. Check server logs for automation execution

### Member Not Auto-Inactivated

**Check:**
1. Has grace period (30 days) passed?
2. Is automation running daily?
3. Check console logs for "Inactivated member" messages
4. Verify member had UNPAID dues status

## API Reference

### GET Active Cycle
```typescript
import { getActiveDuesCycle } from '@/lib/firebase/duesCycles';
const cycle = await getActiveDuesCycle();
```

### GET Member Dues
```typescript
import { getMemberDues } from '@/lib/firebase/duesCycles';
const dues = await getMemberDues(memberId, cycleId);
```

### POST Create Checkout Session
```typescript
const response = await fetch('/api/stripe/checkout/dues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ memberId, cycleId }),
});
const { url } = await response.json();
window.location.href = url;
```

## File Structure

```
types/
  dues.ts                              # TypeScript types

lib/
  utils/
    rotaryYear.ts                      # Rotary year helpers
  firebase/
    duesCycles.ts                      # Firestore CRUD operations

app/
  admin/
    finance/
      dues/
        page.tsx                       # Admin UI
        actions.ts                     # Server actions
  api/
    stripe/
      checkout/
        dues/
          route.ts                     # Create checkout session
    webhooks/
      stripe/
        route.ts                       # Process payments
    admin/
      dues/
        automation/
          route.ts                     # Automation endpoint

components/
  portal/
    DuesBanner.tsx                     # Member dues banner

docs/
  ANNUAL_DUES_GUIDE.md                 # This file
```

## Related Documentation

- [Member Onboarding Guide](./ONBOARDING_GUIDE.md) - Initial membership setup
- [Admin Members Guide](./docs/admin/MEMBERS_GUIDE.md) - Member management
- [Portal Architecture](./PORTAL_ARCHITECTURE.md) - Overall portal structure

## Support

For questions or issues:
- Email: tech@rotaractnewyork.org
- GitHub Issues: [rotaractnyc/issues](https://github.com/your-org/rotaractnyc/issues)
- Slack: #tech-support

---

**Last Updated:** January 2025  
**Version:** 1.0.0
