# Environment Variables for Vercel

Copy these to your Vercel project settings:

## Required Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rotaractnyc-ac453.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rotaractnyc-ac453
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rotaractnyc-ac453.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Comma-separated list of admin emails allowed into /admin
ADMIN_ALLOWLIST=tojacquet97@gmail.com,admin@rotaractnyc.org

# Firebase Admin credentials for server-side access (recommended)
# Option A: paste the full service account JSON string
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Option B: base64-encoded service account JSON (often easier for Vercel)
FIREBASE_SERVICE_ACCOUNT_BASE64=...

# Option C: split values (only if you prefer not to use JSON/base64)
FIREBASE_ADMIN_PROJECT_ID=rotaractnyc-ac453
FIREBASE_ADMIN_CLIENT_EMAIL=...@rotaractnyc-ac453.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Resend (email notifications for contact form)
RESEND_API_KEY=...
# Must be a verified sender, e.g. "Rotaract NYC <noreply@rotaractnyc.org>"
RESEND_FROM=...
# Optional: comma-separated recipients for contact notifications
RESEND_CONTACT_TO=rotaractnewyorkcity@gmail.com

# Stripe (for online dues payment)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Automation (for dues reminders and enforcement)
AUTOMATION_API_KEY=your-secret-key-here
```

## Notes

- The public site can read data via server routes using Firebase Admin.
- Admin writes are protected by `ADMIN_ALLOWLIST` + Firebase ID token verification.
- **Stripe keys are required for online dues payment.** See [STRIPE_SETUP_GUIDE.md](../STRIPE_SETUP_GUIDE.md) for detailed setup instructions.
- Use test keys (`sk_test_`) for development and live keys (`sk_live_`) for production.

## Firebase rules (recommended)

This repo includes locked-down default rules because the app accesses Firestore/Storage via server-side API routes.

- Firestore rules: `firestore.rules`
- Storage rules: `storage.rules`

Deploy:

`npx firebase deploy --only firestore:rules,storage`
