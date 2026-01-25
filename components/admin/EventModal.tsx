'use client'

import { useState, useEffect } from 'react'

type EventFormData = {
  title: string
  date: string
  time: string
  startDate: string
  startTime: string
  endTime: string
  timezone: string
  location: string
  description: string
  category: 'upcoming' | 'past'
  order: number
  status: 'published' | 'draft' | 'cancelled'
  attendees: number
  imageUrl: string
  visibility: 'public' | 'member' | 'board'
}

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (form: EventFormData) => Promise<void>
  editingEvent?: EventFormData & { id: string } | null
  saving?: boolean
}

export default function EventModal({ isOpen, onClose, onSave, editingEvent, saving = false }: EventModalProps) {
  const [form, setForm] = useState<EventFormData>({
    title: '',
    date: '',
    time: '',
    startDate: '',
    startTime: '',
    endTime: '',
    timezone: 'America/New_York',
    location: '',
    description: '',
    category: 'upcoming',
    order: 1,
    status: 'published',
    attendees: 0,
    imageUrl: '',
    visibility: 'member',
  })

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        date: editingEvent.date,
        time: editingEvent.time || '',
        startDate: editingEvent.startDate || '',
        startTime: editingEvent.startTime || '',
        endTime: editingEvent.endTime || '',
        timezone: editingEvent.timezone || 'America/New_York',
        location: editingEvent.location || '',
        description: editingEvent.description,
        category: editingEvent.category,
        order: editingEvent.order,
        status: editingEvent.status || 'published',
        attendees: editingEvent.attendees || 0,
        imageUrl: editingEvent.imageUrl || '',
        visibility: editingEvent.visibility || 'member',
      })
    } else {
      setForm({
        title: '',
        date: '',
        time: '',
        startDate: '',
        startTime: '',
        endTime: '',
        timezone: 'America/New_York',
        location: '',
        description: '',
        category: 'upcoming',
        order: 1,
        status: 'published',
        attendees: 0,
        imageUrl: '',
        visibility: 'member',
      })
    }
  }, [editingEvent, isOpen])

  const hasCalendarDate = Boolean(form.startDate)

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

  const handleSave = async () => {
    await onSave(form)
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content max-w-2xl w-full">
          <div className="modal-header">
            <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        
          <div className="modal-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="input"
                placeholder="Event name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as 'upcoming' | 'past' }))}
                  className="input"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'published' | 'draft' | 'cancelled' }))}
                  className="input"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                Visibility *
              </label>
              <select
                value={form.visibility}
                onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as 'public' | 'member' | 'board' }))}
                className="input"
              >
                <option value="public">Public - Visible to everyone</option>
                <option value="member">Member - Visible to logged-in members</option>
                <option value="board">Board - Visible to board members only</option>
              </select>
            </div>

            {!hasCalendarDate ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                    Date (text) *
                  </label>
                  <input
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="input"
                    placeholder="Every 2nd Thursday"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                      Time (text)
                    </label>
                    <input
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      className="input"
                      placeholder="7:00 PM - 9:00 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                      Location
                    </label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="input"
                      placeholder="Manhattan, NY"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  Location
                </label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="input"
                  placeholder="Manhattan, NY"
                />
              </div>
            )}

            <div className="card p-4 bg-gray-50 dark:bg-zinc-900">
              <div className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-3">
                📅 Calendar Integration (optional)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                    Start time
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="input"
                placeholder="Event description..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title || (!form.date && !form.startDate) || !form.description}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
