/**
 * POST /api/admin/import-album
 *
 * Creates a Firestore `import_jobs/{jobId}` document, then either:
 *   a) Dispatches the `import-album.yml` GitHub Actions workflow (production /
 *      Vercel) — the Actions runner has Playwright and writes log output back
 *      to the Firestore doc in real time via the script's LogSink.
 *   b) Spawns `scripts/import-google-photos.ts` as a detached background
 *      process (dev container / local Node.js server) — same LogSink path.
 *
 * The portal UI subscribes to the Firestore doc with onSnapshot and displays
 * a live terminal — no streaming HTTP required.
 *
 * Returns immediately with { jobId, mode: 'actions' | 'local' }.
 *
 * GitHub Actions mode requires three env vars (set in Vercel project settings):
 *   GITHUB_ACTIONS_TOKEN  — PAT with "workflow" scope
 *   GITHUB_OWNER          — repo owner  (e.g. "rotaractnyc-org")
 *   GITHUB_REPO           — repo name   (e.g. "rotaractnyc")
 *
 * Auth: board | president | treasurer session cookie required.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';

const ADMIN_ROLES = ['board', 'president', 'treasurer'];

// Only accept real Google Photos shared-album short URLs — blocks SSRF
const GOOGLE_PHOTOS_URL_RE = /^https:\/\/photos\.app\.goo\.gl\/[A-Za-z0-9]+$/;

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
  // Rate limit: 3 imports per 10 minutes per user (Chromium is resource-heavy)
  const rlKey = getRateLimitKey(req, 'admin-import-album');
  const rl = await rateLimit(rlKey, { max: 3, windowSec: 600 });
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

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

  if (!GOOGLE_PHOTOS_URL_RE.test(body.url.trim())) {
    return NextResponse.json(
      { error: 'URL must be a Google Photos shared album link (https://photos.app.goo.gl/…)' },
      { status: 400 },
    );
  }

  // ── Create Firestore job doc ─────────────────────────────────────────────
  const jobRef = adminDb.collection('import_jobs').doc();
  const jobId  = jobRef.id;

  await jobRef.set({
    status: 'pending',
    triggeredBy: auth.uid,
    url: body.url.trim(),
    title: body.title ?? null,
    slug: body.slug ?? null,
    description: body.description ?? null,
    isPublic: body.isPublic ?? true,
    previewCount: body.previewCount ?? 6,
    featured: body.featured ?? false,
    featuredCount: body.featuredCount ?? 3,
    dryRun: body.dryRun ?? false,
    logText: '',
    createdAt: FieldValue.serverTimestamp(),
  });

  // ── Mode A: GitHub Actions (production / Vercel) ─────────────────────────
  const GITHUB_TOKEN = process.env.GITHUB_ACTIONS_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER;
  const GITHUB_REPO  = process.env.GITHUB_REPO;

  if (GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO) {
    const inputs: Record<string, string> = {
      job_id:         jobId,
      url:            body.url.trim(),
      title:          body.title          ?? '',
      slug:           body.slug           ?? '',
      description:    body.description    ?? '',
      is_public:      String(body.isPublic    ?? true),
      preview_count:  String(body.previewCount ?? 6),
      featured:       String(body.featured     ?? false),
      featured_count: String(body.featuredCount ?? 3),
      dry_run:        String(body.dryRun       ?? false),
    };

    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/import-album.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main', inputs }),
      },
    );

    if (!ghRes.ok) {
      const text = await ghRes.text().catch(() => ghRes.statusText);
      await jobRef.update({ status: 'error', logText: `❌ GitHub API error ${ghRes.status}: ${text}` });
      return NextResponse.json({ error: `GitHub API error: ${ghRes.status}` }, { status: 502 });
    }

    return NextResponse.json({ jobId, mode: 'actions' });
  }

  // ── Mode B: detached local process (dev container / self-hosted) ─────────
  const tsxBin    = path.join(process.cwd(), 'node_modules/.bin/tsx');
  const scriptPath = path.join(process.cwd(), 'scripts/import-google-photos.ts');

  const scriptArgs = [scriptPath, '--url', body.url.trim(), '--job-id', jobId];
  if (body.title)               scriptArgs.push('--title',          body.title);
  if (body.slug)                scriptArgs.push('--slug',           body.slug);
  if (body.description)         scriptArgs.push('--description',    body.description);
  if (body.isPublic === false)  scriptArgs.push('--private');
  if (body.previewCount != null) scriptArgs.push('--preview-count', String(body.previewCount));
  if (body.featured)            scriptArgs.push('--featured');
  if (body.featuredCount != null) scriptArgs.push('--featured-count', String(body.featuredCount));
  if (body.dryRun)              scriptArgs.push('--dry-run');

  const proc = spawn(tsxBin, scriptArgs, {
    cwd: process.cwd(),
    env: { ...process.env },
    detached: true,   // runs independently even if Next.js hot-reloads
    stdio: 'ignore',  // stdout/stderr mirrored to Firestore via LogSink
  });
  proc.unref(); // allow API response to return without waiting for child

  return NextResponse.json({ jobId, mode: 'local' });
}
