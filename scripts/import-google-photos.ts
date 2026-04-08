/**
 * Google Photos → Firebase Storage + Firestore importer
 *
 * Scrapes shared Google Photos album links using a headless Playwright browser,
 * downloads every full-resolution photo, uploads them to Firebase Storage,
 * and indexes them in Firestore under the `albums` and `gallery` collections.
 *
 * USAGE (from the project root, with .env.local present):
 *
 *   # Import a new album directly from a Google Photos URL:
 *   npx tsx scripts/import-google-photos.ts --url "https://photos.app.goo.gl/xxx"
 *
 *   # With custom title, slug, description:
 *   npx tsx scripts/import-google-photos.ts --url "https://photos.app.goo.gl/xxx" \
 *     --title "Gala 2026" --slug "gala-2026" --description "Annual Gala"
 *
 *   # Dry-run (no uploads) to preview what would be imported:
 *   npx tsx scripts/import-google-photos.ts --url "https://photos.app.goo.gl/xxx" --dry-run
 *
 *   # Import all pre-defined albums:
 *   npx tsx scripts/import-google-photos.ts
 *
 *   # Import a specific pre-defined album:
 *   npx tsx scripts/import-google-photos.ts --album pickleball-2025
 *
 * FLAGS:
 *   --url <url>           Import a new album from a Google Photos shared link
 *   --title <title>       Album title (auto-derived from page title if omitted with --url)
 *   --slug <slug>         Album slug  (derived from title if omitted)
 *   --description <text>  Album description
 *   --private             Mark the album as non-public (default: public)
 *   --preview-count <n>   Number of preview photos for public visitors (default: 6)
 *   --featured            Mark first few photos as featured (for homepage carousel)
 *   --featured-count <n>  How many photos to mark as featured (default: 3)
 *   --dry-run             Print what would be imported without uploading anything
 *   --album <slug>        Only import the pre-defined album matching this slug
 *   --limit <n>           Max photos per album (default: all)
 *   --no-skip-existing    Re-import albums that already exist in Firestore
 *   --debug               Verbose URL logging during scraping
 *
 * REQUIREMENTS:
 *   - .env.local with FIREBASE_SERVICE_ACCOUNT_KEY (or FIREBASE_PROJECT_ID etc.)
 *   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local
 *   - npx playwright install chromium  (run once if not yet done)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import * as os from 'os';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { chromium, type Page } from '@playwright/test';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// ─── Parse CLI flags ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_ALBUM = args.includes('--album') ? args[args.indexOf('--album') + 1] : null;
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
const SKIP_EXISTING = !args.includes('--no-skip-existing');
const VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY || null;

// CLI-driven single album (--url mode)
const URL_FLAG        = args.includes('--url')            ? args[args.indexOf('--url') + 1]            : null;
const TITLE_FLAG      = args.includes('--title')          ? args[args.indexOf('--title') + 1]          : null;
const SLUG_FLAG       = args.includes('--slug')           ? args[args.indexOf('--slug') + 1]           : null;
const DESC_FLAG       = args.includes('--description')    ? args[args.indexOf('--description') + 1]    : null;
const IS_PUBLIC_FLAG  = !args.includes('--private');
const PREVIEW_FLAG    = args.includes('--preview-count')  ? parseInt(args[args.indexOf('--preview-count') + 1], 10) : 6;
const FEAT_FLAG       = args.includes('--featured');
const FEAT_COUNT_FLAG = args.includes('--featured-count') ? parseInt(args[args.indexOf('--featured-count') + 1], 10) : 3;

// ─── Album context tags ───────────────────────────────────────────────────────
// Deterministic tags inferred from album slug — zero cost, always applied

const ALBUM_CONTEXT_TAGS: Record<string, string[]> = {
  'pickleball-2025':        ['sport', 'fellowship', 'outdoor', 'social'],
  'gala-2025':              ['gala', 'formal', 'fellowship', 'fundraiser'],
  'penta-fundraiser-2024':  ['gala', 'formal', 'fellowship', 'fundraiser'],
  'rotaract-reception-2022':['fellowship', 'formal', 'reception'],
  'rotary-day-of-service':  ['service', 'community', 'volunteer'],
  'henry-street-settlement':['service', 'community', 'volunteer'],
  'the-door-visit':         ['service', 'community', 'youth'],
};

// Map Vision API label descriptions → our curated tag vocabulary
const VISION_TAG_MAP: Record<string, string[]> = {
  'event':          ['fellowship'],
  'party':          ['fellowship'],
  'celebration':    ['fellowship'],
  'fun':            ['fellowship'],
  'social':         ['fellowship'],
  'sports':         ['sport'],
  'sport':          ['sport'],
  'racket':         ['sport'],
  'ball':           ['sport'],
  'court':          ['sport'],
  'formal wear':    ['formal'],
  'suit':           ['formal'],
  'gown':           ['formal'],
  'dress':          ['formal'],
  'tuxedo':         ['formal'],
  'crowd':          ['group'],
  'audience':       ['group'],
  'community':      ['service'],
  'volunteer':      ['service'],
  'charity':        ['service'],
  'outdoor':        ['outdoor'],
  'nature':         ['outdoor'],
  'sky':            ['outdoor'],
  'park':           ['outdoor'],
  'tree':           ['outdoor'],
  'building':       ['indoor'],
  'room':           ['indoor'],
  'interior design':['indoor'],
  'smile':          ['portrait'],
  'happy':          ['portrait'],
  'portrait':       ['portrait'],
  'face':           ['portrait'],
  'youth':          ['youth'],
  'child':          ['youth'],
  'student':        ['youth'],
};

// ─── Album definitions ───────────────────────────────────────────────────────

interface AlbumDef {
  slug?: string;          // derived from title if not set
  title?: string;         // derived from scraped page title if not set
  date: string;           // ISO date string
  description?: string;
  googlePhotosUrl: string;
  isPublic: boolean;
  publicPreviewCount: number;
  isFeatured?: boolean;   // first N photos marked as featured (for homepage carousel)
  featuredCount?: number;
}

const ALBUMS: AlbumDef[] = [
  {
    slug: 'pickleball-2025',
    title: 'Pickleball Social',
    date: '2025-09-14',           // from page title: "25.9.14 Pickleball Social"
    description: 'Rotaract NYC Pickleball Social — fellowship on the courts!',
    googlePhotosUrl: 'https://photos.app.goo.gl/f1v5fwReK3ZNNYM46',
    isPublic: true,
    publicPreviewCount: 6,
    isFeatured: true,
    featuredCount: 3,
  },
  {
    slug: 'gala-2025',
    title: 'RCUN Gala 2025',
    date: '2025-01-01',
    description: 'Rotaract NYC Annual Gala 2025 — celebrating another year of service and fellowship.',
    googlePhotosUrl: 'https://photos.app.goo.gl/md5aDSN8oLNEaeW1A',
    isPublic: true,
    publicPreviewCount: 6,
    isFeatured: true,
    featuredCount: 4,
  },
  {
    slug: 'penta-fundraiser-2024',
    title: 'Penta Fundraiser 2024',
    date: '2024-01-01',           // from page title: "RCUN Penta Fundraiser 2024"
    description: 'Rotaract NYC Penta Fundraiser 2024.',
    googlePhotosUrl: 'https://photos.app.goo.gl/wpP4EaFfdbEqGJfB7',
    isPublic: true,
    publicPreviewCount: 6,
    isFeatured: true,
    featuredCount: 2,
  },
  {
    slug: 'rotaract-reception-2022',
    title: 'Rotaract Reception 2022',
    date: '2022-01-01',           // from page title: "Rotaract Reception 2022"
    description: 'Rotaract NYC Reception 2022.',
    googlePhotosUrl: 'https://photos.app.goo.gl/MZFmtCeeVEj5qVkj9',
    isPublic: true,
    publicPreviewCount: 6,
  },
  {
    slug: 'rotary-day-of-service',
    title: 'Rotary Day of Service',
    date: '2023-05-20',           // from page title: "23.5.20 Rotary Day of service"
    description: 'A day of community service with fellow Rotaractors across New York City.',
    googlePhotosUrl: 'https://photos.app.goo.gl/Bz95o4C8RnbCQ5LBA',
    isPublic: true,
    publicPreviewCount: 6,
    isFeatured: true,
    featuredCount: 3,
  },
  {
    slug: 'henry-street-settlement',
    title: 'Henry Street Settlement',
    date: '2022-08-27',           // from page title: "22.8.27 Henry Street Settlement"
    description: 'Volunteering at Henry Street Settlement — one of NYC\'s oldest social service organizations.',
    googlePhotosUrl: 'https://photos.app.goo.gl/uc7MCjgg5cBop8tR6',
    isPublic: true,
    publicPreviewCount: 6,
    isFeatured: true,
    featuredCount: 2,
  },
  {
    slug: 'the-door-visit',
    title: 'The Door Visit',
    date: '2023-03-10',           // from page title: "23.3.10 The Door RCUN visit"
    description: 'Visit to The Door — a center for youth development in New York City.',
    googlePhotosUrl: 'https://photos.app.goo.gl/f6Y9N9WiBQ6JNRPX8',
    isPublic: true,
    publicPreviewCount: 6,
    isFeatured: true,
    featuredCount: 2,
  },
];

// ─── Firebase init ───────────────────────────────────────────────────────────

function initFirebase() {
  if (getApps().length) return;
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    let sa: ServiceAccount;
    try { sa = JSON.parse(saJson) as ServiceAccount; }
    catch { sa = JSON.parse(saJson.replace(/\n/g, '\\n')) as ServiceAccount; }
    initializeApp({ credential: cert(sa) });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as ServiceAccount),
    });
  } else {
    throw new Error('No Firebase credentials found. Add FIREBASE_SERVICE_ACCOUNT_KEY to .env.local');
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    });
    req.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Convert a Google Photos thumbnail URL to the highest-res version */
function toFullRes(url: string): string {
  // Google Photos URLs end in =wXXX-hYYY or =s512 etc.
  // Replace with =w4096 to get max resolution
  let hi = url
    .replace(/=w\d+-h\d+(-[^?]+)?(\?.*)?$/, '=w4096')
    .replace(/=s\d+(\?.*)?$/, '=s4096');
  // /pw/ URLs often have no size suffix — append one for max resolution
  if (hi === url && /\/pw\//.test(url) && !url.includes('=w') && !url.includes('=s')) {
    hi = url + '=w4096';
  }
  return hi;
}

// ─── Google Photos scraper ───────────────────────────────────────────────────

const DEBUG = args.includes('--debug');

async function scrapeAlbum(
  page: Page,
  albumUrl: string,
  limit: number,
): Promise<{ urls: string[]; scrapedTitle: string }> {
  console.log(`  🌐 Opening album: ${albumUrl}`);

  // Use 'load' instead of 'networkidle' — Google Photos makes continuous API calls
  // that prevent networkidle from ever firing within reasonable timeouts
  await page.goto(albumUrl, { waitUntil: 'load', timeout: 60000 });

  // Let the JS app hydrate and lazy-load initial photos
  await sleep(4000);

  // Log page info so we can detect sign-in redirects / errors
  const pageTitle = await page.title();
  const pageUrl = page.url();
  if (DEBUG) {
    console.log(`  🔗 Final URL: ${pageUrl}`);
    console.log(`  📄 Page title: ${pageTitle}`);
  }

  // Detect if we got redirected to a sign-in page
  if (
    pageUrl.includes('accounts.google.com') ||
    pageUrl.includes('/signin') ||
    pageTitle.toLowerCase().includes('sign in') ||
    pageTitle.toLowerCase().includes('log in')
  ) {
    console.log('  ⚠️  Redirected to sign-in — album may be private or require Google account');
    return { urls: [], scrapedTitle: '' };
  }

  // Detect error / empty pages
  if (pageTitle.includes('Error') || pageTitle.includes('not found') || pageTitle === '') {
    console.log(`  ⚠️  Unexpected page: "${pageTitle}"`);
    return { urls: [], scrapedTitle: '' };
  }

  // Scroll to load all photos (Google Photos lazy-loads thumbnails)
  console.log('  📜 Scrolling to load all photos...');
  let previousCount = 0;
  let stableRounds = 0;

  while (stableRounds < 4) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);

    const currentCount = await page.evaluate(() => {
      // Count all candidate images
      const imgs = document.querySelectorAll('img[src*="googleusercontent.com"]');
      return imgs.length;
    });

    if (currentCount === previousCount) {
      stableRounds++;
    } else {
      stableRounds = 0;
      previousCount = currentCount;
    }

    if (currentCount >= limit) break;

    process.stdout.write(`\r  📷 Found ${currentCount} images so far...`);
  }
  console.log('');

  // Extract all unique photo URLs — check img src, data-src, and background-image
  const rawUrls: string[] = await page.evaluate(() => {
    const urls = new Set<string>();

    // Strategy 1: img[src] and img[data-src]
    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const src = img.src || img.getAttribute('data-src') || '';
      if (src) urls.add(src);
    });

    // Strategy 2: elements with background-image style containing googleusercontent
    document.querySelectorAll<HTMLElement>('[style*="googleusercontent.com"]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      const match = style.match(/url\(["']?(https:\/\/[^"')]+googleusercontent[^"')]+)["']?\)/);
      if (match) urls.add(match[1]);
    });

    // Strategy 3: any element with data-src containing googleusercontent
    document.querySelectorAll<HTMLElement>('[data-src*="googleusercontent"]').forEach((el) => {
      const src = el.getAttribute('data-src') || '';
      if (src) urls.add(src);
    });

    return Array.from(urls);
  });

  if (DEBUG) {
    console.log(`  🔍 DEBUG: ${rawUrls.length} total raw URLs found`);
    rawUrls.slice(0, 5).forEach((u) => console.log(`     → ${u.slice(0, 100)}`));
  }

  // Filter to real photo URLs (not UI icons, avatars, profile pics)
  const filtered = rawUrls.filter((src) => {
    if (!src.includes('googleusercontent.com')) return false;
    // Exclude profile / avatar URLs (path component /a/)
    if (/googleusercontent\.com\/a\//.test(src)) return false;
    // Exclude tiny icons (usually < 32px in size param)
    const sizeMatch = src.match(/=(?:w|s)(\d+)/);
    if (sizeMatch && parseInt(sizeMatch[1], 10) < 100) return false;
    // Must have size params or known photo path segments
    const isPhoto = src.includes('=w') || src.includes('=s') || src.includes('/photo/') || /\/pw\//.test(src) || /lh\d\.googleusercontent/.test(src);
    return isPhoto;
  });

  if (DEBUG) {
    console.log(`  🔍 DEBUG: ${filtered.length} photo URLs after filtering`);
    filtered.slice(0, 5).forEach((u) => console.log(`     → ${u.slice(0, 100)}`));
  }

  // Deduplicate by base URL (strip size params for comparison)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const url of filtered) {
    const base = url.replace(/=[^?]+(\?.*)?$/, '');
    if (!seen.has(base)) {
      seen.add(base);
      unique.push(toFullRes(url));
    }
  }

  console.log(`  ✅ Found ${unique.length} unique photos`);
  return { urls: unique.slice(0, limit), scrapedTitle: pageTitle };
}

// ─── Upload to Firebase Storage ──────────────────────────────────────────────

async function uploadToStorage(
  localPath: string,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const bucket = getStorage().bucket(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET
  );

  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: { contentType },
    public: true,
  });

  const file = bucket.file(storagePath);
  const [metadata] = await file.getMetadata();
  // Return the public CDN URL
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
}

// ─── Cloud Vision API tagging ─────────────────────────────────────────────────

/**
 * Calls Google Cloud Vision LABEL_DETECTION on a public image URL.
 * Returns raw label descriptions (lowercased) with score > 0.7.
 * Returns [] if GOOGLE_CLOUD_VISION_API_KEY is not set or request fails.
 */
async function getVisionLabels(imageUrl: string): Promise<string[]> {
  if (!VISION_API_KEY) return [];
  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [{ type: 'LABEL_DETECTION', maxResults: 15 }],
          }],
        }),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const annotations = data.responses?.[0]?.labelAnnotations || [];
    return annotations
      .filter((a: any) => a.score >= 0.70)
      .map((a: any) => (a.description as string).toLowerCase());
  } catch {
    return [];
  }
}

/** Map raw Vision labels + album context slug → curated tag set */
function buildTags(albumSlug: string, visionLabels: string[]): string[] {
  const tagSet = new Set<string>(ALBUM_CONTEXT_TAGS[albumSlug] || []);
  for (const label of visionLabels) {
    const mapped = VISION_TAG_MAP[label];
    if (mapped) mapped.forEach((t) => tagSet.add(t));
  }
  return Array.from(tagSet);
}

// ─── Main import logic ───────────────────────────────────────────────────────

async function importAlbum(
  page: Page,
  album: AlbumDef,
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  // Scrape photo URLs (and pick up the page title for auto-derive)
  const { urls: photoUrls, scrapedTitle } = await scrapeAlbum(page, album.googlePhotosUrl, LIMIT);

  // Auto-fill title + slug from the scraped Google Photos page title
  if (!album.title) {
    album.title = scrapedTitle.replace(/ - Google Photos$/i, '').trim() || 'Imported Album';
    console.log(`  📝 Auto-title: "${album.title}"`);
  }
  if (!album.slug) {
    album.slug = slugify(album.title);
    console.log(`  📝 Auto-slug:  "${album.slug}"`);
  }

  console.log(`\n📁 Album: ${album.title} (${album.slug})`);

  // Check if album already exists (skip in dry-run)
  if (SKIP_EXISTING && !DRY_RUN) {
    const existing = await db.collection('albums').where('slug', '==', album.slug).limit(1).get();
    if (!existing.empty) {
      console.log(`  ⏭️  Skipping — already exists in Firestore (use --no-skip-existing to re-import)`);
      return;
    }
  }

  if (photoUrls.length === 0) {
    console.log('  ⚠️  No photos found — album may be private or require sign-in');
    return;
  }

  if (DRY_RUN) {
    console.log(`  🔍 DRY RUN — would upload ${photoUrls.length} photos`);
    photoUrls.slice(0, 3).forEach((url, i) => console.log(`     [${i}] ${url.slice(0, 80)}...`));
    return;
  }

  // Create temp directory for downloads
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `rotaract-${album.slug}-`));

  try {
    let coverPhotoUrl = '';
    const photoIds: string[] = [];

    // Create album doc first to get the ID
    const albumRef = db.collection('albums').doc();
    const albumId = albumRef.id;

    console.log(`  ⬆️  Uploading ${photoUrls.length} photos to Firebase Storage...`);

    for (let i = 0; i < photoUrls.length; i++) {
      const photoUrl = photoUrls[i];
      const fileName = `photo_${String(i + 1).padStart(4, '0')}.jpg`;
      const localPath = path.join(tmpDir, fileName);
      const storagePath = `albums/${album.slug}/${fileName}`;

      process.stdout.write(`\r  📤 Uploading ${i + 1}/${photoUrls.length}: ${fileName}...`);

      try {
        // Download
        await downloadFile(photoUrl, localPath);

        // Upload to Firebase Storage
        const publicUrl = await uploadToStorage(localPath, storagePath, 'image/jpeg');

        // Auto-tag: album context tags + Vision API labels
        const visionLabels = await getVisionLabels(publicUrl);
        const tags = buildTags(album.slug, visionLabels);

        // Create gallery doc
        const galleryRef = db.collection('gallery').doc();
        const isFeatured = album.isFeatured === true && i < (album.featuredCount || 2);
        const isPreview = i < album.publicPreviewCount;

        await galleryRef.set({
          albumId,
          url: publicUrl,
          storagePath,
          caption: '',
          order: i,
          isPreview,
          isFeatured,
          likes: 0,
          likedBy: [],
          tags,
          visionLabels,
          createdAt: new Date().toISOString(),
        });

        photoIds.push(galleryRef.id);

        // First photo becomes the cover
        if (i === 0) coverPhotoUrl = publicUrl;

        // Clean up local file
        fs.unlinkSync(localPath);

      } catch (err: any) {
        console.log(`\n  ⚠️  Failed to upload photo ${i + 1}: ${err.message}`);
      }

      // Small delay to avoid rate limiting
      await sleep(200);
    }

    console.log('');

    // Save album to Firestore
    await albumRef.set({
      slug: album.slug,
      title: album.title,
      date: album.date,
      description: album.description || '',
      coverPhotoUrl,
      photoCount: photoIds.length,
      isPublic: album.isPublic,
      publicPreviewCount: album.publicPreviewCount,
      googlePhotosUrl: album.googlePhotosUrl,
      isFeatured: album.isFeatured || false,
      tags: ALBUM_CONTEXT_TAGS[album.slug] || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`  ✅ Done! ${photoIds.length} photos uploaded. Album ID: ${albumId}`);
    console.log(`     Cover: ${coverPhotoUrl.slice(0, 60)}...`);

  } finally {
    // Clean up temp dir
    try { fs.rmdirSync(tmpDir, { recursive: true }); } catch {}
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Rotaract NYC — Google Photos → Firebase Importer');
  console.log('═'.repeat(52));

  if (DRY_RUN) console.log('🔍 DRY RUN MODE — nothing will be uploaded\n');

  // Init Firebase
  if (!DRY_RUN) {
    try {
      initFirebase();
      console.log('✅ Firebase Admin initialized');
      if (VISION_API_KEY) {
        console.log('✅ Cloud Vision API enabled — photos will be auto-tagged');
      } else {
        console.log('ℹ️  No GOOGLE_CLOUD_VISION_API_KEY — using album context tags only');
      }
      console.log('');
    } catch (err: any) {
      console.error('❌ Firebase init failed:', err.message);
      console.error('   Make sure .env.local has FIREBASE_SERVICE_ACCOUNT_KEY');
      process.exit(1);
    }
  }

  const db = DRY_RUN ? null as any : getFirestore();

  // ── Determine which albums to import ──────────────────────────────────────

  let albumsToImport: AlbumDef[];

  if (URL_FLAG) {
    // Single-shot import from a Google Photos URL passed on the CLI
    albumsToImport = [{
      googlePhotosUrl: URL_FLAG,
      title:           TITLE_FLAG   || undefined,   // auto-derive from page if not set
      slug:            SLUG_FLAG    || undefined,
      description:     DESC_FLAG    || undefined,
      date:            new Date().toISOString().split('T')[0],
      isPublic:        IS_PUBLIC_FLAG,
      publicPreviewCount: PREVIEW_FLAG,
      isFeatured:      FEAT_FLAG,
      featuredCount:   FEAT_COUNT_FLAG,
    }];
    console.log(`🔗 URL mode: ${URL_FLAG}`);
    if (TITLE_FLAG) console.log(`   Title:       ${TITLE_FLAG}`);
    if (SLUG_FLAG)  console.log(`   Slug:        ${SLUG_FLAG}`);
    console.log(`   Public:      ${IS_PUBLIC_FLAG}`);
    console.log(`   Preview:     ${PREVIEW_FLAG} photos`);
    console.log(`   Featured:    ${FEAT_FLAG ? `yes (${FEAT_COUNT_FLAG} photos)` : 'no'}`);
    console.log('');
  } else {
    // Pre-defined albums list
    albumsToImport = ONLY_ALBUM
      ? ALBUMS.filter((a) => a.slug === ONLY_ALBUM)
      : ALBUMS;

    if (albumsToImport.length === 0) {
      console.error(`❌ No album found with slug "${ONLY_ALBUM}"`);
      console.error('   Available slugs:', ALBUMS.map((a) => a.slug).join(', '));
      process.exit(1);
    }

    console.log(`📋 Albums to import: ${albumsToImport.map((a) => a.title).join(', ')}`);
  }

  console.log(`🔢 Photo limit per album: ${LIMIT === Infinity ? 'all' : LIMIT}`);
  console.log('');

  // Launch Playwright
  console.log('🎭 Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  let successCount = 0;
  let failCount = 0;

  for (const album of albumsToImport) {
    try {
      await importAlbum(page, album, db);
      successCount++;
    } catch (err: any) {
      console.error(`\n❌ Failed to import "${album.title}": ${err.message}`);
      failCount++;
    }
  }

  await browser.close();

  console.log('\n' + '═'.repeat(52));
  console.log(`✅ Import complete!`);
  console.log(`   Succeeded: ${successCount}/${albumsToImport.length} albums`);
  if (failCount > 0) console.log(`   Failed: ${failCount} albums`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Visit your site → /gallery to see the albums');
  console.log('  2. Visit Portal → Media → Albums to manage them');
  console.log('  3. Set accurate dates per album in the portal editor');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
