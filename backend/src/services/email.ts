import nodemailer from 'nodemailer';
import { config } from '../config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"CustomCoachPro" <${config.email.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw - email failure shouldn't break the main flow
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to CustomCoachPro!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Welcome to CustomCoachPro, ${name}!</h1>
        <p>Thank you for joining our fitness platform. We're excited to help you on your fitness journey!</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>Browse our exercise library with 148+ exercises</li>
          <li>Explore workout programs tailored to your goals</li>
          <li>Track your nutrition with our food database</li>
          <li>Connect with certified coaches</li>
        </ul>
        <a href="${config.frontendUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Get Started
        </a>
      </div>
    `,
  });
}

/**
 * Send plan assignment notification
 */
export async function sendPlanAssignmentEmail(
  email: string,
  name: string,
  planName: string,
  planType: 'workout' | 'diet',
  coachName: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `New ${planType} plan assigned: ${planName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">New Plan Assigned!</h1>
        <p>Hi ${name},</p>
        <p>Your coach ${coachName} has assigned you a new ${planType} plan:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h2 style="margin: 0; color: #1f2937;">${planName}</h2>
        </div>
        <a href="${config.frontendUrl}/client/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Plan
        </a>
      </div>
    `,
  });
}

/**
 * Send check-in reminder
 */
export async function sendCheckinReminderEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Time for your weekly check-in!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Check-in Reminder</h1>
        <p>Hi ${name},</p>
        <p>It's time for your weekly check-in! Your coach is waiting to hear about your progress.</p>
        <a href="${config.frontendUrl}/client/checkins" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Submit Check-in
        </a>
      </div>
    `,
  });
}

/**
 * Send check-in received notification to coach
 */
export async function sendCheckinReceivedEmail(
  coachEmail: string,
  coachName: string,
  clientName: string
): Promise<void> {
  await sendEmail({
    to: coachEmail,
    subject: `New check-in from ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">New Client Check-in</h1>
        <p>Hi ${coachName},</p>
        <p>${clientName} has submitted a new check-in and is waiting for your feedback.</p>
        <a href="${config.frontendUrl}/coach/checkins" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Review Check-in
        </a>
      </div>
    `,
  });
}

/**
 * Send coaching request notification
 */
export async function sendCoachingRequestEmail(
  coachEmail: string,
  coachName: string,
  clientName: string,
  message?: string
): Promise<void> {
  await sendEmail({
    to: coachEmail,
    subject: `New coaching request from ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">New Coaching Request</h1>
        <p>Hi ${coachName},</p>
        <p>${clientName} would like you to be their coach!</p>
        ${message ? `<p><strong>Their message:</strong> ${message}</p>` : ''}
        <a href="${config.frontendUrl}/coach/requests" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Request
        </a>
      </div>
    `,
  });
}

/**
 * Generate check-in received email options (for coaches)
 */
export function generateCheckinReceivedEmail(email: string, clientName: string): EmailOptions {
  return {
    to: email,
    subject: `New check-in from ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">New Client Check-in</h1>
        <p>${clientName} has submitted a new check-in and is waiting for your feedback.</p>
        <a href="${config.frontendUrl}/coach/checkins" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Review Check-in
        </a>
      </div>
    `,
  };
}

/**
 * Generate check-in reviewed email options (for clients)
 */
export function generateCheckinReviewedEmail(email: string, coachName: string, feedback?: string): EmailOptions {
  return {
    to: email,
    subject: `Your check-in has been reviewed by ${coachName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Check-in Reviewed</h1>
        <p>Your coach ${coachName} has reviewed your check-in.</p>
        ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
        <a href="${config.frontendUrl}/client/checkins" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Feedback
        </a>
      </div>
    `,
  };
}

/**
 * Generate plan assigned email options (for clients)
 */
export function generatePlanAssignedEmail(
  email: string,
  planName: string,
  planType: string,
  coachName: string
): EmailOptions {
  return {
    to: email,
    subject: `New ${planType} plan assigned: ${planName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">New Plan Assigned!</h1>
        <p>Your coach ${coachName} has assigned you a new ${planType} plan:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h2 style="margin: 0; color: #1f2937;">${planName}</h2>
        </div>
        <a href="${config.frontendUrl}/client/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Plan
        </a>
      </div>
    `,
  };
}
