import crypto from 'crypto';
import QRCode from 'qrcode';
import { SITE } from '@/lib/constants';

const SIGNATURE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET environment variable is not set');
  return secret;
}

/**
 * Build an HMAC-SHA256 signature for a check-in URL.
 */
function hmac(data: string): string {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
}

/**
 * Generate a signed check-in URL for a specific event + member.
 *
 * Optionally include a ticket number (e.g. 1 of 3) so multi-ticket purchases
 * yield visually distinct QR codes. The ticket number is *not* part of the
 * HMAC payload — the same signed (eventId, memberId, timestamp) tuple is
 * reused for all N tickets so any one of them can be scanned for check-in.
 */
export function generateCheckInUrl(
  eventId: string,
  memberId: string,
  ticketNumber?: number,
): string {
  const timestamp = Date.now().toString();
  const signature = hmac(`${eventId}:${memberId}:${timestamp}`);
  const tk = ticketNumber && ticketNumber > 0 ? `&tk=${ticketNumber}` : '';
  return `${SITE.url}/portal/events/${eventId}/checkin?m=${memberId}&t=${timestamp}&sig=${signature}${tk}`;
}

/**
 * Verify that a check-in signature is valid and not expired (24-hour window).
 */
export function verifyCheckInSignature(
  eventId: string,
  memberId: string,
  timestamp: string,
  signature: string,
): boolean {
  const expected = hmac(`${eventId}:${memberId}:${timestamp}`);
  if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))) {
    return false;
  }
  const ts = Number(timestamp);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < SIGNATURE_TTL_MS;
}

/**
 * Generate a QR code PNG as a base-64 data URL.
 */
export async function generateCheckInQRCode(eventId: string, memberId: string): Promise<string> {
  const url = generateCheckInUrl(eventId, memberId);
  return QRCode.toDataURL(url, { width: 300, margin: 2 });
}

/**
 * Generate one QR code per ticket. Returns an array of base-64 PNG data URLs.
 *
 * Used for paid tickets where quantity > 1 — each attendee gets their own
 * scannable QR code in the confirmation email.
 */
export async function generateTicketQRCodes(
  eventId: string,
  memberId: string,
  quantity: number,
): Promise<string[]> {
  const n = Math.max(1, Math.floor(quantity));
  const codes: string[] = [];
  for (let i = 1; i <= n; i++) {
    const url = generateCheckInUrl(eventId, memberId, i);
    codes.push(await QRCode.toDataURL(url, { width: 300, margin: 2 }));
  }
  return codes;
}

/**
 * Returns hosted HTTPS URLs to render each ticket's QR code as a PNG image.
 *
 * Prefer this over generateTicketQRCodes() for emails — many email clients
 * (Gmail in particular) strip `data:` URIs from `<img src>` for security,
 * so embedded data-URI QR codes appear as broken-image placeholders.
 *
 * The URL is signed with the same HMAC the check-in endpoint uses, so the
 * /api/events/qr route can verify authenticity before rendering the PNG.
 */
export function generateTicketQRCodeUrls(
  eventId: string,
  memberId: string,
  quantity: number,
): string[] {
  const n = Math.max(1, Math.floor(quantity));
  const timestamp = Date.now().toString();
  const signature = hmac(`${eventId}:${memberId}:${timestamp}`);
  const base =
    `${SITE.url}/api/events/qr` +
    `?e=${encodeURIComponent(eventId)}` +
    `&m=${encodeURIComponent(memberId)}` +
    `&t=${timestamp}` +
    `&sig=${signature}`;
  const urls: string[] = [];
  for (let i = 1; i <= n; i++) {
    // tot=N gives the QR endpoint the total ticket count so it can render
    // "ticket-2-of-3" in the downloaded filename. Cosmetic only — not signed.
    urls.push(`${base}&tk=${i}&tot=${n}`);
  }
  return urls;
}
