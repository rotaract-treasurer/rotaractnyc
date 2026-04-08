/**
 * POST /api/admin/import-album
 *
 * Spawns `scripts/import-google-photos.ts` as a child process and streams
 * its stdout/stderr back to the browser as plain text (chunked transfer).
 *
 * ⚠️  REQUIRES PLAYWRIGHT — this endpoint only works when the app is running
 *    locally or inside the dev container. Vercel serverless functions do not
 *    have Chromium available and would time-out for any non-trivial album.
 *
 * Auth: board | president | treasurer role required (session cookie).
 */
export const dynamic = 'force-dynamic';
// Allow up to 30 min — import of large albums is slow
export const maxDuration = 1800;

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

const ADMIN_ROLES = ['board', 'president', 'treasurer'];

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<{ uid: string } | NextResponse> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  try {
    ({ uid } = await adminAuth.verifySessionCookie(sessionCookie, true));
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const memberDoc = await adminDb.collection('members').doc(uid).get();
  if (!memberDoc.exists) {
    return NextResponse.json({ error: 'Member not found' }, { status: 403 });
  }
  if (!ADMIN_ROLES.includes(memberDoc.data()!.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  return { uid };
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: {
    url: string;
    title?: string;
    slug?: string;
    description?: string;
    isPublic?: boolean;
    previewCount?: number;
    featured?: boolean;
    featuredCount?: number;
    dryRun?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.url?.trim()) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // ── Build CLI args ──────────────────────────────────────────────────────
  const scriptArgs: string[] = [
    path.join(process.cwd(), 'scripts/import-google-photos.ts'),
    '--url', body.url.trim(),
  ];
  if (body.title)                        scriptArgs.push('--title', body.title);
  if (body.slug)                         scriptArgs.push('--slug', body.slug);
  if (body.description)                  scriptArgs.push('--description', body.description);
  if (body.isPublic === false)           scriptArgs.push('--private');
  if (body.previewCount != null)         scriptArgs.push('--preview-count', String(body.previewCount));
  if (body.featured)                     scriptArgs.push('--featured');
  if (body.featuredCount != null)        scriptArgs.push('--featured-count', String(body.featuredCount));
  if (body.dryRun)                       scriptArgs.push('--dry-run');

  const tsxBin = path.join(process.cwd(), 'node_modules/.bin/tsx');

  // ── Stream stdout + stderr back to the client ────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (text: string) => {
        try { controller.enqueue(encoder.encode(text)); } catch { /* closed */ }
      };

      let proc: ReturnType<typeof spawn>;
      try {
        proc = spawn(tsxBin, scriptArgs, {
          cwd: process.cwd(),
          env: { ...process.env },
        });
      } catch (err) {
        send(`\n❌ Failed to start import script: ${err}\n`);
        controller.close();
        return;
      }

      proc.stdout?.on('data', (data: Buffer) => send(data.toString()));
      proc.stderr?.on('data', (data: Buffer) => send(data.toString()));

      proc.on('error', (err) => {
        send(`\n❌ Process error: ${err.message}\n`);
        controller.close();
      });

      proc.on('close', (code) => {
        send(`\n${code === 0 ? '✅' : '❌'} Process exited with code ${code}\n`);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    },
  });
}
