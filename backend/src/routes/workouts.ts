import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, transformRow, transformRows } from '../db';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';

const router = Router();

// ==================== Templates ====================

/**
 * @swagger
 * /api/workouts/templates:
 *   get:
 *     tags: [Workouts]
 *     summary: Get all workout templates
 */
router.get('/templates', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { difficulty, goal, search, days_per_week, is_system } = req.query;

  // Build visibility logic:
  // - Super admins see all templates (or filtered by is_system if specified)
  // - Regular users see: published system templates + their own templates
  // - Anonymous users see: published system templates only
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
    // Logged-in users see published system templates + their own
    whereClause += '(is_system = 1 AND ISNULL(is_published, 1) = 1) OR created_by = @userId';
    params.userId = req.user.id;
  } else {
    // Anonymous users see only published system templates
    whereClause += 'is_system = 1 AND ISNULL(is_published, 1) = 1';
  }
  whereClause += ')';

  if (difficulty) {
    whereClause += ' AND difficulty = @difficulty';
    params.difficulty = difficulty;
  }
  if (goal) {
    whereClause += ' AND goal = @goal';
    params.goal = goal;
  }
  if (days_per_week) {
    whereClause += ' AND days_per_week = @daysPerWeek';
    params.daysPerWeek = parseInt(days_per_week as string);
  }
  if (search) {
    whereClause += ' AND (name LIKE @search OR description LIKE @search)';
    params.search = `%${search}%`;
  }

  const templates = await queryAll<Record<string, unknown>>(
    `SELECT id, name, description, difficulty, duration_weeks, days_per_week,
            goal, template_type, is_periodized, is_system, is_published, created_by, created_at
     FROM workout_templates ${whereClause}
     ORDER BY name`,
    params
  );

  res.json(templates);
}));

/**
 * @swagger
 * /api/workouts/templates/{id}:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workout template with full structure
 */
router.get('/templates/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const template = await queryOne<Record<string, unknown>>(
    `SELECT id, name, description, difficulty, duration_weeks, days_per_week,
            goal, template_type, is_periodized, is_system, created_by, created_at
     FROM workout_templates WHERE id = @id`,
    { id }
  );

  if (!template) {
    throw NotFoundError('Workout template');
  }

  // Get weeks
  const weeks = await queryAll<Record<string, unknown>>(
    `SELECT id, week_number, name, focus, notes
     FROM workout_template_weeks WHERE template_id = @id
     ORDER BY week_number`,
    { id }
  );

  // Get days for each week
  for (const week of weeks) {
    const days = await queryAll<Record<string, unknown>>(
      `SELECT id, day_number, name, notes
       FROM workout_template_days WHERE week_id = @weekId
       ORDER BY day_number`,
      { weekId: week.id }
    );

    // Get exercises for each day
    for (const day of days) {
      const exercises = await queryAll<Record<string, unknown>>(
        `SELECT wte.id, wte.order_index, wte.sets_min, wte.sets_max, 
                wte.reps_min, wte.reps_max, wte.rest_seconds_min, wte.rest_seconds_max,
                wte.notes, wte.custom_exercise_name, wte.exercise_id,
                e.name as exercise_name, e.primary_muscle, e.equipment, e.instructions
         FROM workout_template_exercises wte
         LEFT JOIN exercises e ON wte.exercise_id = e.id
         WHERE wte.day_id = @dayId
         ORDER BY wte.order_index`,
        { dayId: day.id }
      );
      (day as Record<string, unknown>).exercises = exercises;
    }
    (week as Record<string, unknown>).days = days;
  }

  // Get days without weeks (for simple templates)
  const standaloneDays = await queryAll<Record<string, unknown>>(
    `SELECT id, day_number, name, notes
     FROM workout_template_days WHERE template_id = @id AND week_id IS NULL
     ORDER BY day_number`,
    { id }
  );

  for (const day of standaloneDays) {
    const exercises = await queryAll<Record<string, unknown>>(
      `SELECT wte.id, wte.order_index, wte.sets_min, wte.sets_max, 
              wte.reps_min, wte.reps_max, wte.rest_seconds_min, wte.rest_seconds_max,
              wte.notes, wte.custom_exercise_name, wte.exercise_id,
              e.name as exercise_name, e.primary_muscle, e.equipment, e.instructions
       FROM workout_template_exercises wte
       LEFT JOIN exercises e ON wte.exercise_id = e.id
       WHERE wte.day_id = @dayId
       ORDER BY wte.order_index`,
      { dayId: day.id }
    );
    (day as Record<string, unknown>).exercises = exercises;
  }

  res.json({
    ...template,
    weeks,
    days: standaloneDays,
  });
}));

/**
 * @swagger
 * /api/workouts/templates:
 *   post:
 *     tags: [Workouts]
 *     summary: Create a new workout template
 */
router.post('/templates', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    description,
    difficulty = 'intermediate',
    duration_weeks = 1,
    days_per_week = 3,
    goal,
    template_type,
    is_periodized = false,
    weeks,
    days,
    is_system, // Allow super admin to set this
    is_published = true, // Default to published
  } = req.body;

  if (!name) {
    throw BadRequestError('Name is required');
  }

  const templateId = uuidv4();
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  // Only super admins can create system templates
  const systemFlag = isSuperAdmin && is_system ? 1 : 0;
  // is_published only applies to system templates
  const publishedFlag = systemFlag ? (is_published ? 1 : 0) : 1;

  await execute(
    `INSERT INTO workout_templates (id, name, description, difficulty, duration_weeks, days_per_week, goal, template_type, is_periodized, is_system, is_published, created_by)
     VALUES (@id, @name, @description, @difficulty, @durationWeeks, @daysPerWeek, @goal, @templateType, @isPeriodized, @isSystem, @isPublished, @createdBy)`,
    {
      id: templateId,
      name,
      description,
      difficulty,
      durationWeeks: duration_weeks,
      daysPerWeek: days_per_week,
      goal,
      templateType: template_type,
      isPeriodized: is_periodized ? 1 : 0,
      isSystem: systemFlag,
      isPublished: publishedFlag,
      createdBy: req.user!.id,
    }
  );

  // Insert weeks if provided
  if (weeks && Array.isArray(weeks)) {
    for (const week of weeks) {
      const weekId = uuidv4();
      await execute(
        `INSERT INTO workout_template_weeks (id, template_id, week_number, name, focus, notes)
         VALUES (@id, @templateId, @weekNumber, @name, @focus, @notes)`,
        {
          id: weekId,
          templateId,
          weekNumber: week.week_number,
          name: week.name,
          focus: week.focus,
          notes: week.notes,
        }
      );

      // Insert days for this week
      if (week.days && Array.isArray(week.days)) {
        for (const day of week.days) {
          const dayId = uuidv4();
          await execute(
            `INSERT INTO workout_template_days (id, template_id, week_id, day_number, name, notes)
             VALUES (@id, @templateId, @weekId, @dayNumber, @name, @notes)`,
            {
              id: dayId,
              templateId,
              weekId,
              dayNumber: day.day_number,
              name: day.name,
              notes: day.notes,
            }
          );

          // Insert exercises for this day
          if (day.exercises && Array.isArray(day.exercises)) {
            for (let i = 0; i < day.exercises.length; i++) {
              const ex = day.exercises[i];
              await execute(
                `INSERT INTO workout_template_exercises (id, day_id, exercise_id, custom_exercise_name, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
                 VALUES (@id, @dayId, @exerciseId, @customName, @orderIndex, @setsMin, @setsMax, @repsMin, @repsMax, @restMin, @restMax, @notes)`,
                {
                  id: uuidv4(),
                  dayId,
                  exerciseId: ex.exercise_id,
                  customName: ex.custom_exercise_name,
                  orderIndex: i,
                  setsMin: ex.sets_min || 3,
                  setsMax: ex.sets_max,
                  repsMin: ex.reps_min || 8,
                  repsMax: ex.reps_max,
                  restMin: ex.rest_seconds_min || 60,
                  restMax: ex.rest_seconds_max,
                  notes: ex.notes,
                }
              );
            }
          }
        }
      }
    }
  }

  // Insert standalone days (for simple templates)
  if (days && Array.isArray(days)) {
    for (const day of days) {
      const dayId = uuidv4();
      await execute(
        `INSERT INTO workout_template_days (id, template_id, day_number, name, notes)
         VALUES (@id, @templateId, @dayNumber, @name, @notes)`,
        {
          id: dayId,
          templateId,
          dayNumber: day.day_number,
          name: day.name,
          notes: day.notes,
        }
      );

      if (day.exercises && Array.isArray(day.exercises)) {
        for (let i = 0; i < day.exercises.length; i++) {
          const ex = day.exercises[i];
          await execute(
            `INSERT INTO workout_template_exercises (id, day_id, exercise_id, custom_exercise_name, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
             VALUES (@id, @dayId, @exerciseId, @customName, @orderIndex, @setsMin, @setsMax, @repsMin, @repsMax, @restMin, @restMax, @notes)`,
            {
              id: uuidv4(),
              dayId,
              exerciseId: ex.exercise_id,
              customName: ex.custom_exercise_name,
              orderIndex: i,
              setsMin: ex.sets_min || 3,
              setsMax: ex.sets_max,
              repsMin: ex.reps_min || 8,
              repsMax: ex.reps_max,
              restMin: ex.rest_seconds_min || 60,
              restMax: ex.rest_seconds_max,
              notes: ex.notes,
            }
          );
        }
      }
    }
  }

  const template = await queryOne('SELECT * FROM workout_templates WHERE id = @id', { id: templateId });
  res.status(201).json(template);
}));

/**
 * @swagger
 * /api/workouts/templates/{id}:
 *   put:
 *     tags: [Workouts]
 *     summary: Update a workout template
 */
router.put('/templates/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM workout_templates WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Workout template');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');
  
  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot modify system templates');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only modify your own templates');
  }

  const {
    name,
    description,
    difficulty,
    duration_weeks,
    days_per_week,
    goal,
    template_type,
    is_periodized,
  } = req.body;

  await execute(
    `UPDATE workout_templates SET 
       name = COALESCE(@name, name),
       description = COALESCE(@description, description),
       difficulty = COALESCE(@difficulty, difficulty),
       duration_weeks = COALESCE(@durationWeeks, duration_weeks),
       days_per_week = COALESCE(@daysPerWeek, days_per_week),
       goal = COALESCE(@goal, goal),
       template_type = COALESCE(@templateType, template_type),
       is_periodized = COALESCE(@isPeriodized, is_periodized),
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      name,
      description,
      difficulty,
      durationWeeks: duration_weeks,
      daysPerWeek: days_per_week,
      goal,
      templateType: template_type,
      isPeriodized: is_periodized !== undefined ? (is_periodized ? 1 : 0) : null,
    }
  );

  const template = await queryOne('SELECT * FROM workout_templates WHERE id = @id', { id });
  res.json(template);
}));

/**
 * @swagger
 * /api/workouts/templates/{id}:
 *   delete:
 *     tags: [Workouts]
 *     summary: Delete a workout template
 */
router.delete('/templates/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM workout_templates WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Workout template');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');

  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot delete system templates');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only delete your own templates');
  }

  // Delete in order: exercises -> days -> weeks -> template
  await execute(
    `DELETE FROM workout_template_exercises 
     WHERE day_id IN (SELECT id FROM workout_template_days WHERE template_id = @id)`,
    { id }
  );
  await execute('DELETE FROM workout_template_days WHERE template_id = @id', { id });
  await execute('DELETE FROM workout_template_weeks WHERE template_id = @id', { id });
  await execute('DELETE FROM workout_templates WHERE id = @id', { id });

  res.json({ message: 'Template deleted' });
}));

// Toggle published status for system templates (super admin only)
router.patch('/templates/:id/publish', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_published } = req.body;

  const isSuperAdmin = req.user!.roles.includes('super_admin');
  if (!isSuperAdmin) {
    throw ForbiddenError('Only super admins can change publish status');
  }

  const existing = await queryOne<{ is_system: boolean }>(
    'SELECT is_system FROM workout_templates WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Workout template');
  }

  if (!existing.is_system) {
    throw BadRequestError('Only system templates can have publish status changed');
  }

  await execute(
    'UPDATE workout_templates SET is_published = @isPublished, updated_at = GETUTCDATE() WHERE id = @id',
    { id, isPublished: is_published ? 1 : 0 }
  );

  const template = await queryOne('SELECT * FROM workout_templates WHERE id = @id', { id });
  res.json(template);
}));

// ==================== Template Structure Editing ====================

// Get template structure for editor
router.get('/templates/:id/structure', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const template = await queryOne<Record<string, unknown>>(
    'SELECT * FROM workout_templates WHERE id = @id',
    { id }
  );

  if (!template) {
    throw NotFoundError('Workout template');
  }

  // Check access
  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You do not have access to edit this template');
  }

  // Get full structure (same as GET /templates/:id but with more details)
  const weeks = await queryAll(
    `SELECT * FROM workout_template_weeks WHERE template_id = @id ORDER BY week_number`,
    { id }
  );

  for (const week of weeks as Record<string, unknown>[]) {
    const days = await queryAll(
      `SELECT * FROM workout_template_days WHERE week_id = @weekId ORDER BY day_number`,
      { weekId: week.id }
    );

    for (const day of days as Record<string, unknown>[]) {
      const exercises = await queryAll(
        `SELECT wte.*, e.name as exercise_name, e.primary_muscle, e.equipment, e.difficulty
         FROM workout_template_exercises wte
         LEFT JOIN exercises e ON wte.exercise_id = e.id
         WHERE wte.day_id = @dayId
         ORDER BY wte.order_index`,
        { dayId: day.id }
      );
      day.exercises = exercises;
    }
    week.days = days;
  }

  const standaloneDays = await queryAll(
    `SELECT * FROM workout_template_days WHERE template_id = @id AND week_id IS NULL ORDER BY day_number`,
    { id }
  );

  for (const day of standaloneDays as Record<string, unknown>[]) {
    const exercises = await queryAll(
      `SELECT wte.*, e.name as exercise_name, e.primary_muscle, e.equipment, e.difficulty
       FROM workout_template_exercises wte
       LEFT JOIN exercises e ON wte.exercise_id = e.id
       WHERE wte.day_id = @dayId
       ORDER BY wte.order_index`,
      { dayId: day.id }
    );
    day.exercises = exercises;
  }

  res.json({ ...template, weeks, days: standaloneDays });
}));

// Update template day
router.put('/template-days/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, notes, day_number } = req.body;

  const day = await queryOne<{ template_id: string }>(
    'SELECT template_id FROM workout_template_days WHERE id = @id',
    { id }
  );

  if (!day) {
    throw NotFoundError('Template day');
  }

  // Check template ownership
  const template = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM workout_templates WHERE id = @templateId',
    { templateId: day.template_id }
  );

  if (!template) {
    throw NotFoundError('Template');
  }

  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You cannot edit this template');
  }

  await execute(
    `UPDATE workout_template_days SET
       name = COALESCE(@name, name),
       notes = COALESCE(@notes, notes),
       day_number = COALESCE(@dayNumber, day_number)
     WHERE id = @id`,
    { id, name, notes, dayNumber: day_number }
  );

  const updated = await queryOne('SELECT * FROM workout_template_days WHERE id = @id', { id });
  res.json(updated);
}));

// Add exercise to template day
router.post('/template-exercises', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    day_id,
    exercise_id,
    custom_exercise_name,
    sets_min = 3,
    sets_max,
    reps_min = 8,
    reps_max,
    rest_seconds_min = 60,
    rest_seconds_max,
    notes,
    order_index,
  } = req.body;

  if (!day_id) {
    throw BadRequestError('day_id is required');
  }

  if (!exercise_id && !custom_exercise_name) {
    throw BadRequestError('Either exercise_id or custom_exercise_name is required');
  }

  // Get day and verify ownership
  const day = await queryOne<{ template_id: string }>(
    'SELECT template_id FROM workout_template_days WHERE id = @dayId',
    { dayId: day_id }
  );

  if (!day) {
    throw NotFoundError('Template day');
  }

  const template = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM workout_templates WHERE id = @templateId',
    { templateId: day.template_id }
  );

  if (!template) {
    throw NotFoundError('Template');
  }

  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You cannot edit this template');
  }

  // Determine order index
  let finalOrderIndex = order_index;
  if (finalOrderIndex === undefined) {
    const maxOrder = await queryOne<{ max_order: number }>(
      'SELECT MAX(order_index) as max_order FROM workout_template_exercises WHERE day_id = @dayId',
      { dayId: day_id }
    );
    finalOrderIndex = (maxOrder?.max_order ?? -1) + 1;
  }

  // If custom exercise name is provided, also add it to the exercises library
  let finalExerciseId = exercise_id;
  if (!exercise_id && custom_exercise_name) {
    // Check if an exercise with this name already exists (case-insensitive)
    const existingExercise = await queryOne<{ id: string }>(
      `SELECT id FROM exercises WHERE LOWER(name) = LOWER(@name)`,
      { name: custom_exercise_name }
    );
    
    if (existingExercise) {
      // Use existing exercise ID instead of custom name
      finalExerciseId = existingExercise.id;
    } else {
      // Create new exercise in the library
      const newExerciseId = uuidv4();
      await execute(
        `INSERT INTO exercises (id, name, description, primary_muscle, equipment, difficulty, exercise_type, is_custom, created_by, created_at)
         VALUES (@id, @name, @description, 'other', 'other', 'intermediate', 'compound', 1, @createdBy, GETUTCDATE())`,
        {
          id: newExerciseId,
          name: custom_exercise_name,
          description: `Custom exercise: ${custom_exercise_name}`,
          createdBy: req.user!.id,
        }
      );
      finalExerciseId = newExerciseId;
    }
  }

  const id = uuidv4();
  await execute(
    `INSERT INTO workout_template_exercises (id, day_id, exercise_id, custom_exercise_name, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes)
     VALUES (@id, @dayId, @exerciseId, @customName, @orderIndex, @setsMin, @setsMax, @repsMin, @repsMax, @restMin, @restMax, @notes)`,
    {
      id,
      dayId: day_id,
      exerciseId: finalExerciseId,
      customName: finalExerciseId ? null : custom_exercise_name, // Only store custom name if no exercise_id
      orderIndex: finalOrderIndex,
      setsMin: sets_min,
      setsMax: sets_max,
      repsMin: reps_min,
      repsMax: reps_max,
      restMin: rest_seconds_min,
      restMax: rest_seconds_max,
      notes,
    }
  );

  const exercise = await queryOne(
    `SELECT wte.*, e.name as exercise_name, e.primary_muscle, e.equipment
     FROM workout_template_exercises wte
     LEFT JOIN exercises e ON wte.exercise_id = e.id
     WHERE wte.id = @id`,
    { id }
  );

  res.status(201).json(exercise);
}));

// Reorder exercises within a day
router.put('/template-days/:dayId/reorder', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { dayId } = req.params;
  const { exerciseIds } = req.body; // Array of exercise IDs in new order

  if (!Array.isArray(exerciseIds)) {
    throw BadRequestError('exerciseIds must be an array');
  }

  // Get day and verify ownership
  const day = await queryOne<{ template_id: string }>(
    'SELECT template_id FROM workout_template_days WHERE id = @dayId',
    { dayId }
  );

  if (!day) {
    throw NotFoundError('Template day');
  }

  const template = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM workout_templates WHERE id = @templateId',
    { templateId: day.template_id }
  );

  if (!template) {
    throw NotFoundError('Template');
  }

  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You cannot edit this template');
  }

  // Update order for each exercise
  for (let i = 0; i < exerciseIds.length; i++) {
    await execute(
      'UPDATE workout_template_exercises SET order_index = @orderIndex WHERE id = @id AND day_id = @dayId',
      { orderIndex: i, id: exerciseIds[i], dayId }
    );
  }

  res.json({ message: 'Exercises reordered successfully' });
}));

// Add a new day to template
router.post('/template-days', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { template_id, week_id, name, day_number, notes } = req.body;

  if (!template_id) {
    throw BadRequestError('template_id is required');
  }

  const template = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM workout_templates WHERE id = @templateId',
    { templateId: template_id }
  );

  if (!template) {
    throw NotFoundError('Template');
  }

  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You cannot edit this template');
  }

  // Get next day number if not provided
  let finalDayNumber = day_number;
  if (!finalDayNumber) {
    const maxDay = await queryOne<{ max_day: number }>(
      week_id 
        ? 'SELECT MAX(day_number) as max_day FROM workout_template_days WHERE week_id = @weekId'
        : 'SELECT MAX(day_number) as max_day FROM workout_template_days WHERE template_id = @templateId AND week_id IS NULL',
      week_id ? { weekId: week_id } : { templateId: template_id }
    );
    finalDayNumber = (maxDay?.max_day ?? 0) + 1;
  }

  const dayId = uuidv4();
  await execute(
    `INSERT INTO workout_template_days (id, template_id, week_id, day_number, name, notes)
     VALUES (@id, @templateId, @weekId, @dayNumber, @name, @notes)`,
    {
      id: dayId,
      templateId: template_id,
      weekId: week_id || null,
      dayNumber: finalDayNumber,
      name: name || `Day ${finalDayNumber}`,
      notes: notes || null,
    }
  );

  const newDay = await queryOne('SELECT * FROM workout_template_days WHERE id = @id', { id: dayId });
  res.status(201).json(newDay);
}));

// Delete a day from template
router.delete('/template-days/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const day = await queryOne<{ template_id: string }>(
    'SELECT template_id FROM workout_template_days WHERE id = @id',
    { id }
  );

  if (!day) {
    throw NotFoundError('Template day');
  }

  const template = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM workout_templates WHERE id = @templateId',
    { templateId: day.template_id }
  );

  if (!template) {
    throw NotFoundError('Template');
  }

  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You cannot edit this template');
  }

  // Delete exercises first, then the day
  await execute('DELETE FROM workout_template_exercises WHERE day_id = @dayId', { dayId: id });
  await execute('DELETE FROM workout_template_days WHERE id = @id', { id });

  res.json({ message: 'Day removed from template' });
}));

// Add a new week to template
router.post('/template-weeks', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { template_id, name, week_number, focus, notes } = req.body;

  if (!template_id) {
    throw BadRequestError('template_id is required');
  }

  const template = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM workout_templates WHERE id = @templateId',
    { templateId: template_id }
  );

  if (!template) {
    throw NotFoundError('Template');
  }

  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You cannot edit this template');
  }

  // Get next week number if not provided
  let finalWeekNumber = week_number;
  if (!finalWeekNumber) {
    const maxWeek = await queryOne<{ max_week: number }>(
      'SELECT MAX(week_number) as max_week FROM workout_template_weeks WHERE template_id = @templateId',
      { templateId: template_id }
    );
    finalWeekNumber = (maxWeek?.max_week ?? 0) + 1;
  }

  const weekId = uuidv4();
  await execute(
    `INSERT INTO workout_template_weeks (id, template_id, week_number, name, focus, notes)
     VALUES (@id, @templateId, @weekNumber, @name, @focus, @notes)`,
    {
      id: weekId,
      templateId: template_id,
      weekNumber: finalWeekNumber,
      name: name || `Week ${finalWeekNumber}`,
      focus: focus || null,
      notes: notes || null,
    }
  );

  const newWeek = await queryOne('SELECT * FROM workout_template_weeks WHERE id = @id', { id: weekId });
  res.status(201).json(newWeek);
}));

// Delete a week from template
router.delete('/template-weeks/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const week = await queryOne<{ template_id: string }>(
    'SELECT template_id FROM workout_template_weeks WHERE id = @id',
    { id }
  );

  if (!week) {
    throw NotFoundError('Template week');
  }

  const template = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM workout_templates WHERE id = @templateId',
    { templateId: week.template_id }
  );

  if (!template) {
    throw NotFoundError('Template');
  }

  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You cannot edit this template');
  }

  // Get all days in this week
  const days = await queryAll<{ id: string }>(
    'SELECT id FROM workout_template_days WHERE week_id = @weekId',
    { weekId: id }
  );

  // Delete exercises for all days
  for (const day of days) {
    await execute('DELETE FROM workout_template_exercises WHERE day_id = @dayId', { dayId: day.id });
  }

  // Delete days
  await execute('DELETE FROM workout_template_days WHERE week_id = @weekId', { weekId: id });

  // Delete week
  await execute('DELETE FROM workout_template_weeks WHERE id = @id', { id });

  res.json({ message: 'Week removed from template' });
}));

// Delete template exercise
router.delete('/template-exercises/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const exercise = await queryOne<{ day_id: string }>(
    'SELECT day_id FROM workout_template_exercises WHERE id = @id',
    { id }
  );

  if (!exercise) {
    throw NotFoundError('Template exercise');
  }

  // Get day and verify ownership
  const day = await queryOne<{ template_id: string }>(
    'SELECT template_id FROM workout_template_days WHERE id = @dayId',
    { dayId: exercise.day_id }
  );

  if (!day) {
    throw NotFoundError('Template day');
  }

  const template = await queryOne<{ created_by: string; is_system: boolean }>(
    'SELECT created_by, is_system FROM workout_templates WHERE id = @templateId',
    { templateId: day.template_id }
  );

  if (!template) {
    throw NotFoundError('Template');
  }

  if (!template.is_system && template.created_by !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You cannot edit this template');
  }

  await execute('DELETE FROM workout_template_exercises WHERE id = @id', { id });
  res.json({ message: 'Exercise removed from template' });
}));

// ==================== Workout Logs ====================

/**
 * @swagger
 * /api/workouts/logs:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workout logs for current user
 */
router.get('/logs', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { start_date, end_date, limit = 50 } = req.query;

  let whereClause = 'WHERE client_id = @userId';
  const params: Record<string, unknown> = { userId: req.user!.id };

  if (start_date) {
    whereClause += ' AND workout_date >= @startDate';
    params.startDate = start_date;
  }
  if (end_date) {
    whereClause += ' AND workout_date <= @endDate';
    params.endDate = end_date;
  }

  const logs = await queryAll<Record<string, unknown>>(
    `SELECT TOP ${parseInt(limit as string)} 
            wl.id, wl.workout_date, wl.status, wl.started_at, wl.completed_at,
            wl.duration_minutes, wl.notes, wl.perceived_effort, wl.satisfaction_rating,
            wl.template_id, wt.name as template_name
     FROM workout_logs wl
     LEFT JOIN workout_templates wt ON wl.template_id = wt.id
     ${whereClause}
     ORDER BY wl.workout_date DESC`,
    params
  );

  // Get exercises for each log
  for (const log of logs) {
    const exercises = await queryAll<Record<string, unknown>>(
      `SELECT id, exercise_name, exercise_id, sets_completed, set_data, notes
       FROM workout_log_exercises WHERE workout_log_id = @logId
       ORDER BY order_index`,
      { logId: log.id }
    );
    transformRows(exercises, ['set_data']);
    (log as Record<string, unknown>).exercises = exercises;
  }

  res.json(logs);
}));

// Get single workout log
router.get('/logs/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const log = await queryOne<Record<string, unknown>>(
    `SELECT wl.*, wt.name as template_name
     FROM workout_logs wl
     LEFT JOIN workout_templates wt ON wl.template_id = wt.id
     WHERE wl.id = @id`,
    { id }
  );

  if (!log) {
    throw NotFoundError('Workout log');
  }

  // Check access
  if (log.client_id !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    // Check if user is coach of this client
    if (req.user!.roles.includes('coach')) {
      const relationship = await queryOne(
        `SELECT id FROM coach_client_relationships 
         WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
        { coachId: req.user!.id, clientId: log.client_id }
      );
      if (!relationship) {
        throw ForbiddenError('You do not have access to this workout log');
      }
    } else {
      throw ForbiddenError('You do not have access to this workout log');
    }
  }

  // Get exercises
  const exercises = await queryAll<Record<string, unknown>>(
    `SELECT wle.*, e.name as exercise_name_full, e.primary_muscle, e.equipment
     FROM workout_log_exercises wle
     LEFT JOIN exercises e ON wle.exercise_id = e.id
     WHERE wle.workout_log_id = @logId
     ORDER BY wle.order_index`,
    { logId: id }
  );

  transformRows(exercises, ['set_data']);
  (log as Record<string, unknown>).exercises = exercises;

  res.json(log);
}));

/**
 * @swagger
 * /api/workouts/logs:
 *   post:
 *     tags: [Workouts]
 *     summary: Create a workout log
 */
router.post('/logs', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Support both snake_case and camelCase parameter naming
  const template_id = req.body.template_id || req.body.templateId;
  const template_day_id = req.body.template_day_id || req.body.templateDayId;
  const assignment_id = req.body.assignment_id || req.body.assignmentId;
  const workout_date = req.body.workout_date || req.body.workoutDate;
  const preload_exercises = req.body.preload_exercises ?? req.body.preloadExercises ?? true;
  
  const {
    status = 'in_progress', // Default to in_progress for new workouts
    started_at,
    completed_at,
    duration_minutes,
    notes,
    perceived_effort,
    satisfaction_rating,
    exercises,
  } = req.body;

  const logId = uuidv4();
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO workout_logs (id, client_id, template_id, template_day_id, assignment_id, workout_date, status, started_at, completed_at, duration_minutes, notes, perceived_effort, satisfaction_rating)
     VALUES (@id, @clientId, @templateId, @templateDayId, @assignmentId, @workoutDate, @status, @startedAt, @completedAt, @durationMinutes, @notes, @perceivedEffort, @satisfactionRating)`,
    {
      id: logId,
      clientId: req.user!.id,
      templateId: template_id || null,
      templateDayId: template_day_id || null,
      assignmentId: assignment_id || null,
      workoutDate: workout_date || new Date().toISOString().split('T')[0],
      status,
      startedAt: started_at || (status === 'in_progress' ? now : null),
      completedAt: completed_at || null,
      durationMinutes: duration_minutes || null,
      notes: notes || null,
      perceivedEffort: perceived_effort || null,
      satisfactionRating: satisfaction_rating || null,
    }
  );

  // Insert exercises from provided array
  if (exercises && Array.isArray(exercises)) {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await execute(
        `INSERT INTO workout_log_exercises (id, workout_log_id, exercise_id, exercise_name, order_index, sets_completed, set_data, notes)
         VALUES (@id, @logId, @exerciseId, @exerciseName, @orderIndex, @setsCompleted, @setData, @notes)`,
        {
          id: uuidv4(),
          logId,
          exerciseId: ex.exercise_id,
          exerciseName: ex.exercise_name,
          orderIndex: i,
          setsCompleted: ex.sets_completed || 0,
          setData: JSON.stringify(ex.set_data || []),
          notes: ex.notes,
        }
      );
    }
  } else if (preload_exercises && template_id) {
    // Preload exercises from template when starting from a program
    // First, determine which day to use
    let dayId = template_day_id;
    
    if (!dayId) {
      // If no specific day provided, get the current day based on assignment progress
      // For now, just get day 1 or calculate based on start date
      const template = await queryOne<{ days_per_week: number }>(
        'SELECT days_per_week FROM workout_templates WHERE id = @templateId',
        { templateId: template_id }
      );
      
      if (template) {
        // Get assignment start date to calculate which day
        let dayNumber = 1;
        if (assignment_id) {
          const assignment = await queryOne<{ start_date: string }>(
            'SELECT start_date FROM plan_assignments WHERE id = @assignmentId',
            { assignmentId: assignment_id }
          );
          if (assignment) {
            const startDate = new Date(assignment.start_date);
            const today = new Date();
            const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            dayNumber = (daysSinceStart % template.days_per_week) + 1;
          }
        }
        
        // Find the day with this day_number (prefer standalone days, then week 1 days)
        const day = await queryOne<{ id: string }>(
          `SELECT TOP 1 id FROM workout_template_days 
           WHERE template_id = @templateId AND day_number = @dayNumber
           ORDER BY CASE WHEN week_id IS NULL THEN 0 ELSE 1 END, week_id`,
          { templateId: template_id, dayNumber }
        );
        
        if (day) {
          dayId = day.id;
        }
      }
    }
    
    // Get exercises for this day and preload them
    if (dayId) {
      const templateExercises = await queryAll<{
        exercise_id: string | null;
        exercise_name: string | null;
        custom_exercise_name: string | null;
        order_index: number;
        sets_min: number;
        sets_max: number | null;
        reps_min: number;
        reps_max: number | null;
        rest_seconds_min: number | null;
        rest_seconds_max: number | null;
        notes: string | null;
      }>(
        `SELECT wte.exercise_id, e.name as exercise_name, wte.custom_exercise_name,
                wte.order_index, wte.sets_min, wte.sets_max, wte.reps_min, wte.reps_max,
                wte.rest_seconds_min, wte.rest_seconds_max, wte.notes
         FROM workout_template_exercises wte
         LEFT JOIN exercises e ON wte.exercise_id = e.id
         WHERE wte.day_id = @dayId
         ORDER BY wte.order_index`,
        { dayId }
      );
      
      for (let i = 0; i < templateExercises.length; i++) {
        const tex = templateExercises[i];
        const exerciseName = tex.exercise_name || tex.custom_exercise_name || 'Exercise';
        const numSets = tex.sets_min || 3;
        const reps = tex.reps_min || 10;
        
        // Create set_data array with the template's set/rep scheme
        const setDataArray = [];
        for (let s = 1; s <= numSets; s++) {
          setDataArray.push({
            setNumber: s,
            reps: reps,
            weight: 0,
            completed: false,
          });
        }
        
        await execute(
          `INSERT INTO workout_log_exercises (id, workout_log_id, exercise_id, exercise_name, order_index, sets_completed, set_data, notes)
           VALUES (@id, @logId, @exerciseId, @exerciseName, @orderIndex, @setsCompleted, @setData, @notes)`,
          {
            id: uuidv4(),
            logId,
            exerciseId: tex.exercise_id || null,
            exerciseName,
            orderIndex: i,
            setsCompleted: 0,
            setData: JSON.stringify(setDataArray),
            notes: tex.notes || null,
          }
        );
      }
      
      // Update the log to track which day was used
      await execute(
        'UPDATE workout_logs SET template_day_id = @dayId WHERE id = @logId',
        { dayId, logId }
      );
    }
  }

  const log = await queryOne('SELECT * FROM workout_logs WHERE id = @id', { id: logId });
  res.status(201).json(log);
}));

// Add exercise to existing workout log
router.post('/logs/:id/exercises', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  // Support both snake_case and camelCase
  const exercise_id = req.body.exercise_id || req.body.exerciseId;
  const exercise_name = req.body.exercise_name || req.body.exerciseName;
  const sets_completed = req.body.sets_completed || req.body.setsCompleted || 0;
  const set_data = req.body.set_data || req.body.setData;
  const notes = req.body.notes;

  const log = await queryOne<{ client_id: string }>(
    'SELECT client_id FROM workout_logs WHERE id = @id',
    { id }
  );

  if (!log) {
    throw NotFoundError('Workout log');
  }

  if (log.client_id !== req.user!.id) {
    throw ForbiddenError('You can only edit your own workout logs');
  }

  // Get next order index
  const maxOrder = await queryOne<{ max_order: number }>(
    'SELECT MAX(order_index) as max_order FROM workout_log_exercises WHERE workout_log_id = @logId',
    { logId: id }
  );

  // Create default set data if not provided
  const defaultSetData = set_data || [
    { setNumber: 1, reps: 10, weight: 0, completed: false },
    { setNumber: 2, reps: 10, weight: 0, completed: false },
    { setNumber: 3, reps: 10, weight: 0, completed: false },
  ];

  const exerciseLogId = uuidv4();
  await execute(
    `INSERT INTO workout_log_exercises (id, workout_log_id, exercise_id, exercise_name, order_index, sets_completed, set_data, notes)
     VALUES (@id, @logId, @exerciseId, @exerciseName, @orderIndex, @setsCompleted, @setData, @notes)`,
    {
      id: exerciseLogId,
      logId: id,
      exerciseId: exercise_id || null,
      exerciseName: exercise_name,
      orderIndex: (maxOrder?.max_order ?? -1) + 1,
      setsCompleted: sets_completed,
      setData: JSON.stringify(defaultSetData),
      notes: notes || null,
    }
  );

  const exercise = await queryOne<Record<string, unknown>>('SELECT * FROM workout_log_exercises WHERE id = @id', { id: exerciseLogId });
  if (exercise) {
    transformRow(exercise, ['set_data']);
  }
  res.status(201).json(exercise);
}));

// Update workout log (status, completion, notes, etc.)
router.put('/logs/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  // Support both snake_case and camelCase
  const status = req.body.status;
  const completed_at = req.body.completed_at || req.body.completedAt;
  const duration_minutes = req.body.duration_minutes ?? req.body.durationMinutes;
  const notes = req.body.notes;
  const perceived_effort = req.body.perceived_effort ?? req.body.perceivedEffort;
  const satisfaction_rating = req.body.satisfaction_rating ?? req.body.satisfactionRating;

  const log = await queryOne<{ client_id: string }>(
    'SELECT client_id FROM workout_logs WHERE id = @id',
    { id }
  );

  if (!log) {
    throw NotFoundError('Workout log');
  }

  if (log.client_id !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You can only edit your own workout logs');
  }

  await execute(
    `UPDATE workout_logs SET
       status = COALESCE(@status, status),
       completed_at = COALESCE(@completedAt, completed_at),
       duration_minutes = COALESCE(@durationMinutes, duration_minutes),
       notes = COALESCE(@notes, notes),
       perceived_effort = COALESCE(@perceivedEffort, perceived_effort),
       satisfaction_rating = COALESCE(@satisfactionRating, satisfaction_rating),
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      status,
      completedAt: completed_at || null,
      durationMinutes: duration_minutes ?? null,
      notes: notes ?? null,
      perceivedEffort: perceived_effort ?? null,
      satisfactionRating: satisfaction_rating ?? null,
    }
  );

  const updated = await queryOne('SELECT * FROM workout_logs WHERE id = @id', { id });
  res.json(updated);
}));

// Update exercise in workout log
router.put('/logs/exercises/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  // Support both snake_case and camelCase
  const sets_completed = req.body.sets_completed ?? req.body.setsCompleted;
  const set_data = req.body.set_data || req.body.setData;
  const notes = req.body.notes;

  const exercise = await queryOne<{ workout_log_id: string }>(
    'SELECT workout_log_id FROM workout_log_exercises WHERE id = @id',
    { id }
  );

  if (!exercise) {
    throw NotFoundError('Workout log exercise');
  }

  const log = await queryOne<{ client_id: string }>(
    'SELECT client_id FROM workout_logs WHERE id = @logId',
    { logId: exercise.workout_log_id }
  );

  if (!log || log.client_id !== req.user!.id) {
    throw ForbiddenError('You can only edit your own workout logs');
  }

  await execute(
    `UPDATE workout_log_exercises SET
       sets_completed = COALESCE(@setsCompleted, sets_completed),
       set_data = COALESCE(@setData, set_data),
       notes = COALESCE(@notes, notes)
     WHERE id = @id`,
    {
      id,
      setsCompleted: sets_completed,
      setData: set_data ? JSON.stringify(set_data) : null,
      notes,
    }
  );

  const updated = await queryOne<Record<string, unknown>>('SELECT * FROM workout_log_exercises WHERE id = @id', { id });
  if (updated) {
    transformRow(updated, ['set_data']);
  }
  res.json(updated);
}));

// Delete workout log
router.delete('/logs/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const log = await queryOne<{ client_id: string }>(
    'SELECT client_id FROM workout_logs WHERE id = @id',
    { id }
  );

  if (!log) {
    throw NotFoundError('Workout log');
  }

  if (log.client_id !== req.user!.id && !req.user!.roles.includes('super_admin')) {
    throw ForbiddenError('You can only delete your own workout logs');
  }

  // Delete exercises first, then the log
  await execute('DELETE FROM workout_log_exercises WHERE workout_log_id = @logId', { logId: id });
  await execute('DELETE FROM workout_logs WHERE id = @id', { id });

  res.json({ message: 'Workout log deleted' });
}));

export default router;
