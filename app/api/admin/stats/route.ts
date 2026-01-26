import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/app/api/admin/_utils'
import { getFirebaseAdminDb } from '@/lib/firebase/admin'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status })

  try {
    const db = getFirebaseAdminDb()
    
    // Get member count from 'users' collection (portal users)
    const membersSnap = await db.collection('users').get()
    const memberCount = membersSnap.size
    
    // Get active members (status = 'active')
    const activeMembers = membersSnap.docs.filter((doc) => {
      const data = doc.data()
      return data.status === 'active'
    }).length
    
    // Get events count from portalEvents (admin-managed events)
    const eventsSnap = await db.collection('portalEvents').get()
    const eventCount = eventsSnap.size
    
    // Get active/upcoming events
    const upcomingEvents = eventsSnap.docs.filter((doc) => {
      const data = doc.data()
      // Check both category and startAt for upcoming status
      const startAt = data.startAt?.toDate?.()
      const isUpcoming = startAt ? startAt > new Date() : data.category === 'upcoming'
      return isUpcoming
    }).length
    
    // Get posts count
    const postsSnap = await db.collection('posts').get()
    const postCount = postsSnap.size
    
    // Get published posts
    const publishedPosts = postsSnap.docs.filter((doc) => {
      const data = doc.data()
      return data.published === true
    }).length
    
    // Calculate funds raised from transactions collection
    let fundsRaised = 0
    
    // Check if there's a transactions collection
    try {
      const financeSnap = await db.collection('transactions').get()
      fundsRaised = financeSnap.docs.reduce((total, doc) => {
        const data = doc.data()
        if (data.type === 'income' && data.amount) {
          return total + Number(data.amount)
        }
        return total
      }, 0)
    } catch {
      // Transactions collection might not exist or be empty
      fundsRaised = 0
    }
    
    // Get recent activity counts (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentMembers = membersSnap.docs.filter((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt)
      return createdAt >= thirtyDaysAgo
    }).length
    
    const recentPosts = postsSnap.docs.filter((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt)
      return createdAt >= thirtyDaysAgo && data.published === true
    }).length
    
    return NextResponse.json({
      stats: {
        members: memberCount,
        activeMembers,
        events: eventCount,
        upcomingEvents,
        posts: postCount,
        publishedPosts,
        fundsRaised,
        recentMembers,
        recentPosts,
      }
    })
  } catch (err) {
    const e = err as { message?: string; code?: string }
    console.error('Stats API error:', e)
    return NextResponse.json(
      { error: 'Failed to load stats', details: e?.message || String(err), code: e?.code },
      { status: 500 }
    )
  }
}
