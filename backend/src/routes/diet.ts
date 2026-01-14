import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, transformRow, transformRows } from '../db';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/diet/plans:
 *   get:
 *     tags: [Diet]
 *     summary: Get all diet plans
 */
router.get('/plans', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { goal, dietary_type, search, is_system } = req.query;

  // Build visibility logic:
  // - Super admins see all plans (or filtered by is_system if specified)
  // - Regular users see: published system plans + their own plans
  // - Anonymous users see: published system plans only
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
    // Logged-in users see published system plans + their own
    whereClause += '(is_system = 1 AND ISNULL(is_published, 1) = 1) OR created_by = @userId';
    params.userId = req.user.id;
  } else {
    // Anonymous users see only published system plans
    whereClause += 'is_system = 1 AND ISNULL(is_published, 1) = 1';
  }
  whereClause += ')';

  if (goal) {
    whereClause += ' AND goal = @goal';
    params.goal = goal;
  }
  if (dietary_type) {
    whereClause += ' AND dietary_type = @dietaryType';
    params.dietaryType = dietary_type;
  }
  if (search) {
    whereClause += ' AND (name LIKE @search OR description LIKE @search)';
    params.search = `%${search}%`;
  }

  const plans = await queryAll<Record<string, unknown>>(
    `SELECT id, name, description, calories_target, protein_grams, carbs_grams, fat_grams,
            meals_per_day, dietary_type, goal, is_system, is_published, is_active, created_by, created_at
     FROM diet_plans ${whereClause}
     ORDER BY name`,
    params
  );

  res.json(plans);
}));

/**
 * @swagger
 * /api/diet/plans/{id}:
 *   get:
 *     tags: [Diet]
 *     summary: Get diet plan with meals
 */
router.get('/plans/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const plan = await queryOne<Record<string, unknown>>(
    `SELECT id, name, description, calories_target, protein_grams, carbs_grams, fat_grams,
            meals_per_day, dietary_type, goal, notes, is_system, is_active, created_by, created_at
     FROM diet_plans WHERE id = @id`,
    { id }
  );

  if (!plan) {
    throw NotFoundError('Diet plan');
  }

  // Get meals
  const meals = await queryAll<Record<string, unknown>>(
    `SELECT id, meal_number, meal_name, time_suggestion, calories, protein_grams, carbs_grams, fat_grams, notes, food_suggestions
     FROM diet_plan_meals WHERE plan_id = @id
     ORDER BY meal_number`,
    { id }
  );

  // Parse food_suggestions for each meal - ensure arrays
  const transformedMeals = transformRows(meals, [], ['food_suggestions']);

  // Get food items for each meal
  for (const meal of transformedMeals) {
    const items = await queryAll<Record<string, unknown>>(
      `SELECT mfi.id, mfi.quantity, mfi.unit, mfi.notes, mfi.order_index,
              mfi.calculated_calories, mfi.calculated_protein, mfi.calculated_carbs, mfi.calculated_fat,
              mfi.food_id, f.name as food_name, f.calories_per_100g, f.protein_per_100g,
              mfi.recipe_id, r.name as recipe_name, r.calories_per_serving
       FROM meal_food_items mfi
       LEFT JOIN foods f ON mfi.food_id = f.id
       LEFT JOIN recipes r ON mfi.recipe_id = r.id
       WHERE mfi.meal_id = @mealId
       ORDER BY mfi.order_index`,
      { mealId: meal.id }
    );
    (meal as Record<string, unknown>).items = items;
  }

  res.json({ ...plan, meals: transformedMeals });
}));

/**
 * @swagger
 * /api/diet/plans:
 *   post:
 *     tags: [Diet]
 *     summary: Create a new diet plan
 */
router.post('/plans', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    description,
    calories_target,
    protein_grams,
    carbs_grams,
    fat_grams,
    meals_per_day = 3,
    dietary_type,
    goal,
    notes,
    meals,
    is_system, // Allow super admin to set this
    is_published = true, // Default to published
  } = req.body;

  if (!name) {
    throw BadRequestError('Name is required');
  }

  const planId = uuidv4();
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  // Only super admins can create system diet plans
  const systemFlag = isSuperAdmin && is_system ? 1 : 0;
  // is_published only applies to system plans
  const publishedFlag = systemFlag ? (is_published ? 1 : 0) : 1;

  await execute(
    `INSERT INTO diet_plans (id, name, description, calories_target, protein_grams, carbs_grams, fat_grams, meals_per_day, dietary_type, goal, notes, is_system, is_published, is_active, created_by)
     VALUES (@id, @name, @description, @caloriesTarget, @proteinGrams, @carbsGrams, @fatGrams, @mealsPerDay, @dietaryType, @goal, @notes, @isSystem, @isPublished, 1, @createdBy)`,
    {
      id: planId,
      name,
      description,
      caloriesTarget: calories_target,
      proteinGrams: protein_grams,
      carbsGrams: carbs_grams,
      fatGrams: fat_grams,
      mealsPerDay: meals_per_day,
      dietaryType: dietary_type,
      goal,
      notes,
      isSystem: systemFlag,
      isPublished: publishedFlag,
      createdBy: req.user!.id,
    }
  );

  // Insert meals
  if (meals && Array.isArray(meals)) {
    for (const meal of meals) {
      const mealId = uuidv4();
      await execute(
        `INSERT INTO diet_plan_meals (id, plan_id, meal_number, meal_name, time_suggestion, calories, protein_grams, carbs_grams, fat_grams, notes, food_suggestions)
         VALUES (@id, @planId, @mealNumber, @mealName, @timeSuggestion, @calories, @proteinGrams, @carbsGrams, @fatGrams, @notes, @foodSuggestions)`,
        {
          id: mealId,
          planId,
          mealNumber: meal.meal_number,
          mealName: meal.meal_name,
          timeSuggestion: meal.time_suggestion,
          calories: meal.calories,
          proteinGrams: meal.protein_grams,
          carbsGrams: meal.carbs_grams,
          fatGrams: meal.fat_grams,
          notes: meal.notes,
          foodSuggestions: JSON.stringify(meal.food_suggestions || []),
        }
      );

      // Insert food items
      if (meal.items && Array.isArray(meal.items)) {
        for (let i = 0; i < meal.items.length; i++) {
          const item = meal.items[i];
          await execute(
            `INSERT INTO meal_food_items (id, meal_id, food_id, recipe_id, quantity, unit, order_index, notes, calculated_calories, calculated_protein, calculated_carbs, calculated_fat)
             VALUES (@id, @mealId, @foodId, @recipeId, @quantity, @unit, @orderIndex, @notes, @calcCal, @calcProtein, @calcCarbs, @calcFat)`,
            {
              id: uuidv4(),
              mealId,
              foodId: item.food_id,
              recipeId: item.recipe_id,
              quantity: item.quantity,
              unit: item.unit || 'g',
              orderIndex: i,
              notes: item.notes,
              calcCal: item.calculated_calories,
              calcProtein: item.calculated_protein,
              calcCarbs: item.calculated_carbs,
              calcFat: item.calculated_fat,
            }
          );
        }
      }
    }
  }

  const plan = await queryOne('SELECT * FROM diet_plans WHERE id = @id', { id: planId });
  res.status(201).json(plan);
}));

/**
 * @swagger
 * /api/diet/plans/{id}:
 *   put:
 *     tags: [Diet]
 *     summary: Update a diet plan
 */
router.put('/plans/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM diet_plans WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Diet plan');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');
  
  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot modify system diet plans');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only modify your own diet plans');
  }

  const {
    name,
    description,
    calories_target,
    protein_grams,
    carbs_grams,
    fat_grams,
    meals_per_day,
    dietary_type,
    goal,
    notes,
    meals,
  } = req.body;

  await execute(
    `UPDATE diet_plans SET 
       name = COALESCE(@name, name),
       description = COALESCE(@description, description),
       calories_target = COALESCE(@caloriesTarget, calories_target),
       protein_grams = COALESCE(@proteinGrams, protein_grams),
       carbs_grams = COALESCE(@carbsGrams, carbs_grams),
       fat_grams = COALESCE(@fatGrams, fat_grams),
       meals_per_day = COALESCE(@mealsPerDay, meals_per_day),
       dietary_type = COALESCE(@dietaryType, dietary_type),
       goal = COALESCE(@goal, goal),
       notes = COALESCE(@notes, notes),
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      name,
      description,
      caloriesTarget: calories_target,
      proteinGrams: protein_grams,
      carbsGrams: carbs_grams,
      fatGrams: fat_grams,
      mealsPerDay: meals_per_day,
      dietaryType: dietary_type,
      goal,
      notes,
    }
  );

  // If meals are provided, update them
  if (meals && Array.isArray(meals)) {
    // Delete existing meals and their items
    const existingMeals = await queryAll<{ id: string }>('SELECT id FROM diet_plan_meals WHERE plan_id = @id', { id });
    for (const meal of existingMeals) {
      await execute('DELETE FROM meal_food_items WHERE meal_id = @mealId', { mealId: meal.id });
    }
    await execute('DELETE FROM diet_plan_meals WHERE plan_id = @id', { id });

    // Insert new meals
    for (const meal of meals) {
      const mealId = uuidv4();
      await execute(
        `INSERT INTO diet_plan_meals (id, plan_id, meal_number, meal_name, time_suggestion, calories, protein_grams, carbs_grams, fat_grams, notes, food_suggestions)
         VALUES (@id, @planId, @mealNumber, @mealName, @timeSuggestion, @calories, @proteinGrams, @carbsGrams, @fatGrams, @notes, @foodSuggestions)`,
        {
          id: mealId,
          planId: id,
          mealNumber: meal.meal_number,
          mealName: meal.meal_name,
          timeSuggestion: meal.time_suggestion,
          calories: meal.calories,
          proteinGrams: meal.protein_grams,
          carbsGrams: meal.carbs_grams,
          fatGrams: meal.fat_grams,
          notes: meal.notes,
          foodSuggestions: JSON.stringify(meal.food_suggestions || []),
        }
      );

      // Insert food items
      if (meal.items && Array.isArray(meal.items)) {
        for (let i = 0; i < meal.items.length; i++) {
          const item = meal.items[i];
          await execute(
            `INSERT INTO meal_food_items (id, meal_id, food_id, recipe_id, quantity, unit, order_index, notes, calculated_calories, calculated_protein, calculated_carbs, calculated_fat)
             VALUES (@id, @mealId, @foodId, @recipeId, @quantity, @unit, @orderIndex, @notes, @calcCal, @calcProtein, @calcCarbs, @calcFat)`,
            {
              id: uuidv4(),
              mealId,
              foodId: item.food_id,
              recipeId: item.recipe_id,
              quantity: item.quantity,
              unit: item.unit || 'g',
              orderIndex: i,
              notes: item.notes,
              calcCal: item.calculated_calories,
              calcProtein: item.calculated_protein,
              calcCarbs: item.calculated_carbs,
              calcFat: item.calculated_fat,
            }
          );
        }
      }
    }
  }

  const plan = await queryOne('SELECT * FROM diet_plans WHERE id = @id', { id });
  res.json(plan);
}));

/**
 * @swagger
 * /api/diet/plans/{id}:
 *   delete:
 *     tags: [Diet]
 *     summary: Delete a diet plan
 */
router.delete('/plans/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM diet_plans WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Diet plan');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');

  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot delete system diet plans');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only delete your own diet plans');
  }

  // Delete in order: food items -> meals -> plan
  await execute(
    `DELETE FROM meal_food_items 
     WHERE meal_id IN (SELECT id FROM diet_plan_meals WHERE plan_id = @id)`,
    { id }
  );
  await execute('DELETE FROM diet_plan_meals WHERE plan_id = @id', { id });
  await execute('DELETE FROM diet_plans WHERE id = @id', { id });

  res.json({ message: 'Diet plan deleted' });
}));

// Toggle published status for system diet plans (super admin only)
router.patch('/plans/:id/publish', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_published } = req.body;

  const isSuperAdmin = req.user!.roles.includes('super_admin');
  if (!isSuperAdmin) {
    throw ForbiddenError('Only super admins can change publish status');
  }

  const existing = await queryOne<{ is_system: boolean }>(
    'SELECT is_system FROM diet_plans WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Diet plan');
  }

  if (!existing.is_system) {
    throw BadRequestError('Only system diet plans can have publish status changed');
  }

  await execute(
    'UPDATE diet_plans SET is_published = @isPublished, updated_at = GETUTCDATE() WHERE id = @id',
    { id, isPublished: is_published ? 1 : 0 }
  );

  const plan = await queryOne('SELECT * FROM diet_plans WHERE id = @id', { id });
  res.json(plan);
}));

/**
 * @swagger
 * /api/diet/assignments:
 *   get:
 *     tags: [Diet]
 *     summary: Get diet plan assignments for current user
 */
router.get('/assignments', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const assignments = await queryAll<Record<string, unknown>>(
    `SELECT pa.id, pa.start_date, pa.end_date, pa.status, pa.coach_notes, pa.client_notes,
            pa.diet_plan_id, dp.name as plan_name, dp.calories_target,
            pa.coach_id, p.full_name as coach_name
     FROM plan_assignments pa
     JOIN diet_plans dp ON pa.diet_plan_id = dp.id
     LEFT JOIN profiles p ON pa.coach_id = p.user_id
     WHERE pa.client_id = @userId AND pa.plan_type = 'diet'
     ORDER BY pa.start_date DESC`,
    { userId: req.user!.id }
  );

  res.json(assignments);
}));

// Get meal food items by meal IDs (for bulk fetching)
router.post('/meal-food-items', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { meal_ids } = req.body;

  if (!meal_ids || !Array.isArray(meal_ids) || meal_ids.length === 0) {
    res.json([]);
    return;
  }

  // Build IN clause
  const placeholders = meal_ids.map((_, i) => `@mealId${i}`).join(', ');
  const params: Record<string, unknown> = {};
  meal_ids.forEach((id, i) => {
    params[`mealId${i}`] = id;
  });

  const items = await queryAll(
    `SELECT mfi.*, f.name as food_name, f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
            r.name as recipe_name, r.calories_per_serving
     FROM meal_food_items mfi
     LEFT JOIN foods f ON mfi.food_id = f.id
     LEFT JOIN recipes r ON mfi.recipe_id = r.id
     WHERE mfi.meal_id IN (${placeholders})
     ORDER BY mfi.meal_id, mfi.order_index`,
    params
  );

  res.json(items);
}));

// Add food item to meal
router.post('/meals/:mealId/items', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { mealId } = req.params;
  const { food_id, recipe_id, quantity, unit = 'g', notes } = req.body;

  if (!food_id && !recipe_id) {
    throw BadRequestError('Either food_id or recipe_id is required');
  }

  // Verify meal exists and user has access
  const meal = await queryOne<{ plan_id: string }>(
    'SELECT plan_id FROM diet_plan_meals WHERE id = @mealId',
    { mealId }
  );

  if (!meal) {
    throw NotFoundError('Meal');
  }

  const plan = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM diet_plans WHERE id = @planId',
    { planId: meal.plan_id }
  );

  if (!plan) {
    throw NotFoundError('Diet plan');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');
  if (!plan.is_system && plan.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You cannot edit this diet plan');
  }

  // Calculate nutrition
  let calcCal = 0, calcProtein = 0, calcCarbs = 0, calcFat = 0;
  
  if (food_id) {
    const food = await queryOne<{
      calories_per_100g: number;
      protein_per_100g: number;
      carbs_per_100g: number;
      fat_per_100g: number;
    }>('SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM foods WHERE id = @id', { id: food_id });
    
    if (food) {
      const factor = (quantity || 100) / 100;
      calcCal = Math.round(food.calories_per_100g * factor);
      calcProtein = Math.round(food.protein_per_100g * factor * 10) / 10;
      calcCarbs = Math.round(food.carbs_per_100g * factor * 10) / 10;
      calcFat = Math.round(food.fat_per_100g * factor * 10) / 10;
    }
  } else if (recipe_id) {
    const recipe = await queryOne<{
      calories_per_serving: number;
      protein_per_serving: number;
      carbs_per_serving: number;
      fat_per_serving: number;
    }>('SELECT calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving FROM recipes WHERE id = @id', { id: recipe_id });
    
    if (recipe) {
      const servings = quantity || 1;
      calcCal = Math.round((recipe.calories_per_serving || 0) * servings);
      calcProtein = Math.round((recipe.protein_per_serving || 0) * servings * 10) / 10;
      calcCarbs = Math.round((recipe.carbs_per_serving || 0) * servings * 10) / 10;
      calcFat = Math.round((recipe.fat_per_serving || 0) * servings * 10) / 10;
    }
  }

  // Get next order index
  const maxOrder = await queryOne<{ max_order: number }>(
    'SELECT MAX(order_index) as max_order FROM meal_food_items WHERE meal_id = @mealId',
    { mealId }
  );

  const id = uuidv4();
  await execute(
    `INSERT INTO meal_food_items (id, meal_id, food_id, recipe_id, quantity, unit, order_index, notes, calculated_calories, calculated_protein, calculated_carbs, calculated_fat)
     VALUES (@id, @mealId, @foodId, @recipeId, @quantity, @unit, @orderIndex, @notes, @calcCal, @calcProtein, @calcCarbs, @calcFat)`,
    {
      id,
      mealId,
      foodId: food_id,
      recipeId: recipe_id,
      quantity: quantity || (food_id ? 100 : 1),
      unit,
      orderIndex: (maxOrder?.max_order ?? -1) + 1,
      notes,
      calcCal,
      calcProtein,
      calcCarbs,
      calcFat,
    }
  );

  const item = await queryOne(
    `SELECT mfi.*, f.name as food_name, r.name as recipe_name
     FROM meal_food_items mfi
     LEFT JOIN foods f ON mfi.food_id = f.id
     LEFT JOIN recipes r ON mfi.recipe_id = r.id
     WHERE mfi.id = @id`,
    { id }
  );

  res.status(201).json(item);
}));

// Remove food item from meal
router.delete('/meal-items/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const item = await queryOne<{ meal_id: string }>(
    'SELECT meal_id FROM meal_food_items WHERE id = @id',
    { id }
  );

  if (!item) {
    throw NotFoundError('Meal food item');
  }

  const meal = await queryOne<{ plan_id: string }>(
    'SELECT plan_id FROM diet_plan_meals WHERE id = @mealId',
    { mealId: item.meal_id }
  );

  if (!meal) {
    throw NotFoundError('Meal');
  }

  const plan = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM diet_plans WHERE id = @planId',
    { planId: meal.plan_id }
  );

  if (!plan) {
    throw NotFoundError('Diet plan');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');
  if (!plan.is_system && plan.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You cannot edit this diet plan');
  }

  await execute('DELETE FROM meal_food_items WHERE id = @id', { id });
  res.json({ message: 'Food item removed' });
}));

export default router;
