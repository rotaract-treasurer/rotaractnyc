import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const TO_EMAIL = process.env.RESEND_TO_EMAIL || 'rotaractnewyorkcity@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@rotaractnyc.org';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // If Resend is configured, send actual email
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: `Rotaract NYC Website <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        replyTo: email,
        subject: subject ? `[Website] ${subject}` : `[Website] Contact from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #9B1B30;">New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666; width: 80px;"><strong>Name:</strong></td><td style="padding: 8px 0;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              ${subject ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Subject:</strong></td><td style="padding: 8px 0;">${subject}</td></tr>` : ''}
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #9B1B30;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #999;">Sent from rotaractnyc.org contact form</p>
          </div>
        `,
      });
    } else {
      // Fallback: log it
      console.log('Contact form submission (Resend not configured):', { name, email, subject, message });
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
