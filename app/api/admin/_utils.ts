import { NextRequest } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminConfigStatus } from '@/lib/firebase/admin'
import { isEmailAllowed } from '@/lib/firebase/allowlist'
import { ADMIN_SESSION_COOKIE } from '@/lib/firebase/session'

export async function requireAdmin(req: NextRequest) {
  let auth: ReturnType<typeof getFirebaseAdminAuth>
  try {
    auth = getFirebaseAdminAuth()
  } catch {
    const status = getFirebaseAdminConfigStatus()
    return {
      ok: false as const,
      status: 500,
      message: status.ok
        ? 'Firebase Admin is not configured.'
        : `Server configuration error: ${status.error}`,
    }
  }

  const sessionCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (sessionCookie) {
    try {
      const decoded = await auth.verifySessionCookie(sessionCookie, true)
      const email = decoded.email || null
      if (!isEmailAllowed(email)) {
        return { ok: false as const, status: 403, message: 'Not allowed' }
      }
      return { ok: true as const, email, uid: decoded.uid }
    } catch {
      // fall through to bearer token
    }
  }

  const authHeader = req.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]

  if (!token) {
    return { ok: false as const, status: 401, message: 'Missing session cookie or Authorization bearer token' }
  }

  try {
    const decoded = await auth.verifyIdToken(token)
    const email = decoded.email || null

    if (!isEmailAllowed(email)) {
      return { ok: false as const, status: 403, message: 'Not allowed' }
    }

    return { ok: true as const, email, uid: decoded.uid }
  } catch {
    return { ok: false as const, status: 401, message: 'Invalid token' }
  }
}
