'use client'

import { useRouter, useParams } from 'next/navigation'
import { useAdminSession } from '@/lib/admin/useAdminSession'
import { useCallback, useEffect, useState } from 'react'
import { FaArrowLeft, FaCalendar, FaMapMarkerAlt, FaClock, FaEdit, FaTrash, FaUsers, FaEye } from 'react-icons/fa'
import EventModal from '@/components/admin/EventModal'
import { getFriendlyAdminApiError } from '@/lib/admin/apiError'

type EventRow = {
  id: string
  title: string
  date: string
  time?: string
  startDate?: string
  startTime?: string
  endTime?: string
  timezone?: string
  location?: string
  description: string
  category: 'upcoming' | 'past'
  order: number
  status?: 'published' | 'draft' | 'cancelled'
  attendees?: number
  imageUrl?: string
  visibility?: 'public' | 'member' | 'board'
}

export default function AdminEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const session = useAdminSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<EventRow | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const formatDisplayDateFromStartDate = (isoDate: string) => {
    const parts = isoDate.split('-').map((p) => Number(p))
    if (parts.length !== 3) return ''
    const [year, month, day] = parts
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return ''
    const dt = new Date(Date.UTC(year, month - 1, day))
    if (Number.isNaN(dt.getTime())) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(dt)
  }

  const formatDisplayTimeFromCalendar = (startTime?: string, endTime?: string) => {
    const to12h = (t: string) => {
      const [hhRaw, mmRaw] = t.split(':')
      const hh = Number(hhRaw)
      const mm = Number(mmRaw)
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) return ''
      const hour12 = ((hh + 11) % 12) + 1
      const ampm = hh >= 12 ? 'PM' : 'AM'
      const mmPadded = String(mm).padStart(2, '0')
      return `${hour12}:${mmPadded} ${ampm}`
    }

    if (!startTime) return ''
    const start = to12h(startTime)
    if (!start) return ''
    if (!endTime) return start
    const end = to12h(endTime)
    return end ? `${start} - ${end}` : start
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to load event.'))
        return
      }
      const json = await res.json()
      if (json.event) {
        setEvent(json.event)
      } else {
        setError('Event not found.')
      }
    } catch {
      setError('Unable to load event.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (session.status === 'unauthenticated') router.push('/admin/login')
  }, [router, session.status])

  useEffect(() => {
    if (session.status === 'authenticated') load()
  }, [load, session.status])

  const save = async (form: Omit<EventRow, 'id'>) => {
    setSaving(true)
    setError(null)
    try {
      const generatedDate =
        !form.date && form.startDate ? formatDisplayDateFromStartDate(form.startDate) : ''
      const generatedTime =
        !form.time && form.startTime
          ? formatDisplayTimeFromCalendar(form.startTime, form.endTime)
          : ''

      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          ...form,
          date: form.date || generatedDate,
          time: form.time || generatedTime,
          order: Number(form.order) || 1,
        }),
      })

      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to save event.'))
        return
      }

      setShowEditModal(false)
      await load()
    } catch {
      setError('Unable to save event.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete this event? This action cannot be undone.')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to delete event.'))
        return
      }
      router.push('/admin/events')
    } catch {
      setError('Unable to delete event.')
    }
  }

  const getStatusBadge = (status?: string) => {
    const statusMap = {
      published: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', dot: 'bg-green-500', label: 'Published' },
      draft: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400', dot: 'bg-amber-500', label: 'Draft' },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', dot: 'bg-red-500', label: 'Cancelled' },
    }
    const s = statusMap[status as keyof typeof statusMap] || statusMap.published
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${s.bg} ${s.text}`}>
        <span className={`size-2 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    )
  }

  const getVisibilityBadge = (visibility?: string) => {
    const visibilityMap = {
      public: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', icon: FaEye, label: 'Public' },
      member: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400', icon: FaUsers, label: 'Members Only' },
      board: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-400', icon: FaUsers, label: 'Board Only' },
    }
    const v = visibilityMap[visibility as keyof typeof visibilityMap] || visibilityMap.member
    const Icon = v.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${v.bg} ${v.text}`}>
        <Icon className="text-sm" />
        {v.label}
      </span>
    )
  }

  if (session.status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rotaract-pink" />
      </div>
    )
  }

  if (session.status !== 'authenticated') return null

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
            Event Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/admin/events')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rotaract-pink hover:bg-rotaract-darkpink text-white rounded-lg font-semibold transition-colors"
          >
            <FaArrowLeft />
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  if (!event) return null

  return (
    <>
      <main className="flex-1 w-full px-4 md:px-8 py-6 max-w-[1200px] mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
          <button
            onClick={() => router.push('/admin/events')}
            className="hover:text-rotaract-pink transition-colors"
          >
            Events
          </button>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{event.title}</span>
        </nav>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          {/* Event Image */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gradient-to-br from-rotaract-pink to-rotaract-darkpink">
            {event.imageUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${event.imageUrl})` }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/20">
                <FaCalendar className="text-8xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Floating badges */}
            <div className="absolute top-6 left-6 flex flex-wrap gap-2">
              {getStatusBadge(event.status)}
              {getVisibilityBadge(event.visibility)}
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm">
                {event.category === 'upcoming' ? '📅 Upcoming' : '📆 Past Event'}
              </span>
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg">
                {event.title}
              </h1>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rotaract-pink/10 flex items-center justify-center">
                  <FaClock className="text-rotaract-pink text-lg" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Date & Time
                  </div>
                  <div className="text-slate-900 dark:text-white font-semibold">
                    {event.date || (event.startDate && formatDisplayDateFromStartDate(event.startDate))}
                  </div>
                  {(event.time || event.startTime) && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {event.time || formatDisplayTimeFromCalendar(event.startTime, event.endTime)}
                    </div>
                  )}
                  {event.timezone && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {event.timezone}
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400 text-lg" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Location
                    </div>
                    <div className="text-slate-900 dark:text-white font-medium">
                      {event.location}
                    </div>
                  </div>
                </div>
              )}

              {/* Attendees */}
              {event.attendees !== undefined && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FaUsers className="text-green-600 dark:text-green-400 text-lg" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Attendees
                    </div>
                    <div className="text-slate-900 dark:text-white font-semibold">
                      {event.attendees} {event.attendees === 1 ? 'person' : 'people'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Description
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/admin/events')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-colors"
              >
                <FaArrowLeft />
                Back to Events
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-rotaract-pink hover:bg-rotaract-darkpink text-white rounded-lg font-semibold transition-colors"
              >
                <FaEdit />
                Edit Event
              </button>
              <button
                onClick={remove}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors ml-auto"
              >
                <FaTrash />
                Delete Event
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Event Modal */}
      <EventModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={save}
        editingEvent={event as any}
        saving={saving}
      />
    </>
  )
}
