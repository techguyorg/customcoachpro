import { Router, Response } from 'express';
import { queryAll, queryOne, execute } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all favorites for the user (optionally filter by item type)
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { itemType } = req.query;
  
  let query = 'SELECT * FROM user_favorites WHERE user_id = @userId';
  const params: Record<string, unknown> = { userId: req.user!.id };
  
  if (itemType) {
    query += ' AND item_type = @itemType';
    params.itemType = itemType;
  }
  
  const favorites = await queryAll(query, params);
  res.json(favorites);
}));

// Check if an item is favorited
router.get('/check', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { itemType, itemId } = req.query;
  
  if (!itemType || !itemId) {
    res.json({ isFavorite: false });
    return;
  }
  
  const existing = await queryOne(
    'SELECT id FROM user_favorites WHERE user_id = @userId AND item_type = @itemType AND item_id = @itemId',
    { userId: req.user!.id, itemType, itemId }
  );
  
  res.json({ isFavorite: !!existing });
}));

// Add a favorite
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Support both camelCase (frontend) and snake_case (legacy) field names
  const itemType = req.body.itemType || req.body.item_type;
  const itemId = req.body.itemId || req.body.item_id;
  
  if (!itemType || !itemId) {
    res.status(400).json({ error: 'itemType and itemId are required' });
    return;
  }
  
  const existing = await queryOne(
    'SELECT id FROM user_favorites WHERE user_id = @userId AND item_type = @itemType AND item_id = @itemId',
    { userId: req.user!.id, itemType, itemId }
  );
  
  if (existing) {
    res.json({ message: 'Already favorited' });
    return;
  }
  
  await execute(
    'INSERT INTO user_favorites (id, user_id, item_type, item_id) VALUES (@id, @userId, @itemType, @itemId)',
    { id: uuidv4(), userId: req.user!.id, itemType, itemId }
  );
  
  res.status(201).json({ message: 'Added to favorites' });
}));

// Delete a favorite - support both query params and route params
router.delete('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { itemType, itemId } = req.query;
  
  if (!itemType || !itemId) {
    res.status(400).json({ error: 'itemType and itemId query params are required' });
    return;
  }
  
  await execute(
    'DELETE FROM user_favorites WHERE user_id = @userId AND item_type = @itemType AND item_id = @itemId',
    { userId: req.user!.id, itemType, itemId }
  );
  
  res.json({ message: 'Removed from favorites' });
}));

// Delete a favorite using route params (legacy support)
router.delete('/:itemType/:itemId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { itemType, itemId } = req.params;
  
  await execute(
    'DELETE FROM user_favorites WHERE user_id = @userId AND item_type = @itemType AND item_id = @itemId',
    { userId: req.user!.id, itemType, itemId }
  );
  
  res.json({ message: 'Removed from favorites' });
}));

export default router;
