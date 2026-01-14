import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';

const router = Router();

// Get all messages (legacy endpoint)
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const messages = await queryAll(
    `SELECT m.*, p.full_name as sender_name 
     FROM messages m 
     JOIN profiles p ON m.sender_id = p.user_id 
     WHERE m.sender_id = @userId OR m.recipient_id = @userId 
     ORDER BY m.created_at DESC`,
    { userId: req.user!.id }
  );
  res.json(messages);
}));

// Get list of conversations with last message
router.get('/conversations', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Get distinct conversation partners
  const conversations = await queryAll(
    `WITH ConversationPartners AS (
       SELECT 
         CASE WHEN sender_id = @userId THEN recipient_id ELSE sender_id END as partner_id,
         MAX(created_at) as last_message_at
       FROM messages
       WHERE sender_id = @userId OR recipient_id = @userId
       GROUP BY CASE WHEN sender_id = @userId THEN recipient_id ELSE sender_id END
     )
     SELECT 
       cp.partner_id,
       cp.last_message_at,
       p.full_name as partner_name,
       p.avatar_url as partner_avatar,
       m.content as last_message,
       m.sender_id as last_message_sender_id,
       (SELECT COUNT(*) FROM messages 
        WHERE sender_id = cp.partner_id AND recipient_id = @userId AND read_at IS NULL) as unread_count
     FROM ConversationPartners cp
     JOIN profiles p ON cp.partner_id = p.user_id
     JOIN messages m ON m.created_at = cp.last_message_at 
       AND ((m.sender_id = @userId AND m.recipient_id = cp.partner_id) 
            OR (m.sender_id = cp.partner_id AND m.recipient_id = @userId))
     ORDER BY cp.last_message_at DESC`,
    { userId: req.user!.id }
  );

  res.json(conversations);
}));

// Get messages with specific partner
router.get('/:partnerId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { partnerId } = req.params;
  const { limit = 50, before } = req.query;

  let whereClause = `WHERE ((sender_id = @userId AND recipient_id = @partnerId) 
                           OR (sender_id = @partnerId AND recipient_id = @userId))`;
  const params: Record<string, unknown> = { userId: req.user!.id, partnerId };

  if (before) {
    whereClause += ' AND created_at < @before';
    params.before = before;
  }

  const messages = await queryAll(
    `SELECT TOP ${parseInt(limit as string)} 
            m.*, p.full_name as sender_name, p.avatar_url as sender_avatar
     FROM messages m
     JOIN profiles p ON m.sender_id = p.user_id
     ${whereClause}
     ORDER BY m.created_at DESC`,
    params
  );

  // Get partner info
  const partner = await queryOne(
    'SELECT user_id, full_name, avatar_url FROM profiles WHERE user_id = @partnerId',
    { partnerId }
  );

  // Mark messages as read
  await execute(
    `UPDATE messages SET read_at = GETUTCDATE() 
     WHERE sender_id = @partnerId AND recipient_id = @userId AND read_at IS NULL`,
    { partnerId, userId: req.user!.id }
  );

  res.json({
    messages: messages.reverse(), // Return in chronological order
    partner,
  });
}));

// Send a message
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { recipient_id, content } = req.body;

  if (!recipient_id || !content) {
    throw BadRequestError('Recipient ID and content are required');
  }

  // Verify recipient exists
  const recipient = await queryOne('SELECT user_id FROM profiles WHERE user_id = @recipientId', { recipientId: recipient_id });
  if (!recipient) {
    throw NotFoundError('Recipient');
  }

  const id = uuidv4();
  await execute(
    'INSERT INTO messages (id, sender_id, recipient_id, content) VALUES (@id, @senderId, @recipientId, @content)',
    { id, senderId: req.user!.id, recipientId: recipient_id, content }
  );

  // Create notification for recipient
  await execute(
    `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id)
     VALUES (@id, @userId, 'new_message', 'New Message', @message, 'message', @refId)`,
    {
      id: uuidv4(),
      userId: recipient_id,
      message: `${req.user!.fullName || 'Someone'} sent you a message`,
      refId: id,
    }
  );

  const message = await queryOne(
    `SELECT m.*, p.full_name as sender_name 
     FROM messages m 
     JOIN profiles p ON m.sender_id = p.user_id 
     WHERE m.id = @id`,
    { id }
  );

  res.status(201).json(message);
}));

// Mark messages as read
router.post('/mark-read', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { partner_id, message_ids } = req.body;

  if (message_ids && Array.isArray(message_ids)) {
    // Mark specific messages as read
    for (const msgId of message_ids) {
      await execute(
        `UPDATE messages SET read_at = GETUTCDATE() 
         WHERE id = @msgId AND recipient_id = @userId AND read_at IS NULL`,
        { msgId, userId: req.user!.id }
      );
    }
  } else if (partner_id) {
    // Mark all messages from partner as read
    await execute(
      `UPDATE messages SET read_at = GETUTCDATE() 
       WHERE sender_id = @partnerId AND recipient_id = @userId AND read_at IS NULL`,
      { partnerId: partner_id, userId: req.user!.id }
    );
  } else {
    throw BadRequestError('Either partner_id or message_ids is required');
  }

  res.json({ message: 'Messages marked as read' });
}));

// Get unread message count
router.get('/unread/count', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM messages WHERE recipient_id = @userId AND read_at IS NULL',
    { userId: req.user!.id }
  );

  res.json({ count: result?.count || 0 });
}));

export default router;
