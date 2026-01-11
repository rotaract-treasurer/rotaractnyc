export type CalendarEventInput = {
  id: string
  title: string
  description?: string
  location?: string
  // Calendar fields
  startDate?: string // YYYY-MM-DD
  startTime?: string // HH:MM
  endTime?: string // HH:MM
  timezone?: string // IANA, default America/New_York
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function ymdToCompact(ymd: string) {
  return ymd.replaceAll('-', '')
}

function addDays(ymd: string, days: number) {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ymd
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(Date.UTC(y, mo - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

function timeToCompact(time: string) {
  // HH:MM -> HHMM00
  const m = time.match(/^(\d{2}):(\d{2})$/)
  if (!m) return null
  return `${m[1]}${m[2]}00`
}

function escapeIcsText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\r\n', '\\n')
    .replaceAll('\n', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;')
}

export function getGoogleCalendarUrl(e: CalendarEventInput) {
  const tz = e.timezone || 'America/New_York'
  if (!e.startDate) return null

  const text = e.title || ''
  const details = e.description || ''
  const location = e.location || ''

  const base = 'https://calendar.google.com/calendar/render'

  const params = new URLSearchParams()
  params.set('action', 'TEMPLATE')
  params.set('text', text)
  if (details) params.set('details', details)
  if (location) params.set('location', location)
  params.set('ctz', tz)

  if (!e.startTime) {
    // All-day event
    const start = ymdToCompact(e.startDate)
    const end = ymdToCompact(addDays(e.startDate, 1))
    params.set('dates', `${start}/${end}`)
    return `${base}?${params.toString()}`
  }

  const startTime = timeToCompact(e.startTime)
  if (!startTime) return null

  const endTime = timeToCompact(e.endTime || '') || timeToCompact('01:00')

  const start = `${ymdToCompact(e.startDate)}T${startTime}`
  // If no endTime, default to +1h-ish (not perfect, but OK for MVP). Prefer explicit endTime.
  const end = e.endTime && timeToCompact(e.endTime) ? `${ymdToCompact(e.startDate)}T${endTime}` : null

  if (end) {
    params.set('dates', `${start}/${end}`)
    return `${base}?${params.toString()}`
  }

  // No end time: Google still needs an end; use start + 1 hour.
  const m = e.startTime.match(/^(\d{2}):(\d{2})$/)
  if (!m) return null
  const startMinutes = Number(m[1]) * 60 + Number(m[2])
  const endMinutes = startMinutes + 60
  const endH = Math.floor(endMinutes / 60) % 24
  const endM = endMinutes % 60
  const endCompact = `${pad2(endH)}${pad2(endM)}00`
  params.set('dates', `${start}/${ymdToCompact(e.startDate)}T${endCompact}`)
  return `${base}?${params.toString()}`
}

export function getEventIcs(e: CalendarEventInput, opts?: { url?: string }) {
  const tz = e.timezone || 'America/New_York'
  if (!e.startDate) return null

  const uid = `${e.id}@rotaractnyc`
  const dtstamp = new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace('.000', '')
  const summary = escapeIcsText(e.title || '')
  const description = escapeIcsText(e.description || '')
  const location = escapeIcsText(e.location || '')

  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('PRODID:-//Rotaract NYC//Website//EN')
  lines.push('METHOD:PUBLISH')
  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${uid}`)
  lines.push(`DTSTAMP:${dtstamp.replace('Z', 'Z')}`)
  lines.push(`SUMMARY:${summary}`)
  if (description) lines.push(`DESCRIPTION:${description}`)
  if (location) lines.push(`LOCATION:${location}`)
  if (opts?.url) lines.push(`URL:${escapeIcsText(opts.url)}`)

  if (!e.startTime) {
    const start = ymdToCompact(e.startDate)
    const end = ymdToCompact(addDays(e.startDate, 1))
    lines.push(`DTSTART;VALUE=DATE:${start}`)
    lines.push(`DTEND;VALUE=DATE:${end}`)
  } else {
    const startTime = timeToCompact(e.startTime)
    if (!startTime) return null
    const start = `${ymdToCompact(e.startDate)}T${startTime}`

    let endValue: string | null = null
    if (e.endTime) {
      const et = timeToCompact(e.endTime)
      if (et) endValue = `${ymdToCompact(e.startDate)}T${et}`
    }

    if (!endValue) {
      const m = e.startTime.match(/^(\d{2}):(\d{2})$/)
      if (!m) return null
      const startMinutes = Number(m[1]) * 60 + Number(m[2])
      const endMinutes = startMinutes + 60
      const endH = Math.floor(endMinutes / 60) % 24
      const endM = endMinutes % 60
      endValue = `${ymdToCompact(e.startDate)}T${pad2(endH)}${pad2(endM)}00`
    }

    lines.push(`DTSTART;TZID=${tz}:${start}`)
    lines.push(`DTEND;TZID=${tz}:${endValue}`)
  }

  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
