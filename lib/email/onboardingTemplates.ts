/**
 * Email templates for member onboarding and dues payment
 */

export interface WelcomeEmailData {
  firstName: string;
  email: string;
  onboardingUrl: string;
  expiresInDays: number;
}

export interface ConfirmationEmailData {
  firstName: string;
  email: string;
  portalUrl: string;
}

/**
 * Generate welcome email HTML
 */
export function generateWelcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Welcome to Rotaract NYC! Complete Your Membership';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f9f9f9;
      padding: 30px 20px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
    .steps {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .step {
      margin: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .step-number {
      position: absolute;
      left: 0;
      top: 0;
      background: #667eea;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Rotaract NYC! 🎉</h1>
  </div>
  <div class="content">
    <p>Hi ${data.firstName},</p>
    
    <p>You've been invited to join <strong>Rotaract NYC</strong>! We're excited to have you as part of our community of young professionals making a difference.</p>
    
    <div class="steps">
      <h3>Complete Your Membership in 3 Easy Steps:</h3>
      <div class="step">
        <div class="step-number">1</div>
        <strong>Sign In</strong> - Verify your email address
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <strong>Complete Profile</strong> - Tell us about yourself
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <strong>Pay Dues</strong> - Secure payment of $85 annual membership dues
      </div>
    </div>
    
    <center>
      <a href="${data.onboardingUrl}" class="button">Complete Your Membership</a>
    </center>
    
    <p><strong>Important:</strong> This invitation link will expire in ${data.expiresInDays} days. Please complete your onboarding as soon as possible.</p>
    
    <p>Once you've completed all steps, you'll gain full access to:</p>
    <ul>
      <li>Member directory and networking</li>
      <li>Event calendar and RSVP</li>
      <li>Club documents and resources</li>
      <li>Community announcements</li>
    </ul>
    
    <p>If you have any questions, please don't hesitate to reach out to our team.</p>
    
    <p>Looking forward to seeing you at our next event!</p>
    
    <p>Best regards,<br>
    <strong>Rotaract NYC Team</strong></p>
  </div>
  
  <div class="footer">
    <p>Rotaract NYC | Building Leaders, Transforming Communities</p>
    <p>This email was sent to ${data.email}</p>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to Rotaract NYC!

Hi ${data.firstName},

You've been invited to join Rotaract NYC! We're excited to have you as part of our community.

Complete Your Membership in 3 Easy Steps:
1. Sign In - Verify your email address
2. Complete Profile - Tell us about yourself
3. Pay Dues - Secure payment of $85 annual membership dues

Click here to get started: ${data.onboardingUrl}

This invitation link will expire in ${data.expiresInDays} days.

Once you've completed all steps, you'll gain full access to our member portal, events, and resources.

Looking forward to seeing you!

Best regards,
Rotaract NYC Team
  `.trim();

  return { subject, html, text };
}

/**
 * Generate confirmation email HTML (after completing onboarding)
 */
export function generateConfirmationEmail(data: ConfirmationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Welcome Aboard! Your Rotaract NYC Membership is Active';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f9f9f9;
      padding: 30px 20px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .success-badge {
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 You're All Set!</h1>
  </div>
  <div class="content">
    <center>
      <div class="success-badge">✓ Membership Active</div>
    </center>
    
    <p>Hi ${data.firstName},</p>
    
    <p>Congratulations! Your profile is complete, your dues are paid, and you now have full access to the <strong>Rotaract NYC Member Portal</strong>.</p>
    
    <center>
      <a href="${data.portalUrl}" class="button">Access Member Portal</a>
    </center>
    
    <p><strong>What's Next?</strong></p>
    <ul>
      <li>Browse the member directory and connect with fellow Rotaractors</li>
      <li>RSVP to upcoming events</li>
      <li>Access club documents and resources</li>
      <li>Stay updated with announcements</li>
      <li>View financial transparency reports</li>
    </ul>
    
    <p><strong>Get Involved:</strong></p>
    <p>We encourage you to attend our next meeting and join a committee that interests you. Check the events calendar in the portal for upcoming opportunities!</p>
    
    <p>If you have any questions or need assistance, feel free to reach out to any board member through the portal.</p>
    
    <p>Welcome to the Rotaract NYC family!</p>
    
    <p>Best regards,<br>
    <strong>Rotaract NYC Team</strong></p>
  </div>
  
  <div class="footer">
    <p>Rotaract NYC | Building Leaders, Transforming Communities</p>
    <p>This email was sent to ${data.email}</p>
  </div>
</body>
</html>
  `;

  const text = `
You're All Set!

Hi ${data.firstName},

Congratulations! Your profile is complete, your dues are paid, and you now have full access to the Rotaract NYC Member Portal.

Access the portal here: ${data.portalUrl}

What's Next?
- Browse the member directory and connect with fellow Rotaractors
- RSVP to upcoming events
- Access club documents and resources
- Stay updated with announcements

Welcome to the Rotaract NYC family!

Best regards,
Rotaract NYC Team
  `.trim();

  return { subject, html, text };
}
