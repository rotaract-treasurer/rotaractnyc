/**
 * Google Workspace — shared OAuth2 / service-account client.
 *
 * Two auth strategies are supported:
 *
 *  1. **Service Account** (GOOGLE_SERVICE_ACCOUNT_KEY env var)
 *     Best for server-to-server access to a shared club calendar, Drive
 *     folder, or Sheets spreadsheet.  The service account must be granted
 *     Domain-Wide Delegation if you need to impersonate a Workspace user,
 *     or shared directly on the target resources.
 *
 *  2. **OAuth2 Client** (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET env vars)
 *     Used when you need per-user consent (e.g. accessing a member's own
 *     calendar).  Tokens are stored in Firestore per user.
 *
 * This module exposes helpers to obtain an authorized `google.auth` instance
 * for either strategy.
 */

import { google } from 'googleapis';
import { adminDb } from '@/lib/firebase/admin';

// ─── Environment Variables ───

const SA_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google/callback`;

// ─── Settings Collection ───

const SETTINGS_DOC = 'settings';
const GOOGLE_DOC = 'google-workspace';

export interface GoogleWorkspaceSettings {
  calendarId?: string;         // shared calendar ID
  sheetId?: string;            // linked Sheets spreadsheet ID
  driveFolderId?: string;      // shared Drive folder ID
  enabled: boolean;
  calendarEnabled?: boolean;
  sheetsEnabled?: boolean;
  driveEnabled?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_SETTINGS: GoogleWorkspaceSettings = {
  enabled: false,
  calendarEnabled: false,
  sheetsEnabled: false,
  driveEnabled: false,
};

// ─── Helpers ───

/** Read Google Workspace settings from Firestore. */
export async function getGoogleSettings(): Promise<GoogleWorkspaceSettings> {
  const doc = await adminDb.collection(SETTINGS_DOC).doc(GOOGLE_DOC).get();
  if (!doc.exists) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...doc.data() } as GoogleWorkspaceSettings;
}

/** Write Google Workspace settings to Firestore. */
export async function updateGoogleSettings(
  data: Partial<GoogleWorkspaceSettings>,
  updatedBy: string,
): Promise<GoogleWorkspaceSettings> {
  const updated = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await adminDb.collection(SETTINGS_DOC).doc(GOOGLE_DOC).set(updated, { merge: true });
  return { ...DEFAULT_SETTINGS, ...(await getGoogleSettings()) };
}

// ─── Service Account Auth ───

let _saAuth: InstanceType<typeof google.auth.GoogleAuth> | null = null;

/**
 * Return an authorized GoogleAuth client using the service account.
 * Scopes cover Calendar, Sheets and Drive.
 */
export function getServiceAccountAuth() {
  if (!SA_KEY) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not configured. ' +
        'Set it in your environment variables to enable Google Workspace integration.',
    );
  }

  if (_saAuth) return _saAuth;

  let credentials: Record<string, any>;
  try {
    credentials = JSON.parse(SA_KEY);
  } catch {
    credentials = JSON.parse(SA_KEY.replace(/\n/g, '\\n'));
  }

  _saAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  return _saAuth;
}

/** Check whether service-account credentials are configured. */
export function isServiceAccountConfigured(): boolean {
  return !!SA_KEY;
}

// ─── OAuth2 Client (per-user) ───

export function getOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for OAuth2.',
    );
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function isOAuth2Configured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

/**
 * Generate the Google OAuth consent URL for an admin to connect
 * the club's Google Workspace account.
 */
export function getConsentUrl(state?: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: state || 'google-workspace-connect',
  });
}

/**
 * Exchange an authorization code for tokens and store them in Firestore.
 */
export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Persist tokens
  await adminDb.collection(SETTINGS_DOC).doc(GOOGLE_DOC).set(
    {
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
      oauthConnectedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return tokens;
}

/**
 * Get an OAuth2 client with stored tokens (for making API calls).
 */
export async function getAuthedOAuth2Client() {
  const settings = await adminDb.collection(SETTINGS_DOC).doc(GOOGLE_DOC).get();
  const data = settings.data();
  if (!data?.tokens?.refresh_token) {
    throw new Error('Google Workspace is not connected. Please connect via Admin settings.');
  }

  const client = getOAuth2Client();
  client.setCredentials(data.tokens);

  // Handle token refresh
  client.on('tokens', async (newTokens) => {
    const updates: Record<string, any> = {
      'tokens.access_token': newTokens.access_token,
      'tokens.expiry_date': newTokens.expiry_date,
    };
    if (newTokens.refresh_token) {
      updates['tokens.refresh_token'] = newTokens.refresh_token;
    }
    await adminDb.collection(SETTINGS_DOC).doc(GOOGLE_DOC).update(updates);
  });

  return client;
}
