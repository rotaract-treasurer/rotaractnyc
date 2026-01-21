import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '@/app/api/admin/_utils'
import { getFirebaseAdminDb } from '@/lib/firebase/admin'
import type { UserRole, UserStatus } from '@/types/portal'

function coerceRole(v: unknown): UserRole {
  const valid: UserRole[] = ['MEMBER', 'BOARD', 'TREASURER', 'ADMIN']
  return valid.includes(v as UserRole) ? (v as UserRole) : 'MEMBER'
}

function coerceStatus(v: unknown): UserStatus {
  const valid: UserStatus[] = ['active', 'inactive', 'pending']
  return valid.includes(v as UserStatus) ? (v as UserStatus) : 'pending'
}

function coerceUser(input: unknown): Record<string, unknown> {
  const obj = typeof input === 'object' && input ? (input as Record<string, unknown>) : {}
  
  const photoURL = String(obj.photoURL ?? '').trim()
  const displayOrder = Number(obj.displayOrder)
  const committee = String(obj.committee ?? '').trim()
  const phone = String(obj.phone ?? '').trim()
  const whatsapp = String(obj.whatsapp ?? '').trim()
  const linkedin = String(obj.linkedin ?? '').trim()
  const bio = String(obj.bio ?? '').trim()
  
  return {
    name: String(obj.name ?? ''),
    email: String(obj.email ?? ''),
    photoURL: photoURL || undefined,
    role: coerceRole(obj.role),
    status: coerceStatus(obj.status),
    committee: committee || undefined,
    phone: phone || undefined,
    whatsapp: whatsapp || undefined,
    linkedin: linkedin || undefined,
    bio: bio || undefined,
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : undefined,
    phoneOptIn: obj.phoneOptIn === true,
  }
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status })

  const { searchParams } = new URL(req.url)
  const roleFilter = searchParams.get('role') || 'all'
  const statusFilter = searchParams.get('status') || 'all'

  try {
    const db = getFirebaseAdminDb()
    let query: FirebaseFirestore.Query = db.collection('users')
    
    // Apply filters if specified
    if (roleFilter !== 'all') {
      query = query.where('role', '==', roleFilter)
    }
    if (statusFilter !== 'all') {
      query = query.where('status', '==', statusFilter)
    }
    
    const snap = await query.limit(500).get()
    const users = snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ uid: d.id, ...d.data() }))
    
    // Sort by displayOrder if available, otherwise by name
    users.sort((a: any, b: any) => {
      const ao = Number.isFinite(a.displayOrder) ? a.displayOrder : 999
      const bo = Number.isFinite(b.displayOrder) ? b.displayOrder : 999
      if (ao !== bo) return ao - bo
      return (a.name || '').localeCompare(b.name || '')
    })

    return NextResponse.json({ users })
  } catch (err) {
    const e = err as { message?: string; code?: string }
    return NextResponse.json(
      { error: 'Failed to load users', details: e?.message || String(err), code: e?.code },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status })

  const body: unknown = await req.json().catch(() => null)
  const userData = coerceUser(body)

  if (!userData.name || !userData.email) {
    return NextResponse.json({ error: 'Missing required fields: name and email' }, { status: 400 })
  }

  const db = getFirebaseAdminDb()
  // Generate a new ID for the user
  const ref = db.collection('users').doc()
  
  await ref.set({
    ...userData,
    uid: ref.id,
    emailVerified: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ ok: true, uid: ref.id })
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status })

  const body: unknown = await req.json().catch(() => null)
  const obj = typeof body === 'object' && body ? (body as Record<string, unknown>) : {}
  const uid = String(obj.uid ?? '')
  if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 })

  const userData = coerceUser(body)
  if (!userData.name || !userData.email) {
    return NextResponse.json({ error: 'Missing required fields: name and email' }, { status: 400 })
  }

  const db = getFirebaseAdminDb()
  await db.collection('users').doc(uid).set(
    {
      ...userData,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status })

  const { searchParams } = new URL(req.url)
  const uid = searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 })

  const db = getFirebaseAdminDb()
  await db.collection('users').doc(uid).delete()

  return NextResponse.json({ ok: true })
}
