-- =============================================================================
-- CustomCoachPro Azure SQL Database Schema - VERIFICATION SCRIPT
-- =============================================================================
-- Run this script to verify your database schema matches backend expectations.
-- Any failures indicate a schema mismatch that will cause runtime errors.
-- =============================================================================

SET NOCOUNT ON;

DECLARE @errors INT = 0;
DECLARE @checks INT = 0;

PRINT '=== CustomCoachPro Schema Verification ===';
PRINT '';

-- =========================================
-- HELPER: Check if column exists
-- =========================================

-- Check users table columns
PRINT '1. Checking users table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'id')
BEGIN PRINT '   ❌ MISSING: users.id'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email')
BEGIN PRINT '   ❌ MISSING: users.email'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash')
BEGIN PRINT '   ❌ MISSING: users.password_hash'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active')
BEGIN PRINT '   ❌ MISSING: users.is_active'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified')
BEGIN PRINT '   ❌ MISSING: users.email_verified'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_token')
BEGIN PRINT '   ❌ MISSING: users.email_verification_token'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_expires')
BEGIN PRINT '   ❌ MISSING: users.email_verification_expires'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_reset_token')
BEGIN PRINT '   ❌ MISSING: users.password_reset_token'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_reset_expires')
BEGIN PRINT '   ❌ MISSING: users.password_reset_expires'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at')
BEGIN PRINT '   ❌ MISSING: users.last_login_at'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'login_count')
BEGIN PRINT '   ❌ MISSING: users.login_count'; SET @errors = @errors + 1; END

PRINT '   ✓ users table checked';

-- Check user_roles table
PRINT '2. Checking user_roles table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_roles')
BEGIN PRINT '   ❌ MISSING: user_roles table'; SET @errors = @errors + 1; END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_roles' AND COLUMN_NAME = 'user_id')
    BEGIN PRINT '   ❌ MISSING: user_roles.user_id'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_roles' AND COLUMN_NAME = 'role')
    BEGIN PRINT '   ❌ MISSING: user_roles.role'; SET @errors = @errors + 1; END
END
PRINT '   ✓ user_roles table checked';

-- Check refresh_tokens table
PRINT '3. Checking refresh_tokens table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'refresh_tokens')
BEGIN PRINT '   ❌ MISSING: refresh_tokens table'; SET @errors = @errors + 1; END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'refresh_tokens' AND COLUMN_NAME = 'token')
    BEGIN PRINT '   ❌ MISSING: refresh_tokens.token'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'refresh_tokens' AND COLUMN_NAME = 'expires_at')
    BEGIN PRINT '   ❌ MISSING: refresh_tokens.expires_at'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'refresh_tokens' AND COLUMN_NAME = 'revoked_at')
    BEGIN PRINT '   ❌ MISSING: refresh_tokens.revoked_at'; SET @errors = @errors + 1; END
END
PRINT '   ✓ refresh_tokens table checked';

-- Check profiles table
PRINT '4. Checking profiles table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'profiles')
BEGIN PRINT '   ❌ MISSING: profiles table'; SET @errors = @errors + 1; END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'user_id')
    BEGIN PRINT '   ❌ MISSING: profiles.user_id'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'full_name')
    BEGIN PRINT '   ❌ MISSING: profiles.full_name'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'email')
    BEGIN PRINT '   ❌ MISSING: profiles.email'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'avatar_url')
    BEGIN PRINT '   ❌ MISSING: profiles.avatar_url'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'bio')
    BEGIN PRINT '   ❌ MISSING: profiles.bio'; SET @errors = @errors + 1; END
END
PRINT '   ✓ profiles table checked';

-- Check client_profiles table
PRINT '5. Checking client_profiles table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'client_profiles')
BEGIN PRINT '   ❌ MISSING: client_profiles table'; SET @errors = @errors + 1; END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'client_profiles' AND COLUMN_NAME = 'user_id')
    BEGIN PRINT '   ❌ MISSING: client_profiles.user_id'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'client_profiles' AND COLUMN_NAME = 'fitness_level')
    BEGIN PRINT '   ❌ MISSING: client_profiles.fitness_level'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'client_profiles' AND COLUMN_NAME = 'fitness_goals')
    BEGIN PRINT '   ❌ MISSING: client_profiles.fitness_goals'; SET @errors = @errors + 1; END
END
PRINT '   ✓ client_profiles table checked';

-- Check coach_profiles table
PRINT '6. Checking coach_profiles table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'coach_profiles')
BEGIN PRINT '   ❌ MISSING: coach_profiles table'; SET @errors = @errors + 1; END
PRINT '   ✓ coach_profiles table checked';

-- Check exercises table
PRINT '7. Checking exercises table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'exercises')
BEGIN PRINT '   ❌ MISSING: exercises table'; SET @errors = @errors + 1; END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'exercises' AND COLUMN_NAME = 'name')
    BEGIN PRINT '   ❌ MISSING: exercises.name'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'exercises' AND COLUMN_NAME = 'primary_muscle')
    BEGIN PRINT '   ❌ MISSING: exercises.primary_muscle'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'exercises' AND COLUMN_NAME = 'equipment')
    BEGIN PRINT '   ❌ MISSING: exercises.equipment'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'exercises' AND COLUMN_NAME = 'difficulty')
    BEGIN PRINT '   ❌ MISSING: exercises.difficulty'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'exercises' AND COLUMN_NAME = 'is_system')
    BEGIN PRINT '   ❌ MISSING: exercises.is_system'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'exercises' AND COLUMN_NAME = 'exercise_type')
    BEGIN PRINT '   ❌ MISSING: exercises.exercise_type'; SET @errors = @errors + 1; END
END
PRINT '   ✓ exercises table checked';

-- Check workout_templates table
PRINT '8. Checking workout_templates table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'workout_templates')
BEGIN PRINT '   ❌ MISSING: workout_templates table'; SET @errors = @errors + 1; END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'name')
    BEGIN PRINT '   ❌ MISSING: workout_templates.name'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'difficulty')
    BEGIN PRINT '   ❌ MISSING: workout_templates.difficulty'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'days_per_week')
    BEGIN PRINT '   ❌ MISSING: workout_templates.days_per_week'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'category')
    BEGIN PRINT '   ❌ MISSING: workout_templates.category'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'is_system')
    BEGIN PRINT '   ❌ MISSING: workout_templates.is_system'; SET @errors = @errors + 1; END
END
PRINT '   ✓ workout_templates table checked';

-- Check workout_template_weeks table
PRINT '9. Checking workout_template_weeks table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'workout_template_weeks')
BEGIN PRINT '   ❌ MISSING: workout_template_weeks table'; SET @errors = @errors + 1; END
PRINT '   ✓ workout_template_weeks table checked';

-- Check workout_template_days table
PRINT '10. Checking workout_template_days table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'workout_template_days')
BEGIN PRINT '   ❌ MISSING: workout_template_days table'; SET @errors = @errors + 1; END
PRINT '   ✓ workout_template_days table checked';

-- Check workout_template_exercises table
PRINT '11. Checking workout_template_exercises table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'workout_template_exercises')
BEGIN PRINT '   ❌ MISSING: workout_template_exercises table'; SET @errors = @errors + 1; END
PRINT '   ✓ workout_template_exercises table checked';

-- Check foods table
PRINT '12. Checking foods table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'foods')
BEGIN PRINT '   ❌ MISSING: foods table'; SET @errors = @errors + 1; END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'foods' AND COLUMN_NAME = 'name')
    BEGIN PRINT '   ❌ MISSING: foods.name'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'foods' AND COLUMN_NAME = 'category')
    BEGIN PRINT '   ❌ MISSING: foods.category'; SET @errors = @errors + 1; END
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'foods' AND COLUMN_NAME = 'calories_per_100g')
    BEGIN PRINT '   ❌ MISSING: foods.calories_per_100g'; SET @errors = @errors + 1; END
END
PRINT '   ✓ foods table checked';

-- Check recipes table
PRINT '13. Checking recipes table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'recipes')
BEGIN PRINT '   ❌ MISSING: recipes table'; SET @errors = @errors + 1; END
PRINT '   ✓ recipes table checked';

-- Check diet_plans table
PRINT '14. Checking diet_plans table...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'diet_plans')
BEGIN PRINT '   ❌ MISSING: diet_plans table'; SET @errors = @errors + 1; END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'diet_plans' AND COLUMN_NAME = 'is_active')
    BEGIN PRINT '   ❌ MISSING: diet_plans.is_active'; SET @errors = @errors + 1; END
END
PRINT '   ✓ diet_plans table checked';

-- Check remaining tables
PRINT '15. Checking remaining tables...';
SET @checks = @checks + 1;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'workout_logs')
BEGIN PRINT '   ❌ MISSING: workout_logs table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'workout_log_exercises')
BEGIN PRINT '   ❌ MISSING: workout_log_exercises table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'client_measurements')
BEGIN PRINT '   ❌ MISSING: client_measurements table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'client_goals')
BEGIN PRINT '   ❌ MISSING: client_goals table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'client_checkins')
BEGIN PRINT '   ❌ MISSING: client_checkins table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'coach_client_relationships')
BEGIN PRINT '   ❌ MISSING: coach_client_relationships table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'plan_assignments')
BEGIN PRINT '   ❌ MISSING: plan_assignments table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'messages')
BEGIN PRINT '   ❌ MISSING: messages table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'notifications')
BEGIN PRINT '   ❌ MISSING: notifications table'; SET @errors = @errors + 1; END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_favorites')
BEGIN PRINT '   ❌ MISSING: user_favorites table'; SET @errors = @errors + 1; END

PRINT '   ✓ remaining tables checked';

-- =========================================
-- SUMMARY
-- =========================================
PRINT '';
PRINT '===========================================';
IF @errors = 0
BEGIN
    PRINT '✅ SCHEMA VERIFICATION PASSED';
    PRINT 'All ' + CAST(@checks AS NVARCHAR(10)) + ' checks passed successfully.';
    PRINT 'Your database schema matches backend expectations.';
END
ELSE
BEGIN
    PRINT '❌ SCHEMA VERIFICATION FAILED';
    PRINT CAST(@errors AS NVARCHAR(10)) + ' errors found.';
    PRINT 'Run azure-sql-schema.patch.sql to fix issues.';
END
PRINT '===========================================';
