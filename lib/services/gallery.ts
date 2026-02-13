/**
 * Gallery operations (server-side).
 */
import { adminDb } from '@/lib/firebase/admin';
import type { GalleryImage } from '@/types';

const COLLECTION = 'gallery';

export async function getGalleryImages(limit = 50): Promise<GalleryImage[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryImage));
}

export async function getGalleryImage(id: string): Promise<GalleryImage | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as GalleryImage;
}

export async function addGalleryImage(data: Omit<GalleryImage, 'id'>): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
  });
  return ref.id;
}

export async function addGalleryImages(images: Omit<GalleryImage, 'id'>[]): Promise<string[]> {
  const batch = adminDb.batch();
  const ids: string[] = [];
  for (const img of images) {
    const ref = adminDb.collection(COLLECTION).doc();
    ids.push(ref.id);
    batch.set(ref, {
      ...img,
      createdAt: img.createdAt || new Date().toISOString(),
    });
  }
  await batch.commit();
  return ids;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

export async function getGalleryByEvent(event: string): Promise<GalleryImage[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('event', '==', event)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryImage));
}
