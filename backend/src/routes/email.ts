import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendEmail,
  sendWelcomeEmail,
  sendPlanAssignmentEmail,
  sendCheckinReminderEmail,
  sendCheckinReceivedEmail,
  sendCoachingRequestEmail,
} from '../services/email';

const router = Router();

/**
 * @swagger
 * /api/email/send:
 *   post:
 *     summary: Send a generic email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 */
router.post('/send', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    await sendEmail({ to, subject, html, text });
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * @swagger
 * /api/email/welcome:
 *   post:
 *     summary: Send welcome email to new user
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post('/welcome', authenticate, async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Missing required fields: email, name' });
    }

    await sendWelcomeEmail(email, name);
    res.json({ success: true, message: 'Welcome email sent' });
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

/**
 * @swagger
 * /api/email/plan-assignment:
 *   post:
 *     summary: Send plan assignment notification
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post('/plan-assignment', authenticate, async (req: Request, res: Response) => {
  try {
    const { email, name, planName, planType, coachName } = req.body;

    if (!email || !name || !planName || !planType || !coachName) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, name, planName, planType, coachName' 
      });
    }

    await sendPlanAssignmentEmail(email, name, planName, planType, coachName);
    res.json({ success: true, message: 'Plan assignment email sent' });
  } catch (error: any) {
    console.error('Error sending plan assignment email:', error);
    res.status(500).json({ error: 'Failed to send plan assignment email' });
  }
});

/**
 * @swagger
 * /api/email/checkin-reminder:
 *   post:
 *     summary: Send check-in reminder to client
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post('/checkin-reminder', authenticate, async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Missing required fields: email, name' });
    }

    await sendCheckinReminderEmail(email, name);
    res.json({ success: true, message: 'Check-in reminder sent' });
  } catch (error: any) {
    console.error('Error sending checkin reminder:', error);
    res.status(500).json({ error: 'Failed to send check-in reminder' });
  }
});

/**
 * @swagger
 * /api/email/checkin-received:
 *   post:
 *     summary: Notify coach of new client check-in
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post('/checkin-received', authenticate, async (req: Request, res: Response) => {
  try {
    const { coachEmail, coachName, clientName } = req.body;

    if (!coachEmail || !coachName || !clientName) {
      return res.status(400).json({ 
        error: 'Missing required fields: coachEmail, coachName, clientName' 
      });
    }

    await sendCheckinReceivedEmail(coachEmail, coachName, clientName);
    res.json({ success: true, message: 'Check-in received notification sent' });
  } catch (error: any) {
    console.error('Error sending checkin received email:', error);
    res.status(500).json({ error: 'Failed to send check-in received notification' });
  }
});

/**
 * @swagger
 * /api/email/coaching-request:
 *   post:
 *     summary: Notify coach of new coaching request
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post('/coaching-request', authenticate, async (req: Request, res: Response) => {
  try {
    const { coachEmail, coachName, clientName, message } = req.body;

    if (!coachEmail || !coachName || !clientName) {
      return res.status(400).json({ 
        error: 'Missing required fields: coachEmail, coachName, clientName' 
      });
    }

    await sendCoachingRequestEmail(coachEmail, coachName, clientName, message);
    res.json({ success: true, message: 'Coaching request notification sent' });
  } catch (error: any) {
    console.error('Error sending coaching request email:', error);
    res.status(500).json({ error: 'Failed to send coaching request notification' });
  }
});

/**
 * @swagger
 * /api/email/client-invitation:
 *   post:
 *     summary: Send invitation email to potential client
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post('/client-invitation', authenticate, async (req: Request, res: Response) => {
  try {
    const { email, clientName, coachName, message } = req.body;

    if (!email || !clientName || !coachName) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, clientName, coachName' 
      });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">You've Been Invited!</h1>
        <p>Hello ${clientName},</p>
        <p><strong>${coachName}</strong> has invited you to join CustomCoachPro as their client.</p>
        ${message ? `<p><em>"${message}"</em></p>` : ''}
        <p>CustomCoachPro is a comprehensive fitness coaching platform where you can:</p>
        <ul>
          <li>Receive personalized workout and diet plans</li>
          <li>Track your progress with detailed analytics</li>
          <li>Communicate directly with your coach</li>
          <li>Log workouts and nutrition</li>
        </ul>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
            Accept Invitation
          </a>
        </p>
        <p>Best regards,<br>The CustomCoachPro Team</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `${coachName} has invited you to CustomCoachPro`,
      html,
    });

    res.json({ success: true, message: 'Client invitation sent' });
  } catch (error: any) {
    console.error('Error sending client invitation:', error);
    res.status(500).json({ error: 'Failed to send client invitation' });
  }
});

/**
 * @swagger
 * /api/email/admin-notification:
 *   post:
 *     summary: Send admin notification
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post('/admin-notification', authenticate, async (req: Request, res: Response) => {
  try {
    const { email, subject, message, actionUrl, actionText } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, subject, message' 
      });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Admin Notification</h1>
        <p>${message}</p>
        ${actionUrl ? `
          <p>
            <a href="${actionUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
              ${actionText || 'View Details'}
            </a>
          </p>
        ` : ''}
        <p>Best regards,<br>CustomCoachPro System</p>
      </div>
    `;

    await sendEmail({ to: email, subject, html });
    res.json({ success: true, message: 'Admin notification sent' });
  } catch (error: any) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({ error: 'Failed to send admin notification' });
  }
});

export default router;
