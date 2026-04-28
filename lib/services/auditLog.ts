/**
 * Centralized audit logging for sensitive operations.
 *
 * Logs to a Firestore `activity_logs` collection so there's a
 * tamper-evident trail of who did what and when.
 */

import { adminDb } from '@/lib/firebase/admin';

export type AuditAction =
  | 'member.created'
  | 'member.updated'
  | 'member.role_changed'
  | 'member.status_changed'
  | 'member.deleted'
  | 'dues.created'
  | 'dues.updated'
  | 'dues.approved_offline'
  | 'dues.waived'
  | 'donation.created'
  | 'finance.transaction_created'
  | 'finance.transaction_deleted'
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'post.created'
  | 'post.deleted'
  | 'article.created'
  | 'article.updated'
  | 'article.deleted'
  | 'committee.updated'
  | 'settings.updated'
  | 'gallery.image_added'
  | 'gallery.image_deleted'
  | 'member.imported'
  | 'broadcast.sent';

interface AuditLogEntry {
  action: AuditAction;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

/**
 * Log an audit event to Firestore.
 * This is a fire-and-forget operation — failures are logged to console
 * but never throw, so they don't block the primary operation.
 */
export async function logAuditEvent(
  action: AuditAction,
  actorId: string,
  actorName: string,
  options?: {
    targetId?: string;
    targetType?: string;
    details?: Record<string, unknown>;
    ip?: string;
  },
): Promise<void> {
  try {
    const entry: AuditLogEntry = {
      action,
      actorId,
      actorName,
      targetId: options?.targetId,
      targetType: options?.targetType,
      details: options?.details,
      ip: options?.ip,
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('activity_logs').add(entry);
  } catch (err) {
    console.error('[AuditLog] Failed to log event:', err);
  }
}

/**
 * Batch log multiple audit events efficiently.
 */
export async function logAuditEvents(events: AuditLogEntry[]): Promise<void> {
  try {
    const batch = adminDb.batch();
    for (const entry of events) {
      const ref = adminDb.collection('activity_logs').doc();
      batch.set(ref, entry);
    }
    await batch.commit();
  } catch (err) {
    console.error('[AuditLog] Failed to batch log events:', err);
  }
}
