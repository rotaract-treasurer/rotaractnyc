/**
 * GET  /api/google/callback  — OAuth2 callback handler
 *
 * Google redirects here after the admin grants consent.
 * Exchanges the code for tokens and stores them.
 */
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, updateGoogleSettings } from '@/lib/google/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state') || '';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const adminPage = `${appUrl}/portal/admin/google-workspace`;

  if (error) {
    return NextResponse.redirect(
      `${adminPage}?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${adminPage}?error=${encodeURIComponent('No authorization code received')}`,
    );
  }

  try {
    await exchangeCodeForTokens(code);

    // Mark as enabled
    await updateGoogleSettings({ enabled: true }, state || 'oauth-callback');

    return NextResponse.redirect(`${adminPage}?success=connected`);
  } catch (err: any) {
    console.error('[GET /api/google/callback]', err);
    return NextResponse.redirect(
      `${adminPage}?error=${encodeURIComponent(err.message || 'Token exchange failed')}`,
    );
  }
}
