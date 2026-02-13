/**
 * Document library CRUD operations (server-side).
 */
import { adminDb } from '@/lib/firebase/admin';
import type { PortalDocument } from '@/types';

const COLLECTION = 'documents';

export async function getDocuments(category?: string): Promise<PortalDocument[]> {
  let q: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
  if (category) q = q.where('category', '==', category);
  q = q.orderBy('createdAt', 'desc');
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PortalDocument));
}

export async function getDocument(id: string): Promise<PortalDocument | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as PortalDocument;
}

export async function createDocument(data: Omit<PortalDocument, 'id'>): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateDocument(id: string, data: Partial<PortalDocument>): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

export async function getDocumentCategories(): Promise<string[]> {
  const docs = await getDocuments();
  const categories = new Set(docs.map((d) => d.category));
  return Array.from(categories).sort();
}
