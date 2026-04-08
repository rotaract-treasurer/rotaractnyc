/**
 * GET  /api/google/drive/files  — list files in the shared Drive folder
 * POST /api/google/drive/files  — create a sub-folder
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getGoogleSettings } from '@/lib/google/client';
import { listFiles, listFolders, createFolder } from '@/lib/google/drive';

export const dynamic = 'force-dynamic';

// ─── GET: list files ───

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const settings = await getGoogleSettings();
    if (!settings.enabled || !settings.driveEnabled || !settings.driveFolderId) {
      return NextResponse.json({ files: [], folders: [], enabled: false });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || undefined;
    const query = searchParams.get('q') || undefined;
    const pageToken = searchParams.get('pageToken') || undefined;

    const [fileResult, folders] = await Promise.all([
      listFiles({ folderId, query, pageToken }),
      listFolders(folderId),
    ]);

    return NextResponse.json({
      files: fileResult.files,
      folders,
      nextPageToken: fileResult.nextPageToken,
      enabled: true,
    });
  } catch (error: any) {
    console.error('[GET /api/google/drive/files]', error);
    return NextResponse.json({ files: [], folders: [], error: error.message }, { status: 500 });
  }
}

// ─── POST: create folder ───

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
    const { name, parentFolderId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    }

    const folder = await createFolder(name.trim(), parentFolderId);
    return NextResponse.json(folder);
  } catch (error: any) {
    console.error('[POST /api/google/drive/files]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
