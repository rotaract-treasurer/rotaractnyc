/**
 * Renders a check-in QR code as a PNG image.
 *
 * Why this exists: emails embed QR codes via `<img src>`. Many email
 * clients (notably Gmail) strip `data:` URIs from images for security,
 * which causes the QR to render as a broken-image placeholder. Hosting
 * the PNG over HTTPS solves that.
 *
 * Security: the URL is signed with the same HMAC used by the check-in
 * endpoint (lib/utils/qrcode → verifyCheckInSignature). An attacker
 * can't enumerate QR codes for arbitrary events/members because they
 * can't forge a valid signature without the CRON_SECRET.
 *
 * Caching: the QR encodes a check-in URL valid for 24 hours, so we set
 * a long-lived public cache (signature is immutable for that window).
 */
import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { verifyCheckInSignature } from '@/lib/utils/qrcode';
import { SITE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get('e') || '';
  const memberId = url.searchParams.get('m') || '';
  const timestamp = url.searchParams.get('t') || '';
  const signature = url.searchParams.get('sig') || '';
  const tk = url.searchParams.get('tk');

  if (!eventId || !memberId || !timestamp || !signature) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  if (!verifyCheckInSignature(eventId, memberId, timestamp, signature)) {
    return NextResponse.json({ error: 'Invalid or expired signature' }, { status: 403 });
  }

  // Reconstruct the same check-in URL the QR encodes. We don't import
  // generateCheckInUrl directly because it always builds a fresh
  // timestamp; we need to honor the (verified) timestamp from the link.
  const tkSuffix = tk ? `&tk=${encodeURIComponent(tk)}` : '';
  const checkInUrl =
    `${SITE.url}/portal/events/${eventId}/checkin` +
    `?m=${encodeURIComponent(memberId)}` +
    `&t=${encodeURIComponent(timestamp)}` +
    `&sig=${encodeURIComponent(signature)}` +
    tkSuffix;

  try {
    const png = await QRCode.toBuffer(checkInUrl, {
      type: 'png',
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return new NextResponse(png as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // 24h public cache — matches the signature TTL.
        'Cache-Control': 'public, max-age=86400, immutable',
        'Content-Length': String(png.length),
      },
    });
  } catch (err) {
    console.error('QR generation failed:', err);
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 });
  }
}
