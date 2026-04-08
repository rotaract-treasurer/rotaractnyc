/**
 * GET  /api/google/status  — returns Google Workspace connection status
 * POST /api/google/status  — update Google Workspace settings (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
  getGoogleSettings,
  updateGoogleSettings,
  isServiceAccountConfigured,
  isOAuth2Configured,
} from '@/lib/google/client';

export const dynamic = 'force-dynamic';

// ─── GET: Return integration status ───

export async function GET() {
  try {
    const settings = await getGoogleSettings();
    return NextResponse.json({
      configured: isServiceAccountConfigured() || isOAuth2Configured(),
      serviceAccountConfigured: isServiceAccountConfigured(),
      oauthConfigured: isOAuth2Configured(),
      enabled: settings.enabled,
      calendarEnabled: settings.calendarEnabled ?? false,
      sheetsEnabled: settings.sheetsEnabled ?? false,
      driveEnabled: settings.driveEnabled ?? false,
      calendarId: settings.calendarId || null,
      sheetId: settings.sheetId || null,
      driveFolderId: settings.driveFolderId || null,
      updatedAt: settings.updatedAt || null,
    });
  } catch (error) {
    console.error('[GET /api/google/status]', error);
    return NextResponse.json(
      { configured: false, enabled: false, error: 'Failed to fetch status' },
      { status: 500 },
    );
  }
}

// ─── POST: Update settings (admin only) ───

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const memberSnap = await adminDb.collection('members').doc(uid).get();
    const member = memberSnap.exists ? (memberSnap.data() as any) : null;
    if (!member || !['board', 'president'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      'calendarId', 'sheetId', 'driveFolderId',
      'enabled', 'calendarEnabled', 'sheetsEnabled', 'driveEnabled',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const settings = await updateGoogleSettings(updates, uid);
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[POST /api/google/status]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 },
    );
  }
}
