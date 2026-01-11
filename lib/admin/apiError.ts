export type AdminApiErrorPayload = {
  error?: unknown
  message?: unknown
  details?: unknown
  code?: unknown
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export async function getFriendlyAdminApiError(res: Response, fallback: string): Promise<string> {
  let payload: AdminApiErrorPayload | null = null

  try {
    // Many endpoints return JSON with { error, details, code }.
    payload = (await res.json()) as AdminApiErrorPayload
  } catch {
    payload = null
  }

  const parts: string[] = []
  parts.push(fallback)

  const main = payload ? asString(payload.error) || asString(payload.message) : ''
  const details = payload ? asString(payload.details) : ''
  const code = payload ? asString(payload.code) : ''

  const serverDetails = [main, details, code ? `(${code})` : ''].filter(Boolean).join(' ')
  if (serverDetails) parts.push(serverDetails)

  if (res.status === 401) {
    parts.push('Please sign in again.')
  } else if (res.status === 403) {
    parts.push('Your email is not on the admin allowlist.')
  } else if (res.status >= 500 && !serverDetails) {
    parts.push('This is usually a server configuration issue (Firebase Admin env vars on Vercel).')
  }

  return parts.join(' ')
}
