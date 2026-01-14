# Azure Migration Guide - CustomCoachPro

## 1. SQL Migration Script for Azure SQL Database

Run this script in Azure Data Studio connected to your Azure SQL Database:

```sql
-- =============================================
-- CustomCoachPro Database Schema
-- Azure SQL Database Migration Script
-- =============================================

-- Enable required features
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE dbo.users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    email_verified BIT DEFAULT 0,
    email_verification_token NVARCHAR(255) NULL,
    email_verification_expires DATETIME2 NULL,
    password_reset_token NVARCHAR(255) NULL,
    password_reset_expires DATETIME2 NULL,
    google_id NVARCHAR(255) NULL UNIQUE,
    refresh_token NVARCHAR(500) NULL,
    last_login DATETIME2 NULL,
    login_count INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_users_email ON dbo.users(email);
CREATE INDEX idx_users_google_id ON dbo.users(google_id);
CREATE INDEX idx_users_verification_token ON dbo.users(email_verification_token);
CREATE INDEX idx_users_reset_token ON dbo.users(password_reset_token);
GO

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE dbo.profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    avatar_url NVARCHAR(500) NULL,
    bio NVARCHAR(MAX) NULL,
    phone NVARCHAR(50) NULL,
    date_of_birth DATE NULL,
    gender NVARCHAR(20) NULL,
    onboarding_completed BIT DEFAULT 0,
    onboarding_step INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_profiles_user_id ON dbo.profiles(user_id);
GO

-- =============================================
-- USER ROLES TABLE
-- =============================================
CREATE TABLE dbo.user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'coach', 'client')),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON dbo.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON dbo.user_roles(role);
GO

-- =============================================
-- CLIENT PROFILES TABLE
-- =============================================
CREATE TABLE dbo.client_profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    coach_id UNIQUEIDENTIFIER NULL,
    height_cm DECIMAL(5,2) NULL,
    current_weight_kg DECIMAL(5,2) NULL,
    target_weight_kg DECIMAL(5,2) NULL,
    fitness_level NVARCHAR(20) NULL,
    fitness_goals NVARCHAR(MAX) NULL, -- JSON array
    dietary_restrictions NVARCHAR(MAX) NULL, -- JSON array
    medical_conditions NVARCHAR(MAX) NULL,
    subscription_status NVARCHAR(20) NULL,
    subscription_end_date DATE NULL,
    email_plan_assigned BIT DEFAULT 1,
    email_checkin_submitted BIT DEFAULT 1,
    email_checkin_reviewed BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_client_profiles_user_id ON dbo.client_profiles(user_id);
CREATE INDEX idx_client_profiles_coach_id ON dbo.client_profiles(coach_id);
GO

-- =============================================
-- COACH PROFILES TABLE
-- =============================================
CREATE TABLE dbo.coach_profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    specializations NVARCHAR(MAX) NULL, -- JSON array
    certifications NVARCHAR(MAX) NULL, -- JSON array
    experience_years INT NULL,
    hourly_rate DECIMAL(10,2) NULL,
    currency NVARCHAR(3) DEFAULT 'USD',
    max_clients INT NULL,
    is_accepting_clients BIT DEFAULT 1,
    rating DECIMAL(3,2) NULL,
    total_reviews INT DEFAULT 0,
    stripe_account_id NVARCHAR(255) NULL,
    email_plan_assigned BIT DEFAULT 1,
    email_checkin_received BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_coach_profiles_user_id ON dbo.coach_profiles(user_id);
GO

-- =============================================
-- EXERCISES TABLE
-- =============================================
CREATE TABLE dbo.exercises (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    primary_muscle NVARCHAR(50) NOT NULL,
    secondary_muscles NVARCHAR(MAX) NULL, -- JSON array
    equipment NVARCHAR(50) NOT NULL,
    difficulty NVARCHAR(20) DEFAULT 'intermediate',
    exercise_type NVARCHAR(20) DEFAULT 'compound',
    instructions NVARCHAR(MAX) NULL, -- JSON array
    tips NVARCHAR(MAX) NULL, -- JSON array
    common_mistakes NVARCHAR(MAX) NULL, -- JSON array
    video_url NVARCHAR(500) NULL,
    image_url NVARCHAR(500) NULL,
    is_system BIT DEFAULT 0,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_exercises_muscle ON dbo.exercises(primary_muscle);
CREATE INDEX idx_exercises_equipment ON dbo.exercises(equipment);
CREATE INDEX idx_exercises_is_system ON dbo.exercises(is_system);
GO

-- =============================================
-- WORKOUT TEMPLATES TABLE
-- =============================================
CREATE TABLE dbo.workout_templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    goal NVARCHAR(100) NULL,
    difficulty NVARCHAR(20) DEFAULT 'intermediate',
    template_type NVARCHAR(50) NULL,
    days_per_week INT DEFAULT 3,
    duration_weeks INT NULL,
    is_periodized BIT DEFAULT 0,
    is_system BIT DEFAULT 0,
    created_by UNIQUEIDENTIFIER NULL,
    cloned_from UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_workout_templates_is_system ON dbo.workout_templates(is_system);
CREATE INDEX idx_workout_templates_created_by ON dbo.workout_templates(created_by);
GO

-- =============================================
-- WORKOUT TEMPLATE WEEKS TABLE
-- =============================================
CREATE TABLE dbo.workout_template_weeks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL,
    week_number INT NOT NULL,
    name NVARCHAR(100) NULL,
    focus NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (template_id) REFERENCES dbo.workout_templates(id) ON DELETE CASCADE
);

CREATE INDEX idx_workout_template_weeks_template ON dbo.workout_template_weeks(template_id);
GO

-- =============================================
-- WORKOUT TEMPLATE DAYS TABLE
-- =============================================
CREATE TABLE dbo.workout_template_days (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL,
    week_id UNIQUEIDENTIFIER NULL,
    day_number INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (template_id) REFERENCES dbo.workout_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (week_id) REFERENCES dbo.workout_template_weeks(id) ON DELETE NO ACTION
);

CREATE INDEX idx_workout_template_days_template ON dbo.workout_template_days(template_id);
GO

-- =============================================
-- WORKOUT TEMPLATE EXERCISES TABLE
-- =============================================
CREATE TABLE dbo.workout_template_exercises (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    day_id UNIQUEIDENTIFIER NOT NULL,
    exercise_id UNIQUEIDENTIFIER NULL,
    custom_exercise_name NVARCHAR(255) NULL,
    order_index INT DEFAULT 0,
    sets_min INT DEFAULT 3,
    sets_max INT NULL,
    reps_min INT DEFAULT 8,
    reps_max INT NULL,
    rest_seconds_min INT NULL,
    rest_seconds_max INT NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (day_id) REFERENCES dbo.workout_template_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES dbo.exercises(id) ON DELETE SET NULL
);

CREATE INDEX idx_workout_template_exercises_day ON dbo.workout_template_exercises(day_id);
GO

-- =============================================
-- DIET PLANS TABLE
-- =============================================
CREATE TABLE dbo.diet_plans (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    goal NVARCHAR(100) NULL,
    dietary_type NVARCHAR(50) NULL,
    calories_target INT NULL,
    protein_grams INT NULL,
    carbs_grams INT NULL,
    fat_grams INT NULL,
    meals_per_day INT NULL,
    notes NVARCHAR(MAX) NULL,
    is_active BIT DEFAULT 1,
    is_system BIT DEFAULT 0,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_diet_plans_is_system ON dbo.diet_plans(is_system);
CREATE INDEX idx_diet_plans_created_by ON dbo.diet_plans(created_by);
GO

-- =============================================
-- FOODS TABLE
-- =============================================
CREATE TABLE dbo.foods (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    brand NVARCHAR(255) NULL,
    category NVARCHAR(100) NOT NULL,
    subcategory NVARCHAR(100) NULL,
    calories_per_100g DECIMAL(8,2) DEFAULT 0,
    protein_per_100g DECIMAL(8,2) DEFAULT 0,
    carbs_per_100g DECIMAL(8,2) DEFAULT 0,
    fat_per_100g DECIMAL(8,2) DEFAULT 0,
    fiber_per_100g DECIMAL(8,2) NULL,
    sugar_per_100g DECIMAL(8,2) NULL,
    sodium_mg_per_100g DECIMAL(8,2) NULL,
    default_serving_size DECIMAL(8,2) DEFAULT 100,
    default_serving_unit NVARCHAR(20) DEFAULT 'g',
    barcode NVARCHAR(50) NULL,
    image_url NVARCHAR(500) NULL,
    notes NVARCHAR(MAX) NULL,
    is_system BIT DEFAULT 0,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_foods_category ON dbo.foods(category);
CREATE INDEX idx_foods_is_system ON dbo.foods(is_system);
CREATE INDEX idx_foods_barcode ON dbo.foods(barcode);
GO

-- =============================================
-- RECIPES TABLE
-- =============================================
CREATE TABLE dbo.recipes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    category NVARCHAR(100) NULL,
    servings INT DEFAULT 1,
    prep_time_minutes INT NULL,
    cook_time_minutes INT NULL,
    instructions NVARCHAR(MAX) NULL,
    calories_per_serving DECIMAL(8,2) NULL,
    protein_per_serving DECIMAL(8,2) NULL,
    carbs_per_serving DECIMAL(8,2) NULL,
    fat_per_serving DECIMAL(8,2) NULL,
    fiber_per_serving DECIMAL(8,2) NULL,
    total_weight_g DECIMAL(8,2) NULL,
    image_url NVARCHAR(500) NULL,
    is_system BIT DEFAULT 0,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_recipes_category ON dbo.recipes(category);
CREATE INDEX idx_recipes_is_system ON dbo.recipes(is_system);
GO

-- =============================================
-- PLAN ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE dbo.plan_assignments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    coach_id UNIQUEIDENTIFIER NOT NULL,
    client_id UNIQUEIDENTIFIER NOT NULL,
    plan_type NVARCHAR(20) NOT NULL CHECK (plan_type IN ('workout', 'diet')),
    workout_template_id UNIQUEIDENTIFIER NULL,
    diet_plan_id UNIQUEIDENTIFIER NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status NVARCHAR(20) DEFAULT 'active',
    coach_notes NVARCHAR(MAX) NULL,
    client_notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (workout_template_id) REFERENCES dbo.workout_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (diet_plan_id) REFERENCES dbo.diet_plans(id) ON DELETE SET NULL
);

CREATE INDEX idx_plan_assignments_coach ON dbo.plan_assignments(coach_id);
CREATE INDEX idx_plan_assignments_client ON dbo.plan_assignments(client_id);
CREATE INDEX idx_plan_assignments_status ON dbo.plan_assignments(status);
GO

-- =============================================
-- WORKOUT LOGS TABLE
-- =============================================
CREATE TABLE dbo.workout_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL,
    template_id UNIQUEIDENTIFIER NULL,
    template_day_id UNIQUEIDENTIFIER NULL,
    assignment_id UNIQUEIDENTIFIER NULL,
    workout_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    status NVARCHAR(20) DEFAULT 'pending',
    started_at DATETIME2 NULL,
    completed_at DATETIME2 NULL,
    duration_minutes INT NULL,
    perceived_effort INT NULL,
    satisfaction_rating INT NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (template_id) REFERENCES dbo.workout_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (template_day_id) REFERENCES dbo.workout_template_days(id) ON DELETE SET NULL,
    FOREIGN KEY (assignment_id) REFERENCES dbo.plan_assignments(id) ON DELETE SET NULL
);

CREATE INDEX idx_workout_logs_client ON dbo.workout_logs(client_id);
CREATE INDEX idx_workout_logs_date ON dbo.workout_logs(workout_date);
GO

-- =============================================
-- CLIENT MEASUREMENTS TABLE
-- =============================================
CREATE TABLE dbo.client_measurements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL,
    recorded_at DATETIME2 DEFAULT GETUTCDATE(),
    weight_kg DECIMAL(5,2) NOT NULL,
    body_fat_pct DECIMAL(5,2) NULL,
    muscle_mass_kg DECIMAL(5,2) NULL,
    chest_cm DECIMAL(5,2) NULL,
    waist_cm DECIMAL(5,2) NULL,
    hips_cm DECIMAL(5,2) NULL,
    left_arm_cm DECIMAL(5,2) NULL,
    right_arm_cm DECIMAL(5,2) NULL,
    left_thigh_cm DECIMAL(5,2) NULL,
    right_thigh_cm DECIMAL(5,2) NULL,
    left_calf_cm DECIMAL(5,2) NULL,
    right_calf_cm DECIMAL(5,2) NULL,
    shoulders_cm DECIMAL(5,2) NULL,
    neck_cm DECIMAL(5,2) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_client_measurements_client ON dbo.client_measurements(client_id);
CREATE INDEX idx_client_measurements_date ON dbo.client_measurements(recorded_at);
GO

-- =============================================
-- CLIENT CHECKINS TABLE
-- =============================================
CREATE TABLE dbo.client_checkins (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL,
    coach_id UNIQUEIDENTIFIER NULL,
    template_id UNIQUEIDENTIFIER NULL,
    checkin_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    period_start DATE NULL,
    period_end DATE NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    workout_adherence INT NULL,
    diet_adherence INT NULL,
    sleep_quality INT NULL,
    energy_level INT NULL,
    stress_level INT NULL,
    mood_rating INT NULL,
    workout_notes NVARCHAR(MAX) NULL,
    diet_notes NVARCHAR(MAX) NULL,
    general_notes NVARCHAR(MAX) NULL,
    wins NVARCHAR(MAX) NULL,
    challenges NVARCHAR(MAX) NULL,
    measurement_id UNIQUEIDENTIFIER NULL,
    photo_ids NVARCHAR(MAX) NULL, -- JSON array
    submitted_at DATETIME2 NULL,
    reviewed_by UNIQUEIDENTIFIER NULL,
    reviewed_at DATETIME2 NULL,
    coach_feedback NVARCHAR(MAX) NULL,
    coach_rating INT NULL,
    next_checkin_date DATE NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (measurement_id) REFERENCES dbo.client_measurements(id) ON DELETE SET NULL
);

CREATE INDEX idx_client_checkins_client ON dbo.client_checkins(client_id);
CREATE INDEX idx_client_checkins_coach ON dbo.client_checkins(coach_id);
CREATE INDEX idx_client_checkins_status ON dbo.client_checkins(status);
GO

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE dbo.messages (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sender_id UNIQUEIDENTIFIER NOT NULL,
    recipient_id UNIQUEIDENTIFIER NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    read_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_messages_sender ON dbo.messages(sender_id);
CREATE INDEX idx_messages_recipient ON dbo.messages(recipient_id);
CREATE INDEX idx_messages_created ON dbo.messages(created_at);
GO

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE dbo.notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    reference_type NVARCHAR(50) NULL,
    reference_id UNIQUEIDENTIFIER NULL,
    data NVARCHAR(MAX) NULL, -- JSON
    is_read BIT DEFAULT 0,
    read_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_notifications_user ON dbo.notifications(user_id);
CREATE INDEX idx_notifications_read ON dbo.notifications(is_read);
GO

-- =============================================
-- USER FAVORITES TABLE
-- =============================================
CREATE TABLE dbo.user_favorites (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    item_type NVARCHAR(50) NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX idx_user_favorites_user ON dbo.user_favorites(user_id);
GO

-- =============================================
-- PROGRESS PHOTOS TABLE
-- =============================================
CREATE TABLE dbo.progress_photos (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL,
    photo_url NVARCHAR(500) NOT NULL,
    thumbnail_url NVARCHAR(500) NULL,
    pose_type NVARCHAR(50) NOT NULL,
    recorded_at DATETIME2 DEFAULT GETUTCDATE(),
    notes NVARCHAR(MAX) NULL,
    is_private BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_progress_photos_client ON dbo.progress_photos(client_id);
GO

-- =============================================
-- ADMIN AUDIT LOGS TABLE
-- =============================================
CREATE TABLE dbo.admin_audit_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    admin_user_id UNIQUEIDENTIFIER NOT NULL,
    action_type NVARCHAR(100) NOT NULL,
    target_user_id UNIQUEIDENTIFIER NULL,
    target_resource_type NVARCHAR(50) NULL,
    target_resource_id UNIQUEIDENTIFIER NULL,
    details NVARCHAR(MAX) NULL, -- JSON
    ip_address NVARCHAR(50) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_admin_audit_logs_admin ON dbo.admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action ON dbo.admin_audit_logs(action_type);
CREATE INDEX idx_admin_audit_logs_created ON dbo.admin_audit_logs(created_at);
GO

-- =============================================
-- PLATFORM SETTINGS TABLE
-- =============================================
CREATE TABLE dbo.platform_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    setting_key NVARCHAR(100) NOT NULL UNIQUE,
    setting_value NVARCHAR(MAX) NOT NULL, -- JSON
    setting_type NVARCHAR(20) DEFAULT 'string',
    category NVARCHAR(50) DEFAULT 'general',
    description NVARCHAR(MAX) NULL,
    updated_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_platform_settings_key ON dbo.platform_settings(setting_key);
CREATE INDEX idx_platform_settings_category ON dbo.platform_settings(category);
GO

PRINT 'CustomCoachPro database schema created successfully!';
GO
```

---

## 2. Azure DevOps Variable Groups

Create **TWO** variable groups in Azure DevOps:

### Variable Group 1: `CustomCoachPro-Variables`
| Variable Name | Value | Secret |
|--------------|-------|--------|
| `VITE_API_URL` | `https://customcoachpro.azurewebsites.net/api` | No |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | No |
| `NODE_ENV` | `production` | No |

### Variable Group 2: `CustomCoachPro-Secrets` (All marked as Secret)
| Variable Name | Value | Secret |
|--------------|-------|--------|
| `SQL_SERVER` | `your-server.database.windows.net` | ✅ Yes |
| `SQL_DATABASE` | `CustomCoachProDB` | ✅ Yes |
| `SQL_USER` | Azure SQL admin username | ✅ Yes |
| `SQL_PASSWORD` | Azure SQL admin password | ✅ Yes |
| `JWT_SECRET` | Generate: `openssl rand -base64 64` | ✅ Yes |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | ✅ Yes |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | ✅ Yes |
| `GOOGLE_EMAIL` | Gmail account for sending emails | ✅ Yes |
| `GOOGLE_APP_PASSWORD` | 16-char app password from Google Account → Security → 2FA → App Passwords | ✅ Yes |
| `STORAGE_CONNECTION_STRING` | Azure Storage account connection string | ✅ Yes |
| `AZURE_SERVICE_CONNECTION` | Azure DevOps service connection name | No |

### How to Create Variable Groups:
1. Go to Azure DevOps → Your Project → **Pipelines** → **Library**
2. Click **+ Variable group**
3. Name it `CustomCoachPro-Variables` or `CustomCoachPro-Secrets`
4. Add each variable with its value
5. For secrets, click the lock icon 🔒 to mark as secret
6. Click **Save**

---

## 3. Google OAuth URLs for Verification

For Google OAuth consent screen verification, use these URLs:

| Field | URL |
|-------|-----|
| **Privacy Policy** | `https://customcoachpro.azurewebsites.net/privacy` |
| **Terms of Service** | `https://customcoachpro.azurewebsites.net/terms` |
| **Authorized Redirect URI** | `https://customcoachpro.azurewebsites.net/auth/google/callback` |

---

## 4. Remaining Migration Checklist

### ✅ Completed:
- [x] Azure Functions backend structure
- [x] Authentication API endpoints
- [x] Frontend auth context with Azure
- [x] Login/Signup pages updated
- [x] Privacy Policy & Terms of Service pages
- [x] Azure Pipelines YAML configuration
- [x] Environment configuration

### 📋 Your Manual Steps:
- [ ] Run SQL migration script in Azure Data Studio
- [ ] Create Azure DevOps variable groups
- [ ] Configure Google OAuth redirect URIs
- [ ] Submit Privacy Policy & Terms URLs to Google
- [ ] Deploy and test

### 🔮 Future Enhancements (Optional):
- [ ] Create additional data API functions (exercises, workouts, etc.)
- [ ] Add Azure SignalR for real-time messaging
- [ ] Set up Azure Application Insights monitoring
- [ ] Configure Azure Key Vault for secrets management
