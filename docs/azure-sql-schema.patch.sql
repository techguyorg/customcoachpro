-- =============================================================================
-- CustomCoachPro Azure SQL Database Schema - PATCH SCRIPT
-- =============================================================================
-- Run this script if you already have tables created but need to fix mismatches.
-- This script uses conditional logic to only add columns that don't exist.
-- =============================================================================

-- =========================================
-- PATCH 1: users table
-- =========================================
-- Add missing columns to users table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active')
BEGIN
    ALTER TABLE dbo.users ADD is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT(1);
    PRINT 'Added is_active to users';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified')
BEGIN
    ALTER TABLE dbo.users ADD email_verified BIT NOT NULL CONSTRAINT DF_users_email_verified DEFAULT(0);
    PRINT 'Added email_verified to users';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_token')
BEGIN
    ALTER TABLE dbo.users ADD email_verification_token NVARCHAR(255) NULL;
    PRINT 'Added email_verification_token to users';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_expires')
BEGIN
    ALTER TABLE dbo.users ADD email_verification_expires DATETIME2 NULL;
    PRINT 'Added email_verification_expires to users';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_reset_token')
BEGIN
    ALTER TABLE dbo.users ADD password_reset_token NVARCHAR(255) NULL;
    PRINT 'Added password_reset_token to users';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_reset_expires')
BEGIN
    ALTER TABLE dbo.users ADD password_reset_expires DATETIME2 NULL;
    PRINT 'Added password_reset_expires to users';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at')
BEGIN
    ALTER TABLE dbo.users ADD last_login_at DATETIME2 NULL;
    PRINT 'Added last_login_at to users';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'login_count')
BEGIN
    ALTER TABLE dbo.users ADD login_count INT NOT NULL CONSTRAINT DF_users_login_count DEFAULT(0);
    PRINT 'Added login_count to users';
END

-- Handle renamed columns (if old names exist, rename them)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_token')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_token')
BEGIN
    EXEC sp_rename 'dbo.users.verification_token', 'email_verification_token', 'COLUMN';
    PRINT 'Renamed verification_token to email_verification_token';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_token_expires')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_expires')
BEGIN
    EXEC sp_rename 'dbo.users.verification_token_expires', 'email_verification_expires', 'COLUMN';
    PRINT 'Renamed verification_token_expires to email_verification_expires';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_reset_token')
BEGIN
    EXEC sp_rename 'dbo.users.reset_token', 'password_reset_token', 'COLUMN';
    PRINT 'Renamed reset_token to password_reset_token';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token_expires')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_reset_expires')
BEGIN
    EXEC sp_rename 'dbo.users.reset_token_expires', 'password_reset_expires', 'COLUMN';
    PRINT 'Renamed reset_token_expires to password_reset_expires';
END

-- Fix full_name if it's NOT NULL (backend doesn't write to users.full_name)
-- Make it nullable to avoid insert failures
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'full_name' AND IS_NULLABLE = 'NO'
)
BEGIN
    ALTER TABLE dbo.users ALTER COLUMN full_name NVARCHAR(255) NULL;
    PRINT 'Made users.full_name nullable';
END

-- =========================================
-- PATCH 2: refresh_tokens table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'refresh_tokens' AND COLUMN_NAME = 'revoked_at')
BEGIN
    ALTER TABLE dbo.refresh_tokens ADD revoked_at DATETIME2 NULL;
    PRINT 'Added revoked_at to refresh_tokens';
END

-- =========================================
-- PATCH 3: workout_templates table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'category')
BEGIN
    ALTER TABLE dbo.workout_templates ADD category NVARCHAR(100) NULL;
    PRINT 'Added category to workout_templates';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'template_type')
BEGIN
    ALTER TABLE dbo.workout_templates ADD template_type NVARCHAR(50) NULL;
    PRINT 'Added template_type to workout_templates';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'is_periodized')
BEGIN
    ALTER TABLE dbo.workout_templates ADD is_periodized BIT DEFAULT 0;
    PRINT 'Added is_periodized to workout_templates';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'cloned_from')
BEGIN
    ALTER TABLE dbo.workout_templates ADD cloned_from NVARCHAR(36) NULL;
    PRINT 'Added cloned_from to workout_templates';
END

-- =========================================
-- PATCH 4: exercises table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'exercises' AND COLUMN_NAME = 'exercise_type')
BEGIN
    ALTER TABLE dbo.exercises ADD exercise_type NVARCHAR(50) NULL DEFAULT 'strength';
    PRINT 'Added exercise_type to exercises';
END

-- =========================================
-- PATCH 5: diet_plans table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'diet_plans' AND COLUMN_NAME = 'is_active')
BEGIN
    ALTER TABLE dbo.diet_plans ADD is_active BIT NOT NULL CONSTRAINT DF_diet_plans_is_active DEFAULT(1);
    PRINT 'Added is_active to diet_plans';
END

-- =========================================
-- PATCH 6: client_profiles table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'client_profiles' AND COLUMN_NAME = 'email_plan_assigned')
BEGIN
    ALTER TABLE dbo.client_profiles ADD email_plan_assigned BIT DEFAULT 1;
    PRINT 'Added email_plan_assigned to client_profiles';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'client_profiles' AND COLUMN_NAME = 'email_checkin_submitted')
BEGIN
    ALTER TABLE dbo.client_profiles ADD email_checkin_submitted BIT DEFAULT 1;
    PRINT 'Added email_checkin_submitted to client_profiles';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'client_profiles' AND COLUMN_NAME = 'email_checkin_reviewed')
BEGIN
    ALTER TABLE dbo.client_profiles ADD email_checkin_reviewed BIT DEFAULT 1;
    PRINT 'Added email_checkin_reviewed to client_profiles';
END

-- =========================================
-- PATCH 7: coach_profiles table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'coach_profiles' AND COLUMN_NAME = 'email_plan_assigned')
BEGIN
    ALTER TABLE dbo.coach_profiles ADD email_plan_assigned BIT DEFAULT 1;
    PRINT 'Added email_plan_assigned to coach_profiles';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'coach_profiles' AND COLUMN_NAME = 'email_checkin_received')
BEGIN
    ALTER TABLE dbo.coach_profiles ADD email_checkin_received BIT DEFAULT 1;
    PRINT 'Added email_checkin_received to coach_profiles';
END

-- =========================================
-- PATCH 8: profiles table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'onboarding_completed')
BEGIN
    ALTER TABLE dbo.profiles ADD onboarding_completed BIT DEFAULT 0;
    PRINT 'Added onboarding_completed to profiles';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'onboarding_step')
BEGIN
    ALTER TABLE dbo.profiles ADD onboarding_step INT DEFAULT 0;
    PRINT 'Added onboarding_step to profiles';
END

-- =========================================
-- PATCH 9: recipes table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'recipes' AND COLUMN_NAME = 'fiber_per_serving')
BEGIN
    ALTER TABLE dbo.recipes ADD fiber_per_serving DECIMAL(10,2) NULL;
    PRINT 'Added fiber_per_serving to recipes';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'recipes' AND COLUMN_NAME = 'total_weight_g')
BEGIN
    ALTER TABLE dbo.recipes ADD total_weight_g DECIMAL(10,2) NULL;
    PRINT 'Added total_weight_g to recipes';
END

-- =========================================
-- PATCH 10: foods table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'foods' AND COLUMN_NAME = 'subcategory')
BEGIN
    ALTER TABLE dbo.foods ADD subcategory NVARCHAR(100) NULL;
    PRINT 'Added subcategory to foods';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'foods' AND COLUMN_NAME = 'barcode')
BEGIN
    ALTER TABLE dbo.foods ADD barcode NVARCHAR(50) NULL;
    PRINT 'Added barcode to foods';
END

-- =========================================
-- CREATE MISSING INDEXES
-- =========================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_users_email_verification_token')
BEGIN
    CREATE INDEX idx_users_email_verification_token ON dbo.users(email_verification_token);
    PRINT 'Created index idx_users_email_verification_token';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_users_password_reset_token')
BEGIN
    CREATE INDEX idx_users_password_reset_token ON dbo.users(password_reset_token);
    PRINT 'Created index idx_users_password_reset_token';
END

-- =========================================
-- PATCH 11: workout_templates is_system flag
-- Templates with is_system = 1 are visible to all users
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workout_templates' AND COLUMN_NAME = 'is_system')
BEGIN
    ALTER TABLE dbo.workout_templates ADD is_system BIT DEFAULT 0;
    PRINT 'Added is_system to workout_templates';
END

-- Set all existing templates as system templates so they are visible
UPDATE dbo.workout_templates SET is_system = 1 WHERE is_system IS NULL OR is_system = 0;
PRINT 'Updated workout_templates.is_system = 1 for visibility';

-- =========================================
-- PATCH 12: diet_plans is_system flag
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'diet_plans' AND COLUMN_NAME = 'is_system')
BEGIN
    ALTER TABLE dbo.diet_plans ADD is_system BIT DEFAULT 0;
    PRINT 'Added is_system to diet_plans';
END

-- Set all existing diet plans as system plans so they are visible
UPDATE dbo.diet_plans SET is_system = 1 WHERE is_system IS NULL OR is_system = 0;
PRINT 'Updated diet_plans.is_system = 1 for visibility';

-- =========================================
-- PATCH 13: user_email_preferences table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_email_preferences')
BEGIN
    CREATE TABLE dbo.user_email_preferences (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
        email_checkin_reminder BIT DEFAULT 1,
        email_checkin_submitted BIT DEFAULT 1,
        email_checkin_reviewed BIT DEFAULT 1,
        email_plan_assigned BIT DEFAULT 1,
        email_coach_message BIT DEFAULT 1,
        email_marketing BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_email_prefs_user ON dbo.user_email_preferences(user_id);
    PRINT 'Created user_email_preferences table';
END

-- =========================================
-- PATCH 14: blog_posts table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'blog_posts')
BEGIN
    CREATE TABLE dbo.blog_posts (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        title NVARCHAR(500) NOT NULL,
        slug NVARCHAR(500) NOT NULL UNIQUE,
        content NVARCHAR(MAX),
        excerpt NVARCHAR(1000),
        cover_image_url NVARCHAR(1000),
        status NVARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        author_id UNIQUEIDENTIFIER NOT NULL,
        published_at DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (author_id) REFERENCES dbo.users(id)
    );
    CREATE INDEX idx_blog_posts_slug ON dbo.blog_posts(slug);
    CREATE INDEX idx_blog_posts_status ON dbo.blog_posts(status);
    PRINT 'Created blog_posts table';
END

-- =========================================
-- PATCH 15: blog_permissions table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'blog_permissions')
BEGIN
    CREATE TABLE dbo.blog_permissions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        can_create BIT DEFAULT 0,
        can_edit BIT DEFAULT 0,
        can_publish BIT DEFAULT 0,
        can_delete BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX idx_blog_perms_user ON dbo.blog_permissions(user_id);
    PRINT 'Created blog_permissions table';
END

-- =========================================
-- PATCH 16: progress_photos table
-- =========================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'progress_photos')
BEGIN
    CREATE TABLE dbo.progress_photos (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        client_id UNIQUEIDENTIFIER NOT NULL,
        photo_url NVARCHAR(1000) NOT NULL,
        pose_type NVARCHAR(50) DEFAULT 'front',
        notes NVARCHAR(MAX),
        is_private BIT DEFAULT 1,
        recorded_at DATETIME2 DEFAULT GETUTCDATE(),
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (client_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_progress_photos_client ON dbo.progress_photos(client_id);
    PRINT 'Created progress_photos table';
END

-- =========================================
-- PATCH 17: Initialize coach_profiles JSON arrays
-- =========================================
UPDATE dbo.coach_profiles SET specializations = '[]' WHERE specializations IS NULL OR specializations = '';
UPDATE dbo.coach_profiles SET certifications = '[]' WHERE certifications IS NULL OR certifications = '';
PRINT 'Initialized coach_profiles JSON array columns';

-- =========================================
-- PATCH 18: Unique constraint for user_roles
-- =========================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_user_roles_user_role' AND object_id = OBJECT_ID('dbo.user_roles'))
BEGIN
    -- Remove duplicates first
    WITH CTE AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id, role ORDER BY created_at) AS rn
        FROM dbo.user_roles
    )
    DELETE FROM CTE WHERE rn > 1;
    
    -- Add unique constraint
    BEGIN TRY
        CREATE UNIQUE INDEX UQ_user_roles_user_role ON dbo.user_roles(user_id, role);
        PRINT 'Added unique constraint on user_roles(user_id, role)';
    END TRY
    BEGIN CATCH
        PRINT 'Could not add user_roles unique constraint';
    END CATCH
END

-- =========================================
-- DONE
-- =========================================
PRINT '';
PRINT '========================================';
PRINT 'Schema patch completed successfully!';
PRINT 'Please restart your backend server.';
PRINT '========================================';
