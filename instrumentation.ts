/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Fails fast if required environment variables are missing so the
 * problem is obvious at boot time rather than surfacing as a cryptic
 * runtime error deep in a request handler.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const required: string[] = [
      // Firebase Admin
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      // Stripe
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      // Email
      'RESEND_API_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      const list = missing.map((k) => `  • ${k}`).join('\n');
      // Use console.error so it's visible in logs even if the process continues
      console.error(
        `\n[rotaractnyc] FATAL: Missing required environment variables:\n${list}\n` +
        `  Set them in .env.local (development) or your hosting provider's env config.\n`,
      );
      // In production throw to prevent the server from silently starting broken
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }
  }
}
