import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute } from '../db';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/foods:
 *   get:
 *     tags: [Foods]
 *     summary: Get all foods
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of foods }
 */
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, subcategory, search, limit = 100 } = req.query;

  let whereClause = 'WHERE (is_system = 1';
  const params: Record<string, unknown> = {};

  if (req.user) {
    whereClause += ' OR created_by = @userId';
    params.userId = req.user.id;
  }
  whereClause += ')';

  if (category) {
    whereClause += ' AND category = @category';
    params.category = category;
  }
  if (subcategory) {
    whereClause += ' AND subcategory = @subcategory';
    params.subcategory = subcategory;
  }
  if (search) {
    whereClause += ' AND (name LIKE @search OR brand LIKE @search)';
    params.search = `%${search}%`;
  }

  const foods = await queryAll<Record<string, unknown>>(
    `SELECT TOP ${parseInt(limit as string)}
            id, name, brand, category, subcategory, barcode,
            calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
            fiber_per_100g, sugar_per_100g, sodium_mg_per_100g,
            default_serving_size, default_serving_unit, image_url, notes,
            is_system, created_by, created_at
     FROM foods ${whereClause}
     ORDER BY name`,
    params
  );

  res.json(foods);
}));

/**
 * @swagger
 * /api/foods/{id}:
 *   get:
 *     tags: [Foods]
 *     summary: Get food by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Food details }
 *       404: { description: Food not found }
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const food = await queryOne<Record<string, unknown>>(
    `SELECT id, name, brand, category, subcategory, barcode,
            calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
            fiber_per_100g, sugar_per_100g, sodium_mg_per_100g,
            default_serving_size, default_serving_unit, image_url, notes,
            is_system, created_by, created_at
     FROM foods WHERE id = @id`,
    { id }
  );

  if (!food) {
    throw NotFoundError('Food');
  }

  // Get alternatives
  const alternatives = await queryAll<{ id: string; name: string; reason: string }>(
    `SELECT f.id, f.name, fa.reason
     FROM foods f
     JOIN food_alternatives fa ON f.id = fa.alternative_food_id
     WHERE fa.food_id = @id`,
    { id }
  );

  res.json({ ...food, alternatives });
}));

/**
 * @swagger
 * /api/foods:
 *   post:
 *     tags: [Foods]
 *     summary: Create a new food
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Food'
 *     responses:
 *       201: { description: Food created }
 */
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    brand,
    category,
    subcategory,
    barcode,
    calories_per_100g = 0,
    protein_per_100g = 0,
    carbs_per_100g = 0,
    fat_per_100g = 0,
    fiber_per_100g,
    sugar_per_100g,
    sodium_mg_per_100g,
    default_serving_size = 100,
    default_serving_unit = 'g',
    image_url,
    notes,
    is_system, // Allow super admin to set this
  } = req.body;

  if (!name || !category) {
    throw BadRequestError('Name and category are required');
  }

  const id = uuidv4();
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  // Only super admins can create system foods
  const systemFlag = isSuperAdmin && is_system ? 1 : 0;

  await execute(
    `INSERT INTO foods (id, name, brand, category, subcategory, barcode,
                       calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
                       fiber_per_100g, sugar_per_100g, sodium_mg_per_100g,
                       default_serving_size, default_serving_unit, image_url, notes,
                       is_system, created_by)
     VALUES (@id, @name, @brand, @category, @subcategory, @barcode,
             @caloriesPer100g, @proteinPer100g, @carbsPer100g, @fatPer100g,
             @fiberPer100g, @sugarPer100g, @sodiumMgPer100g,
             @defaultServingSize, @defaultServingUnit, @imageUrl, @notes,
             @isSystem, @createdBy)`,
    {
      id,
      name,
      brand,
      category,
      subcategory,
      barcode,
      caloriesPer100g: calories_per_100g,
      proteinPer100g: protein_per_100g,
      carbsPer100g: carbs_per_100g,
      fatPer100g: fat_per_100g,
      fiberPer100g: fiber_per_100g,
      sugarPer100g: sugar_per_100g,
      sodiumMgPer100g: sodium_mg_per_100g,
      defaultServingSize: default_serving_size,
      defaultServingUnit: default_serving_unit,
      imageUrl: image_url,
      notes,
      isSystem: systemFlag,
      createdBy: req.user!.id,
    }
  );

  const food = await queryOne('SELECT * FROM foods WHERE id = @id', { id });
  res.status(201).json(food);
}));

/**
 * @swagger
 * /api/foods/{id}:
 *   put:
 *     tags: [Foods]
 *     summary: Update a food
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Food updated }
 */
router.put('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM foods WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Food');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');

  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot modify system foods');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only modify your own foods');
  }

  const {
    name,
    brand,
    category,
    subcategory,
    calories_per_100g,
    protein_per_100g,
    carbs_per_100g,
    fat_per_100g,
    fiber_per_100g,
    sugar_per_100g,
    sodium_mg_per_100g,
    default_serving_size,
    default_serving_unit,
    image_url,
    notes,
  } = req.body;

  await execute(
    `UPDATE foods SET
       name = COALESCE(@name, name),
       brand = COALESCE(@brand, brand),
       category = COALESCE(@category, category),
       subcategory = COALESCE(@subcategory, subcategory),
       calories_per_100g = COALESCE(@caloriesPer100g, calories_per_100g),
       protein_per_100g = COALESCE(@proteinPer100g, protein_per_100g),
       carbs_per_100g = COALESCE(@carbsPer100g, carbs_per_100g),
       fat_per_100g = COALESCE(@fatPer100g, fat_per_100g),
       fiber_per_100g = COALESCE(@fiberPer100g, fiber_per_100g),
       sugar_per_100g = COALESCE(@sugarPer100g, sugar_per_100g),
       sodium_mg_per_100g = COALESCE(@sodiumMgPer100g, sodium_mg_per_100g),
       default_serving_size = COALESCE(@defaultServingSize, default_serving_size),
       default_serving_unit = COALESCE(@defaultServingUnit, default_serving_unit),
       image_url = COALESCE(@imageUrl, image_url),
       notes = COALESCE(@notes, notes),
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      name,
      brand,
      category,
      subcategory,
      caloriesPer100g: calories_per_100g,
      proteinPer100g: protein_per_100g,
      carbsPer100g: carbs_per_100g,
      fatPer100g: fat_per_100g,
      fiberPer100g: fiber_per_100g,
      sugarPer100g: sugar_per_100g,
      sodiumMgPer100g: sodium_mg_per_100g,
      defaultServingSize: default_serving_size,
      defaultServingUnit: default_serving_unit,
      imageUrl: image_url,
      notes,
    }
  );

  const food = await queryOne('SELECT * FROM foods WHERE id = @id', { id });
  res.json(food);
}));

/**
 * @swagger
 * /api/foods/{id}:
 *   delete:
 *     tags: [Foods]
 *     summary: Delete a food
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Food deleted }
 */
router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM foods WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Food');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');

  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot delete system foods');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only delete your own foods');
  }

  await execute('DELETE FROM foods WHERE id = @id', { id });
  res.json({ message: 'Food deleted' });
}));

/**
 * @swagger
 * /api/foods/categories:
 *   get:
 *     tags: [Foods]
 *     summary: Get all food categories
 *     responses:
 *       200: { description: List of categories }
 */
router.get('/categories', asyncHandler(async (_req, res: Response) => {
  const categories = await queryAll<{ category: string; count: number }>(
    `SELECT category, COUNT(*) as count 
     FROM foods 
     WHERE is_system = 1 
     GROUP BY category 
     ORDER BY category`
  );

  res.json(categories);
}));

export default router;
