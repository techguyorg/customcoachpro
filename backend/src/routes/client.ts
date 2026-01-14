import { Router, Response } from 'express';
import { queryAll, queryOne, execute, ensureArray, parseJsonField } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============ Profile ============

router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await queryOne<Record<string, unknown>>(
    `SELECT cp.*, p.full_name, p.email, p.avatar_url, p.phone, p.bio
     FROM client_profiles cp
     JOIN profiles p ON cp.user_id = p.user_id
     WHERE cp.user_id = @userId`,
    { userId: req.user!.id }
  );
  
  if (!profile) {
    return res.json({
      hasProfile: false,
      isComplete: false,
      missingFields: ['All profile information'],
      profile: null,
    });
  }
  
  // Parse JSON fields
  profile.fitness_goals = parseJsonField(profile.fitness_goals);
  profile.dietary_restrictions = parseJsonField(profile.dietary_restrictions);
  
  // Check completeness - use human-readable labels
  const fieldLabels: Record<string, string> = {
    'height_cm': 'Height',
    'current_weight_kg': 'Current Weight',
    'fitness_level': 'Fitness Level',
  };
  const requiredFields = ['height_cm', 'current_weight_kg', 'fitness_level'];
  const missingFields = requiredFields
    .filter(f => !profile[f])
    .map(f => fieldLabels[f] || f);
  
  res.json({
    hasProfile: true,
    isComplete: missingFields.length === 0,
    missingFields,
    profile,
  });
}));

router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    height_cm, current_weight_kg, target_weight_kg, 
    fitness_goals, fitness_level, medical_conditions, dietary_restrictions 
  } = req.body;
  
  // Check if profile exists
  const existing = await queryOne('SELECT id FROM client_profiles WHERE user_id = @userId', { userId: req.user!.id });
  
  if (existing) {
    await execute(
      `UPDATE client_profiles SET 
        height_cm = COALESCE(@heightCm, height_cm),
        current_weight_kg = COALESCE(@currentWeight, current_weight_kg),
        target_weight_kg = COALESCE(@targetWeight, target_weight_kg),
        fitness_goals = COALESCE(@fitnessGoals, fitness_goals),
        fitness_level = COALESCE(@fitnessLevel, fitness_level),
        medical_conditions = COALESCE(@medicalConditions, medical_conditions),
        dietary_restrictions = COALESCE(@dietaryRestrictions, dietary_restrictions),
        updated_at = GETUTCDATE()
       WHERE user_id = @userId`,
      {
        userId: req.user!.id,
        heightCm: height_cm,
        currentWeight: current_weight_kg,
        targetWeight: target_weight_kg,
        fitnessGoals: fitness_goals ? JSON.stringify(fitness_goals) : null,
        fitnessLevel: fitness_level,
        medicalConditions: medical_conditions,
        dietaryRestrictions: dietary_restrictions ? JSON.stringify(dietary_restrictions) : null,
      }
    );
  } else {
    await execute(
      `INSERT INTO client_profiles (id, user_id, height_cm, current_weight_kg, target_weight_kg, fitness_goals, fitness_level, medical_conditions, dietary_restrictions)
       VALUES (@id, @userId, @heightCm, @currentWeight, @targetWeight, @fitnessGoals, @fitnessLevel, @medicalConditions, @dietaryRestrictions)`,
      {
        id: uuidv4(),
        userId: req.user!.id,
        heightCm: height_cm,
        currentWeight: current_weight_kg,
        targetWeight: target_weight_kg,
        fitnessGoals: fitness_goals ? JSON.stringify(fitness_goals) : null,
        fitnessLevel: fitness_level,
        medicalConditions: medical_conditions,
        dietaryRestrictions: dietary_restrictions ? JSON.stringify(dietary_restrictions) : null,
      }
    );
  }
  
  res.json({ message: 'Profile updated successfully' });
}));

// ============ Dashboard Stats ============

router.get('/dashboard-stats', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  // Workouts this week
  const workoutsThisWeek = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM workout_logs 
     WHERE client_id = @userId AND workout_date >= DATEADD(day, -7, GETUTCDATE())`,
    { userId }
  );
  
  // Total workout minutes this week
  const totalMinutes = await queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM workout_logs 
     WHERE client_id = @userId AND workout_date >= DATEADD(day, -7, GETUTCDATE())`,
    { userId }
  );
  
  // Calories logged today
  const caloriesLogged = await queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(calories), 0) as total FROM client_nutrition_logs 
     WHERE client_id = @userId AND CAST(log_date AS DATE) = CAST(GETUTCDATE() AS DATE)`,
    { userId }
  );
  
  // Current streak (consecutive days with workouts)
  const streakQuery = await queryAll<{ workout_date: string }>(
    `SELECT DISTINCT CAST(workout_date AS DATE) as workout_date 
     FROM workout_logs WHERE client_id = @userId 
     ORDER BY workout_date DESC`,
    { userId }
  );
  
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < streakQuery.length; i++) {
    const workoutDate = new Date(streakQuery[i].workout_date);
    workoutDate.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (workoutDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Next checkin date
  const nextCheckin = await queryOne<{ next_checkin_date: string }>(
    `SELECT TOP 1 next_checkin_date FROM client_checkins 
     WHERE client_id = @userId AND next_checkin_date >= CAST(GETUTCDATE() AS DATE)
     ORDER BY next_checkin_date`,
    { userId }
  );
  
  // Active plans
  const activeWorkoutPlan = await queryOne<{ id: string }>(
    `SELECT id FROM plan_assignments 
     WHERE client_id = @userId AND plan_type = 'workout' AND status = 'active'`,
    { userId }
  );
  
  const activeDietPlan = await queryOne<{ id: string }>(
    `SELECT id FROM plan_assignments 
     WHERE client_id = @userId AND plan_type = 'diet' AND status = 'active'`,
    { userId }
  );
  
  // Today's workout from active plan
  let todaysWorkout = null;
  if (activeWorkoutPlan) {
    const assignment = await queryOne<{ workout_template_id: string; start_date: string }>(
      `SELECT workout_template_id, start_date FROM plan_assignments WHERE id = @id`,
      { id: activeWorkoutPlan.id }
    );
    
    if (assignment?.workout_template_id) {
      const startDate = new Date(assignment.start_date);
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const template = await queryOne<{ days_per_week: number }>(
        'SELECT days_per_week FROM workout_templates WHERE id = @id',
        { id: assignment.workout_template_id }
      );
      
      if (template) {
        const dayNumber = (daysSinceStart % template.days_per_week) + 1;
        const todayDay = await queryOne<{ id: string; name: string; day_number: number }>(
          `SELECT id, name, day_number FROM workout_template_days 
           WHERE template_id = @templateId AND day_number = @dayNumber`,
          { templateId: assignment.workout_template_id, dayNumber }
        );
        
        if (todayDay) {
          todaysWorkout = {
            id: todayDay.id,
            name: todayDay.name,
            dayNumber: todayDay.day_number,
          };
        }
      }
    }
  }
  
  // Today's diet from active plan
  let todaysDiet = null;
  if (activeDietPlan) {
    const assignment = await queryOne<{ diet_plan_id: string }>(
      `SELECT diet_plan_id FROM plan_assignments WHERE id = @id`,
      { id: activeDietPlan.id }
    );
    
    if (assignment?.diet_plan_id) {
      const plan = await queryOne<{ id: string; name: string; calories_target: number; protein_grams: number; carbs_grams: number; fat_grams: number }>(
        `SELECT id, name, calories_target, protein_grams, carbs_grams, fat_grams FROM diet_plans WHERE id = @id`,
        { id: assignment.diet_plan_id }
      );
      
      if (plan) {
        todaysDiet = {
          id: plan.id,
          name: plan.name,
          calories: plan.calories_target || 0,
          protein: plan.protein_grams || 0,
          carbs: plan.carbs_grams || 0,
          fat: plan.fat_grams || 0,
        };
      }
    }
  }
  
  res.json({
    workoutsThisWeek: workoutsThisWeek?.count || 0,
    totalWorkoutMinutes: totalMinutes?.total || 0,
    caloriesLogged: caloriesLogged?.total || 0,
    currentStreak,
    nextCheckinDate: nextCheckin?.next_checkin_date || null,
    hasActiveWorkoutPlan: !!activeWorkoutPlan,
    hasActiveDietPlan: !!activeDietPlan,
    todaysWorkout,
    todaysDiet,
  });
}));

// ============ My Coach ============

router.get('/my-coach', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const coach = await queryOne<Record<string, unknown>>(
    `SELECT p.user_id as coachId, p.full_name as fullName, p.avatar_url as avatarUrl, 
            p.bio, p.email, cp.specializations, cp.rating, cp.experience_years as experienceYears
     FROM coach_client_relationships ccr
     JOIN profiles p ON ccr.coach_id = p.user_id
     LEFT JOIN coach_profiles cp ON ccr.coach_id = cp.user_id
     WHERE ccr.client_id = @clientId AND ccr.status = 'active'`,
    { clientId: req.user!.id }
  );
  
  if (!coach) {
    return res.json(null);
  }
  
  coach.specializations = parseJsonField(coach.specializations);
  res.json(coach);
}));

router.post('/end-coaching', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute(
    `UPDATE coach_client_relationships 
     SET status = 'ended', ended_at = GETUTCDATE(), updated_at = GETUTCDATE()
     WHERE client_id = @clientId AND status = 'active'`,
    { clientId: req.user!.id }
  );
  
  // Also update client_profile to remove coach_id
  await execute(
    `UPDATE client_profiles SET coach_id = NULL, updated_at = GETUTCDATE() WHERE user_id = @userId`,
    { userId: req.user!.id }
  );
  
  res.json({ message: 'Coaching relationship ended' });
}));

// ============ Measurements ============

router.get('/measurements', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const measurements = await queryAll(
    'SELECT * FROM client_measurements WHERE client_id = @clientId ORDER BY recorded_at DESC', 
    { clientId: req.user!.id }
  );
  res.json(measurements);
}));

router.post('/measurements', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    weight_kg, body_fat_pct, muscle_mass_kg, waist_cm, chest_cm, hips_cm, 
    shoulders_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm,
    left_calf_cm, right_calf_cm, neck_cm, notes, recorded_at
  } = req.body;
  
  const id = uuidv4();
  await execute(
    `INSERT INTO client_measurements (id, client_id, weight_kg, body_fat_pct, muscle_mass_kg, waist_cm, chest_cm, hips_cm, shoulders_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm, left_calf_cm, right_calf_cm, neck_cm, notes, recorded_at) 
     VALUES (@id, @clientId, @weightKg, @bodyFatPct, @muscleMassKg, @waistCm, @chestCm, @hipsCm, @shouldersCm, @leftArmCm, @rightArmCm, @leftThighCm, @rightThighCm, @leftCalfCm, @rightCalfCm, @neckCm, @notes, @recordedAt)`,
    { 
      id, clientId: req.user!.id, weightKg: weight_kg, bodyFatPct: body_fat_pct, muscleMassKg: muscle_mass_kg,
      waistCm: waist_cm, chestCm: chest_cm, hipsCm: hips_cm, shouldersCm: shoulders_cm,
      leftArmCm: left_arm_cm, rightArmCm: right_arm_cm, leftThighCm: left_thigh_cm, rightThighCm: right_thigh_cm,
      leftCalfCm: left_calf_cm, rightCalfCm: right_calf_cm, neckCm: neck_cm, notes,
      recordedAt: recorded_at || new Date().toISOString()
    }
  );
  
  const measurement = await queryOne('SELECT * FROM client_measurements WHERE id = @id', { id });
  res.status(201).json(measurement);
}));

// ============ Goals ============

router.get('/goals', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const goals = await queryAll(
    'SELECT * FROM client_goals WHERE client_id = @clientId ORDER BY created_at DESC', 
    { clientId: req.user!.id }
  );
  res.json(goals);
}));

router.post('/goals', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, goal_type, target_value, starting_value, current_value, unit, target_date } = req.body;
  
  if (!title || !goal_type) {
    throw BadRequestError('Title and goal_type are required');
  }
  
  const id = uuidv4();
  await execute(
    `INSERT INTO client_goals (id, client_id, title, description, goal_type, target_value, starting_value, current_value, unit, target_date, status)
     VALUES (@id, @clientId, @title, @description, @goalType, @targetValue, @startingValue, @currentValue, @unit, @targetDate, 'active')`,
    { id, clientId: req.user!.id, title, description, goalType: goal_type, targetValue: target_value, startingValue: starting_value, currentValue: current_value, unit, targetDate: target_date }
  );
  
  const goal = await queryOne('SELECT * FROM client_goals WHERE id = @id', { id });
  res.status(201).json(goal);
}));

router.put('/goals/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, target_value, current_value, unit, target_date, status } = req.body;
  
  await execute(
    `UPDATE client_goals SET 
       title = COALESCE(@title, title),
       description = COALESCE(@description, description),
       target_value = COALESCE(@targetValue, target_value),
       current_value = COALESCE(@currentValue, current_value),
       unit = COALESCE(@unit, unit),
       target_date = COALESCE(@targetDate, target_date),
       status = COALESCE(@status, status),
       completed_at = CASE WHEN @status = 'completed' THEN GETUTCDATE() ELSE completed_at END,
       updated_at = GETUTCDATE()
     WHERE id = @id AND client_id = @clientId`,
    { id, clientId: req.user!.id, title, description, targetValue: target_value, currentValue: current_value, unit, targetDate: target_date, status }
  );
  
  const goal = await queryOne('SELECT * FROM client_goals WHERE id = @id', { id });
  res.json(goal);
}));

router.delete('/goals/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute('DELETE FROM client_goals WHERE id = @id AND client_id = @clientId', { id: req.params.id, clientId: req.user!.id });
  res.json({ message: 'Goal deleted' });
}));

// ============ Start Program / Diet Plan ============

router.post('/start-program', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { templateId, startDate } = req.body;
  
  if (!templateId) {
    throw BadRequestError('templateId is required');
  }
  
  // Verify template exists
  const template = await queryOne<{ id: string; name: string }>(
    'SELECT id, name FROM workout_templates WHERE id = @id',
    { id: templateId }
  );
  
  if (!template) {
    throw NotFoundError('Workout template');
  }
  
  // Deactivate any existing active workout assignments
  await execute(
    `UPDATE plan_assignments SET status = 'completed', end_date = GETUTCDATE(), updated_at = GETUTCDATE()
     WHERE client_id = @clientId AND plan_type = 'workout' AND status = 'active'`,
    { clientId: req.user!.id }
  );
  
  // Create new assignment (self-assigned, no coach)
  const id = uuidv4();
  await execute(
    `INSERT INTO plan_assignments (id, client_id, coach_id, workout_template_id, plan_type, start_date, status)
     VALUES (@id, @clientId, @clientId, @templateId, 'workout', @startDate, 'active')`,
    { id, clientId: req.user!.id, templateId, startDate: startDate || new Date().toISOString().split('T')[0] }
  );
  
  res.status(201).json({ id, message: 'Program started successfully', templateName: template.name });
}));

router.post('/start-diet-plan', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { dietPlanId, startDate } = req.body;
  
  if (!dietPlanId) {
    throw BadRequestError('dietPlanId is required');
  }
  
  // Verify plan exists
  const plan = await queryOne<{ id: string; name: string }>(
    'SELECT id, name FROM diet_plans WHERE id = @id',
    { id: dietPlanId }
  );
  
  if (!plan) {
    throw NotFoundError('Diet plan');
  }
  
  // Deactivate any existing active diet assignments
  await execute(
    `UPDATE plan_assignments SET status = 'completed', end_date = GETUTCDATE(), updated_at = GETUTCDATE()
     WHERE client_id = @clientId AND plan_type = 'diet' AND status = 'active'`,
    { clientId: req.user!.id }
  );
  
  // Create new assignment (self-assigned)
  const id = uuidv4();
  await execute(
    `INSERT INTO plan_assignments (id, client_id, coach_id, diet_plan_id, plan_type, start_date, status)
     VALUES (@id, @clientId, @clientId, @dietPlanId, 'diet', @startDate, 'active')`,
    { id, clientId: req.user!.id, dietPlanId, startDate: startDate || new Date().toISOString().split('T')[0] }
  );
  
  res.status(201).json({ id, message: 'Diet plan started successfully', planName: plan.name });
}));

// ============ Plan Assignments ============

router.get('/assignments', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const assignments = await queryAll<Record<string, unknown>>(
    `SELECT pa.*, 
            wt.name as workout_template_name, wt.description as workout_description, wt.days_per_week,
            dp.name as diet_plan_name, dp.description as diet_description, dp.calories_target,
            p.full_name as coach_name
     FROM plan_assignments pa
     LEFT JOIN workout_templates wt ON pa.workout_template_id = wt.id
     LEFT JOIN diet_plans dp ON pa.diet_plan_id = dp.id
     LEFT JOIN profiles p ON pa.coach_id = p.user_id
     WHERE pa.client_id = @clientId
     ORDER BY pa.created_at DESC`,
    { clientId: req.user!.id }
  );
  res.json(assignments);
}));

// ============ Workout Logs ============

router.get('/workout-logs', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
            wl.*, wt.name as template_name
     FROM workout_logs wl
     LEFT JOIN workout_templates wt ON wl.template_id = wt.id
     ${whereClause}
     ORDER BY wl.workout_date DESC`,
    params
  );
  
  // Get exercises for each log
  for (const log of logs) {
    const exercises = await queryAll<Record<string, unknown>>(
      `SELECT wle.*, e.name as exercise_name, e.primary_muscle
       FROM workout_log_exercises wle
       LEFT JOIN exercises e ON wle.exercise_id = e.id
       WHERE wle.workout_log_id = @logId
       ORDER BY wle.order_index`,
      { logId: log.id }
    );
    
    // Parse set_data JSON
    log.exercises = exercises.map(ex => ({
      ...ex,
      set_data: parseJsonField(ex.set_data)
    }));
  }
  
  res.json(logs);
}));

router.get('/workout-stats', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const totalWorkouts = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM workout_logs WHERE client_id = @userId AND status = 'completed'`,
    { userId }
  );
  
  const totalMinutesAll = await queryOne<{ total: number }>(
    'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM workout_logs WHERE client_id = @userId',
    { userId }
  );
  
  const thisWeek = await queryOne<{ count: number; minutes: number }>(
    `SELECT COUNT(*) as count, COALESCE(SUM(duration_minutes), 0) as minutes FROM workout_logs 
     WHERE client_id = @userId AND workout_date >= DATEADD(day, -7, GETUTCDATE()) AND status = 'completed'`,
    { userId }
  );
  
  const lastWeek = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM workout_logs 
     WHERE client_id = @userId 
       AND workout_date >= DATEADD(day, -14, GETUTCDATE())
       AND workout_date < DATEADD(day, -7, GETUTCDATE())
       AND status = 'completed'`,
    { userId }
  );
  
  // Calculate streak
  const streakDates = await queryAll<{ workout_date: string }>(
    `SELECT DISTINCT CAST(workout_date AS DATE) as workout_date 
     FROM workout_logs WHERE client_id = @userId AND status = 'completed'
     ORDER BY workout_date DESC`,
    { userId }
  );
  
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < streakDates.length; i++) {
    const workoutDate = new Date(streakDates[i].workout_date);
    workoutDate.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (workoutDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else if (i === 0 && workoutDate.getTime() === expectedDate.getTime() - 86400000) {
      // Allow yesterday as current streak start
      currentStreak++;
    } else {
      break;
    }
  }
  
  res.json({
    // These match what the frontend expects
    workoutsThisWeek: thisWeek?.count || 0,
    totalMinutesThisWeek: thisWeek?.minutes || 0,
    currentStreak,
    totalWorkouts: totalWorkouts?.count || 0,
    // Legacy fields
    thisWeek: thisWeek?.count || 0,
    lastWeek: lastWeek?.count || 0,
    totalMinutes: totalMinutesAll?.total || 0,
    trend: (thisWeek?.count || 0) - (lastWeek?.count || 0),
  });
}));

// ============ Workout Analytics ============

router.get('/workout-analytics', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { days = 90 } = req.query;
  const userId = req.user!.id;
  const daysNum = parseInt(days as string);
  
  // Weekly volume
  const weeklyVolume = await queryAll<Record<string, unknown>>(
    `SELECT 
       DATEPART(year, workout_date) as year,
       DATEPART(week, workout_date) as week,
       COUNT(*) as workouts,
       COALESCE(SUM(wle.sets_completed), 0) as totalSets
     FROM workout_logs wl
     LEFT JOIN workout_log_exercises wle ON wl.id = wle.workout_log_id
     WHERE wl.client_id = @userId AND wl.workout_date >= DATEADD(day, -@days, GETUTCDATE())
     GROUP BY DATEPART(year, workout_date), DATEPART(week, workout_date)
     ORDER BY year, week`,
    { userId, days: daysNum }
  );
  
  // Muscle distribution
  const muscleDistribution = await queryAll<{ muscle: string; count: number }>(
    `SELECT e.primary_muscle as muscle, COUNT(*) as count
     FROM workout_log_exercises wle
     JOIN workout_logs wl ON wle.workout_log_id = wl.id
     JOIN exercises e ON wle.exercise_id = e.id
     WHERE wl.client_id = @userId AND wl.workout_date >= DATEADD(day, -@days, GETUTCDATE())
     GROUP BY e.primary_muscle
     ORDER BY count DESC`,
    { userId, days: daysNum }
  );
  
  // Progress metrics
  const totalWorkouts = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM workout_logs WHERE client_id = @userId`,
    { userId }
  );
  
  const avgDuration = await queryOne<{ avg: number }>(
    `SELECT AVG(duration_minutes) as avg FROM workout_logs WHERE client_id = @userId AND duration_minutes IS NOT NULL`,
    { userId }
  );
  
  const avgExercises = await queryOne<{ avg: number }>(
    `SELECT AVG(exercise_count) as avg FROM (
       SELECT wl.id, COUNT(wle.id) as exercise_count
       FROM workout_logs wl
       LEFT JOIN workout_log_exercises wle ON wl.id = wle.workout_log_id
       WHERE wl.client_id = @userId
       GROUP BY wl.id
     ) sub`,
    { userId }
  );
  
  res.json({
    weeklyVolume: weeklyVolume.map(w => ({
      week: `${w.year}-W${w.week}`,
      totalSets: w.totalSets || 0,
      totalReps: 0, // Would need to parse set_data
      totalWeight: 0,
    })),
    weeklyFrequency: weeklyVolume.map(w => ({
      week: `${w.year}-W${w.week}`,
      workouts: w.workouts || 0,
    })),
    muscleDistribution,
    progressMetrics: {
      totalWorkouts: totalWorkouts?.count || 0,
      avgWorkoutDuration: Math.round(avgDuration?.avg || 0),
      avgExercisesPerWorkout: Math.round(avgExercises?.avg || 0),
      currentStreak: 0, // Calculated separately if needed
      longestStreak: 0,
      mostActiveDay: 'Monday', // Would need day-of-week analysis
    },
  });
}));

// ============ Nutrition Log ============

router.get('/nutrition-log', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { date, start_date, end_date } = req.query;
  
  let whereClause = 'WHERE client_id = @clientId';
  const params: Record<string, unknown> = { clientId: req.user!.id };
  
  if (date) {
    whereClause += ' AND CAST(log_date AS DATE) = @date';
    params.date = date;
  } else if (start_date && end_date) {
    whereClause += ' AND log_date >= @startDate AND log_date <= @endDate';
    params.startDate = start_date;
    params.endDate = end_date;
  }
  
  const logs = await queryAll<Record<string, unknown>>(
    `SELECT cnl.*, f.name as food_name, r.name as recipe_name
     FROM client_nutrition_logs cnl
     LEFT JOIN foods f ON cnl.food_id = f.id
     LEFT JOIN recipes r ON cnl.recipe_id = r.id
     ${whereClause}
     ORDER BY cnl.log_date DESC, cnl.meal_type`,
    params
  );
  
  res.json(logs);
}));

router.post('/nutrition-log', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    food_id, recipe_id, custom_food_name, meal_type, quantity, unit, 
    calories, protein_grams, carbs_grams, fat_grams, log_date, notes 
  } = req.body;
  
  if (!meal_type) {
    throw BadRequestError('meal_type is required');
  }
  
  const id = uuidv4();
  await execute(
    `INSERT INTO client_nutrition_logs (id, client_id, food_id, recipe_id, custom_food_name, meal_type, quantity, unit, calories, protein_grams, carbs_grams, fat_grams, log_date, notes)
     VALUES (@id, @clientId, @foodId, @recipeId, @customFoodName, @mealType, @quantity, @unit, @calories, @proteinGrams, @carbsGrams, @fatGrams, @logDate, @notes)`,
    { 
      id, clientId: req.user!.id, foodId: food_id, recipeId: recipe_id, customFoodName: custom_food_name,
      mealType: meal_type, quantity: quantity || 1, unit: unit || 'serving',
      calories, proteinGrams: protein_grams, carbsGrams: carbs_grams, fatGrams: fat_grams,
      logDate: log_date || new Date().toISOString().split('T')[0], notes
    }
  );
  
  const log = await queryOne('SELECT * FROM client_nutrition_logs WHERE id = @id', { id });
  res.status(201).json(log);
}));

router.put('/nutrition-log/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { quantity, unit, notes } = req.body;
  
  await execute(
    `UPDATE client_nutrition_logs SET 
       quantity = COALESCE(@quantity, quantity),
       unit = COALESCE(@unit, unit),
       notes = COALESCE(@notes, notes),
       updated_at = GETUTCDATE()
     WHERE id = @id AND client_id = @clientId`,
    { id: req.params.id, clientId: req.user!.id, quantity, unit, notes }
  );
  
  res.json({ message: 'Nutrition log updated' });
}));

router.delete('/nutrition-log/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute('DELETE FROM client_nutrition_logs WHERE id = @id AND client_id = @clientId', { id: req.params.id, clientId: req.user!.id });
  res.json({ message: 'Nutrition log deleted' });
}));

// ============ Progress Photos ============

router.get('/photos', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const photos = await queryAll(
    `SELECT * FROM progress_photos WHERE client_id = @clientId ORDER BY recorded_at DESC`,
    { clientId: req.user!.id }
  );
  res.json(photos);
}));

router.post('/photos', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { photo_url, thumbnail_url, pose_type, notes, is_private, recorded_at } = req.body;
  
  if (!photo_url) {
    throw BadRequestError('photo_url is required');
  }
  
  const id = uuidv4();
  await execute(
    `INSERT INTO progress_photos (id, client_id, photo_url, thumbnail_url, pose_type, notes, is_private, recorded_at)
     VALUES (@id, @clientId, @photoUrl, @thumbnailUrl, @poseType, @notes, @isPrivate, @recordedAt)`,
    { 
      id, clientId: req.user!.id, photoUrl: photo_url, thumbnailUrl: thumbnail_url,
      poseType: pose_type || 'front', notes, isPrivate: is_private ? 1 : 0,
      recordedAt: recorded_at || new Date().toISOString()
    }
  );
  
  const photo = await queryOne('SELECT * FROM progress_photos WHERE id = @id', { id });
  res.status(201).json(photo);
}));

router.delete('/photos/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await execute('DELETE FROM progress_photos WHERE id = @id AND client_id = @clientId', { id: req.params.id, clientId: req.user!.id });
  res.json({ message: 'Photo deleted' });
}));

// ============ Coach Access to Client Data ============

router.get('/:clientId/measurements', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clientId } = req.params;
  
  // Verify coach has access
  const isCoach = req.user!.roles.includes('coach');
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  
  if (!isCoach && !isSuperAdmin) {
    return res.status(403).json({ error: 'Coach access required' });
  }
  
  if (isCoach && !isSuperAdmin) {
    const relationship = await queryOne(
      `SELECT id FROM coach_client_relationships WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
      { coachId: req.user!.id, clientId }
    );
    if (!relationship) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
    }
  }
  
  const measurements = await queryAll(
    'SELECT * FROM client_measurements WHERE client_id = @clientId ORDER BY recorded_at DESC',
    { clientId }
  );
  res.json(measurements);
}));

router.get('/:clientId/goals', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clientId } = req.params;
  
  const isCoach = req.user!.roles.includes('coach');
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  
  if (!isCoach && !isSuperAdmin) {
    return res.status(403).json({ error: 'Coach access required' });
  }
  
  if (isCoach && !isSuperAdmin) {
    const relationship = await queryOne(
      `SELECT id FROM coach_client_relationships WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
      { coachId: req.user!.id, clientId }
    );
    if (!relationship) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
    }
  }
  
  const goals = await queryAll(
    'SELECT * FROM client_goals WHERE client_id = @clientId ORDER BY created_at DESC',
    { clientId }
  );
  res.json(goals);
}));

router.get('/:clientId/photos', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clientId } = req.params;
  
  const isCoach = req.user!.roles.includes('coach');
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  
  if (!isCoach && !isSuperAdmin) {
    return res.status(403).json({ error: 'Coach access required' });
  }
  
  if (isCoach && !isSuperAdmin) {
    const relationship = await queryOne(
      `SELECT id FROM coach_client_relationships WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
      { coachId: req.user!.id, clientId }
    );
    if (!relationship) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
    }
  }
  
  // Only show non-private photos to coach
  const photos = await queryAll(
    `SELECT * FROM progress_photos WHERE client_id = @clientId AND is_private = 0 ORDER BY recorded_at DESC`,
    { clientId }
  );
  res.json(photos);
}));

router.get('/:clientId/assignments', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clientId } = req.params;
  
  const isCoach = req.user!.roles.includes('coach');
  const isSuperAdmin = req.user!.roles.includes('super_admin');
  
  if (!isCoach && !isSuperAdmin) {
    return res.status(403).json({ error: 'Coach access required' });
  }
  
  const assignments = await queryAll<Record<string, unknown>>(
    `SELECT pa.*, 
            wt.name as workout_template_name, 
            dp.name as diet_plan_name
     FROM plan_assignments pa
     LEFT JOIN workout_templates wt ON pa.workout_template_id = wt.id
     LEFT JOIN diet_plans dp ON pa.diet_plan_id = dp.id
     WHERE pa.client_id = @clientId
     ORDER BY pa.created_at DESC`,
    { clientId }
  );
  res.json(assignments);
}));

export default router;
