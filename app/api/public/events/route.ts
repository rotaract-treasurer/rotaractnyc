import { NextResponse } from 'next/server'
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin not configured' },
      { status: 500 }
    )
  }

  try {
    const db = getFirebaseAdminDb()
    // Avoid composite index requirements (e.g. orderBy(category)+orderBy(order)).
    const snap = await db.collection('events').get()

    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    events.sort((a, b) => {
      const cat = String((a as { category?: unknown }).category ?? '').localeCompare(
        String((b as { category?: unknown }).category ?? '')
      )
      if (cat !== 0) return cat
      const ao = Number.isFinite((a as { order?: unknown }).order as number)
        ? Number((a as { order?: unknown }).order)
        : 0
      const bo = Number.isFinite((b as { order?: unknown }).order as number)
        ? Number((b as { order?: unknown }).order)
        : 0
      return ao - bo
    })

    return NextResponse.json({ events })
  } catch (err) {
    const e = err as { message?: string; code?: string }
    return NextResponse.json(
      { error: 'Failed to load events', details: e?.message || String(err), code: e?.code },
      { status: 500 }
    )
  }
}
