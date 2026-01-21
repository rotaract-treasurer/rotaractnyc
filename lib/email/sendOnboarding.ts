import { Resend } from 'resend';
import { generateWelcomeEmail, generateConfirmationEmail, WelcomeEmailData, ConfirmationEmailData } from './onboardingTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM || 'Rotaract NYC <no-reply@rotaractnyc.org>';

/**
 * Send welcome email to new member with onboarding link
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, html, text } = generateWelcomeEmail(data);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject,
      html,
      text,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email after member completes onboarding
 */
export async function sendConfirmationEmail(data: ConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, html, text } = generateConfirmationEmail(data);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject,
      html,
      text,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send confirmation email:', error);
    return { success: false, error: error.message };
  }
}
