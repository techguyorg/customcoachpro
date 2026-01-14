import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute } from '../db';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     tags: [Recipes]
 *     summary: Get all recipes
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of recipes }
 */
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, search, limit = 100, is_system } = req.query;

  // Build visibility logic:
  // - Super admins see all recipes (or filtered by is_system if specified)
  // - Regular users see: published system recipes + their own recipes
  // - Anonymous users see: published system recipes only
  let whereClause = 'WHERE (';
  const params: Record<string, unknown> = {};
  
  const isSuperAdmin = req.user?.roles?.includes('super_admin');
  
  if (isSuperAdmin) {
    // Super admin sees everything, but can filter by is_system
    if (is_system === 'true') {
      whereClause += 'is_system = 1';
    } else if (is_system === 'false') {
      whereClause += 'is_system = 0';
    } else {
      whereClause += '1=1';
    }
  } else if (req.user) {
    // Logged-in users see published system recipes + their own
    whereClause += '(is_system = 1 AND ISNULL(is_published, 1) = 1) OR created_by = @userId';
    params.userId = req.user.id;
  } else {
    // Anonymous users see only published system recipes
    whereClause += 'is_system = 1 AND ISNULL(is_published, 1) = 1';
  }
  whereClause += ')';

  if (category) {
    whereClause += ' AND category = @category';
    params.category = category;
  }
  if (search) {
    whereClause += ' AND (name LIKE @search OR description LIKE @search)';
    params.search = `%${search}%`;
  }

  const recipes = await queryAll<Record<string, unknown>>(
    `SELECT TOP ${parseInt(limit as string)}
            id, name, description, category, prep_time_minutes, cook_time_minutes,
            servings, total_weight_g, calories_per_serving, protein_per_serving,
            carbs_per_serving, fat_per_serving, fiber_per_serving, image_url,
            is_system, is_published, created_by, created_at
     FROM recipes ${whereClause}
     ORDER BY name`,
    params
  );

  res.json(recipes);
}));

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     tags: [Recipes]
 *     summary: Get recipe by ID with ingredients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Recipe with ingredients }
 *       404: { description: Recipe not found }
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const recipe = await queryOne<Record<string, unknown>>(
    `SELECT id, name, description, category, instructions, prep_time_minutes, cook_time_minutes,
            servings, total_weight_g, calories_per_serving, protein_per_serving,
            carbs_per_serving, fat_per_serving, fiber_per_serving, image_url,
            is_system, created_by, created_at
     FROM recipes WHERE id = @id`,
    { id }
  );

  if (!recipe) {
    throw NotFoundError('Recipe');
  }

  // Get ingredients
  const ingredients = await queryAll<Record<string, unknown>>(
    `SELECT ri.id, ri.quantity, ri.unit, ri.notes, ri.order_index,
            ri.food_id, f.name as food_name, f.calories_per_100g, f.protein_per_100g,
            f.carbs_per_100g, f.fat_per_100g
     FROM recipe_ingredients ri
     JOIN foods f ON ri.food_id = f.id
     WHERE ri.recipe_id = @id
     ORDER BY ri.order_index`,
    { id }
  );

  res.json({ ...recipe, ingredients });
}));

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     tags: [Recipes]
 *     summary: Create a new recipe
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       201: { description: Recipe created }
 */
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    description,
    category,
    instructions,
    prep_time_minutes,
    cook_time_minutes,
    servings = 1,
    total_weight_g,
    calories_per_serving,
    protein_per_serving,
    carbs_per_serving,
    fat_per_serving,
    fiber_per_serving,
    image_url,
    ingredients,
    is_system, // Allow super admin to set this
    is_published = true, // Default to published
  } = req.body;

  if (!name) {
    throw BadRequestError('Name is required');
  }

  const id = uuidv4();
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  // Only super admins can create system recipes
  const systemFlag = isSuperAdmin && is_system ? 1 : 0;
  // is_published only applies to system recipes
  const publishedFlag = systemFlag ? (is_published ? 1 : 0) : 1;

  await execute(
    `INSERT INTO recipes (id, name, description, category, instructions, prep_time_minutes, cook_time_minutes,
                         servings, total_weight_g, calories_per_serving, protein_per_serving,
                         carbs_per_serving, fat_per_serving, fiber_per_serving, image_url,
                         is_system, is_published, created_by)
     VALUES (@id, @name, @description, @category, @instructions, @prepTimeMinutes, @cookTimeMinutes,
             @servings, @totalWeightG, @caloriesPerServing, @proteinPerServing,
             @carbsPerServing, @fatPerServing, @fiberPerServing, @imageUrl,
             @isSystem, @isPublished, @createdBy)`,
    {
      id,
      name,
      description,
      category,
      instructions,
      prepTimeMinutes: prep_time_minutes,
      cookTimeMinutes: cook_time_minutes,
      servings,
      totalWeightG: total_weight_g,
      caloriesPerServing: calories_per_serving,
      proteinPerServing: protein_per_serving,
      carbsPerServing: carbs_per_serving,
      fatPerServing: fat_per_serving,
      fiberPerServing: fiber_per_serving,
      imageUrl: image_url,
      isSystem: systemFlag,
      isPublished: publishedFlag,
      createdBy: req.user!.id,
    }
  );

  // Insert ingredients
  if (ingredients && Array.isArray(ingredients)) {
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      await execute(
        `INSERT INTO recipe_ingredients (id, recipe_id, food_id, quantity, unit, notes, order_index)
         VALUES (@id, @recipeId, @foodId, @quantity, @unit, @notes, @orderIndex)`,
        {
          id: uuidv4(),
          recipeId: id,
          foodId: ing.food_id,
          quantity: ing.quantity,
          unit: ing.unit || 'g',
          notes: ing.notes,
          orderIndex: i,
        }
      );
    }
  }

  const recipe = await queryOne('SELECT * FROM recipes WHERE id = @id', { id });
  res.status(201).json(recipe);
}));

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     tags: [Recipes]
 *     summary: Update a recipe
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Recipe updated }
 */
router.put('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM recipes WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Recipe');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');

  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot modify system recipes');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only modify your own recipes');
  }

  const {
    name,
    description,
    category,
    instructions,
    prep_time_minutes,
    cook_time_minutes,
    servings,
    total_weight_g,
    calories_per_serving,
    protein_per_serving,
    carbs_per_serving,
    fat_per_serving,
    fiber_per_serving,
    image_url,
    ingredients,
  } = req.body;

  await execute(
    `UPDATE recipes SET
       name = COALESCE(@name, name),
       description = COALESCE(@description, description),
       category = COALESCE(@category, category),
       instructions = COALESCE(@instructions, instructions),
       prep_time_minutes = COALESCE(@prepTimeMinutes, prep_time_minutes),
       cook_time_minutes = COALESCE(@cookTimeMinutes, cook_time_minutes),
       servings = COALESCE(@servings, servings),
       total_weight_g = COALESCE(@totalWeightG, total_weight_g),
       calories_per_serving = COALESCE(@caloriesPerServing, calories_per_serving),
       protein_per_serving = COALESCE(@proteinPerServing, protein_per_serving),
       carbs_per_serving = COALESCE(@carbsPerServing, carbs_per_serving),
       fat_per_serving = COALESCE(@fatPerServing, fat_per_serving),
       fiber_per_serving = COALESCE(@fiberPerServing, fiber_per_serving),
       image_url = COALESCE(@imageUrl, image_url),
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      name,
      description,
      category,
      instructions,
      prepTimeMinutes: prep_time_minutes,
      cookTimeMinutes: cook_time_minutes,
      servings,
      totalWeightG: total_weight_g,
      caloriesPerServing: calories_per_serving,
      proteinPerServing: protein_per_serving,
      carbsPerServing: carbs_per_serving,
      fatPerServing: fat_per_serving,
      fiberPerServing: fiber_per_serving,
      imageUrl: image_url,
    }
  );

  // Update ingredients if provided
  if (ingredients && Array.isArray(ingredients)) {
    // Delete existing ingredients
    await execute('DELETE FROM recipe_ingredients WHERE recipe_id = @id', { id });

    // Insert new ingredients
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      await execute(
        `INSERT INTO recipe_ingredients (id, recipe_id, food_id, quantity, unit, notes, order_index)
         VALUES (@id, @recipeId, @foodId, @quantity, @unit, @notes, @orderIndex)`,
        {
          id: uuidv4(),
          recipeId: id,
          foodId: ing.food_id,
          quantity: ing.quantity,
          unit: ing.unit || 'g',
          notes: ing.notes,
          orderIndex: i,
        }
      );
    }
  }

  const recipe = await queryOne('SELECT * FROM recipes WHERE id = @id', { id });
  res.json(recipe);
}));

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     tags: [Recipes]
 *     summary: Delete a recipe
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Recipe deleted }
 */
router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM recipes WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Recipe');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');

  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot delete system recipes');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only delete your own recipes');
  }

  await execute('DELETE FROM recipe_ingredients WHERE recipe_id = @id', { id });
  await execute('DELETE FROM recipes WHERE id = @id', { id });

  res.json({ message: 'Recipe deleted' });
}));

// Toggle published status for system recipes (super admin only)
router.patch('/:id/publish', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_published } = req.body;

  const isSuperAdmin = req.user!.roles.includes('super_admin');
  if (!isSuperAdmin) {
    throw ForbiddenError('Only super admins can change publish status');
  }

  const existing = await queryOne<{ is_system: boolean }>(
    'SELECT is_system FROM recipes WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Recipe');
  }

  if (!existing.is_system) {
    throw BadRequestError('Only system recipes can have publish status changed');
  }

  await execute(
    'UPDATE recipes SET is_published = @isPublished, updated_at = GETUTCDATE() WHERE id = @id',
    { id, isPublished: is_published ? 1 : 0 }
  );

  const recipe = await queryOne('SELECT * FROM recipes WHERE id = @id', { id });
  res.json(recipe);
}));

export default router;
