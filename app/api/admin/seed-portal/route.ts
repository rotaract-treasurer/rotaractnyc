import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '@/app/api/admin/_utils'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebase/admin'

type SeedResult = {
  ok: true
  createdOrUpdated: {
    users: number
    portalEvents: number
    announcements: number
    documents: number
    communityPosts: number
    transactions: number
    monthlySummaries: number
    acknowledgements: number
  }
}

function monthIdFromDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export async function GET(req: NextRequest) {
  // Convenience: allow click-to-seed from browser after /admin login.
  // Equivalent to POST.
  return POST(req)
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status })

  try {
    const db = getFirebaseAdminDb()
    const auth = getFirebaseAdminAuth()
    const batch = db.batch()

    const createdOrUpdated: SeedResult['createdOrUpdated'] = {
      users: 0,
      portalEvents: 0,
      announcements: 0,
      documents: 0,
      communityPosts: 0,
      transactions: 0,
      monthlySummaries: 0,
      acknowledgements: 0,
    }

    // Ensure the current allowlisted admin user can actually access portal content.
    // Portal Firestore rules depend on request.auth.token.role (custom claims).
    if (admin.uid) {
      await auth.setCustomUserClaims(admin.uid, { role: 'ADMIN' })

      const ref = db.collection('users').doc(admin.uid)
      batch.set(
        ref,
        {
          email: admin.email,
          name: admin.email || 'Admin',
          role: 'ADMIN',
          status: 'active',
          phoneOptIn: false,
          spotlightQuote: 'Welcome to the Rotaract NYC members portal!',
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          seeded: true,
        },
        { merge: true }
      )
      createdOrUpdated.users += 1
    }

    // Deterministic IDs so multiple runs are safe.
    const users = [
      {
        uid: 'system',
        name: 'Rotaract NYC',
        email: 'no-reply@rotaractnyc.org',
        photoURL: null,
        role: 'ADMIN',
        status: 'active',
        committee: 'Leadership',
        phoneOptIn: false,
        spotlightQuote: 'Welcome to the Rotaract NYC members portal!',
      },
      {
        uid: 'u_elena',
        name: 'Elena Rodriguez',
        email: 'elena@example.com',
        photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        role: 'BOARD',
        status: 'active',
        committee: 'Service',
        phoneOptIn: false,
        spotlightQuote: 'Service is how we build community — together.',
      },
      {
        uid: 'u_marcus',
        name: 'Marcus Chen',
        email: 'marcus@example.com',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        role: 'BOARD',
        status: 'active',
        committee: 'Operations',
        phoneOptIn: false,
      },
      {
        uid: 'u_sarah',
        name: 'Sarah Kim',
        email: 'sarah@example.com',
        photoURL: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&h=200&fit=crop',
        role: 'MEMBER',
        status: 'active',
        committee: 'Fundraising',
        phoneOptIn: false,
      },
      {
        uid: 'u_amina',
        name: 'Amina Patel',
        email: 'amina@example.com',
        photoURL: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop',
        role: 'TREASURER',
        status: 'active',
        committee: 'Finance',
        phoneOptIn: false,
      },
    ] as const

    for (const u of users) {
      const ref = db.collection('users').doc(u.uid)
      batch.set(
        ref,
        {
          name: u.name,
          email: u.email,
          photoURL: u.photoURL,
          role: u.role,
          status: u.status,
          committee: u.committee,
          phoneOptIn: u.phoneOptIn,
          spotlightQuote: (u as any).spotlightQuote ?? null,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          seeded: true,
        },
        { merge: true }
      )
      createdOrUpdated.users += 1
    }

    // Portal Events
    const now = Date.now()
    const portalEvents = [
      {
        id: 'sample-monthly-general-meeting',
        title: 'Monthly General Meeting',
        description:
          'Join us for our monthly general meeting to discuss upcoming projects and initiatives.',
        startAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
        endAt: new Date(now + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        location: 'Virtual (Zoom link will be shared)',
        visibility: 'member',
        createdBy: 'system',
      },
      {
        id: 'sample-food-pantry-support',
        title: 'Community Service: Food Pantry Support',
        description: 'Help sort and pack food donations for NYC families. Gloves provided.',
        startAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
        endAt: new Date(now + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        location: 'Manhattan, NY',
        visibility: 'member',
        createdBy: 'u_elena',
      },
    ] as const

    for (const e of portalEvents) {
      const ref = db.collection('portalEvents').doc(e.id)
      batch.set(
        ref,
        {
          title: e.title,
          description: e.description,
          startAt: e.startAt,
          endAt: e.endAt,
          location: e.location,
          visibility: e.visibility,
          createdBy: e.createdBy,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          seeded: true,
        },
        { merge: true }
      )
      createdOrUpdated.portalEvents += 1
    }

    // Announcements
    const announcements = [
      {
        id: 'welcome-portal',
        title: 'Welcome to the Members Portal!',
        body:
          "We're excited to launch our new members portal. Here you can access events, announcements, documents, and more.",
        pinned: true,
        visibility: 'member',
        createdBy: 'system',
      },
      {
        id: 'volunteer-spotlight',
        title: 'Volunteer Spotlight',
        body: 'Huge thanks to everyone who joined last weekend’s cleanup — we made a real impact.',
        pinned: false,
        visibility: 'member',
        createdBy: 'u_marcus',
      },
    ] as const

    for (const a of announcements) {
      const ref = db.collection('announcements').doc(a.id)
      batch.set(
        ref,
        {
          title: a.title,
          body: a.body,
          pinned: a.pinned,
          visibility: a.visibility,
          createdBy: a.createdBy,
          createdAt: FieldValue.serverTimestamp(),
          seeded: true,
        },
        { merge: true }
      )
      createdOrUpdated.announcements += 1
    }

    // Acknowledgements
    const ackPairs = [
      { announcementId: 'welcome-portal', uid: 'u_sarah' },
      { announcementId: 'welcome-portal', uid: 'u_marcus' },
    ] as const
    for (const ack of ackPairs) {
      const ref = db
        .collection('announcements')
        .doc(ack.announcementId)
        .collection('acknowledgements')
        .doc(ack.uid)
      batch.set(
        ref,
        {
          createdAt: FieldValue.serverTimestamp(),
          seeded: true,
        },
        { merge: true }
      )
      createdOrUpdated.acknowledgements += 1
    }

    // Documents
    const documents = [
      {
        id: 'club-bylaws',
        title: 'Club Bylaws',
        category: 'Governance',
        url: 'https://example.com/bylaws.pdf',
        visibility: 'member',
        createdBy: 'system',
      },
      {
        id: 'meeting-minutes-sample',
        title: 'Monthly Meeting Minutes (Sample)',
        category: 'Minutes',
        url: 'https://example.com/minutes.pdf',
        visibility: 'member',
        createdBy: 'u_marcus',
      },
    ] as const

    for (const d of documents) {
      const ref = db.collection('documents').doc(d.id)
      batch.set(
        ref,
        {
          title: d.title,
          category: d.category,
          url: d.url,
          visibility: d.visibility,
          createdBy: d.createdBy,
          createdAt: FieldValue.serverTimestamp(),
          seeded: true,
        },
        { merge: true }
      )
      createdOrUpdated.documents += 1
    }

    // Community posts (used by /portal dashboard)
    const communityPosts = [
      {
        id: 'post-cleanup-highlights',
        authorUid: 'u_elena',
        authorName: 'Elena Rodriguez',
        authorRole: 'Service Committee Chair',
        authorPhotoURL:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        title: 'Highlights from the Park Clean-up',
        body: 'Amazing turnout this weekend — thank you everyone who helped keep NYC beautiful!',
        type: 'text',
        images: null,
        document: null,
        likesCount: 24,
        commentsCount: 6,
      },
      {
        id: 'post-welcome-new-members',
        authorUid: 'system',
        authorName: 'Rotaract NYC',
        authorRole: 'Official Announcement',
        authorPhotoURL: null,
        title: 'Welcome our newest members!',
        body: 'We are thrilled to welcome new members this month. Say hi at the next meetup!',
        type: 'announcement',
        images: null,
        document: null,
        likesCount: 42,
        commentsCount: 12,
      },
      {
        id: 'post-minutes-uploaded',
        authorUid: 'u_marcus',
        authorName: 'Marcus Chen',
        authorRole: 'Club Secretary',
        authorPhotoURL:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        title: null,
        body: 'Just uploaded a sample minutes doc — please review before next week.',
        type: 'document',
        images: null,
        document: {
          name: 'Meeting_Minutes_Sample.pdf',
          size: '1.2 MB',
          url: 'https://example.com/minutes.pdf',
        },
        likesCount: 8,
        commentsCount: 3,
      },
    ] as const

    for (const p of communityPosts) {
      const ref = db.collection('communityPosts').doc(p.id)
      batch.set(
        ref,
        {
          authorUid: p.authorUid,
          authorName: p.authorName,
          authorRole: p.authorRole,
          authorPhotoURL: p.authorPhotoURL,
          title: p.title,
          body: p.body,
          type: p.type,
          images: p.images,
          document: p.document,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          createdAt: FieldValue.serverTimestamp(),
          seeded: true,
        },
        { merge: true }
      )
      createdOrUpdated.communityPosts += 1
    }

    // Transactions
    const transactions = [
      {
        id: 'tx-office-depot',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        vendor: 'Office Depot',
        category: 'Operations',
        amount: -86.42,
        noteForMembers: 'Supplies for meeting materials',
        visibility: 'member',
        createdBy: 'u_amina',
      },
      {
        id: 'tx-member-dues',
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        vendor: 'Member Dues',
        category: 'Fundraising',
        amount: 250,
        noteForMembers: 'Monthly dues collected (sample)',
        visibility: 'member',
        createdBy: 'u_amina',
      },
    ] as const

    for (const t of transactions) {
      const ref = db.collection('transactions').doc(t.id)
      batch.set(
        ref,
        {
          date: t.date,
          vendor: t.vendor,
          category: t.category,
          amount: t.amount,
          noteForMembers: t.noteForMembers,
          visibility: t.visibility,
          createdBy: t.createdBy,
          createdAt: FieldValue.serverTimestamp(),
          seeded: true,
        },
        { merge: true }
      )
      createdOrUpdated.transactions += 1
    }

    // Monthly summary
    const monthId = monthIdFromDate(new Date())
    batch.set(
      db.collection('monthlySummaries').doc(monthId),
      {
        month: monthId,
        startingBalance: 1000,
        incomeTotal: 500,
        expenseTotal: 300,
        endingBalance: 1200,
        categoryTotals: {
          Fundraising: 500,
          Events: -200,
          Operations: -100,
        },
        notes: 'Sample monthly summary',
        updatedAt: FieldValue.serverTimestamp(),
        seeded: true,
      },
      { merge: true }
    )
    createdOrUpdated.monthlySummaries += 1

    await batch.commit()

    return NextResponse.json({ ok: true, createdOrUpdated } satisfies SeedResult)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        error: 'Seed portal data failed. Check Firebase Admin / Firestore configuration.',
        details: message,
        code: 'SEED_PORTAL_FAILED',
      },
      { status: 500 }
    )
  }
}
