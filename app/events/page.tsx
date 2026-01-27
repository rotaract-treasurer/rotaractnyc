'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { DEFAULT_EVENTS, type EventCategory, type SiteEvent } from '@/lib/content/events'
import { getGoogleCalendarUrl } from '@/lib/calendar/eventCalendar'
import { useEffect, useMemo, useState } from 'react'

type EventsResponseRow = Record<string, unknown>

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toYmdLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function formatMonthShort(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function parseYmdLocal(ymd: string) {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function includesText(haystack: string, needle: string) {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

function normalizeEventText(event: SiteEvent) {
  return [event.title, event.location ?? '', event.description].join(' ').trim()
}

export default function EventsPage() {
  const [events, setEvents] = useState<SiteEvent[]>(DEFAULT_EVENTS)
  const [query, setQuery] = useState('')
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [showPast, setShowPast] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const res = await fetch('/api/public/events')
        if (!res.ok) return
        const json: unknown = await res.json()
        const rows =
          typeof json === 'object' &&
          json &&
          Array.isArray((json as { events?: unknown }).events)
            ? ((json as { events: unknown[] }).events as unknown[])
            : []

        if (!cancelled && rows.length > 0) {
          setEvents(
            rows
              .map((e): SiteEvent => {
                const obj: EventsResponseRow = typeof e === 'object' && e ? (e as EventsResponseRow) : {}
                const order = Number(obj.order)
                const category: EventCategory = obj.category === 'past' ? 'past' : 'upcoming'
                return {
                  id: String(obj.id ?? ''),
                  category,
                  title: String(obj.title ?? ''),
                  date: String(obj.date ?? ''),
                  time: obj.time ? String(obj.time) : '',
                  startDate: obj.startDate ? String(obj.startDate) : '',
                  startTime: obj.startTime ? String(obj.startTime) : '',
                  endTime: obj.endTime ? String(obj.endTime) : '',
                  timezone: obj.timezone ? String(obj.timezone) : 'America/New_York',
                  location: obj.location ? String(obj.location) : '',
                  description: String(obj.description ?? ''),
                  order: Number.isFinite(order) ? order : 1,
                }
              })
              .filter((e) => e.id)
          )
        }
      } catch {
        // ignore and keep defaults
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    const upcoming = events.filter((e) => e.category === 'upcoming').length
    const past = events.filter((e) => e.category === 'past').length
    return { upcoming, past }
  }, [events])

  const filteredEvents = useMemo(() => {
    const visibleCategories = new Set<EventCategory>([
      ...(showUpcoming ? (['upcoming'] as const) : []),
      ...(showPast ? (['past'] as const) : []),
    ])

    return events
      .filter((e) => visibleCategories.has(e.category))
      .filter((e) => includesText(normalizeEventText(e), query))
      .sort((a, b) => {
        const catA = a.category === 'upcoming' ? 0 : 1
        const catB = b.category === 'upcoming' ? 0 : 1
        if (catA !== catB) return catA - catB
        return a.order - b.order
      })
  }, [events, query, showPast, showUpcoming])

  const visibleEventsByYmd = useMemo(() => {
    const map = new Map<string, SiteEvent[]>()
    for (const e of filteredEvents) {
      if (!e.startDate) continue
      const key = e.startDate
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    return map
  }, [filteredEvents])

  const monthLabel = useMemo(() => {
    return calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }, [calendarMonth])

  const calendarCells = useMemo(() => {
    const first = startOfMonth(calendarMonth)
    const firstDow = first.getDay()
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    const prevMonthDays = new Date(first.getFullYear(), first.getMonth(), 0).getDate()

    const cells: Array<{ day: number; inMonth: boolean; ymd: string | null }> = []

    for (let i = 0; i < firstDow; i++) {
      const day = prevMonthDays - (firstDow - 1 - i)
      cells.push({ day, inMonth: false, ymd: null })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dt = new Date(first.getFullYear(), first.getMonth(), day)
      cells.push({ day, inMonth: true, ymd: toYmdLocal(dt) })
    }

    const totalCells = Math.ceil(cells.length / 7) * 7
    const trailing = totalCells - cells.length
    for (let i = 0; i < trailing; i++) {
      cells.push({ day: i + 1, inMonth: false, ymd: null })
    }

    return cells
  }, [calendarMonth])

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark">
      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-800"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
              <span className="material-symbols-outlined text-accent text-sm">calendar_month</span>
              <span className="text-white/90 text-sm font-semibold">Events & Gatherings</span>
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">
              Join Our Community
            </h1>
            <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              Service projects, networking events, and social gatherings that bring our community together in the heart of New York City.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="relative bg-white dark:bg-slate-800 -mt-8 mx-4 lg:mx-20 rounded-2xl shadow-xl z-10 border border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 lg:p-8 text-center group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
          >
            <div className="flex justify-center mb-3 text-primary">
              <span className="material-symbols-outlined text-4xl">event_available</span>
            </div>
            <p className="text-4xl lg:text-5xl font-bold text-primary dark:text-white mb-1 tracking-tighter">{counts.upcoming}</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-xs">Upcoming Events</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 lg:p-8 text-center group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex justify-center mb-3 text-accent">
              <span className="material-symbols-outlined text-4xl">history</span>
            </div>
            <p className="text-4xl lg:text-5xl font-bold text-primary dark:text-white mb-1 tracking-tighter">{counts.past}</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-xs">Past Events</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 lg:p-8 text-center group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none"
          >
            <div className="flex justify-center mb-3 text-primary">
              <span className="material-symbols-outlined text-4xl">diversity_3</span>
            </div>
            <p className="text-4xl lg:text-5xl font-bold text-primary dark:text-white mb-1 tracking-tighter">50+</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-xs">Active Members</p>
          </motion.div>
        </div>
      </section>

      {/* Filter & View Controls */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            {/* Search */}
            <div className="relative max-w-md w-full">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                <span className="material-symbols-outlined text-xl">search</span>
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Search events..."
                type="text"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                <button
                  onClick={() => { setShowUpcoming(true); setShowPast(false); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    showUpcoming && !showPast
                      ? 'bg-primary text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                  }`}
                >
                  Upcoming ({counts.upcoming})
                </button>
                <button
                  onClick={() => { setShowUpcoming(false); setShowPast(true); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    !showUpcoming && showPast
                      ? 'bg-primary text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                  }`}
                >
                  Past ({counts.past})
                </button>
                <button
                  onClick={() => { setShowUpcoming(true); setShowPast(true); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    showUpcoming && showPast
                      ? 'bg-primary text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                  }`}
                >
                  All
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                      : 'text-slate-500 hover:text-primary'
                  }`}
                  title="Grid View"
                >
                  <span className="material-symbols-outlined text-xl">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                      : 'text-slate-500 hover:text-primary'
                  }`}
                  title="Calendar View"
                >
                  <span className="material-symbols-outlined text-xl">calendar_month</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{monthLabel}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCalendarMonth((d) => addMonths(d, -1))}
                      className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                      onClick={() => setCalendarMonth(startOfMonth(new Date()))}
                      className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded-full transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setCalendarMonth((d) => addMonths(d, 1))}
                      className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 py-2">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((cell, idx) => {
                      const todayYmd = toYmdLocal(new Date())
                      const isToday = cell.ymd === todayYmd
                      const dayEvents = cell.ymd ? visibleEventsByYmd.get(cell.ymd) ?? [] : []
                      
                      return (
                        <div
                          key={idx}
                          className={`min-h-[80px] p-2 rounded-lg border transition-colors ${
                            cell.inMonth
                              ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary/30'
                              : 'bg-slate-50 dark:bg-slate-900/30 border-transparent opacity-40'
                          }`}
                        >
                          <div className={`text-sm font-medium mb-1 ${
                            isToday
                              ? 'w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {cell.day}
                          </div>
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <div
                              key={i}
                              className={`text-xs p-1 rounded mb-1 truncate ${
                                event.category === 'upcoming'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-slate-400">+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">event_busy</span>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No events found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                {query ? 'No events match your search. Try a different search term.' : 'Check back soon for upcoming events.'}
              </p>
              <Link
                href="/newsletter-sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-600 transition-colors"
              >
                <span className="material-symbols-outlined">mail</span>
                Sign Up for Updates
              </Link>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => {
                const dt = event.startDate ? parseYmdLocal(event.startDate) : null
                const badgeMonth = dt ? formatMonthShort(dt) : null
                const badgeDay = dt ? pad2(dt.getDate()) : null
                const googleUrl = event.startDate
                  ? getGoogleCalendarUrl({
                      id: event.id,
                      title: event.title,
                      description: event.description,
                      location: event.location,
                      startDate: event.startDate,
                      startTime: event.startTime,
                      endTime: event.endTime,
                      timezone: event.timezone,
                    })
                  : null

                return (
                  <motion.article
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="relative p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              event.category === 'upcoming'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {event.category === 'upcoming' ? 'event_available' : 'history'}
                            </span>
                            {event.category === 'upcoming' ? 'Upcoming' : 'Past'}
                          </span>
                          <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                        </div>

                        {/* Date Badge */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 shadow-sm flex flex-col items-center justify-center">
                          {badgeMonth && badgeDay ? (
                            <>
                              <span className="text-xs font-bold uppercase tracking-wider text-primary">{badgeMonth}</span>
                              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{badgeDay}</span>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-slate-500 text-center px-1">{event.date}</span>
                          )}
                        </div>
                      </div>

                      {/* Event Meta */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                          <span>{event.date}</span>
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-lg">schedule</span>
                            <span>{event.time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {event.description}
                      </p>

                      {/* Actions */}
                      <div className="mt-6 space-y-3">
                        {event.category === 'upcoming' && (
                          <a
                            href={`mailto:rotaractnewyorkcity@gmail.com?subject=RSVP: ${encodeURIComponent(event.title)}&body=Hi, I would like to RSVP for ${encodeURIComponent(event.title)} on ${event.date}.`}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
                          >
                            <span className="material-symbols-outlined">how_to_reg</span>
                            RSVP for Event
                          </a>
                        )}
                        
                        <div className="flex gap-2">
                          {googleUrl && (
                            <a
                              href={googleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                            >
                              <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                              <span className="hidden sm:inline">Add to Calendar</span>
                            </a>
                          )}
                          <a
                            href={`/api/public/events/ics?id=${encodeURIComponent(event.id)}`}
                            className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                            <span className="hidden sm:inline">.ics</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50 dark:bg-zinc-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="material-symbols-outlined text-primary/30 text-7xl mb-4">volunteer_activism</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Want to Get Involved?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join us at our next event and become part of a community dedicated to service and fellowship. Members get exclusive access to all events and activities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/about/membership"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary-600 transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">group_add</span>
                Become a Member
              </Link>
              <Link
                href="/meetings"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all"
              >
                <span className="material-symbols-outlined">event</span>
                View Meeting Schedule
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Never Miss an Event
            </h2>
            <p className="text-white/80 mb-8">
              Subscribe to our newsletter for event updates, community news, and more.
            </p>
            <Link
              href="/newsletter-sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-accent transition-all"
            >
              <span className="material-symbols-outlined">mail</span>
              Subscribe to Newsletter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
