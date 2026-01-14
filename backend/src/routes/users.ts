import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, queryAll, execute, transformRow } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ==================== Onboarding ====================

// Get onboarding status
router.get('/onboarding', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await queryOne<{ onboarding_completed: number; onboarding_step: number }>(
    'SELECT onboarding_completed, onboarding_step FROM profiles WHERE user_id = @userId',
    { userId: req.user!.id }
  );
  
  res.json({
    onboarding_completed: profile?.onboarding_completed === 1,
    onboarding_step: profile?.onboarding_step || 0,
  });
}));

// Update onboarding status
router.put('/onboarding', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { completed, step } = req.body;
  
  // Build update query with proper handling for completed flag
  const updates: string[] = [];
  const params: Record<string, unknown> = { userId: req.user!.id };
  
  if (completed !== undefined) {
    updates.push('onboarding_completed = @completed');
    params.completed = completed ? 1 : 0;
  }
  if (step !== undefined) {
    updates.push('onboarding_step = @step');
    params.step = step;
  }
  updates.push('updated_at = GETUTCDATE()');
  
  if (updates.length > 1) {
    await execute(
      `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = @userId`,
      params
    );
  }
  
  res.json({ message: 'Onboarding status updated' });
}));

// Complete onboarding - save all profile data
router.post('/onboarding', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    dateOfBirth, gender, heightCm, currentWeightKg, targetWeightKg,
    fitnessGoals, fitnessLevel, medicalConditions, dietaryRestrictions
  } = req.body;
  
  // Update profiles table (basic info)
  await execute(
    `UPDATE profiles SET 
       date_of_birth = COALESCE(@dateOfBirth, date_of_birth),
       gender = COALESCE(@gender, gender),
       onboarding_completed = 1,
       updated_at = GETUTCDATE()
     WHERE user_id = @userId`,
    { userId: req.user!.id, dateOfBirth, gender }
  );
  
  // Check if client_profiles exists
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
        heightCm,
        currentWeight: currentWeightKg,
        targetWeight: targetWeightKg,
        fitnessGoals: fitnessGoals ? JSON.stringify(fitnessGoals) : null,
        fitnessLevel,
        medicalConditions,
        dietaryRestrictions: dietaryRestrictions ? JSON.stringify(dietaryRestrictions) : null,
      }
    );
  } else {
    await execute(
      `INSERT INTO client_profiles (id, user_id, height_cm, current_weight_kg, target_weight_kg, fitness_goals, fitness_level, medical_conditions, dietary_restrictions)
       VALUES (@id, @userId, @heightCm, @currentWeight, @targetWeight, @fitnessGoals, @fitnessLevel, @medicalConditions, @dietaryRestrictions)`,
      {
        id: uuidv4(),
        userId: req.user!.id,
        heightCm,
        currentWeight: currentWeightKg,
        targetWeight: targetWeightKg,
        fitnessGoals: fitnessGoals ? JSON.stringify(fitnessGoals) : null,
        fitnessLevel,
        medicalConditions,
        dietaryRestrictions: dietaryRestrictions ? JSON.stringify(dietaryRestrictions) : null,
      }
    );
  }
  
  // Also add initial measurement if weight provided
  if (currentWeightKg) {
    const measurementExists = await queryOne(
      'SELECT id FROM client_measurements WHERE client_id = @userId',
      { userId: req.user!.id }
    );
    
    if (!measurementExists) {
      await execute(
        `INSERT INTO client_measurements (id, client_id, weight_kg, recorded_at)
         VALUES (@id, @clientId, @weight, GETUTCDATE())`,
        { id: uuidv4(), clientId: req.user!.id, weight: currentWeightKg }
      );
    }
  }
  
  res.json({ message: 'Profile completed successfully' });
}));

router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await queryOne(
    `SELECT full_name, phone, bio, avatar_url, date_of_birth, gender
     FROM profiles
     WHERE user_id = @userId`,
    { userId: req.user!.id }
  );
  
  let clientProfile = await queryOne<Record<string, unknown>>(
    `SELECT height_cm, current_weight_kg, target_weight_kg, fitness_level, 
            fitness_goals, dietary_restrictions, medical_conditions,
            email_checkin_submitted, email_checkin_reviewed, email_plan_assigned
     FROM client_profiles 
     WHERE user_id = @userId`,
    { userId: req.user!.id }
  );
  
  // Parse JSON arrays using the db utility
  if (clientProfile) {
    clientProfile = transformRow(clientProfile, ['fitness_goals', 'dietary_restrictions'], ['fitness_goals', 'dietary_restrictions']);
  }
  
  res.json({
    profile: profile || {},
    clientProfile: clientProfile || null,
  });
}));

router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { profile, clientProfile } = req.body;
  
  // Handle both old format (flat) and new format (nested)
  const profileData = profile || req.body;
  const full_name = profileData.full_name;
  const bio = profileData.bio;
  const phone = profileData.phone;
  const date_of_birth = profileData.date_of_birth;
  const gender = profileData.gender;
  const avatar_url = profileData.avatar_url;
  
  // Update profiles table
  await execute(
    `UPDATE profiles SET 
       full_name = COALESCE(@fullName, full_name), 
       bio = COALESCE(@bio, bio), 
       phone = COALESCE(@phone, phone), 
       date_of_birth = COALESCE(@dateOfBirth, date_of_birth), 
       gender = COALESCE(@gender, gender), 
       avatar_url = COALESCE(@avatarUrl, avatar_url), 
       updated_at = GETUTCDATE() 
     WHERE user_id = @userId`,
    { userId: req.user!.id, fullName: full_name, bio, phone, dateOfBirth: date_of_birth, gender, avatarUrl: avatar_url }
  );
  
  // Update client_profiles if clientProfile data provided
  if (clientProfile) {
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
          heightCm: clientProfile.height_cm,
          currentWeight: clientProfile.current_weight_kg,
          targetWeight: clientProfile.target_weight_kg,
          fitnessGoals: clientProfile.fitness_goals ? JSON.stringify(clientProfile.fitness_goals) : null,
          fitnessLevel: clientProfile.fitness_level,
          medicalConditions: clientProfile.medical_conditions,
          dietaryRestrictions: clientProfile.dietary_restrictions ? JSON.stringify(clientProfile.dietary_restrictions) : null,
        }
      );
    } else {
      await execute(
        `INSERT INTO client_profiles (id, user_id, height_cm, current_weight_kg, target_weight_kg, fitness_goals, fitness_level, medical_conditions, dietary_restrictions)
         VALUES (@id, @userId, @heightCm, @currentWeight, @targetWeight, @fitnessGoals, @fitnessLevel, @medicalConditions, @dietaryRestrictions)`,
        {
          id: uuidv4(),
          userId: req.user!.id,
          heightCm: clientProfile.height_cm,
          currentWeight: clientProfile.current_weight_kg,
          targetWeight: clientProfile.target_weight_kg,
          fitnessGoals: clientProfile.fitness_goals ? JSON.stringify(clientProfile.fitness_goals) : null,
          fitnessLevel: clientProfile.fitness_level,
          medicalConditions: clientProfile.medical_conditions,
          dietaryRestrictions: clientProfile.dietary_restrictions ? JSON.stringify(clientProfile.dietary_restrictions) : null,
        }
      );
    }
  }
  
  // Return updated profile with client data
  const updatedProfile = await queryOne(
    `SELECT p.*, cp.height_cm, cp.current_weight_kg, cp.target_weight_kg, 
            cp.fitness_goals, cp.fitness_level, cp.medical_conditions, cp.dietary_restrictions
     FROM profiles p
     LEFT JOIN client_profiles cp ON p.user_id = cp.user_id
     WHERE p.user_id = @userId`,
    { userId: req.user!.id }
  );
  
  res.json(updatedProfile);
}));

// Get email preferences
router.get('/email-preferences', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const prefs = await queryOne(
    `SELECT email_checkin_reminder, email_checkin_submitted, email_checkin_reviewed, 
            email_plan_assigned, email_coach_message, email_marketing
     FROM user_email_preferences WHERE user_id = @userId`,
    { userId: req.user!.id }
  );

  if (!prefs) {
    // Return defaults
    res.json({
      email_checkin_reminder: true,
      email_checkin_submitted: true,
      email_checkin_reviewed: true,
      email_plan_assigned: true,
      email_coach_message: true,
      email_marketing: false,
    });
    return;
  }

  res.json(prefs);
}));

// Update email preferences
router.put('/email-preferences', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    email_checkin_reminder, 
    email_checkin_submitted, 
    email_checkin_reviewed,
    email_plan_assigned,
    email_coach_message,
    email_marketing
  } = req.body;

  // Upsert preferences
  const existing = await queryOne('SELECT id FROM user_email_preferences WHERE user_id = @userId', { userId: req.user!.id });

  if (existing) {
    await execute(
      `UPDATE user_email_preferences SET
         email_checkin_reminder = @checkinReminder,
         email_checkin_submitted = @checkinSubmitted,
         email_checkin_reviewed = @checkinReviewed,
         email_plan_assigned = @planAssigned,
         email_coach_message = @coachMessage,
         email_marketing = @marketing,
         updated_at = GETUTCDATE()
       WHERE user_id = @userId`,
      {
        userId: req.user!.id,
        checkinReminder: email_checkin_reminder ? 1 : 0,
        checkinSubmitted: email_checkin_submitted ? 1 : 0,
        checkinReviewed: email_checkin_reviewed ? 1 : 0,
        planAssigned: email_plan_assigned ? 1 : 0,
        coachMessage: email_coach_message ? 1 : 0,
        marketing: email_marketing ? 1 : 0,
      }
    );
  } else {
    await execute(
      `INSERT INTO user_email_preferences (id, user_id, email_checkin_reminder, email_checkin_submitted, email_checkin_reviewed, email_plan_assigned, email_coach_message, email_marketing)
       VALUES (@id, @userId, @checkinReminder, @checkinSubmitted, @checkinReviewed, @planAssigned, @coachMessage, @marketing)`,
      {
        id: uuidv4(),
        userId: req.user!.id,
        checkinReminder: email_checkin_reminder ? 1 : 0,
        checkinSubmitted: email_checkin_submitted ? 1 : 0,
        checkinReviewed: email_checkin_reviewed ? 1 : 0,
        planAssigned: email_plan_assigned ? 1 : 0,
        coachMessage: email_coach_message ? 1 : 0,
        marketing: email_marketing ? 1 : 0,
      }
    );
  }

  res.json({ message: 'Preferences saved' });
}));

// Change password endpoint
router.put('/password', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw BadRequestError('New password must be at least 6 characters');
  }

  // Get current user with password hash
  const user = await queryOne<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = @userId',
    { userId: req.user!.id }
  );

  if (!user) {
    throw NotFoundError('User not found');
  }

  // If currentPassword is provided, verify it (optional for logged-in users)
  if (currentPassword) {
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      throw BadRequestError('Current password is incorrect');
    }
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

  // Update password
  await execute(
    'UPDATE users SET password_hash = @hash WHERE id = @userId',
    { hash: passwordHash, userId: req.user!.id }
  );

  // Revoke all other refresh tokens for security
  await execute(
    'UPDATE refresh_tokens SET revoked_at = GETUTCDATE() WHERE user_id = @userId AND revoked_at IS NULL',
    { userId: req.user!.id }
  );

  res.json({ message: 'Password updated successfully' });
}));

export default router;
