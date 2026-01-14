-- Azure SQL Database Schema for CustomCoachPro
-- This script creates all tables needed to migrate from Supabase to Azure SQL
-- Run this script in Azure Data Studio against your Azure SQL database

-- =====================================================
-- USERS AND AUTHENTICATION
-- =====================================================

-- Users table (replaces Supabase auth.users)
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    avatar_url NVARCHAR(500),
    email_verified BIT NOT NULL DEFAULT 0,
    verification_token NVARCHAR(255),
    verification_token_expires DATETIME2,
    reset_token NVARCHAR(255),
    reset_token_expires DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- User roles
CREATE TABLE user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'coach', 'client')),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE(user_id, role)
);

-- Refresh tokens for JWT
CREATE TABLE refresh_tokens (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token NVARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- PROFILES
-- =====================================================

CREATE TABLE profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    avatar_url NVARCHAR(500),
    bio NVARCHAR(MAX),
    phone NVARCHAR(50),
    date_of_birth DATE,
    gender NVARCHAR(20),
    onboarding_completed BIT DEFAULT 0,
    onboarding_step INT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Client profiles
CREATE TABLE client_profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    coach_id UNIQUEIDENTIFIER REFERENCES users(id),
    height_cm DECIMAL(10,2),
    current_weight_kg DECIMAL(10,2),
    target_weight_kg DECIMAL(10,2),
    fitness_level NVARCHAR(50),
    fitness_goals NVARCHAR(MAX), -- JSON array
    dietary_restrictions NVARCHAR(MAX), -- JSON array
    medical_conditions NVARCHAR(MAX),
    subscription_status NVARCHAR(50),
    subscription_end_date DATE,
    email_checkin_submitted BIT DEFAULT 1,
    email_checkin_reviewed BIT DEFAULT 1,
    email_plan_assigned BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Coach profiles
CREATE TABLE coach_profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specializations NVARCHAR(MAX), -- JSON array
    certifications NVARCHAR(MAX), -- JSON array
    experience_years INT,
    hourly_rate DECIMAL(10,2),
    currency NVARCHAR(10) DEFAULT 'USD',
    max_clients INT,
    is_accepting_clients BIT DEFAULT 1,
    rating DECIMAL(3,2),
    total_reviews INT DEFAULT 0,
    stripe_account_id NVARCHAR(255),
    email_checkin_received BIT DEFAULT 1,
    email_plan_assigned BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- EXERCISES
-- =====================================================

CREATE TABLE exercises (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    primary_muscle NVARCHAR(50) NOT NULL,
    secondary_muscles NVARCHAR(MAX), -- JSON array
    equipment NVARCHAR(50) NOT NULL,
    difficulty NVARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    exercise_type NVARCHAR(50) NOT NULL DEFAULT 'compound',
    instructions NVARCHAR(MAX), -- JSON array
    tips NVARCHAR(MAX), -- JSON array
    common_mistakes NVARCHAR(MAX), -- JSON array
    video_url NVARCHAR(500),
    image_url NVARCHAR(500),
    is_system BIT NOT NULL DEFAULT 0,
    created_by UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Exercise alternatives
CREATE TABLE exercise_alternatives (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    exercise_id UNIQUEIDENTIFIER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    alternative_exercise_id UNIQUEIDENTIFIER NOT NULL REFERENCES exercises(id),
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- WORKOUT TEMPLATES
-- =====================================================

CREATE TABLE workout_templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    difficulty NVARCHAR(20) NOT NULL DEFAULT 'intermediate',
    duration_weeks INT,
    days_per_week INT NOT NULL DEFAULT 3,
    goal NVARCHAR(255),
    template_type NVARCHAR(50),
    is_periodized BIT DEFAULT 0,
    is_system BIT NOT NULL DEFAULT 0,
    created_by UNIQUEIDENTIFIER REFERENCES users(id),
    cloned_from UNIQUEIDENTIFIER REFERENCES workout_templates(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE workout_template_weeks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    name NVARCHAR(255),
    focus NVARCHAR(255),
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE workout_template_days (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    week_id UNIQUEIDENTIFIER REFERENCES workout_template_weeks(id),
    day_number INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE workout_template_exercises (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    day_id UNIQUEIDENTIFIER NOT NULL REFERENCES workout_template_days(id) ON DELETE CASCADE,
    exercise_id UNIQUEIDENTIFIER REFERENCES exercises(id),
    custom_exercise_name NVARCHAR(255),
    order_index INT NOT NULL DEFAULT 0,
    sets_min INT NOT NULL DEFAULT 3,
    sets_max INT,
    reps_min INT NOT NULL DEFAULT 8,
    reps_max INT,
    rest_seconds_min INT,
    rest_seconds_max INT,
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- FOODS AND RECIPES
-- =====================================================

CREATE TABLE foods (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    brand NVARCHAR(255),
    category NVARCHAR(100) NOT NULL,
    subcategory NVARCHAR(100),
    barcode NVARCHAR(100),
    calories_per_100g DECIMAL(10,2) NOT NULL DEFAULT 0,
    protein_per_100g DECIMAL(10,2) NOT NULL DEFAULT 0,
    carbs_per_100g DECIMAL(10,2) NOT NULL DEFAULT 0,
    fat_per_100g DECIMAL(10,2) NOT NULL DEFAULT 0,
    fiber_per_100g DECIMAL(10,2),
    sugar_per_100g DECIMAL(10,2),
    sodium_mg_per_100g DECIMAL(10,2),
    default_serving_size DECIMAL(10,2) NOT NULL DEFAULT 100,
    default_serving_unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    image_url NVARCHAR(500),
    notes NVARCHAR(MAX),
    is_system BIT NOT NULL DEFAULT 0,
    created_by UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE food_alternatives (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    food_id UNIQUEIDENTIFIER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    alternative_food_id UNIQUEIDENTIFIER NOT NULL REFERENCES foods(id),
    reason NVARCHAR(255),
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE recipes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100),
    instructions NVARCHAR(MAX),
    prep_time_minutes INT,
    cook_time_minutes INT,
    servings INT NOT NULL DEFAULT 1,
    calories_per_serving DECIMAL(10,2),
    protein_per_serving DECIMAL(10,2),
    carbs_per_serving DECIMAL(10,2),
    fat_per_serving DECIMAL(10,2),
    fiber_per_serving DECIMAL(10,2),
    total_weight_g DECIMAL(10,2),
    image_url NVARCHAR(500),
    is_system BIT NOT NULL DEFAULT 0,
    created_by UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE recipe_ingredients (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    recipe_id UNIQUEIDENTIFIER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    food_id UNIQUEIDENTIFIER NOT NULL REFERENCES foods(id),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    notes NVARCHAR(MAX),
    order_index INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- DIET PLANS
-- =====================================================

CREATE TABLE diet_plans (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    calories_target INT,
    protein_grams INT,
    carbs_grams INT,
    fat_grams INT,
    meals_per_day INT,
    dietary_type NVARCHAR(50),
    goal NVARCHAR(100),
    notes NVARCHAR(MAX),
    is_system BIT NOT NULL DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_by UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE diet_plan_meals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    plan_id UNIQUEIDENTIFIER NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_number INT NOT NULL,
    meal_name NVARCHAR(255) NOT NULL,
    time_suggestion NVARCHAR(50),
    calories INT,
    protein_grams INT,
    carbs_grams INT,
    fat_grams INT,
    food_suggestions NVARCHAR(MAX), -- JSON array
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE meal_food_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    meal_id UNIQUEIDENTIFIER NOT NULL REFERENCES diet_plan_meals(id) ON DELETE CASCADE,
    food_id UNIQUEIDENTIFIER REFERENCES foods(id),
    recipe_id UNIQUEIDENTIFIER REFERENCES recipes(id),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    order_index INT NOT NULL DEFAULT 0,
    calculated_calories DECIMAL(10,2),
    calculated_protein DECIMAL(10,2),
    calculated_carbs DECIMAL(10,2),
    calculated_fat DECIMAL(10,2),
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Meal templates for quick meal creation
CREATE TABLE meal_templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100),
    total_calories DECIMAL(10,2),
    total_protein DECIMAL(10,2),
    total_carbs DECIMAL(10,2),
    total_fat DECIMAL(10,2),
    is_system BIT NOT NULL DEFAULT 0,
    created_by UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE meal_template_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
    food_id UNIQUEIDENTIFIER REFERENCES foods(id),
    recipe_id UNIQUEIDENTIFIER REFERENCES recipes(id),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    order_index INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- CLIENT TRACKING
-- =====================================================

CREATE TABLE client_measurements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    weight_kg DECIMAL(10,2) NOT NULL,
    body_fat_pct DECIMAL(5,2),
    muscle_mass_kg DECIMAL(10,2),
    waist_cm DECIMAL(10,2),
    chest_cm DECIMAL(10,2),
    hips_cm DECIMAL(10,2),
    shoulders_cm DECIMAL(10,2),
    neck_cm DECIMAL(10,2),
    left_arm_cm DECIMAL(10,2),
    right_arm_cm DECIMAL(10,2),
    left_thigh_cm DECIMAL(10,2),
    right_thigh_cm DECIMAL(10,2),
    left_calf_cm DECIMAL(10,2),
    right_calf_cm DECIMAL(10,2),
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE client_goals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    goal_type NVARCHAR(100) NOT NULL,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    starting_value DECIMAL(10,2),
    unit NVARCHAR(50),
    target_date DATE,
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    completed_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE progress_photos (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url NVARCHAR(500) NOT NULL,
    thumbnail_url NVARCHAR(500),
    pose_type NVARCHAR(50) NOT NULL,
    recorded_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    notes NVARCHAR(MAX),
    is_private BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- WORKOUT LOGS
-- =====================================================

CREATE TABLE workout_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UNIQUEIDENTIFIER REFERENCES workout_templates(id),
    template_day_id UNIQUEIDENTIFIER REFERENCES workout_template_days(id),
    assignment_id UNIQUEIDENTIFIER,
    workout_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    status NVARCHAR(50) NOT NULL DEFAULT 'planned',
    started_at DATETIME2,
    completed_at DATETIME2,
    duration_minutes INT,
    perceived_effort INT,
    satisfaction_rating INT,
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE workout_log_exercises (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    workout_log_id UNIQUEIDENTIFIER NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_id UNIQUEIDENTIFIER REFERENCES exercises(id),
    exercise_name NVARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    sets_completed INT NOT NULL DEFAULT 0,
    set_data NVARCHAR(MAX), -- JSON array of {reps, weight, duration_seconds}
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- NUTRITION LOGS
-- =====================================================

CREATE TABLE client_nutrition_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    meal_type NVARCHAR(50) NOT NULL,
    food_id UNIQUEIDENTIFIER REFERENCES foods(id),
    recipe_id UNIQUEIDENTIFIER REFERENCES recipes(id),
    custom_food_name NVARCHAR(255),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    calories DECIMAL(10,2),
    protein_grams DECIMAL(10,2),
    carbs_grams DECIMAL(10,2),
    fat_grams DECIMAL(10,2),
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- COACHING RELATIONSHIPS
-- =====================================================

CREATE TABLE coach_client_relationships (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    coach_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    status NVARCHAR(50) DEFAULT 'active',
    started_at DATETIME2,
    ended_at DATETIME2,
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE(coach_id, client_id)
);

CREATE TABLE coaching_requests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    coach_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    message NVARCHAR(MAX),
    coach_response NVARCHAR(MAX),
    responded_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE coach_client_notes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    coach_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    title NVARCHAR(255),
    content NVARCHAR(MAX) NOT NULL,
    note_type NVARCHAR(50) NOT NULL DEFAULT 'general',
    is_pinned BIT DEFAULT 0,
    priority NVARCHAR(20),
    tags NVARCHAR(MAX), -- JSON array
    reference_date DATE,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- PLAN ASSIGNMENTS
-- =====================================================

CREATE TABLE plan_assignments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    coach_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    plan_type NVARCHAR(50) NOT NULL,
    workout_template_id UNIQUEIDENTIFIER REFERENCES workout_templates(id),
    diet_plan_id UNIQUEIDENTIFIER REFERENCES diet_plans(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    coach_notes NVARCHAR(MAX),
    client_notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- CHECK-INS
-- =====================================================

CREATE TABLE checkin_templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    coach_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    client_id UNIQUEIDENTIFIER REFERENCES users(id),
    name NVARCHAR(255) NOT NULL DEFAULT 'Weekly Check-in',
    description NVARCHAR(MAX),
    frequency_days INT NOT NULL DEFAULT 7,
    required_fields NVARCHAR(MAX) NOT NULL DEFAULT '{}', -- JSON
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE client_checkins (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    client_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UNIQUEIDENTIFIER REFERENCES users(id),
    template_id UNIQUEIDENTIFIER REFERENCES checkin_templates(id),
    measurement_id UNIQUEIDENTIFIER REFERENCES client_measurements(id),
    checkin_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    period_start DATE,
    period_end DATE,
    diet_adherence INT,
    workout_adherence INT,
    energy_level INT,
    sleep_quality INT,
    mood_rating INT,
    stress_level INT,
    diet_notes NVARCHAR(MAX),
    workout_notes NVARCHAR(MAX),
    general_notes NVARCHAR(MAX),
    wins NVARCHAR(MAX),
    challenges NVARCHAR(MAX),
    photo_ids NVARCHAR(MAX), -- JSON array
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at DATETIME2,
    reviewed_by UNIQUEIDENTIFIER REFERENCES users(id),
    reviewed_at DATETIME2,
    coach_feedback NVARCHAR(MAX),
    coach_rating INT,
    next_checkin_date DATE,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- MESSAGING
-- =====================================================

CREATE TABLE messages (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sender_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    recipient_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    content NVARCHAR(MAX) NOT NULL,
    read_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    reference_type NVARCHAR(100),
    reference_id UNIQUEIDENTIFIER,
    data NVARCHAR(MAX), -- JSON
    is_read BIT DEFAULT 0,
    read_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- FAVORITES
-- =====================================================

CREATE TABLE user_favorites (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type NVARCHAR(50) NOT NULL,
    item_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE(user_id, item_type, item_id)
);

-- =====================================================
-- ADMIN
-- =====================================================

CREATE TABLE platform_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    setting_key NVARCHAR(100) NOT NULL UNIQUE,
    setting_value NVARCHAR(MAX) NOT NULL, -- JSON
    setting_type NVARCHAR(50) NOT NULL DEFAULT 'string',
    category NVARCHAR(100) NOT NULL DEFAULT 'general',
    description NVARCHAR(MAX),
    updated_by UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE admin_audit_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    admin_user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    action_type NVARCHAR(100) NOT NULL,
    target_user_id UNIQUEIDENTIFIER REFERENCES users(id),
    target_resource_type NVARCHAR(100),
    target_resource_id UNIQUEIDENTIFIER,
    details NVARCHAR(MAX), -- JSON
    ip_address NVARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_client_profiles_coach_id ON client_profiles(coach_id);
CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX idx_exercises_primary_muscle ON exercises(primary_muscle);
CREATE INDEX idx_exercises_equipment ON exercises(equipment);
CREATE INDEX idx_exercises_is_system ON exercises(is_system);
CREATE INDEX idx_workout_templates_is_system ON workout_templates(is_system);
CREATE INDEX idx_workout_templates_created_by ON workout_templates(created_by);
CREATE INDEX idx_workout_template_days_template_id ON workout_template_days(template_id);
CREATE INDEX idx_workout_template_exercises_day_id ON workout_template_exercises(day_id);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_foods_is_system ON foods(is_system);
CREATE INDEX idx_recipes_is_system ON recipes(is_system);
CREATE INDEX idx_diet_plans_is_system ON diet_plans(is_system);
CREATE INDEX idx_client_measurements_client_id ON client_measurements(client_id);
CREATE INDEX idx_workout_logs_client_id ON workout_logs(client_id);
CREATE INDEX idx_workout_logs_workout_date ON workout_logs(workout_date);
CREATE INDEX idx_client_nutrition_logs_client_id ON client_nutrition_logs(client_id);
CREATE INDEX idx_client_nutrition_logs_log_date ON client_nutrition_logs(log_date);
CREATE INDEX idx_coach_client_relationships_coach_id ON coach_client_relationships(coach_id);
CREATE INDEX idx_coach_client_relationships_client_id ON coach_client_relationships(client_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_client_checkins_client_id ON client_checkins(client_id);
CREATE INDEX idx_client_checkins_coach_id ON client_checkins(coach_id);

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER (optional, use app-level instead)
-- =====================================================

-- Note: Azure SQL doesn't support triggers the same way as PostgreSQL.
-- Handle updated_at in your application code instead.

PRINT 'Schema created successfully!';
