import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute, transformRows } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler';

const router = Router();

// Get all notifications for current user
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { limit = 50, unread_only } = req.query;

  let whereClause = 'WHERE user_id = @userId';
  const params: Record<string, unknown> = { userId: req.user!.id };

  if (unread_only === 'true') {
    whereClause += ' AND is_read = 0';
  }

  const notifications = await queryAll<Record<string, unknown>>(
    `SELECT TOP ${parseInt(limit as string)} * 
     FROM notifications 
     ${whereClause}
     ORDER BY created_at DESC`,
    params
  );

  transformRows(notifications, ['data']);
  res.json(notifications);
}));

// Get unread notification count
router.get('/unread-count', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = @userId AND is_read = 0',
    { userId: req.user!.id }
  );

  res.json({ count: result?.count || 0 });
}));

// Mark single notification as read
router.put('/:id/read', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute(
    'UPDATE notifications SET is_read = 1, read_at = GETUTCDATE() WHERE id = @id AND user_id = @userId',
    { id: req.params.id, userId: req.user!.id }
  );
  res.json({ message: 'Marked as read' });
}));

// Mark all notifications as read (PUT - legacy)
router.put('/read-all', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute(
    'UPDATE notifications SET is_read = 1, read_at = GETUTCDATE() WHERE user_id = @userId AND is_read = 0',
    { userId: req.user!.id }
  );
  res.json({ message: 'All marked as read' });
}));

// Mark all notifications as read (POST - frontend uses this)
router.post('/mark-all-read', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute(
    'UPDATE notifications SET is_read = 1, read_at = GETUTCDATE() WHERE user_id = @userId AND is_read = 0',
    { userId: req.user!.id }
  );
  res.json({ message: 'All marked as read' });
}));

// Create notification (internal use)
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user_id, type, title, message, reference_type, reference_id, data } = req.body;

  if (!user_id || !type || !title || !message) {
    throw BadRequestError('user_id, type, title, and message are required');
  }

  const id = uuidv4();
  await execute(
    `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id, data)
     VALUES (@id, @userId, @type, @title, @message, @refType, @refId, @data)`,
    {
      id,
      userId: user_id,
      type,
      title,
      message,
      refType: reference_type,
      refId: reference_id,
      data: data ? JSON.stringify(data) : null,
    }
  );

  res.status(201).json({ id, message: 'Notification created' });
}));

// Delete notification
router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute(
    'DELETE FROM notifications WHERE id = @id AND user_id = @userId',
    { id: req.params.id, userId: req.user!.id }
  );
  res.json({ message: 'Notification deleted' });
}));

// Delete all read notifications
router.delete('/clear/read', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute(
    'DELETE FROM notifications WHERE user_id = @userId AND is_read = 1',
    { userId: req.user!.id }
  );
  res.json({ message: 'Read notifications cleared' });
}));

export default router;
