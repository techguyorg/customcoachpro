import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute, ensureArray } from '../db';
import { authenticate, AuthenticatedRequest, requireSuperAdmin } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { logAuditEvent, AUDIT_ACTIONS } from '../services/audit';
import { sendEmail } from '../services/email';
import { superAdminPromotionEmail } from '../services/email-templates';

const router = Router();

// ============ Dashboard Stats ============

router.get('/stats', authenticate, requireSuperAdmin, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const users = await queryAll<{ count: number }>('SELECT COUNT(*) as count FROM users');
  const admins = await queryAll<{ count: number }>(`SELECT COUNT(*) as count FROM user_roles WHERE role = 'super_admin'`);
  const coaches = await queryAll<{ count: number }>(`SELECT COUNT(*) as count FROM user_roles WHERE role = 'coach'`);
  const clients = await queryAll<{ count: number }>(`SELECT COUNT(*) as count FROM user_roles WHERE role = 'client'`);
  const activeCoachings = await queryAll<{ count: number }>(`SELECT COUNT(*) as count FROM coach_client_relationships WHERE status = 'active'`);
  const pendingRequests = await queryAll<{ count: number }>(`SELECT COUNT(*) as count FROM coaching_requests WHERE status = 'pending'`);
  
  // Get system content counts
  const systemExercises = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM exercises WHERE is_system = 1');
  const systemWorkoutTemplates = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM workout_templates WHERE is_system = 1');
  const systemDietPlans = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM diet_plans WHERE is_system = 1');
  const systemRecipes = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM recipes WHERE is_system = 1');
  const systemFoods = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM foods WHERE is_system = 1');
  
  res.json({ 
    totalUsers: users[0]?.count || 0, 
    totalAdmins: admins[0]?.count || 0,
    totalCoaches: coaches[0]?.count || 0, 
    totalClients: clients[0]?.count || 0,
    activeCoachings: activeCoachings[0]?.count || 0,
    pendingRequests: pendingRequests[0]?.count || 0,
    systemExercises: systemExercises?.count || 0,
    systemWorkoutTemplates: systemWorkoutTemplates?.count || 0,
    systemDietPlans: systemDietPlans?.count || 0,
    systemRecipes: systemRecipes?.count || 0,
    systemFoods: systemFoods?.count || 0,
  });
}));

router.get('/recent-activity', authenticate, requireSuperAdmin, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  // Get counts for recent activity
  const newUsersToday = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM users WHERE CAST(created_at AS DATE) = CAST(GETUTCDATE() AS DATE)`
  );
  const newUsersWeek = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM users WHERE created_at >= DATEADD(day, -7, GETUTCDATE())`
  );
  const checkinsMonth = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM client_checkins WHERE created_at >= DATEADD(day, -30, GETUTCDATE())`
  );
  const workoutsMonth = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM workout_logs WHERE created_at >= DATEADD(day, -30, GETUTCDATE())`
  );
  
  // Get top coach client count
  const topCoach = await queryOne<{ client_count: number }>(
    `SELECT TOP 1 COUNT(*) as client_count 
     FROM coach_client_relationships 
     WHERE status = 'active' 
     GROUP BY coach_id 
     ORDER BY client_count DESC`
  );

  res.json({
    newUsersToday: newUsersToday?.count || 0,
    newUsersWeek: newUsersWeek?.count || 0,
    checkinsMonth: checkinsMonth?.count || 0,
    workoutsMonth: workoutsMonth?.count || 0,
    topCoachClientCount: topCoach?.client_count || 0,
  });
}));

// ============ User Management ============

router.get('/users', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const users = await queryAll<Record<string, unknown>>(
    `SELECT u.id, u.email, u.is_active, u.email_verified, u.created_at, u.last_login_at, 
            p.full_name, p.avatar_url, p.phone, p.user_id,
            STRING_AGG(ur.role, ',') as roles 
     FROM users u 
     JOIN profiles p ON u.id = p.user_id 
     LEFT JOIN user_roles ur ON u.id = ur.user_id 
     GROUP BY u.id, u.email, u.is_active, u.email_verified, u.created_at, u.last_login_at, 
              p.full_name, p.avatar_url, p.phone, p.user_id
     ORDER BY u.created_at DESC`
  );
  
  // Parse roles from comma-separated string to array
  const usersWithArrayRoles = users.map(user => ({
    ...user,
    roles: ensureArray<string>(user.roles)
  }));
  
  res.json(usersWithArrayRoles);
}));

router.put('/users/:id/status', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { is_active } = req.body;
  await execute('UPDATE users SET is_active = @isActive WHERE id = @id', { id: req.params.id, isActive: is_active ? 1 : 0 });
  
  await logAuditEvent({
    adminUserId: req.user!.id,
    actionType: AUDIT_ACTIONS.USER_STATUS_CHANGED,
    targetUserId: req.params.id as string,
    details: { is_active }
  });
  
  res.json({ message: 'User status updated' });
}));

router.post('/users/roles', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, role } = req.body;
  
  if (!userId || !role) {
    throw BadRequestError('userId and role are required');
  }
  
  // Check if role already exists
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM user_roles WHERE user_id = @userId AND role = @role',
    { userId, role }
  );
  
  if (existing) {
    throw BadRequestError('User already has this role');
  }
  
  const id = uuidv4();
  await execute(
    'INSERT INTO user_roles (id, user_id, role) VALUES (@id, @userId, @role)',
    { id, userId, role }
  );
  
  // If adding coach role, create coach_profile
  if (role === 'coach') {
    const existingProfile = await queryOne('SELECT id FROM coach_profiles WHERE user_id = @userId', { userId });
    if (!existingProfile) {
      await execute(
        'INSERT INTO coach_profiles (id, user_id) VALUES (@id, @userId)',
        { id: uuidv4(), userId }
      );
    }
  }
  
  // If adding client role, create client_profile
  if (role === 'client') {
    const existingProfile = await queryOne('SELECT id FROM client_profiles WHERE user_id = @userId', { userId });
    if (!existingProfile) {
      await execute(
        'INSERT INTO client_profiles (id, user_id) VALUES (@id, @userId)',
        { id: uuidv4(), userId }
      );
    }
  }
  
  await logAuditEvent({
    adminUserId: req.user!.id,
    actionType: AUDIT_ACTIONS.ROLE_ADDED,
    targetUserId: userId,
    details: { role }
  });
  
  res.status(201).json({ message: 'Role added successfully' });
}));

router.delete('/users/:userId/roles/:role', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, role } = req.params;
  
  // Prevent removing own super_admin role
  if (userId === req.user!.id && role === 'super_admin') {
    throw BadRequestError('Cannot remove your own super_admin role');
  }
  
  await execute(
    'DELETE FROM user_roles WHERE user_id = @userId AND role = @role',
    { userId, role }
  );
  
  await logAuditEvent({
    adminUserId: req.user!.id,
    actionType: AUDIT_ACTIONS.ROLE_REMOVED,
    targetUserId: userId as string,
    details: { role }
  });
  
  res.json({ message: 'Role removed successfully' });
}));

router.delete('/users/:id', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Prevent self-deletion
  if (id === req.user!.id) {
    throw BadRequestError('Cannot delete your own account');
  }
  
  // Delete in order to respect foreign keys
  await execute('DELETE FROM user_roles WHERE user_id = @id', { id });
  await execute('DELETE FROM coach_profiles WHERE user_id = @id', { id });
  await execute('DELETE FROM client_profiles WHERE user_id = @id', { id });
  await execute('DELETE FROM profiles WHERE user_id = @id', { id });
  await execute('DELETE FROM refresh_tokens WHERE user_id = @id', { id });
  await execute('DELETE FROM users WHERE id = @id', { id });
  
  res.json({ message: 'User deleted successfully' });
}));

// ============ Super Admin Management ============

router.get('/super-admins', authenticate, requireSuperAdmin, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const admins = await queryAll<Record<string, unknown>>(
    `SELECT ur.user_id, p.email, p.full_name, ur.created_at
     FROM user_roles ur
     JOIN profiles p ON p.user_id = ur.user_id
     WHERE ur.role = 'super_admin'
     ORDER BY ur.created_at`
  );
  res.json(admins);
}));

router.post('/super-admins', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    throw BadRequestError('Email is required');
  }
  
  // Find user by email
  const profile = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM profiles WHERE LOWER(email) = LOWER(@email)',
    { email }
  );
  
  if (!profile) {
    throw NotFoundError('User with this email');
  }
  
  // Check if already super_admin
  const existing = await queryOne(
    `SELECT id FROM user_roles WHERE user_id = @userId AND role = 'super_admin'`,
    { userId: profile.user_id }
  );
  
  if (existing) {
    throw BadRequestError('User is already a super admin');
  }
  
  // Add super_admin role
  await execute(
    'INSERT INTO user_roles (id, user_id, role) VALUES (@id, @userId, @role)',
    { id: uuidv4(), userId: profile.user_id, role: 'super_admin' }
  );
  
  // Get user email for notification
  const userProfile = await queryOne<{ email: string; full_name: string }>(
    'SELECT email, full_name FROM profiles WHERE user_id = @userId',
    { userId: profile.user_id }
  );
  
  // Send email notification
  if (userProfile?.email) {
    await sendEmail({
      to: userProfile.email,
      subject: 'Super Admin Access Granted - CustomCoachPro',
      html: superAdminPromotionEmail(userProfile.full_name || 'there')
    });
  }
  
  await logAuditEvent({
    adminUserId: req.user!.id,
    actionType: AUDIT_ACTIONS.SUPER_ADMIN_ADDED,
    targetUserId: profile.user_id,
    details: { email }
  });
  
  res.status(201).json({ message: 'Super admin role assigned successfully' });
}));

router.delete('/super-admins/:userId', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  
  // Prevent removing own super_admin role
  if (userId === req.user!.id) {
    throw BadRequestError('Cannot remove your own super_admin role');
  }
  
  await execute(
    `DELETE FROM user_roles WHERE user_id = @userId AND role = 'super_admin'`,
    { userId }
  );
  
  await logAuditEvent({
    adminUserId: req.user!.id,
    actionType: AUDIT_ACTIONS.SUPER_ADMIN_REMOVED,
    targetUserId: userId as string
  });
  
  res.json({ message: 'Super admin role revoked successfully' });
}));

// ============ Platform Settings ============

router.get('/settings', authenticate, requireSuperAdmin, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const settings = await queryAll<Record<string, unknown>>(
    'SELECT id, setting_key, setting_value, setting_type, category, description, updated_at FROM platform_settings ORDER BY category, setting_key'
  );
  
  // Parse setting_value JSON
  const parsedSettings = settings.map(s => ({
    ...s,
    setting_value: typeof s.setting_value === 'string' ? 
      (() => { try { return JSON.parse(s.setting_value as string); } catch { return s.setting_value; } })() : 
      s.setting_value
  }));
  
  res.json(parsedSettings);
}));

router.put('/settings/:key', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { key } = req.params;
  const { value, category, description, setting_type } = req.body;
  
  const existing = await queryOne('SELECT id FROM platform_settings WHERE setting_key = @key', { key });
  
  if (existing) {
    await execute(
      `UPDATE platform_settings SET setting_value = @value, updated_at = GETUTCDATE(), updated_by = @updatedBy WHERE setting_key = @key`,
      { key, value: JSON.stringify(value), updatedBy: req.user!.id }
    );
  } else {
    await execute(
      `INSERT INTO platform_settings (id, setting_key, setting_value, setting_type, category, description, updated_by) 
       VALUES (@id, @key, @value, @settingType, @category, @description, @updatedBy)`,
      { 
        id: uuidv4(), 
        key, 
        value: JSON.stringify(value), 
        settingType: setting_type || 'string',
        category: category || 'general',
        description,
        updatedBy: req.user!.id 
      }
    );
  }
  
  await logAuditEvent({
    adminUserId: req.user!.id,
    actionType: AUDIT_ACTIONS.SETTING_UPDATED,
    details: { key, value }
  });
  
  res.json({ message: 'Setting updated successfully' });
}));

// ============ Audit Logs ============

router.get('/audit-logs', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { action_type, user_id, limit = 100, offset = 0 } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params: Record<string, unknown> = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
  
  if (action_type) {
    whereClause += ' AND al.action_type = @actionType';
    params.actionType = action_type;
  }
  if (user_id) {
    whereClause += ' AND al.admin_user_id = @userId';
    params.userId = user_id;
  }
  
  const logs = await queryAll<Record<string, unknown>>(
    `SELECT al.id, al.admin_user_id, al.action_type, al.target_user_id, 
            al.target_resource_type, al.target_resource_id, al.details, al.ip_address, al.created_at,
            p.full_name as admin_name, p.email as admin_email,
            tp.full_name as target_name, tp.email as target_email
     FROM admin_audit_logs al
     LEFT JOIN profiles p ON al.admin_user_id = p.user_id
     LEFT JOIN profiles tp ON al.target_user_id = tp.user_id
     ${whereClause}
     ORDER BY al.created_at DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params
  );
  
  // Reshape to match frontend expected format with nested profile objects
  const reshaped = logs.map(log => {
    // Parse JSON details field
    let parsedDetails = log.details;
    if (typeof log.details === 'string') {
      try { parsedDetails = JSON.parse(log.details as string); } catch { parsedDetails = null; }
    }
    
    return {
      id: log.id,
      admin_user_id: log.admin_user_id,
      action_type: log.action_type,
      target_user_id: log.target_user_id,
      target_resource_type: log.target_resource_type,
      target_resource_id: log.target_resource_id,
      details: parsedDetails,
      ip_address: log.ip_address,
      created_at: log.created_at,
      admin_profile: log.admin_name ? {
        full_name: log.admin_name,
        email: log.admin_email,
      } : null,
      target_profile: log.target_name ? {
        full_name: log.target_name,
        email: log.target_email,
      } : null,
    };
  });
  
  res.json(reshaped);
}));

// ============ Pending Requests ============

router.get('/pending-requests', authenticate, requireSuperAdmin, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const requests = await queryAll<Record<string, unknown>>(
    `SELECT cr.id, cr.status, cr.message, cr.created_at,
            cp.full_name as client_name, cp.email as client_email,
            cop.full_name as coach_name, cop.email as coach_email
     FROM coaching_requests cr
     JOIN profiles cp ON cr.client_id = cp.user_id
     JOIN profiles cop ON cr.coach_id = cop.user_id
     WHERE cr.status = 'pending'
     ORDER BY cr.created_at DESC`
  );
  res.json(requests);
}));

// ============ Relationships ============

router.get('/relationships', authenticate, requireSuperAdmin, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const relationships = await queryAll<Record<string, unknown>>(
    `SELECT ccr.id, ccr.status, ccr.started_at, ccr.ended_at, ccr.notes, ccr.created_at,
            cp.full_name as client_name, cp.email as client_email, cp.user_id as client_id, cp.avatar_url as client_avatar,
            cop.full_name as coach_name, cop.email as coach_email, cop.user_id as coach_id, cop.avatar_url as coach_avatar
     FROM coach_client_relationships ccr
     JOIN profiles cp ON ccr.client_id = cp.user_id
     JOIN profiles cop ON ccr.coach_id = cop.user_id
     ORDER BY ccr.created_at DESC`
  );
  
  // Reshape to match frontend expected format with nested coach/client objects
  const reshaped = relationships.map(r => ({
    id: r.id,
    status: r.status,
    started_at: r.started_at,
    ended_at: r.ended_at,
    notes: r.notes,
    created_at: r.created_at,
    coach_id: r.coach_id,
    client_id: r.client_id,
    coach: {
      full_name: r.coach_name,
      email: r.coach_email,
      avatar_url: r.coach_avatar,
    },
    client: {
      full_name: r.client_name,
      email: r.client_email,
      avatar_url: r.client_avatar,
    },
  }));
  
  res.json(reshaped);
}));

// ============ Content Export/Import ============

router.get('/content/:type/export', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { type } = req.params;
  
  let data: unknown[] = [];
  
  switch (type) {
    case 'exercises':
      data = await queryAll('SELECT * FROM exercises WHERE is_system = 1');
      break;
    case 'workout_templates':
      data = await queryAll('SELECT * FROM workout_templates WHERE is_system = 1');
      break;
    case 'diet_plans':
      data = await queryAll('SELECT * FROM diet_plans WHERE is_system = 1');
      break;
    case 'foods':
      data = await queryAll('SELECT * FROM foods WHERE is_system = 1');
      break;
    case 'recipes':
      data = await queryAll('SELECT * FROM recipes WHERE is_system = 1');
      break;
    default:
      throw BadRequestError(`Unknown content type: ${type}`);
  }
  
  res.json({ type, count: data.length, data });
}));

router.post('/content/:type/import', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { type } = req.params;
  const { data } = req.body;
  
  if (!Array.isArray(data)) {
    throw BadRequestError('Data must be an array');
  }
  
  let importedCount = 0;
  let skippedCount = 0;
  
  for (const item of data) {
    try {
      const id = uuidv4();
      
      switch (type) {
        case 'exercises':
          await execute(
            `INSERT INTO exercises (id, name, description, instructions, tips, common_mistakes, 
                                   primary_muscle, secondary_muscles, equipment, difficulty, 
                                   exercise_type, video_url, is_system, created_by)
             VALUES (@id, @name, @description, @instructions, @tips, @commonMistakes,
                     @primaryMuscle, @secondaryMuscles, @equipment, @difficulty,
                     @exerciseType, @videoUrl, 1, @createdBy)`,
            {
              id,
              name: item.name,
              description: item.description || null,
              instructions: JSON.stringify(item.instructions || []),
              tips: JSON.stringify(item.tips || []),
              commonMistakes: JSON.stringify(item.common_mistakes || []),
              primaryMuscle: item.primary_muscle,
              secondaryMuscles: JSON.stringify(item.secondary_muscles || []),
              equipment: item.equipment,
              difficulty: item.difficulty || 'intermediate',
              exerciseType: item.exercise_type || 'compound',
              videoUrl: item.video_url || null,
              createdBy: req.user!.id
            }
          );
          importedCount++;
          break;
          
        case 'foods':
          await execute(
            `INSERT INTO foods (id, name, category, subcategory, brand, calories_per_100g, 
                               protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g,
                               default_serving_size, default_serving_unit, is_system, created_by)
             VALUES (@id, @name, @category, @subcategory, @brand, @calories,
                     @protein, @carbs, @fat, @fiber, @servingSize, @servingUnit, 1, @createdBy)`,
            {
              id,
              name: item.name,
              category: item.category,
              subcategory: item.subcategory || null,
              brand: item.brand || null,
              calories: item.calories_per_100g || 0,
              protein: item.protein_per_100g || 0,
              carbs: item.carbs_per_100g || 0,
              fat: item.fat_per_100g || 0,
              fiber: item.fiber_per_100g || 0,
              servingSize: item.default_serving_size || 100,
              servingUnit: item.default_serving_unit || 'g',
              createdBy: req.user!.id
            }
          );
          importedCount++;
          break;
          
        case 'recipes':
          await execute(
            `INSERT INTO recipes (id, name, description, category, servings, prep_time_minutes,
                                 cook_time_minutes, calories_per_serving, protein_per_serving,
                                 carbs_per_serving, fat_per_serving, instructions, is_system, created_by)
             VALUES (@id, @name, @description, @category, @servings, @prepTime,
                     @cookTime, @calories, @protein, @carbs, @fat, @instructions, 1, @createdBy)`,
            {
              id,
              name: item.name,
              description: item.description || null,
              category: item.category || null,
              servings: item.servings || 1,
              prepTime: item.prep_time_minutes || null,
              cookTime: item.cook_time_minutes || null,
              calories: item.calories_per_serving || 0,
              protein: item.protein_per_serving || 0,
              carbs: item.carbs_per_serving || 0,
              fat: item.fat_per_serving || 0,
              instructions: item.instructions || null,
              createdBy: req.user!.id
            }
          );
          importedCount++;
          break;
          
        case 'workout_templates':
          await execute(
            `INSERT INTO workout_templates (id, name, description, goal, difficulty, days_per_week,
                                           duration_weeks, template_type, is_system, created_by)
             VALUES (@id, @name, @description, @goal, @difficulty, @daysPerWeek,
                     @durationWeeks, @templateType, 1, @createdBy)`,
            {
              id,
              name: item.name,
              description: item.description || null,
              goal: item.goal || null,
              difficulty: item.difficulty || 'intermediate',
              daysPerWeek: item.days_per_week || 3,
              durationWeeks: item.duration_weeks || 4,
              templateType: item.template_type || 'custom',
              createdBy: req.user!.id
            }
          );
          importedCount++;
          break;
          
        case 'diet_plans':
          await execute(
            `INSERT INTO diet_plans (id, name, description, goal, dietary_type, calories_target,
                                    protein_grams, carbs_grams, fat_grams, meals_per_day, is_system, created_by)
             VALUES (@id, @name, @description, @goal, @dietaryType, @calories,
                     @protein, @carbs, @fat, @mealsPerDay, 1, @createdBy)`,
            {
              id,
              name: item.name,
              description: item.description || null,
              goal: item.goal || null,
              dietaryType: item.dietary_type || null,
              calories: item.calories_target || 2000,
              protein: item.protein_grams || 150,
              carbs: item.carbs_grams || 200,
              fat: item.fat_grams || 70,
              mealsPerDay: item.meals_per_day || 3,
              createdBy: req.user!.id
            }
          );
          importedCount++;
          break;
          
        default:
          throw BadRequestError(`Unknown content type: ${type}`);
      }
    } catch (error: unknown) {
      // Skip duplicates or errors for individual items
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to import item: ${item.name}`, errMsg);
      skippedCount++;
    }
  }
  
  res.json({ 
    message: `Import completed: ${importedCount} imported, ${skippedCount} skipped`, 
    imported: importedCount,
    skipped: skippedCount
  });
}));

// ============ Data Integrity - Missing Profiles Scanner ============

router.get('/data-integrity/missing-profiles', authenticate, requireSuperAdmin, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  // Find users who exist in the users table but are missing a profiles row
  const missingProfiles = await queryAll<{
    user_id: string;
    email: string;
    created_at: string;
  }>(
    `SELECT u.id as user_id, u.email, u.created_at
     FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE p.id IS NULL
     ORDER BY u.created_at DESC`
  );

  // Also find coach_profiles missing their base profile
  const coachesWithoutProfiles = await queryAll<{
    user_id: string;
    coach_profile_id: string;
  }>(
    `SELECT cp.user_id, cp.id as coach_profile_id
     FROM coach_profiles cp
     LEFT JOIN profiles p ON cp.user_id = p.user_id
     WHERE p.id IS NULL`
  );

  res.json({
    missingProfiles,
    coachesWithoutProfiles,
    summary: {
      usersMissingProfiles: missingProfiles.length,
      coachesMissingBaseProfiles: coachesWithoutProfiles.length,
      totalIssues: missingProfiles.length,
    }
  });
}));

router.post('/data-integrity/repair-profiles', authenticate, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw BadRequestError('userIds array is required');
  }

  let repairedCount = 0;
  const errors: { userId: string; error: string }[] = [];

  for (const userId of userIds) {
    try {
      // Get user email to use as fallback for full_name
      const user = await queryOne<{ email: string }>(
        'SELECT email FROM users WHERE id = @userId',
        { userId }
      );

      if (!user) {
        errors.push({ userId, error: 'User not found' });
        continue;
      }

      // Use MERGE to create profile if missing
      await execute(
        `MERGE profiles AS target
         USING (SELECT @userId AS user_id) AS source
         ON target.user_id = source.user_id
         WHEN NOT MATCHED THEN
           INSERT (id, user_id, full_name, email, created_at, updated_at)
           VALUES (NEWID(), @userId, '', @email, GETUTCDATE(), GETUTCDATE());`,
        { userId, email: user.email }
      );

      repairedCount++;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ userId, error: errMsg });
    }
  }

  // Log the repair action
  await logAuditEvent(req.user!.id, AUDIT_ACTIONS.ADMIN_ACTION, 'data_integrity', null, {
    action: 'repair_missing_profiles',
    repairedCount,
    errorCount: errors.length,
  });

  res.json({
    message: `Repaired ${repairedCount} profiles`,
    repairedCount,
    errors,
  });
}));

export default router;
