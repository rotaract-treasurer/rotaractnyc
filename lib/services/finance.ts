/**
 * Finance operations (server-side).
 */
import { adminDb } from '@/lib/firebase/admin';
import type { Transaction, FinanceSummary } from '@/types';

const COLLECTION = 'transactions';

export async function getTransactions(limit = 50): Promise<Transaction[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .orderBy('date', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Transaction;
}

export async function createTransaction(data: Omit<Transaction, 'id'>): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function deleteTransaction(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const transactions = await getTransactions(500);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Monthly breakdown
  const monthlyMap = new Map<string, { income: number; expenses: number }>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthlyMap.get(key) || { income: 0, expenses: 0 };
    if (t.type === 'income') entry.income += t.amount;
    else entry.expenses += t.amount;
    monthlyMap.set(key, entry);
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, data]) => ({ month, ...data }));

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    monthlyBreakdown,
  };
}

export async function getTransactionsByCategory(): Promise<Record<string, number>> {
  const transactions = await getTransactions(500);
  const categories: Record<string, number> = {};
  for (const t of transactions) {
    const key = `${t.type}:${t.category}`;
    categories[key] = (categories[key] || 0) + t.amount;
  }
  return categories;
}
