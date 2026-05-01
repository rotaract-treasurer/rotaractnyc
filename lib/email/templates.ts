/**
 * Email HTML templates for Rotaract NYC.
 *
 * Design principles:
 *  - Table-based layout for broad email client compatibility (Outlook, Gmail, Apple Mail)
 *  - Preheader / preview text injected per template
 *  - Brand colours: crimson #9B1B30, gold #EBC85B, off-white #FAFAFA
 *  - Defensive HTML escaping on all user-supplied values
 */
import { SITE } from '@/lib/constants';

// ── HTML-escape helper (defense-in-depth against XSS in emails) ──

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Shared building blocks ──────────────────────────────────────────────────

const CRIMSON = '#9B1B30';
const GOLD = '#EBC85B';
const GOLD_LIGHT = '#FEF9E7';
const GRAY_BG = '#F4F5F7';
const GRAY_BORDER = '#E5E7EB';
const TEXT_DARK = '#111827';
const TEXT_BODY = '#374151';
const TEXT_MUTED = '#6B7280';
const TEXT_SUBTLE = '#9CA3AF';

/** Hidden preheader shown as inbox preview text. */
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;">${escapeHtml(text)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`;
}

/** Primary CTA button — table-based for Outlook compatibility. */
function ctaButton(label: string, href: string, secondary = false): string {
  const bg = secondary ? '#ffffff' : CRIMSON;
  const color = secondary ? CRIMSON : '#ffffff';
  const border = secondary ? `border: 2px solid ${CRIMSON};` : '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="border-radius: 8px; ${border} background-color: ${bg};">
          <a href="${href}" target="_blank"
             style="display: inline-block; padding: 14px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; font-weight: 700; color: ${color}; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

/** Info card with a left-side crimson accent bar. */
function infoCard(lines: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; border-radius: 8px; overflow: hidden; border: 1px solid ${GRAY_BORDER};">
      <tr>
        <td width="4" style="background-color: ${CRIMSON};"></td>
        <td style="background-color: #FAFAFA; padding: 18px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${lines}
        </td>
      </tr>
    </table>`;
}

/** Gold highlight box (used for membership upsell / important notices). */
function goldBox(content: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid ${GOLD};">
      <tr>
        <td style="background-color: ${GOLD_LIGHT}; padding: 20px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${content}
        </td>
      </tr>
    </table>`;
}

const headerHtml = `
  <!-- Header -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="background-color: ${CRIMSON}; padding: 32px 40px; text-align: center;">
        <img src="${SITE.url}/rotaract-logo-white.png" alt="${SITE.shortName}" width="180" style="height: auto; display: block; margin: 0 auto;" />
        <p style="color: ${GOLD}; font-size: 11px; font-weight: 600; margin: 12px 0 0; letter-spacing: 2px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${SITE.motto}</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: ${GOLD}; height: 3px; line-height: 3px; font-size: 0;">&nbsp;</td>
    </tr>
  </table>`;

const footerHtml = `
  <!-- Footer -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="background-color: ${GRAY_BG}; border-top: 1px solid ${GRAY_BORDER}; padding: 28px 40px; text-align: center;">
        <!-- Social links -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;">
          <tr>
            <td style="padding: 0 8px;">
              <a href="${SITE.social.instagram}" target="_blank" style="color: ${CRIMSON}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; font-weight: 600; text-decoration: none;">Instagram</a>
            </td>
            <td style="color: ${TEXT_SUBTLE}; font-size: 12px;">&bull;</td>
            <td style="padding: 0 8px;">
              <a href="${SITE.social.linkedin}" target="_blank" style="color: ${CRIMSON}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; font-weight: 600; text-decoration: none;">LinkedIn</a>
            </td>
            <td style="color: ${TEXT_SUBTLE}; font-size: 12px;">&bull;</td>
            <td style="padding: 0 8px;">
              <a href="${SITE.social.facebook}" target="_blank" style="color: ${CRIMSON}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; font-weight: 600; text-decoration: none;">Facebook</a>
            </td>
          </tr>
        </table>
        <p style="color: ${TEXT_BODY}; font-size: 12px; font-weight: 600; margin: 0 0 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${SITE.name}</p>
        <p style="color: ${TEXT_MUTED}; font-size: 11px; margin: 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${SITE.address}</p>
        <p style="color: ${TEXT_SUBTLE}; font-size: 11px; margin: 8px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <a href="${SITE.url}" style="color: ${CRIMSON}; text-decoration: none;">${SITE.domain}</a>
          &nbsp;&bull;&nbsp;
          <a href="mailto:${SITE.email}" style="color: ${TEXT_SUBTLE}; text-decoration: none;">${SITE.email}</a>
        </p>
      </td>
    </tr>
  </table>`;

export function wrapTemplate(body: string, preview = ''): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${SITE.shortName}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${GRAY_BG}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  ${preview ? preheader(preview) : ''}
  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${GRAY_BG};">
    <tr>
      <td style="padding: 32px 16px;">
        <!-- Email card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr><td>${headerHtml}</td></tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 36px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${TEXT_BODY}; font-size: 15px; line-height: 1.6;">
              ${body}
            </td>
          </tr>
          <tr><td>${footerHtml}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Reusable inline style helpers ──────────────────────────────────────────

function h1(text: string): string {
  return `<h1 style="color: ${TEXT_DARK}; font-size: 24px; font-weight: 700; margin: 0 0 8px; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${text}</h1>`;
}

function p(text: string, style = ''): string {
  return `<p style="color: ${TEXT_BODY}; font-size: 15px; line-height: 1.7; margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; ${style}">${text}</p>`;
}

function muted(text: string): string {
  return `<p style="color: ${TEXT_MUTED}; font-size: 13px; line-height: 1.6; margin: 20px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${text}</p>`;
}

function divider(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding: 8px 0;"><div style="border-top: 1px solid ${GRAY_BORDER};"></div></td></tr></table>`;
}

function listItem(icon: string, title: string, detail: string): string {
  return `
    <tr>
      <td style="padding: 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <span style="color: ${TEXT_MUTED}; font-size: 14px;">${icon}&nbsp;&nbsp;</span>
        <strong style="color: ${TEXT_DARK}; font-size: 14px;">${title}</strong>
        <span style="color: ${TEXT_BODY}; font-size: 14px;">&nbsp;${detail}</span>
      </td>
    </tr>`;
}

// ── Templates ──────────────────────────────────────────────────────────────

export function contactFormEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const subject = escapeHtml(data.subject);
  const message = escapeHtml(data.message);

  return {
    subject: `[Contact] ${data.subject}`,
    html: wrapTemplate(`
      ${h1('New Contact Form Submission')}
      ${divider()}
      ${infoCard(`
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('👤', 'From:', `${name} &lt;${email}&gt;`)}
          ${listItem('📌', 'Subject:', subject)}
        </table>
      `)}
      <p style="color: ${TEXT_MUTED}; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 20px 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Message</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius: 8px; overflow: hidden; background-color: #FAFAFA; border: 1px solid ${GRAY_BORDER};">
        <tr><td style="padding: 18px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: ${TEXT_BODY}; line-height: 1.7; white-space: pre-wrap;">${message}</td></tr>
      </table>
    `, `New message from ${data.name}: ${data.subject}`),
    text: `New Contact Form Submission\n\nFrom: ${data.name} (${data.email})\nSubject: ${data.subject}\n\n${data.message}\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function membershipInterestEmail(data: {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const phone = data.phone ? escapeHtml(data.phone) : '';
  const message = data.message ? escapeHtml(data.message) : '';

  return {
    subject: `[Membership Interest] ${data.name}`,
    html: wrapTemplate(`
      ${h1('New Membership Interest')}
      ${p('Someone has expressed interest in joining Rotaract NYC via the website.')}
      ${divider()}
      ${infoCard(`
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('👤', 'Name:', name)}
          ${listItem('✉️', 'Email:', email)}
          ${phone ? listItem('📞', 'Phone:', phone) : ''}
        </table>
      `)}
      ${message ? `
        <p style="color: ${TEXT_MUTED}; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 20px 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Note from applicant</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius: 8px; background-color: #FAFAFA; border: 1px solid ${GRAY_BORDER};">
          <tr><td style="padding: 18px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: ${TEXT_BODY}; line-height: 1.7;">${message}</td></tr>
        </table>` : ''}
    `, `${data.name} is interested in joining Rotaract NYC`),
    text: `New Membership Interest\n\nName: ${data.name}\nEmail: ${data.email}${data.phone ? `\nPhone: ${data.phone}` : ''}${data.message ? `\n\n${data.message}` : ''}\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function welcomeEmail(name: string): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);

  return {
    subject: `Welcome to ${SITE.shortName}! 🎉`,
    html: wrapTemplate(`
      ${h1(`Welcome to the club, ${safeName}!`)}
      ${p(`We're thrilled to have you as a member of the <strong>${SITE.name}</strong>. You're joining a community of young professionals and emerging leaders committed to service, leadership, and fellowship in New York City.`)}
      <p style="color: ${TEXT_MUTED}; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Get started</p>
      ${infoCard(`
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <a href="${SITE.url}/portal/profile" style="color: ${CRIMSON}; font-size: 14px; font-weight: 600; text-decoration: none;">Complete your member profile</a>
              <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 2px 0 0;">Add a photo, bio, and interests so fellow members can find and connect with you.</p>
            </td>
          </tr>
          <tr><td style="padding: 4px 0;"><div style="border-top: 1px solid ${GRAY_BORDER};"></div></td></tr>
          <tr>
            <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <a href="${SITE.url}/portal/dues" style="color: ${CRIMSON}; font-size: 14px; font-weight: 600; text-decoration: none;">Pay your annual dues</a>
              <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 2px 0 0;">Unlock full member benefits including event RSVPs, committees, and voting rights.</p>
            </td>
          </tr>
          <tr><td style="padding: 4px 0;"><div style="border-top: 1px solid ${GRAY_BORDER};"></div></td></tr>
          <tr>
            <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <a href="${SITE.url}/portal/events" style="color: ${CRIMSON}; font-size: 14px; font-weight: 600; text-decoration: none;">Browse upcoming events</a>
              <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 2px 0 0;">RSVP to your first meeting or service event and start meeting people.</p>
            </td>
          </tr>
          <tr><td style="padding: 4px 0;"><div style="border-top: 1px solid ${GRAY_BORDER};"></div></td></tr>
          <tr>
            <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <a href="${SITE.url}/portal/directory" style="color: ${CRIMSON}; font-size: 14px; font-weight: 600; text-decoration: none;">Explore the member directory</a>
              <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 2px 0 0;">Connect with members across committees, industries, and interests.</p>
            </td>
          </tr>
        </table>
      `)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('Go to Your Member Portal', `${SITE.url}/portal`)}
          </td>
        </tr>
      </table>
      ${muted(`We meet <strong>${SITE.meetingSchedule}</strong> at ${SITE.address}. We hope to see you soon!`)}
    `, `You're now a member of ${SITE.name}!`),
    text: `Welcome to the club, ${name}!\n\nWe're thrilled to have you as a member of the ${SITE.name}.\n\nGet started:\n- Complete your member profile: ${SITE.url}/portal/profile\n- Pay your annual dues: ${SITE.url}/portal/dues\n- Browse upcoming events: ${SITE.url}/portal/events\n- Explore the member directory: ${SITE.url}/portal/directory\n\nWe meet ${SITE.meetingSchedule} at ${SITE.address}. We hope to see you soon!\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function inviteEmail(name: string): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);

  return {
    subject: `You're invited to join ${SITE.shortName}`,
    html: wrapTemplate(`
      ${h1(`You've been invited, ${safeName}!`)}
      ${p(`You've been added to the <strong>${SITE.name}</strong> member portal. Sign in to complete your profile and officially become an active member of our community.`)}
      <p style="color: ${TEXT_MUTED}; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">What to expect</p>
      ${infoCard(`
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('1.', 'Sign in', 'with your Google account using this email address.')}
          ${listItem('2.', 'Set up your profile', '— add a photo, bio, and contact info.')}
          ${listItem('3.', 'Choose your membership tier', 'and pay your annual dues.')}
          ${listItem('4.', 'Start exploring', '— events, committees, directory, and more.')}
        </table>
      `)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('Sign In & Get Started', `${SITE.url}/portal/login`)}
          </td>
        </tr>
      </table>
      ${muted(`Please sign in using the same email address this invitation was sent to. This ensures your profile is linked correctly.`)}
    `, `You've been invited to join ${SITE.name}`),
    text: `You've been invited, ${name}!\n\nYou've been added to the ${SITE.name} member portal. Sign in to complete your profile and become an active member.\n\nWhat to expect:\n1. Sign in with your Google account at ${SITE.url}/portal/login\n2. Set up your profile — add a photo, bio, and contact info.\n3. Choose your membership tier and pay your annual dues.\n4. Start exploring — events, committees, directory, and more.\n\nPlease sign in using the same email address this invitation was sent to.\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function duesReminderEmail(name: string, amount: string, cycleName: string): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);
  const safeAmount = escapeHtml(amount);
  const safeCycle = escapeHtml(cycleName);

  return {
    subject: `Action needed: Your ${cycleName} dues are due`,
    html: wrapTemplate(`
      ${h1('Your annual dues are due')}
      ${p(`Hi ${safeName},`)}
      ${p(`Your membership dues of <strong>${safeAmount}</strong> for the <strong>${safeCycle}</strong> Rotary year are now due. Paying on time ensures you retain full access to all member benefits.`)}
      ${infoCard(`
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('💳', 'Amount due:', safeAmount)}
          ${listItem('📅', 'Rotary year:', safeCycle)}
        </table>
      `)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('Pay Dues Now', `${SITE.url}/portal/dues`)}
          </td>
        </tr>
      </table>
      ${muted('Questions? Reply to this email or reach us at <a href="mailto:' + SITE.email + '" style="color: ' + CRIMSON + ';">' + SITE.email + '</a>.')}
    `, `Your ${cycleName} dues of ${amount} are due — pay now to keep your membership active`),
    text: `Your annual dues are due\n\nHi ${name},\n\nYour membership dues of ${amount} for the ${cycleName} Rotary year are now due.\n\nPay now: ${SITE.url}/portal/dues\n\nQuestions? Email us at ${SITE.email}.\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function eventReminderEmail(name: string, event: {
  title: string;
  date: string;
  time: string;
  location: string;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(event.title);
  const safeDate = escapeHtml(event.date);
  const safeTime = escapeHtml(event.time);
  const safeLocation = escapeHtml(event.location);

  return {
    subject: `Reminder: ${event.title}`,
    html: wrapTemplate(`
      ${h1('Event Reminder')}
      ${p(`Hi ${safeName}, just a heads-up — you have an upcoming event:`)}
      ${infoCard(`
        <p style="color: ${CRIMSON}; font-size: 17px; font-weight: 700; margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${safeTitle}</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('📅', 'Date:', `${safeDate} at ${safeTime}`)}
          ${listItem('📍', 'Location:', safeLocation)}
        </table>
      `)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('View Event', `${SITE.url}/portal/events`)}
          </td>
        </tr>
      </table>
      ${muted('We look forward to seeing you there!')}
    `, `Reminder: ${event.title} — ${event.date} at ${event.time}`),
    text: `Event Reminder\n\nHi ${name}, just a heads-up — you have an upcoming event:\n\n${event.title}\n${event.date} at ${event.time}\n${event.location}\n\nView event: ${SITE.url}/portal/events\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

// ── Onboarding Sequence Templates ──────────────────────────────────────────

export function profileReminderEmail(name: string): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);

  return {
    subject: `Your profile is almost complete — ${SITE.shortName}`,
    html: wrapTemplate(`
      ${h1(`${safeName}, finish setting up your profile`)}
      ${p(`You're one step away from being fully set up as a member. A complete profile helps fellow members find you, learn about your background, and connect with you more easily.`)}
      ${p(`It only takes a few minutes — add a photo, write a short bio, and select your interests.`)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('Complete Your Profile', `${SITE.url}/portal/profile`)}
          </td>
        </tr>
      </table>
      ${muted('Already finished your profile? You can safely ignore this email.')}
    `, 'A few minutes is all it takes — finish setting up your Rotaract NYC profile'),
    text: `${name}, finish setting up your profile\n\nYou're one step away from being fully set up as a member. Add a photo, bio, and interests.\n\nComplete your profile: ${SITE.url}/portal/profile\n\nAlready finished? You can safely ignore this email.\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function duesNudgeEmail(name: string, amount: string): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);
  const safeAmount = escapeHtml(amount);

  return {
    subject: `Your dues are still outstanding — ${SITE.shortName}`,
    html: wrapTemplate(`
      ${h1(`A gentle reminder, ${safeName}`)}
      ${p(`Your annual membership dues of <strong>${safeAmount}</strong> haven't been paid yet.`)}
      ${p(`Your dues go directly toward service projects, community events, and the partnerships that make Rotaract NYC possible. Staying current also ensures you have full access to member benefits — event RSVPs, committee participation, and voting rights.`)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('Pay Dues Now', `${SITE.url}/portal/dues`)}
          </td>
        </tr>
      </table>
      ${muted("If you've already paid, it may take a moment to reflect — feel free to disregard this message.")}
    `, `Your dues of ${amount} are outstanding — pay now to keep your membership active`),
    text: `A gentle reminder, ${name}\n\nYour annual membership dues of ${amount} haven't been paid yet.\n\nPay dues now: ${SITE.url}/portal/dues\n\nIf you've already paid, it may take a moment to reflect — feel free to disregard this message.\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function oneWeekCheckInEmail(name: string): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);

  return {
    subject: `One week in — how's it going, ${name}?`,
    html: wrapTemplate(`
      ${h1(`How are you settling in, ${safeName}?`)}
      ${p(`It's been a week since you joined ${SITE.name} — we hope you're getting comfortable!`)}
      ${p(`Here are two easy ways to get more out of your membership right now:`)}
      ${infoCard(`
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <a href="${SITE.url}/portal/events" style="color: ${CRIMSON}; font-size: 14px; font-weight: 700; text-decoration: none;">Attend an upcoming event →</a>
              <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 3px 0 0;">RSVP to your first meeting or service event. It's hands-down the best way to meet fellow members.</p>
            </td>
          </tr>
          <tr><td style="padding: 4px 0;"><div style="border-top: 1px solid ${GRAY_BORDER};"></div></td></tr>
          <tr>
            <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <a href="${SITE.url}/portal/directory" style="color: ${CRIMSON}; font-size: 14px; font-weight: 700; text-decoration: none;">Browse the member directory →</a>
              <p style="color: ${TEXT_MUTED}; font-size: 13px; margin: 3px 0 0;">Find members with shared interests, industries, or committees — and say hello.</p>
            </td>
          </tr>
        </table>
      `)}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto 0;">
        <tr>
          <td style="padding-right: 8px;">${ctaButton('Browse Events', `${SITE.url}/portal/events`)}</td>
          <td style="padding-left: 8px;">${ctaButton('Member Directory', `${SITE.url}/portal/directory`, true)}</td>
        </tr>
      </table>
      ${muted(`We meet <strong>${SITE.meetingSchedule}</strong> — we'd love to see you there!`)}
    `, `Tips for making the most of your first week with Rotaract NYC`),
    text: `How are you settling in, ${name}?\n\nIt's been a week since you joined ${SITE.name}!\n\n- Attend an upcoming event: ${SITE.url}/portal/events\n- Browse the member directory: ${SITE.url}/portal/directory\n\nWe meet ${SITE.meetingSchedule} — we'd love to see you there!\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function guestRsvpConfirmationEmail(
  name: string,
  event: { title: string; date: string; time: string; location: string; slug: string },
): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(event.title);
  const safeDate = escapeHtml(event.date);
  const safeTime = escapeHtml(event.time);
  const safeLocation = escapeHtml(event.location);

  return {
    subject: `You're registered: ${event.title}`,
    html: wrapTemplate(`
      ${h1(`You're all set, ${safeName}!`)}
      ${p(`Your registration has been confirmed for the following event:`)}
      ${infoCard(`
        <p style="color: ${CRIMSON}; font-size: 17px; font-weight: 700; margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${safeTitle}</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('📅', 'Date:', `${safeDate} at ${safeTime}`)}
          ${listItem('📍', 'Location:', safeLocation)}
        </table>
      `)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('View Event Details', `${SITE.url}/events/${event.slug}`)}
          </td>
        </tr>
      </table>
      ${divider()}
      ${goldBox(`
        <p style="color: ${TEXT_DARK}; font-size: 15px; font-weight: 700; margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Enjoying the event? Consider joining Rotaract NYC.</p>
        <p style="color: ${TEXT_BODY}; font-size: 14px; margin: 0 0 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Members get access to exclusive events, service opportunities, professional development, and a community of driven young professionals making a real difference in NYC.</p>
        ${ctaButton('Learn About Membership', `${SITE.url}/membership`, true)}
      `)}
    `, `Registration confirmed — see you at ${event.title}!`),
    text: `You're all set, ${name}!\n\nYour registration has been confirmed:\n\n${event.title}\n${event.date} at ${event.time}\n${event.location}\n\nView event details: ${SITE.url}/events/${event.slug}\n\n---\n\nEnjoying the event? Consider joining Rotaract NYC.\nMembers get access to exclusive events, service opportunities, and a network of young professionals.\n${SITE.url}/membership\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function guestTicketConfirmationEmail(
  name: string,
  event: { title: string; date: string; time: string; location: string; slug: string; tierLabel?: string; quantity?: number; attendeeNames?: string[] },
  amountCents: number,
  qrCodeDataUrl?: string,
): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(event.title);
  const safeDate = escapeHtml(event.date);
  const safeTime = escapeHtml(event.time);
  const safeLocation = escapeHtml(event.location);
  const tierLabel = event.tierLabel ? escapeHtml(event.tierLabel) : '';
  const quantity = event.quantity ?? 1;
  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
  const attendeeNames = event.attendeeNames ?? [name];

  const attendeeNamesHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; border-radius: 8px; border: 1px solid ${GRAY_BORDER}; overflow: hidden;">
      <tr>
        <td style="background-color: ${CRIMSON}; padding: 10px 20px;">
          <p style="color: #ffffff; font-size: 11px; font-weight: 700; margin: 0; letter-spacing: 1.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">🎟️ Ticket${quantity > 1 ? 's' : ''} (${quantity})</p>
        </td>
      </tr>
      ${attendeeNames.map((n, i) => `
      <tr>
        <td style="background-color: ${i % 2 === 0 ? '#FAFAFA' : '#FFFFFF'}; padding: 12px 20px; border-top: 1px solid ${GRAY_BORDER}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <p style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 600; margin: 0;"><span style="color: ${TEXT_MUTED}; font-weight: 400; margin-right: 8px;">#${i + 1}</span>${escapeHtml(n)}</p>
        </td>
      </tr>`).join('')}
    </table>`;

  const qrCodeHtml = qrCodeDataUrl ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="text-align: center;">
          <p style="color: ${TEXT_MUTED}; font-size: 12px; font-weight: 600; margin: 0 0 12px; letter-spacing: 1px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Present at entry</p>
          <div style="display: inline-block; padding: 16px; background: #ffffff; border-radius: 12px; border: 2px solid ${GRAY_BORDER}; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <img src="${qrCodeDataUrl}" alt="Check-in QR Code" width="180" height="180" style="display: block; border-radius: 4px;" />
          </div>
          <p style="color: ${TEXT_SUBTLE}; font-size: 11px; margin: 10px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Screenshot or print this QR code for quick check-in</p>
        </td>
      </tr>
    </table>` : '';

  return {
    subject: `Your ticket is confirmed: ${event.title}`,
    html: wrapTemplate(`
      ${h1(`Your ticket is confirmed, ${safeName}!`)}
      ${p(`Payment received — you're all set for the following event:`)}
      ${infoCard(`
        <p style="color: ${CRIMSON}; font-size: 17px; font-weight: 700; margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${safeTitle}</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('📅', 'Date:', `${safeDate} at ${safeTime}`)}
          ${listItem('📍', 'Location:', safeLocation)}
          ${tierLabel ? listItem('🎟️', 'Ticket type:', tierLabel) : ''}
          ${listItem('💳', 'Amount paid:', amountFormatted)}
        </table>
      `)}
      ${attendeeNamesHtml}
      ${qrCodeHtml}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('View Event Details', `${SITE.url}/events/${event.slug}`)}
          </td>
        </tr>
      </table>
      ${divider()}
      ${goldBox(`
        <p style="color: ${TEXT_DARK}; font-size: 15px; font-weight: 700; margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Enjoying the event? Consider joining Rotaract NYC.</p>
        <p style="color: ${TEXT_BODY}; font-size: 14px; margin: 0 0 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Members get access to exclusive events, service opportunities, professional development, and a community of driven young professionals making a real difference in NYC.</p>
        ${ctaButton('Learn About Membership', `${SITE.url}/membership`, true)}
      `)}
    `, `Ticket confirmed — you're going to ${event.title}!`),
    text: `Your ticket is confirmed, ${name}!\n\n${event.title}\n${event.date} at ${event.time}\n${event.location}${tierLabel ? `\nTicket type: ${event.tierLabel}` : ''}\nTickets (${quantity}): ${attendeeNames.join(', ')}\nAmount paid: ${amountFormatted}\n\nView event details: ${SITE.url}/events/${event.slug}\n\n---\n\nEnjoying the event? Consider joining Rotaract NYC.\n${SITE.url}/membership\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

// ── Member-specific event email templates ──────────────────────────────────
// These differ from guest templates in two ways:
//  1. No membership upsell — the recipient is already a member
//  2. A "bring a friend" / community prompt instead
//  3. Richer member-facing detail (portal deep-link, tier/seat info)

export function memberTicketConfirmationEmail(
  name: string,
  event: { title: string; date: string; time: string; location: string; slug: string; tierLabel?: string; quantity?: number; attendeeNames?: string[] },
  amountCents: number,
  qrCodeDataUrl?: string,
): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(event.title);
  const safeDate = escapeHtml(event.date);
  const safeTime = escapeHtml(event.time);
  const safeLocation = escapeHtml(event.location);
  const tierLabel = event.tierLabel ? escapeHtml(event.tierLabel) : '';
  const quantity = event.quantity ?? 1;
  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
  const attendeeNames = event.attendeeNames ?? [name];

  const attendeeNamesHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; border-radius: 8px; border: 1px solid ${GRAY_BORDER}; overflow: hidden;">
      <tr>
        <td style="background-color: ${CRIMSON}; padding: 10px 20px;">
          <p style="color: #ffffff; font-size: 11px; font-weight: 700; margin: 0; letter-spacing: 1.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">🎟️ Ticket${quantity > 1 ? 's' : ''} (${quantity})</p>
        </td>
      </tr>
      ${attendeeNames.map((n, i) => `
      <tr>
        <td style="background-color: ${i % 2 === 0 ? '#FAFAFA' : '#FFFFFF'}; padding: 12px 20px; border-top: 1px solid ${GRAY_BORDER}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <p style="color: ${TEXT_DARK}; font-size: 14px; font-weight: 600; margin: 0;"><span style="color: ${TEXT_MUTED}; font-weight: 400; margin-right: 8px;">#${i + 1}</span>${escapeHtml(n)}</p>
        </td>
      </tr>`).join('')}
    </table>`;

  const qrCodeHtml = qrCodeDataUrl ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="text-align: center;">
          <p style="color: ${TEXT_MUTED}; font-size: 12px; font-weight: 600; margin: 0 0 12px; letter-spacing: 1px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Present at entry</p>
          <div style="display: inline-block; padding: 16px; background: #ffffff; border-radius: 12px; border: 2px solid ${GRAY_BORDER}; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <img src="${qrCodeDataUrl}" alt="Check-in QR Code" width="180" height="180" style="display: block; border-radius: 4px;" />
          </div>
          <p style="color: ${TEXT_SUBTLE}; font-size: 11px; margin: 10px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Screenshot or print this QR code for quick check-in</p>
        </td>
      </tr>
    </table>` : '';

  return {
    subject: `You're going: ${event.title}`,
    html: wrapTemplate(`
      ${h1(`You're going, ${safeName}!`)}
      ${p(`Your ticket is confirmed. We can't wait to see you there.`)}
      ${infoCard(`
        <p style="color: ${CRIMSON}; font-size: 17px; font-weight: 700; margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${safeTitle}</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('📅', 'Date:', `${safeDate} at ${safeTime}`)}
          ${listItem('📍', 'Location:', safeLocation)}
          ${tierLabel ? listItem('🎟️', 'Ticket type:', tierLabel) : ''}
          ${listItem('💳', 'Amount paid:', amountFormatted)}
        </table>
      `)}
      ${attendeeNamesHtml}
      ${qrCodeHtml}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('View Event in Portal', `${SITE.url}/portal/events`)}
          </td>
        </tr>
      </table>
      ${divider()}
      ${goldBox(`
        <p style="color: ${TEXT_DARK}; font-size: 15px; font-weight: 700; margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Know someone who'd love this event?</p>
        <p style="color: ${TEXT_BODY}; font-size: 14px; margin: 0 0 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Share the event page with friends, colleagues, or anyone who might want to join. The more the merrier — and it's a great way to grow our community.</p>
        ${ctaButton('Share Event Page', `${SITE.url}/events/${event.slug}`, true)}
      `)}
      ${muted('Questions about this event? Reply to this email or reach us at <a href="mailto:' + SITE.email + '" style="color: ' + CRIMSON + ';">' + SITE.email + '</a>.')}
    `, `Ticket confirmed — see you at ${event.title}!`),
    text: `You're going, ${name}!\n\nYour ticket is confirmed:\n\n${event.title}\n${event.date} at ${event.time}\n${event.location}${tierLabel ? `\nTicket type: ${event.tierLabel}` : ''}\nTickets (${quantity}): ${attendeeNames.join(', ')}\nAmount paid: ${amountFormatted}\n\nView in portal: ${SITE.url}/portal/events\n\nKnow someone who'd love this? Share: ${SITE.url}/events/${event.slug}\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function memberRsvpConfirmationEmail(
  name: string,
  event: { title: string; date: string; time: string; location: string; slug: string },
): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(event.title);
  const safeDate = escapeHtml(event.date);
  const safeTime = escapeHtml(event.time);
  const safeLocation = escapeHtml(event.location);

  return {
    subject: `RSVP confirmed: ${event.title}`,
    html: wrapTemplate(`
      ${h1(`See you there, ${safeName}!`)}
      ${p(`Your RSVP has been confirmed. We're looking forward to seeing you at:`)}
      ${infoCard(`
        <p style="color: ${CRIMSON}; font-size: 17px; font-weight: 700; margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${safeTitle}</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('📅', 'Date:', `${safeDate} at ${safeTime}`)}
          ${listItem('📍', 'Location:', safeLocation)}
        </table>
      `)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('View Event in Portal', `${SITE.url}/portal/events`)}
          </td>
        </tr>
      </table>
      ${divider()}
      ${goldBox(`
        <p style="color: ${TEXT_DARK}; font-size: 15px; font-weight: 700; margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Bring a friend!</p>
        <p style="color: ${TEXT_BODY}; font-size: 14px; margin: 0 0 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Know someone who would enjoy this event? Send them the public event page — guests are always welcome at Rotaract NYC.</p>
        ${ctaButton('Share Event Page', `${SITE.url}/events/${event.slug}`, true)}
      `)}
      ${muted('Need to change your RSVP? You can update it anytime from your <a href="' + SITE.url + '/portal/events" style="color: ' + CRIMSON + ';">events dashboard</a>.')}
    `, `RSVP confirmed — we'll see you at ${event.title}!`),
    text: `See you there, ${name}!\n\nYour RSVP has been confirmed:\n\n${event.title}\n${event.date} at ${event.time}\n${event.location}\n\nView in portal: ${SITE.url}/portal/events\n\nBring a friend! Share: ${SITE.url}/events/${event.slug}\n\nNeed to change your RSVP? Update it anytime at ${SITE.url}/portal/events\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function waitlistConfirmationEmail(
  email: string,
  eventTitle: string,
  eventSlug: string,
): { subject: string; html: string; text: string } {
  const safeEmail = escapeHtml(email);
  const safeTitle = escapeHtml(eventTitle);

  return {
    subject: `You're on the waitlist: ${eventTitle}`,
    html: wrapTemplate(`
      ${h1(`You're on the waitlist`)}
      ${p(`Hi ${safeEmail},`)}
      ${p(`We've added you to the waitlist for <strong>${safeTitle}</strong>. If a spot opens up, we'll notify you right away — so keep an eye on your inbox.`)}
      ${infoCard(`
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('📌', 'Event:', safeTitle)}
          ${listItem('✉️', 'Waitlist email:', safeEmail)}
        </table>
      `)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center;">
            ${ctaButton('View Event Details', `${SITE.url}/events/${eventSlug}`)}
          </td>
        </tr>
      </table>
      ${muted("You'll only receive one notification if a spot becomes available. If you no longer wish to be on the waitlist, you can ignore this email.")}
    `, `You're on the waitlist for ${eventTitle} — we'll notify you if a spot opens`),
    text: `You're on the waitlist\n\nHi ${email},\n\nWe've added you to the waitlist for ${eventTitle}. If a spot opens up, we'll notify you right away.\n\nView event: ${SITE.url}/events/${eventSlug}\n\nYou'll only receive one notification if a spot becomes available.\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}

export function donationThankYouEmail(
  donorName: string,
  amountCents: number,
): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(donorName);
  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;

  return {
    subject: `Thank you for your donation to ${SITE.shortName}`,
    html: wrapTemplate(`
      ${h1(`Thank you, ${safeName}!`)}
      ${p(`Your generous donation of <strong>${amountFormatted}</strong> to the ${SITE.name} has been received.`)}
      ${goldBox(`
        <p style="color: ${TEXT_BODY}; font-size: 14px; line-height: 1.7; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Your gift goes directly toward the service projects, community events, and partnerships that define Rotaract NYC. Every dollar amplifies our impact — locally and around the world.</p>
      `)}
      <p style="color: ${TEXT_MUTED}; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Your donation supports</p>
      ${infoCard(`
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${listItem('🥫', 'Food drives', '& meal distribution programs')}
          ${listItem('🌿', 'Park cleanups', '& neighborhood beautification')}
          ${listItem('📚', 'Educational programs', 'for underserved youth')}
          ${listItem('🌍', 'International service', 'initiatives & global partnerships')}
        </table>
      `)}
      ${p(`Thank you for being part of our mission to create positive change in New York City and beyond.`)}
      ${muted(`Questions about your donation? Contact us at <a href="mailto:${SITE.email}" style="color: ${CRIMSON};">${SITE.email}</a>.`)}
    `, `Your ${amountFormatted} donation to ${SITE.name} has been received — thank you!`),
    text: `Thank you, ${donorName}!\n\nYour generous donation of ${amountFormatted} to the ${SITE.name} has been received.\n\nYour gift supports:\n- Food drives & meal distribution programs\n- Park cleanups & neighborhood beautification\n- Educational programs for underserved youth\n- International service initiatives & global partnerships\n\nThank you for being part of our mission.\n\nQuestions? Email us at ${SITE.email}.\n\n--\n${SITE.name}\n${SITE.address}`,
  };
}
