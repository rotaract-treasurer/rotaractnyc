import { NextRequest } from 'next/server'
import { getFirebaseAdminAuth } from '@/lib/firebase/admin'

/**
 * Get authenticated user from session cookie or bearer token
 * Returns user info if authenticated, null if not
 */
export async function getUserFromRequest(req: NextRequest) {
  try {
    const auth = getFirebaseAdminAuth()

    // Try session cookie first (from portal login)
    const sessionCookie = req.cookies.get('rotaract_session')?.value
    if (sessionCookie) {
      try {
        const decoded = await auth.verifySessionCookie(sessionCookie, true)
        return {
          uid: decoded.uid,
          email: decoded.email || '',
          emailVerified: decoded.email_verified || false,
        }
      } catch {
        // Fall through to bearer token
      }
    }

    // Try authorization bearer token
    const authHeader = req.headers.get('authorization') || ''
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    const token = match?.[1]

    if (token) {
      const decoded = await auth.verifyIdToken(token)
      return {
        uid: decoded.uid,
        email: decoded.email || '',
        emailVerified: decoded.email_verified || false,
      }
    }

    return null
  } catch (error) {
    console.error('Error verifying user:', error)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
