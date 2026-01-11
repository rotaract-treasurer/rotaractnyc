import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin'
import { isResendConfigured, sendMembershipApplicationEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

type MembershipApplicationBody = {
  fullName?: string
  email?: string
  phone?: string
  membershipType?: string
  location?: string
  occupationOrSchool?: string
  interests?: string
  whyJoin?: string
  hearAboutUs?: string
  company?: string // honeypot
}

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 })
  }

  const body = (await req.json().catch(() => null)) as MembershipApplicationBody | null

  const honeypot = (body?.company || '').trim()
  if (honeypot) {
    return NextResponse.json({ ok: true })
  }

  const fullName = (body?.fullName || '').trim()
  const email = (body?.email || '').trim()
  const membershipType = (body?.membershipType || '').trim()

  const phone = (body?.phone || '').trim()
  const location = (body?.location || '').trim()
  const occupationOrSchool = (body?.occupationOrSchool || '').trim()
  const interests = (body?.interests || '').trim()
  const whyJoin = (body?.whyJoin || '').trim()
  const hearAboutUs = (body?.hearAboutUs || '').trim()

  if (!fullName || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const db = getFirebaseAdminDb()
  const ref = await db.collection('membershipApplications').add({
    fullName,
    email,
    membershipType,
    phone,
    location,
    occupationOrSchool,
    interests,
    whyJoin,
    hearAboutUs,
    createdAt: FieldValue.serverTimestamp(),
  })

  let emailSent = false
  if (isResendConfigured()) {
    const from = process.env.RESEND_FROM as string
    const to = process.env.RESEND_MEMBERSHIP_TO || 'treasurerrcun@gmail.com'

    try {
      await sendMembershipApplicationEmail({
        from,
        to,
        replyTo: email,
        applicant: {
          fullName,
          email,
          phone,
          membershipType,
          location,
          occupationOrSchool,
          interests,
          whyJoin,
          hearAboutUs,
        },
        applicationId: ref.id,
      })
      emailSent = true
    } catch (err) {
      console.error('Resend membership email failed', err)
    }
  }

  return NextResponse.json({ ok: true, id: ref.id, emailSent })
}
