import { config } from '../config';

// Branded email wrapper with consistent styling
const brandedWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CustomCoachPro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(145deg, #151b23 0%, #0d1117 100%); border-radius: 16px; border: 1px solid #21262d; overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #21262d;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e 0%, #14b8a6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #0d1117; font-size: 24px; font-weight: 800;">C</span>
                </div>
                <span style="color: #f0f6fc; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CustomCoachPro</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #21262d; text-align: center;">
              <p style="margin: 0 0 8px; color: #8b949e; font-size: 13px;">
                © ${new Date().getFullYear()} CustomCoachPro. All rights reserved.
              </p>
              <p style="margin: 0; color: #6e7681; font-size: 12px;">
                You're receiving this email because you have an account with CustomCoachPro.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const primaryButton = (text: string, href: string) => `
  <a href="${href}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #14b8a6 100%); color: #0d1117; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.25);">
    ${text}
  </a>
`;

const secondaryButton = (text: string, href: string) => `
  <a href="${href}" style="display: inline-block; background: #21262d; color: #f0f6fc; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; border: 1px solid #30363d;">
    ${text}
  </a>
`;

const infoBox = (content: string, type: 'info' | 'warning' | 'success' = 'info') => {
  const colors = {
    info: { bg: 'rgba(56, 139, 253, 0.1)', border: '#388bfd', text: '#79c0ff' },
    warning: { bg: 'rgba(210, 153, 34, 0.1)', border: '#d29922', text: '#e3b341' },
    success: { bg: 'rgba(46, 160, 67, 0.1)', border: '#2ea043', text: '#56d364' }
  };
  const c = colors[type];
  return `
    <div style="background: ${c.bg}; border-left: 3px solid ${c.border}; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: ${c.text}; font-size: 14px; line-height: 1.6;">
        ${content}
      </p>
    </div>
  `;
};

// ============ Email Templates ============

export const welcomeEmail = (name: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    Welcome to CustomCoachPro, ${name}! 🎉
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    We're thrilled to have you on board. Your fitness journey is about to get a whole lot smarter.
  </p>
  
  <div style="background: #161b22; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h3 style="margin: 0 0 16px; color: #f0f6fc; font-size: 16px;">What you can do:</h3>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #8b949e; font-size: 14px; line-height: 2;">
      <li>🏋️ Browse our library of 148+ exercises with video guides</li>
      <li>📋 Access personalized workout programs</li>
      <li>🥗 Track nutrition with our comprehensive food database</li>
      <li>👨‍🏫 Connect with certified fitness coaches</li>
      <li>📊 Monitor your progress with detailed analytics</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 32px 0 16px;">
    ${primaryButton('Get Started', config.frontendUrl)}
  </div>
`);

export const emailVerificationEmail = (name: string, verificationUrl: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    Verify Your Email
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    Hi ${name}, welcome to CustomCoachPro! Please verify your email address to activate your account.
  </p>
  
  <div style="text-align: center; margin: 32px 0;">
    ${primaryButton('Verify Email Address', verificationUrl)}
  </div>
  
  ${infoBox('This verification link expires in 24 hours. If you didn\'t create an account, you can safely ignore this email.', 'info')}
  
  <p style="margin: 24px 0 0; color: #6e7681; font-size: 13px;">
    Can't click the button? Copy and paste this link into your browser:<br>
    <a href="${verificationUrl}" style="color: #58a6ff; word-break: break-all;">${verificationUrl}</a>
  </p>
`);

export const passwordResetEmail = (resetUrl: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    Reset Your Password
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    We received a request to reset your password. Click the button below to choose a new password.
  </p>
  
  <div style="text-align: center; margin: 32px 0;">
    ${primaryButton('Reset Password', resetUrl)}
  </div>
  
  ${infoBox('This link expires in 1 hour. If you didn\'t request a password reset, please ignore this email or contact support if you have concerns.', 'warning')}
  
  <p style="margin: 24px 0 0; color: #6e7681; font-size: 13px;">
    Can't click the button? Copy and paste this link into your browser:<br>
    <a href="${resetUrl}" style="color: #58a6ff; word-break: break-all;">${resetUrl}</a>
  </p>
`);

export const planAssignmentEmail = (clientName: string, planName: string, planType: 'workout' | 'diet', coachName: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    New ${planType === 'workout' ? 'Workout' : 'Diet'} Plan Assigned! 💪
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    Hi ${clientName}, great news! Your coach has prepared something special for you.
  </p>
  
  <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 8px; color: #8b949e; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
      ${planType === 'workout' ? '🏋️ Workout Program' : '🥗 Nutrition Plan'}
    </p>
    <h2 style="margin: 0 0 8px; color: #f0f6fc; font-size: 22px; font-weight: 600;">
      ${planName}
    </h2>
    <p style="margin: 0; color: #8b949e; font-size: 14px;">
      Assigned by <strong style="color: #22c55e;">${coachName}</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin: 32px 0 16px;">
    ${primaryButton('View Your Plan', `${config.frontendUrl}/client/dashboard`)}
  </div>
`);

export const checkinReminderEmail = (clientName: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    Time for Your Weekly Check-in! 📋
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    Hi ${clientName}, it's time to update your coach on your progress. Regular check-ins help your coach fine-tune your program for better results.
  </p>
  
  <div style="background: #161b22; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h3 style="margin: 0 0 16px; color: #f0f6fc; font-size: 16px;">What to include:</h3>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #8b949e; font-size: 14px; line-height: 2;">
      <li>📸 Progress photos (optional but recommended)</li>
      <li>⚖️ Current measurements</li>
      <li>💭 How you're feeling overall</li>
      <li>🎯 Any challenges or wins from the week</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 32px 0 16px;">
    ${primaryButton('Submit Check-in', `${config.frontendUrl}/client/checkins`)}
  </div>
`);

export const checkinReceivedEmail = (coachName: string, clientName: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    New Check-in from ${clientName} 📬
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    Hi ${coachName}, your client has submitted their weekly check-in and is waiting for your feedback.
  </p>
  
  ${infoBox('Quick responses lead to higher client engagement and better results!', 'success')}
  
  <div style="text-align: center; margin: 32px 0 16px;">
    ${primaryButton('Review Check-in', `${config.frontendUrl}/coach/checkins`)}
  </div>
`);

export const checkinReviewedEmail = (clientName: string, coachName: string, feedback: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    Your Coach Reviewed Your Check-in! ✅
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    Hi ${clientName}, great news! ${coachName} has reviewed your check-in and left feedback for you.
  </p>
  
  <div style="background: #161b22; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <p style="margin: 0 0 8px; color: #8b949e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Coach Feedback</p>
    <p style="margin: 0; color: #f0f6fc; font-size: 15px; line-height: 1.7; font-style: italic;">
      "${feedback}"
    </p>
  </div>
  
  <div style="text-align: center; margin: 32px 0 16px;">
    ${primaryButton('View Full Details', `${config.frontendUrl}/client/checkins`)}
  </div>
`);

export const coachingRequestEmail = (coachName: string, clientName: string, message?: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    New Coaching Request! 🌟
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    Hi ${coachName}, you have a new potential client who wants to work with you!
  </p>
  
  <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 8px; color: #8b949e; font-size: 13px;">Request from</p>
    <h2 style="margin: 0; color: #22c55e; font-size: 22px; font-weight: 600;">
      ${clientName}
    </h2>
  </div>
  
  ${message ? `
    <div style="background: #161b22; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: #8b949e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Their Message</p>
      <p style="margin: 0; color: #f0f6fc; font-size: 15px; line-height: 1.7; font-style: italic;">
        "${message}"
      </p>
    </div>
  ` : ''}
  
  <div style="text-align: center; margin: 32px 0 16px;">
    ${primaryButton('View Request', `${config.frontendUrl}/coach/requests`)}
  </div>
`);

export const coachInvitationEmail = (coachName: string, message?: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    You've Been Invited! 🎉
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    ${coachName} has invited you to join CustomCoachPro as their coaching client.
  </p>
  
  ${message ? `
    <div style="background: #161b22; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: #8b949e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Personal Message</p>
      <p style="margin: 0; color: #f0f6fc; font-size: 15px; line-height: 1.7; font-style: italic;">
        "${message}"
      </p>
    </div>
  ` : ''}
  
  <div style="background: #161b22; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h3 style="margin: 0 0 16px; color: #f0f6fc; font-size: 16px;">What you'll get:</h3>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #8b949e; font-size: 14px; line-height: 2;">
      <li>Personalized workout and diet plans</li>
      <li>Direct messaging with your coach</li>
      <li>Progress tracking and analytics</li>
      <li>Weekly check-ins and feedback</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 32px 0 16px;">
    ${primaryButton('Accept Invitation', `${config.frontendUrl}/signup`)}
  </div>
`);

export const superAdminPromotionEmail = (userName: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    Super Admin Access Granted 🔐
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    Hi ${userName}, you have been granted Super Admin access to the CustomCoachPro platform.
  </p>
  
  ${infoBox('With great power comes great responsibility. All actions are logged for security purposes.', 'warning')}
  
  <div style="background: #161b22; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h3 style="margin: 0 0 16px; color: #f0f6fc; font-size: 16px;">Your new capabilities:</h3>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #8b949e; font-size: 14px; line-height: 2;">
      <li>Full user management access</li>
      <li>Platform settings configuration</li>
      <li>Content management (exercises, programs, etc.)</li>
      <li>View platform analytics and audit logs</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 32px 0 16px;">
    ${primaryButton('Access Admin Dashboard', `${config.frontendUrl}/admin`)}
  </div>
`);

export const adminNotificationEmail = (subject: string, message: string, actionUrl?: string, actionText?: string) => brandedWrapper(`
  <h1 style="margin: 0 0 16px; color: #f0f6fc; font-size: 28px; font-weight: 700;">
    ${subject}
  </h1>
  <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.6;">
    ${message}
  </p>
  
  ${actionUrl ? `
    <div style="text-align: center; margin: 32px 0 16px;">
      ${primaryButton(actionText || 'View Details', actionUrl)}
    </div>
  ` : ''}
`);

// Helper for generating check-in reviewed email
export const generateCheckinReviewedEmail = (clientEmail: string, coachName: string, feedback: string) => ({
  to: clientEmail,
  subject: 'Your coach has reviewed your check-in!',
  html: checkinReviewedEmail('there', coachName, feedback)
});
