/**
 * Post & Article CRUD operations (server-side).
 */
import { adminDb } from '@/lib/firebase/admin';
import type { CommunityPost, Article, Comment } from '@/types';

const POSTS = 'posts';
const ARTICLES = 'articles';
const COMMENTS = 'comments';

// ── Community Posts ──

export async function getPosts(limit = 30): Promise<CommunityPost[]> {
  const snap = await adminDb
    .collection(POSTS)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost));
}

export async function getPost(id: string): Promise<CommunityPost | null> {
  const doc = await adminDb.collection(POSTS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as CommunityPost;
}

export async function createPost(data: Omit<CommunityPost, 'id'>): Promise<string> {
  const ref = await adminDb.collection(POSTS).add({
    ...data,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function deletePost(id: string): Promise<void> {
  await adminDb.collection(POSTS).doc(id).delete();
}

export async function likePost(postId: string, memberId: string): Promise<void> {
  const postRef = adminDb.collection(POSTS).doc(postId);
  await adminDb.runTransaction(async (t) => {
    const doc = await t.get(postRef);
    if (!doc.exists) throw new Error('Post not found');
    const data = doc.data()!;
    const likedBy: string[] = data.likedBy || [];
    if (likedBy.includes(memberId)) {
      t.update(postRef, {
        likedBy: likedBy.filter((id) => id !== memberId),
        likeCount: Math.max(0, (data.likeCount || 0) - 1),
      });
    } else {
      t.update(postRef, {
        likedBy: [...likedBy, memberId],
        likeCount: (data.likeCount || 0) + 1,
      });
    }
  });
}

// ── Comments ──

export async function getComments(postId: string): Promise<Comment[]> {
  const snap = await adminDb
    .collection(COMMENTS)
    .where('postId', '==', postId)
    .orderBy('createdAt', 'asc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
}

export async function addComment(data: Omit<Comment, 'id'>): Promise<string> {
  const ref = await adminDb.collection(COMMENTS).add({
    ...data,
    likeCount: 0,
    createdAt: new Date().toISOString(),
  });
  // Increment comment count on post
  const postRef = adminDb.collection(POSTS).doc(data.postId);
  const postSnap = await postRef.get();
  if (postSnap.exists) {
    await postRef.update({ commentCount: (postSnap.data()?.commentCount || 0) + 1 });
  }
  return ref.id;
}

// ── Articles ──

export async function getArticles(publishedOnly = true): Promise<Article[]> {
  let q: FirebaseFirestore.Query = adminDb.collection(ARTICLES);
  if (publishedOnly) q = q.where('isPublished', '==', true);
  q = q.orderBy('publishedAt', 'desc');
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

export async function getArticle(id: string): Promise<Article | null> {
  const doc = await adminDb.collection(ARTICLES).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Article;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const snap = await adminDb
    .collection(ARTICLES)
    .where('slug', '==', slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Article;
}

export async function createArticle(data: Omit<Article, 'id'>): Promise<string> {
  const ref = await adminDb.collection(ARTICLES).add({
    ...data,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<void> {
  await adminDb.collection(ARTICLES).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteArticle(id: string): Promise<void> {
  await adminDb.collection(ARTICLES).doc(id).delete();
}

export async function incrementArticleViews(id: string): Promise<void> {
  const ref = adminDb.collection(ARTICLES).doc(id);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ viewCount: (snap.data()?.viewCount || 0) + 1 });
  }
}
