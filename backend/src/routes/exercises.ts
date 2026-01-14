import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, transformRow, transformRows } from '../db';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/exercises:
 *   get:
 *     tags: [Exercises]
 *     summary: Get all exercises
 */
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { muscle, equipment, difficulty, search, type } = req.query;

  let whereClause = 'WHERE (is_system = 1';
  const params: Record<string, unknown> = {};

  // Include user's custom exercises if authenticated
  if (req.user) {
    whereClause += ' OR created_by = @userId';
    params.userId = req.user.id;
  }
  whereClause += ')';

  if (muscle) {
    whereClause += ' AND primary_muscle = @muscle';
    params.muscle = muscle;
  }
  if (equipment) {
    whereClause += ' AND equipment = @equipment';
    params.equipment = equipment;
  }
  if (difficulty) {
    whereClause += ' AND difficulty = @difficulty';
    params.difficulty = difficulty;
  }
  if (type) {
    whereClause += ' AND exercise_type = @type';
    params.type = type;
  }
  if (search) {
    whereClause += ' AND (name LIKE @search OR description LIKE @search)';
    params.search = `%${search}%`;
  }

  const exercises = await queryAll<Record<string, unknown>>(
    `SELECT id, name, description, instructions, tips, common_mistakes,
            primary_muscle, secondary_muscles, equipment, difficulty,
            exercise_type, video_url, is_system, created_by, created_at
     FROM exercises ${whereClause}
     ORDER BY name`,
    params
  );

  // Parse JSON fields and ensure arrays
  const transformed = transformRows(exercises, [], ['instructions', 'tips', 'common_mistakes', 'secondary_muscles']);

  res.json(transformed);
}));

/**
 * @swagger
 * /api/exercises/{id}:
 *   get:
 *     tags: [Exercises]
 *     summary: Get exercise by ID
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const exercise = await queryOne<Record<string, unknown>>(
    `SELECT id, name, description, instructions, tips, common_mistakes,
            primary_muscle, secondary_muscles, equipment, difficulty,
            exercise_type, video_url, is_system, created_by, created_at
     FROM exercises WHERE id = @id`,
    { id }
  );

  if (!exercise) {
    throw NotFoundError('Exercise');
  }

  // Check access for non-system exercises
  if (!exercise.is_system && exercise.created_by !== req.user?.id) {
    throw ForbiddenError('You do not have access to this exercise');
  }

  // Parse JSON fields and ensure arrays
  const transformedExercise = transformRow(exercise, [], ['instructions', 'tips', 'common_mistakes', 'secondary_muscles']);

  // Get alternatives
  const alternatives = await queryAll<{ id: string; name: string; primary_muscle: string }>(
    `SELECT e.id, e.name, e.primary_muscle
     FROM exercises e
     JOIN exercise_alternatives ea ON e.id = ea.alternative_exercise_id
     WHERE ea.exercise_id = @id`,
    { id }
  );

  res.json({ ...transformedExercise, alternatives });
}));

/**
 * @swagger
 * /api/exercises:
 *   post:
 *     tags: [Exercises]
 *     summary: Create a new exercise
 */
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    description,
    instructions,
    tips,
    common_mistakes,
    primary_muscle,
    secondary_muscles,
    equipment,
    difficulty = 'intermediate',
    exercise_type = 'compound',
    video_url,
  } = req.body;

  if (!name || !primary_muscle || !equipment) {
    throw BadRequestError('Name, primary muscle, and equipment are required');
  }

  const id = uuidv4();

  await execute(
    `INSERT INTO exercises (id, name, description, instructions, tips, common_mistakes,
                           primary_muscle, secondary_muscles, equipment, difficulty,
                           exercise_type, video_url, is_system, created_by)
     VALUES (@id, @name, @description, @instructions, @tips, @commonMistakes,
             @primaryMuscle, @secondaryMuscles, @equipment, @difficulty,
             @exerciseType, @videoUrl, 0, @createdBy)`,
    {
      id,
      name,
      description,
      instructions: JSON.stringify(instructions || []),
      tips: JSON.stringify(tips || []),
      commonMistakes: JSON.stringify(common_mistakes || []),
      primaryMuscle: primary_muscle,
      secondaryMuscles: JSON.stringify(secondary_muscles || []),
      equipment,
      difficulty,
      exerciseType: exercise_type,
      videoUrl: video_url,
      createdBy: req.user!.id,
    }
  );

  const exercise = await queryOne<Record<string, unknown>>(
    'SELECT * FROM exercises WHERE id = @id',
    { id }
  );

  const result = exercise ? transformRow(exercise, [], ['instructions', 'tips', 'common_mistakes', 'secondary_muscles']) : null;

  res.status(201).json(result);
}));

/**
 * @swagger
 * /api/exercises/{id}:
 *   put:
 *     tags: [Exercises]
 *     summary: Update an exercise
 */
router.put('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM exercises WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Exercise');
  }

  // Only super_admin can edit system exercises
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot modify system exercises');
  }

  // Only creator or super_admin can edit custom exercises
  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only modify your own exercises');
  }

  const {
    name,
    description,
    instructions,
    tips,
    common_mistakes,
    primary_muscle,
    secondary_muscles,
    equipment,
    difficulty,
    exercise_type,
    video_url,
  } = req.body;

  await execute(
    `UPDATE exercises SET 
       name = COALESCE(@name, name),
       description = COALESCE(@description, description),
       instructions = COALESCE(@instructions, instructions),
       tips = COALESCE(@tips, tips),
       common_mistakes = COALESCE(@commonMistakes, common_mistakes),
       primary_muscle = COALESCE(@primaryMuscle, primary_muscle),
       secondary_muscles = COALESCE(@secondaryMuscles, secondary_muscles),
       equipment = COALESCE(@equipment, equipment),
       difficulty = COALESCE(@difficulty, difficulty),
       exercise_type = COALESCE(@exerciseType, exercise_type),
       video_url = COALESCE(@videoUrl, video_url),
       updated_at = GETUTCDATE()
     WHERE id = @id`,
    {
      id,
      name,
      description,
      instructions: instructions ? JSON.stringify(instructions) : null,
      tips: tips ? JSON.stringify(tips) : null,
      commonMistakes: common_mistakes ? JSON.stringify(common_mistakes) : null,
      primaryMuscle: primary_muscle,
      secondaryMuscles: secondary_muscles ? JSON.stringify(secondary_muscles) : null,
      equipment,
      difficulty,
      exerciseType: exercise_type,
      videoUrl: video_url,
    }
  );

  const exercise = await queryOne<Record<string, unknown>>('SELECT * FROM exercises WHERE id = @id', { id });
  const result = exercise ? transformRow(exercise, [], ['instructions', 'tips', 'common_mistakes', 'secondary_muscles']) : null;
  res.json(result);
}));

/**
 * @swagger
 * /api/exercises/{id}:
 *   delete:
 *     tags: [Exercises]
 *     summary: Delete an exercise
 */
router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await queryOne<{ is_system: boolean; created_by: string }>(
    'SELECT is_system, created_by FROM exercises WHERE id = @id',
    { id }
  );

  if (!existing) {
    throw NotFoundError('Exercise');
  }

  const isSuperAdmin = req.user!.roles.includes('super_admin');
  
  if (existing.is_system && !isSuperAdmin) {
    throw ForbiddenError('Cannot delete system exercises');
  }

  if (!existing.is_system && existing.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only delete your own exercises');
  }

  // Delete alternatives first
  await execute('DELETE FROM exercise_alternatives WHERE exercise_id = @id OR alternative_exercise_id = @id', { id });
  await execute('DELETE FROM exercises WHERE id = @id', { id });

  res.json({ message: 'Exercise deleted' });
}));

// Add exercise alternative
router.post('/:id/alternatives', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { alternative_exercise_id, notes } = req.body;

  if (!alternative_exercise_id) {
    throw BadRequestError('alternative_exercise_id is required');
  }

  // Verify both exercises exist
  const exercise = await queryOne<{ id: string; created_by: string; is_system: boolean }>(
    'SELECT id, created_by, is_system FROM exercises WHERE id = @id', 
    { id }
  );
  const alternative = await queryOne('SELECT id FROM exercises WHERE id = @altId', { altId: alternative_exercise_id });

  if (!exercise || !alternative) {
    throw NotFoundError('Exercise');
  }

  // Check permission
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  if (!exercise.is_system && exercise.created_by !== req.user!.id && !isSuperAdmin) {
    throw ForbiddenError('You can only modify your own exercises');
  }

  const altId = uuidv4();
  await execute(
    `INSERT INTO exercise_alternatives (id, exercise_id, alternative_exercise_id, notes)
     VALUES (@id, @exerciseId, @alternativeId, @notes)`,
    { id: altId, exerciseId: id, alternativeId: alternative_exercise_id, notes }
  );

  res.status(201).json({ id: altId, message: 'Alternative added' });
}));

export default router;
