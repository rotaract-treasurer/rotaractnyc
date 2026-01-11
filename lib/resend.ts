import { Resend } from 'resend'

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM)
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(apiKey)
}

function parseRecipientList(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

export type SendContactEmailArgs = {
  to: string | string[]
  from: string
  replyTo?: string
  subject: string
  name: string
  email: string
  message: string
  messageId?: string
}

export type SendMembershipApplicationEmailArgs = {
  to: string | string[]
  from: string
  replyTo?: string
  applicant: {
    fullName: string
    email: string
    phone?: string
    membershipType?: string
    location?: string
    occupationOrSchool?: string
    interests?: string
    whyJoin?: string
    hearAboutUs?: string
  }
  applicationId?: string
}

export async function sendContactEmail(args: SendContactEmailArgs) {
  const resend = getResendClient()

  const to = Array.isArray(args.to) ? args.to : parseRecipientList(args.to)
  if (to.length === 0) {
    throw new Error('No recipient configured for contact email')
  }

  const safeSubject = args.subject.trim() || 'Website contact form'
  const idLine = args.messageId ? `<p><strong>Message ID:</strong> ${escapeHtml(args.messageId)}</p>` : ''

  const html = `
    <div>
      <h2>New website message</h2>
      ${idLine}
      <p><strong>From:</strong> ${escapeHtml(args.name)} (${escapeHtml(args.email)})</p>
      <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(args.message)}</pre>
    </div>
  `.trim()

  const text = [
    'New website message',
    args.messageId ? `Message ID: ${args.messageId}` : null,
    `From: ${args.name} (${args.email})`,
    `Subject: ${safeSubject}`,
    '',
    args.message,
  ]
    .filter(Boolean)
    .join('\n')

  return await resend.emails.send({
    from: args.from,
    to,
    subject: `Contact: ${safeSubject}`,
    html,
    text,
    ...(args.replyTo ? { replyTo: args.replyTo } : {}),
  })
}

export async function sendMembershipApplicationEmail(args: SendMembershipApplicationEmailArgs) {
  const resend = getResendClient()

  const to = Array.isArray(args.to) ? args.to : parseRecipientList(args.to)
  if (to.length === 0) {
    throw new Error('No recipient configured for membership application email')
  }

  const safeName = args.applicant.fullName.trim() || 'Unknown'
  const safeEmail = args.applicant.email.trim() || 'Unknown'
  const idLine = args.applicationId
    ? `<p><strong>Application ID:</strong> ${escapeHtml(args.applicationId)}</p>`
    : ''

  const html = `
    <div>
      <h2>New membership application</h2>
      ${idLine}
      <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(args.applicant.phone || '')}</p>
      <p><strong>Membership type:</strong> ${escapeHtml(args.applicant.membershipType || '')}</p>
      <p><strong>Location:</strong> ${escapeHtml(args.applicant.location || '')}</p>
      <p><strong>Occupation / School:</strong> ${escapeHtml(args.applicant.occupationOrSchool || '')}</p>
      <p><strong>Interests:</strong></p>
      <pre style="white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(
        args.applicant.interests || ''
      )}</pre>
      <p><strong>Why join:</strong></p>
      <pre style="white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(
        args.applicant.whyJoin || ''
      )}</pre>
      <p><strong>How they heard about us:</strong></p>
      <pre style="white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(
        args.applicant.hearAboutUs || ''
      )}</pre>
    </div>
  `.trim()

  const text = [
    'New membership application',
    args.applicationId ? `Application ID: ${args.applicationId}` : null,
    `Name: ${safeName}`,
    `Email: ${safeEmail}`,
    args.applicant.phone ? `Phone: ${args.applicant.phone}` : null,
    args.applicant.membershipType ? `Membership type: ${args.applicant.membershipType}` : null,
    args.applicant.location ? `Location: ${args.applicant.location}` : null,
    args.applicant.occupationOrSchool ? `Occupation/School: ${args.applicant.occupationOrSchool}` : null,
    '',
    args.applicant.interests ? `Interests:\n${args.applicant.interests}` : null,
    '',
    args.applicant.whyJoin ? `Why join:\n${args.applicant.whyJoin}` : null,
    '',
    args.applicant.hearAboutUs ? `How heard about us:\n${args.applicant.hearAboutUs}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return await resend.emails.send({
    from: args.from,
    to,
    subject: `Membership Application: ${safeName}`,
    html,
    text,
    ...(args.replyTo ? { replyTo: args.replyTo } : {}),
  })
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
