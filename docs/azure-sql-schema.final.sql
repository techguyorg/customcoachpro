-- =============================================================================
-- CustomCoachPro Azure SQL Database Schema - FINAL VERSION
-- =============================================================================
-- This schema is derived from actual backend route queries to ensure 100% compatibility.
-- Run this script on a fresh Azure SQL Database.
-- =============================================================================

-- =============================================================================
-- 1. USERS AND AUTHENTICATION
-- =============================================================================

CREATE TABLE dbo.users (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    email_verified BIT NOT NULL DEFAULT 0,
    email_verification_token NVARCHAR(255) NULL,
    email_verification_expires DATETIME2 NULL,
    password_reset_token NVARCHAR(255) NULL,
    password_reset_expires DATETIME2 NULL,
    last_login_at DATETIME2 NULL,
    login_count INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_users_email ON dbo.users(email);
CREATE INDEX idx_users_email_verification_token ON dbo.users(email_verification_token);
CREATE INDEX idx_users_password_reset_token ON dbo.users(password_reset_token);

-- User roles
CREATE TABLE dbo.user_roles (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(36) NOT NULL,
    role NVARCHAR(50) NOT NULL, -- 'super_admin', 'coach', 'client'
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_roles_user_id ON dbo.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON dbo.user_roles(role);

-- Refresh tokens
CREATE TABLE dbo.refresh_tokens (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(36) NOT NULL,
    token NVARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    revoked_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_token ON dbo.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON dbo.refresh_tokens(user_id);

-- =============================================================================
-- 2. PROFILES
-- =============================================================================

CREATE TABLE dbo.profiles (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(36) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    avatar_url NVARCHAR(500) NULL,
    bio NVARCHAR(MAX) NULL,
    phone NVARCHAR(50) NULL,
    date_of_birth DATE NULL,
    gender NVARCHAR(20) NULL,
    onboarding_completed BIT DEFAULT 0,
    onboarding_step INT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_profiles_user_id ON dbo.profiles(user_id);

-- Client profiles (additional client-specific data)
CREATE TABLE dbo.client_profiles (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(36) NOT NULL UNIQUE,
    coach_id NVARCHAR(36) NULL,
    fitness_level NVARCHAR(50) NULL,
    fitness_goals NVARCHAR(MAX) NULL, -- JSON array
    current_weight_kg DECIMAL(5,2) NULL,
    target_weight_kg DECIMAL(5,2) NULL,
    height_cm DECIMAL(5,2) NULL,
    dietary_restrictions NVARCHAR(MAX) NULL, -- JSON array
    medical_conditions NVARCHAR(MAX) NULL,
    subscription_status NVARCHAR(50) NULL,
    subscription_end_date DATE NULL,
    email_plan_assigned BIT DEFAULT 1,
    email_checkin_submitted BIT DEFAULT 1,
    email_checkin_reviewed BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_client_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_client_profiles_user_id ON dbo.client_profiles(user_id);
CREATE INDEX idx_client_profiles_coach_id ON dbo.client_profiles(coach_id);

-- Coach profiles (additional coach-specific data)
CREATE TABLE dbo.coach_profiles (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(36) NOT NULL UNIQUE,
    specializations NVARCHAR(MAX) NULL, -- JSON array
    certifications NVARCHAR(MAX) NULL, -- JSON array
    experience_years INT NULL,
    hourly_rate DECIMAL(10,2) NULL,
    currency NVARCHAR(10) DEFAULT 'USD',
    max_clients INT NULL,
    is_accepting_clients BIT DEFAULT 1,
    rating DECIMAL(3,2) NULL,
    total_reviews INT DEFAULT 0,
    stripe_account_id NVARCHAR(255) NULL,
    email_plan_assigned BIT DEFAULT 1,
    email_checkin_received BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_coach_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_coach_profiles_user_id ON dbo.coach_profiles(user_id);

-- =============================================================================
-- 3. EXERCISES
-- =============================================================================

CREATE TABLE dbo.exercises (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    instructions NVARCHAR(MAX) NULL, -- JSON array
    tips NVARCHAR(MAX) NULL, -- JSON array
    common_mistakes NVARCHAR(MAX) NULL, -- JSON array
    primary_muscle NVARCHAR(50) NOT NULL,
    secondary_muscles NVARCHAR(MAX) NULL, -- JSON array
    equipment NVARCHAR(50) NOT NULL,
    difficulty NVARCHAR(20) NOT NULL DEFAULT 'intermediate',
    exercise_type NVARCHAR(50) NULL DEFAULT 'strength',
    video_url NVARCHAR(500) NULL,
    image_url NVARCHAR(500) NULL,
    is_system BIT NOT NULL DEFAULT 0,
    created_by NVARCHAR(36) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_exercises_primary_muscle ON dbo.exercises(primary_muscle);
CREATE INDEX idx_exercises_equipment ON dbo.exercises(equipment);
CREATE INDEX idx_exercises_difficulty ON dbo.exercises(difficulty);
CREATE INDEX idx_exercises_is_system ON dbo.exercises(is_system);
CREATE INDEX idx_exercises_created_by ON dbo.exercises(created_by);

-- Exercise alternatives
CREATE TABLE dbo.exercise_alternatives (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    exercise_id NVARCHAR(36) NOT NULL,
    alternative_exercise_id NVARCHAR(36) NOT NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_exercise_alternatives_exercise FOREIGN KEY (exercise_id) REFERENCES dbo.exercises(id) ON DELETE CASCADE,
    CONSTRAINT FK_exercise_alternatives_alt FOREIGN KEY (alternative_exercise_id) REFERENCES dbo.exercises(id)
);

CREATE INDEX idx_exercise_alternatives_exercise_id ON dbo.exercise_alternatives(exercise_id);

-- =============================================================================
-- 4. WORKOUT TEMPLATES
-- =============================================================================

CREATE TABLE dbo.workout_templates (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    difficulty NVARCHAR(20) NOT NULL DEFAULT 'intermediate',
    duration_weeks INT NULL DEFAULT 1,
    days_per_week INT NOT NULL DEFAULT 3,
    goal NVARCHAR(100) NULL,
    category NVARCHAR(100) NULL,
    template_type NVARCHAR(50) NULL,
    is_periodized BIT DEFAULT 0,
    cloned_from NVARCHAR(36) NULL,
    is_system BIT NOT NULL DEFAULT 0,
    created_by NVARCHAR(36) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_workout_templates_difficulty ON dbo.workout_templates(difficulty);
CREATE INDEX idx_workout_templates_goal ON dbo.workout_templates(goal);
CREATE INDEX idx_workout_templates_is_system ON dbo.workout_templates(is_system);
CREATE INDEX idx_workout_templates_created_by ON dbo.workout_templates(created_by);

-- Workout template weeks
CREATE TABLE dbo.workout_template_weeks (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    template_id NVARCHAR(36) NOT NULL,
    week_number INT NOT NULL,
    name NVARCHAR(255) NULL,
    focus NVARCHAR(255) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_workout_template_weeks_template FOREIGN KEY (template_id) REFERENCES dbo.workout_templates(id) ON DELETE CASCADE
);

CREATE INDEX idx_workout_template_weeks_template_id ON dbo.workout_template_weeks(template_id);

-- Workout template days
CREATE TABLE dbo.workout_template_days (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    template_id NVARCHAR(36) NOT NULL,
    week_id NVARCHAR(36) NULL,
    day_number INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_workout_template_days_template FOREIGN KEY (template_id) REFERENCES dbo.workout_templates(id) ON DELETE CASCADE,
    CONSTRAINT FK_workout_template_days_week FOREIGN KEY (week_id) REFERENCES dbo.workout_template_weeks(id)
);

CREATE INDEX idx_workout_template_days_template_id ON dbo.workout_template_days(template_id);
CREATE INDEX idx_workout_template_days_week_id ON dbo.workout_template_days(week_id);

-- Workout template exercises
CREATE TABLE dbo.workout_template_exercises (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    day_id NVARCHAR(36) NOT NULL,
    exercise_id NVARCHAR(36) NULL,
    custom_exercise_name NVARCHAR(255) NULL,
    order_index INT NOT NULL DEFAULT 0,
    sets_min INT NOT NULL DEFAULT 3,
    sets_max INT NULL,
    reps_min INT NOT NULL DEFAULT 8,
    reps_max INT NULL,
    rest_seconds_min INT NULL DEFAULT 60,
    rest_seconds_max INT NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_workout_template_exercises_day FOREIGN KEY (day_id) REFERENCES dbo.workout_template_days(id) ON DELETE CASCADE,
    CONSTRAINT FK_workout_template_exercises_exercise FOREIGN KEY (exercise_id) REFERENCES dbo.exercises(id)
);

CREATE INDEX idx_workout_template_exercises_day_id ON dbo.workout_template_exercises(day_id);
CREATE INDEX idx_workout_template_exercises_exercise_id ON dbo.workout_template_exercises(exercise_id);

-- =============================================================================
-- 5. FOODS
-- =============================================================================

CREATE TABLE dbo.foods (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    brand NVARCHAR(255) NULL,
    category NVARCHAR(100) NOT NULL,
    subcategory NVARCHAR(100) NULL,
    barcode NVARCHAR(50) NULL,
    calories_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
    protein_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
    carbs_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
    fat_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
    fiber_per_100g DECIMAL(8,2) NULL,
    sugar_per_100g DECIMAL(8,2) NULL,
    sodium_mg_per_100g DECIMAL(8,2) NULL,
    default_serving_size DECIMAL(8,2) NOT NULL DEFAULT 100,
    default_serving_unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    image_url NVARCHAR(500) NULL,
    notes NVARCHAR(MAX) NULL,
    is_system BIT NOT NULL DEFAULT 0,
    created_by NVARCHAR(36) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_foods_category ON dbo.foods(category);
CREATE INDEX idx_foods_is_system ON dbo.foods(is_system);
CREATE INDEX idx_foods_created_by ON dbo.foods(created_by);
CREATE INDEX idx_foods_barcode ON dbo.foods(barcode);

-- Food alternatives
CREATE TABLE dbo.food_alternatives (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    food_id NVARCHAR(36) NOT NULL,
    alternative_food_id NVARCHAR(36) NOT NULL,
    reason NVARCHAR(255) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_food_alternatives_food FOREIGN KEY (food_id) REFERENCES dbo.foods(id) ON DELETE CASCADE,
    CONSTRAINT FK_food_alternatives_alt FOREIGN KEY (alternative_food_id) REFERENCES dbo.foods(id)
);

CREATE INDEX idx_food_alternatives_food_id ON dbo.food_alternatives(food_id);

-- =============================================================================
-- 6. RECIPES
-- =============================================================================

CREATE TABLE dbo.recipes (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    category NVARCHAR(100) NULL,
    instructions NVARCHAR(MAX) NULL,
    prep_time_minutes INT NULL,
    cook_time_minutes INT NULL,
    servings INT NOT NULL DEFAULT 1,
    total_weight_g DECIMAL(10,2) NULL,
    calories_per_serving DECIMAL(10,2) NULL,
    protein_per_serving DECIMAL(10,2) NULL,
    carbs_per_serving DECIMAL(10,2) NULL,
    fat_per_serving DECIMAL(10,2) NULL,
    fiber_per_serving DECIMAL(10,2) NULL,
    image_url NVARCHAR(500) NULL,
    is_system BIT NOT NULL DEFAULT 0,
    created_by NVARCHAR(36) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_recipes_category ON dbo.recipes(category);
CREATE INDEX idx_recipes_is_system ON dbo.recipes(is_system);
CREATE INDEX idx_recipes_created_by ON dbo.recipes(created_by);

-- Recipe ingredients
CREATE TABLE dbo.recipe_ingredients (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    recipe_id NVARCHAR(36) NOT NULL,
    food_id NVARCHAR(36) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 100,
    unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    order_index INT NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_recipe_ingredients_recipe FOREIGN KEY (recipe_id) REFERENCES dbo.recipes(id) ON DELETE CASCADE,
    CONSTRAINT FK_recipe_ingredients_food FOREIGN KEY (food_id) REFERENCES dbo.foods(id)
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON dbo.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_food_id ON dbo.recipe_ingredients(food_id);

-- =============================================================================
-- 7. DIET PLANS
-- =============================================================================

CREATE TABLE dbo.diet_plans (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    calories_target INT NULL,
    protein_grams INT NULL,
    carbs_grams INT NULL,
    fat_grams INT NULL,
    meals_per_day INT NULL DEFAULT 3,
    dietary_type NVARCHAR(50) NULL,
    goal NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    is_system BIT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_by NVARCHAR(36) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_diet_plans_goal ON dbo.diet_plans(goal);
CREATE INDEX idx_diet_plans_dietary_type ON dbo.diet_plans(dietary_type);
CREATE INDEX idx_diet_plans_is_system ON dbo.diet_plans(is_system);
CREATE INDEX idx_diet_plans_created_by ON dbo.diet_plans(created_by);

-- Diet plan meals
CREATE TABLE dbo.diet_plan_meals (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    plan_id NVARCHAR(36) NOT NULL,
    meal_number INT NOT NULL,
    meal_name NVARCHAR(100) NOT NULL,
    time_suggestion NVARCHAR(50) NULL,
    calories INT NULL,
    protein_grams INT NULL,
    carbs_grams INT NULL,
    fat_grams INT NULL,
    notes NVARCHAR(MAX) NULL,
    food_suggestions NVARCHAR(MAX) NULL, -- JSON array
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_diet_plan_meals_plan FOREIGN KEY (plan_id) REFERENCES dbo.diet_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_diet_plan_meals_plan_id ON dbo.diet_plan_meals(plan_id);

-- Meal food items
CREATE TABLE dbo.meal_food_items (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    meal_id NVARCHAR(36) NOT NULL,
    food_id NVARCHAR(36) NULL,
    recipe_id NVARCHAR(36) NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 100,
    unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    order_index INT NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX) NULL,
    calculated_calories DECIMAL(10,2) NULL,
    calculated_protein DECIMAL(10,2) NULL,
    calculated_carbs DECIMAL(10,2) NULL,
    calculated_fat DECIMAL(10,2) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_meal_food_items_meal FOREIGN KEY (meal_id) REFERENCES dbo.diet_plan_meals(id) ON DELETE CASCADE,
    CONSTRAINT FK_meal_food_items_food FOREIGN KEY (food_id) REFERENCES dbo.foods(id),
    CONSTRAINT FK_meal_food_items_recipe FOREIGN KEY (recipe_id) REFERENCES dbo.recipes(id)
);

CREATE INDEX idx_meal_food_items_meal_id ON dbo.meal_food_items(meal_id);

-- Meal templates
CREATE TABLE dbo.meal_templates (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    category NVARCHAR(100) NULL,
    total_calories DECIMAL(10,2) NULL,
    total_protein DECIMAL(10,2) NULL,
    total_carbs DECIMAL(10,2) NULL,
    total_fat DECIMAL(10,2) NULL,
    is_system BIT NOT NULL DEFAULT 0,
    created_by NVARCHAR(36) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Meal template items
CREATE TABLE dbo.meal_template_items (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    template_id NVARCHAR(36) NOT NULL,
    food_id NVARCHAR(36) NULL,
    recipe_id NVARCHAR(36) NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 100,
    unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    order_index INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_meal_template_items_template FOREIGN KEY (template_id) REFERENCES dbo.meal_templates(id) ON DELETE CASCADE,
    CONSTRAINT FK_meal_template_items_food FOREIGN KEY (food_id) REFERENCES dbo.foods(id),
    CONSTRAINT FK_meal_template_items_recipe FOREIGN KEY (recipe_id) REFERENCES dbo.recipes(id)
);

CREATE INDEX idx_meal_template_items_template_id ON dbo.meal_template_items(template_id);

-- =============================================================================
-- 8. CLIENT TRACKING
-- =============================================================================

CREATE TABLE dbo.client_measurements (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    client_id NVARCHAR(36) NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    body_fat_pct DECIMAL(5,2) NULL,
    muscle_mass_kg DECIMAL(5,2) NULL,
    waist_cm DECIMAL(5,2) NULL,
    chest_cm DECIMAL(5,2) NULL,
    hips_cm DECIMAL(5,2) NULL,
    neck_cm DECIMAL(5,2) NULL,
    shoulders_cm DECIMAL(5,2) NULL,
    left_arm_cm DECIMAL(5,2) NULL,
    right_arm_cm DECIMAL(5,2) NULL,
    left_thigh_cm DECIMAL(5,2) NULL,
    right_thigh_cm DECIMAL(5,2) NULL,
    left_calf_cm DECIMAL(5,2) NULL,
    right_calf_cm DECIMAL(5,2) NULL,
    notes NVARCHAR(MAX) NULL,
    recorded_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_client_measurements_client_id ON dbo.client_measurements(client_id);
CREATE INDEX idx_client_measurements_recorded_at ON dbo.client_measurements(recorded_at);

-- Client goals
CREATE TABLE dbo.client_goals (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    client_id NVARCHAR(36) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    goal_type NVARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2) NULL,
    current_value DECIMAL(10,2) NULL,
    starting_value DECIMAL(10,2) NULL,
    unit NVARCHAR(50) NULL,
    target_date DATE NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    completed_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_client_goals_client_id ON dbo.client_goals(client_id);
CREATE INDEX idx_client_goals_status ON dbo.client_goals(status);

-- Progress photos
CREATE TABLE dbo.progress_photos (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    client_id NVARCHAR(36) NOT NULL,
    photo_url NVARCHAR(500) NOT NULL,
    thumbnail_url NVARCHAR(500) NULL,
    pose_type NVARCHAR(50) NOT NULL,
    notes NVARCHAR(MAX) NULL,
    is_private BIT NOT NULL DEFAULT 0,
    recorded_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_progress_photos_client_id ON dbo.progress_photos(client_id);
CREATE INDEX idx_progress_photos_recorded_at ON dbo.progress_photos(recorded_at);

-- =============================================================================
-- 9. WORKOUT LOGS
-- =============================================================================

CREATE TABLE dbo.workout_logs (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    client_id NVARCHAR(36) NOT NULL,
    template_id NVARCHAR(36) NULL,
    template_day_id NVARCHAR(36) NULL,
    assignment_id NVARCHAR(36) NULL,
    workout_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    status NVARCHAR(50) NOT NULL DEFAULT 'completed',
    started_at DATETIME2 NULL,
    completed_at DATETIME2 NULL,
    duration_minutes INT NULL,
    notes NVARCHAR(MAX) NULL,
    perceived_effort INT NULL,
    satisfaction_rating INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_workout_logs_client_id ON dbo.workout_logs(client_id);
CREATE INDEX idx_workout_logs_workout_date ON dbo.workout_logs(workout_date);
CREATE INDEX idx_workout_logs_template_id ON dbo.workout_logs(template_id);

-- Workout log exercises
CREATE TABLE dbo.workout_log_exercises (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    workout_log_id NVARCHAR(36) NOT NULL,
    exercise_id NVARCHAR(36) NULL,
    exercise_name NVARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    sets_completed INT NOT NULL DEFAULT 0,
    set_data NVARCHAR(MAX) NULL, -- JSON array of sets with reps/weight
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_workout_log_exercises_log FOREIGN KEY (workout_log_id) REFERENCES dbo.workout_logs(id) ON DELETE CASCADE,
    CONSTRAINT FK_workout_log_exercises_exercise FOREIGN KEY (exercise_id) REFERENCES dbo.exercises(id)
);

CREATE INDEX idx_workout_log_exercises_log_id ON dbo.workout_log_exercises(workout_log_id);

-- =============================================================================
-- 10. NUTRITION LOGS
-- =============================================================================

CREATE TABLE dbo.client_nutrition_logs (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    client_id NVARCHAR(36) NOT NULL,
    log_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    meal_type NVARCHAR(50) NOT NULL,
    food_id NVARCHAR(36) NULL,
    recipe_id NVARCHAR(36) NULL,
    custom_food_name NVARCHAR(255) NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 100,
    unit NVARCHAR(20) NOT NULL DEFAULT 'g',
    calories DECIMAL(10,2) NULL,
    protein_grams DECIMAL(10,2) NULL,
    carbs_grams DECIMAL(10,2) NULL,
    fat_grams DECIMAL(10,2) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_client_nutrition_logs_client_id ON dbo.client_nutrition_logs(client_id);
CREATE INDEX idx_client_nutrition_logs_log_date ON dbo.client_nutrition_logs(log_date);

-- =============================================================================
-- 11. COACHING RELATIONSHIPS
-- =============================================================================

CREATE TABLE dbo.coach_client_relationships (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    coach_id NVARCHAR(36) NOT NULL,
    client_id NVARCHAR(36) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    started_at DATETIME2 NULL DEFAULT GETUTCDATE(),
    ended_at DATETIME2 NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_coach_client_relationships_coach_id ON dbo.coach_client_relationships(coach_id);
CREATE INDEX idx_coach_client_relationships_client_id ON dbo.coach_client_relationships(client_id);
CREATE INDEX idx_coach_client_relationships_status ON dbo.coach_client_relationships(status);

-- Coaching requests
CREATE TABLE dbo.coaching_requests (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    coach_id NVARCHAR(36) NOT NULL,
    client_id NVARCHAR(36) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    message NVARCHAR(MAX) NULL,
    coach_response NVARCHAR(MAX) NULL,
    responded_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_coaching_requests_coach_id ON dbo.coaching_requests(coach_id);
CREATE INDEX idx_coaching_requests_client_id ON dbo.coaching_requests(client_id);
CREATE INDEX idx_coaching_requests_status ON dbo.coaching_requests(status);

-- Coach client notes
CREATE TABLE dbo.coach_client_notes (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    coach_id NVARCHAR(36) NOT NULL,
    client_id NVARCHAR(36) NOT NULL,
    title NVARCHAR(255) NULL,
    content NVARCHAR(MAX) NOT NULL,
    note_type NVARCHAR(50) NOT NULL DEFAULT 'general',
    priority NVARCHAR(20) NULL,
    is_pinned BIT NOT NULL DEFAULT 0,
    reference_date DATE NULL,
    tags NVARCHAR(MAX) NULL, -- JSON array
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_coach_client_notes_coach_id ON dbo.coach_client_notes(coach_id);
CREATE INDEX idx_coach_client_notes_client_id ON dbo.coach_client_notes(client_id);

-- =============================================================================
-- 12. PLAN ASSIGNMENTS
-- =============================================================================

CREATE TABLE dbo.plan_assignments (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    coach_id NVARCHAR(36) NOT NULL,
    client_id NVARCHAR(36) NOT NULL,
    plan_type NVARCHAR(50) NOT NULL, -- 'workout' or 'diet'
    workout_template_id NVARCHAR(36) NULL,
    diet_plan_id NVARCHAR(36) NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    coach_notes NVARCHAR(MAX) NULL,
    client_notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_plan_assignments_coach_id ON dbo.plan_assignments(coach_id);
CREATE INDEX idx_plan_assignments_client_id ON dbo.plan_assignments(client_id);
CREATE INDEX idx_plan_assignments_status ON dbo.plan_assignments(status);

-- =============================================================================
-- 13. CHECK-INS
-- =============================================================================

CREATE TABLE dbo.checkin_templates (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    coach_id NVARCHAR(36) NOT NULL,
    client_id NVARCHAR(36) NULL,
    name NVARCHAR(255) NOT NULL DEFAULT 'Weekly Check-in',
    description NVARCHAR(MAX) NULL,
    frequency_days INT NOT NULL DEFAULT 7,
    required_fields NVARCHAR(MAX) NOT NULL DEFAULT '[]', -- JSON array
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_checkin_templates_coach_id ON dbo.checkin_templates(coach_id);

CREATE TABLE dbo.client_checkins (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    client_id NVARCHAR(36) NOT NULL,
    coach_id NVARCHAR(36) NULL,
    template_id NVARCHAR(36) NULL,
    measurement_id NVARCHAR(36) NULL,
    checkin_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    period_start DATE NULL,
    period_end DATE NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at DATETIME2 NULL,
    reviewed_at DATETIME2 NULL,
    reviewed_by NVARCHAR(36) NULL,
    diet_adherence INT NULL,
    diet_notes NVARCHAR(MAX) NULL,
    workout_adherence INT NULL,
    workout_notes NVARCHAR(MAX) NULL,
    energy_level INT NULL,
    sleep_quality INT NULL,
    mood_rating INT NULL,
    stress_level INT NULL,
    general_notes NVARCHAR(MAX) NULL,
    wins NVARCHAR(MAX) NULL,
    challenges NVARCHAR(MAX) NULL,
    photo_ids NVARCHAR(MAX) NULL, -- JSON array
    coach_feedback NVARCHAR(MAX) NULL,
    coach_rating INT NULL,
    next_checkin_date DATE NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_client_checkins_client_id ON dbo.client_checkins(client_id);
CREATE INDEX idx_client_checkins_coach_id ON dbo.client_checkins(coach_id);
CREATE INDEX idx_client_checkins_status ON dbo.client_checkins(status);
CREATE INDEX idx_client_checkins_checkin_date ON dbo.client_checkins(checkin_date);

-- =============================================================================
-- 14. MESSAGING
-- =============================================================================

CREATE TABLE dbo.messages (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    sender_id NVARCHAR(36) NOT NULL,
    recipient_id NVARCHAR(36) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    read_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_messages_sender_id ON dbo.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON dbo.messages(recipient_id);
CREATE INDEX idx_messages_created_at ON dbo.messages(created_at);

-- =============================================================================
-- 15. NOTIFICATIONS
-- =============================================================================

CREATE TABLE dbo.notifications (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(36) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    reference_type NVARCHAR(50) NULL,
    reference_id NVARCHAR(36) NULL,
    data NVARCHAR(MAX) NULL, -- JSON
    is_read BIT NOT NULL DEFAULT 0,
    read_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_notifications_user_id ON dbo.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON dbo.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON dbo.notifications(created_at);

-- =============================================================================
-- 16. FAVORITES
-- =============================================================================

CREATE TABLE dbo.user_favorites (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(36) NOT NULL,
    item_type NVARCHAR(50) NOT NULL, -- 'exercise', 'food', 'recipe', 'workout_template', 'diet_plan'
    item_id NVARCHAR(36) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_user_favorites UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX idx_user_favorites_user_id ON dbo.user_favorites(user_id);
CREATE INDEX idx_user_favorites_item_type ON dbo.user_favorites(item_type);

-- =============================================================================
-- 17. ADMIN
-- =============================================================================

CREATE TABLE dbo.platform_settings (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    setting_key NVARCHAR(100) NOT NULL UNIQUE,
    setting_value NVARCHAR(MAX) NOT NULL, -- JSON
    setting_type NVARCHAR(50) NOT NULL DEFAULT 'string',
    category NVARCHAR(50) NOT NULL DEFAULT 'general',
    description NVARCHAR(MAX) NULL,
    updated_by NVARCHAR(36) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE dbo.admin_audit_logs (
    id NVARCHAR(36) NOT NULL PRIMARY KEY DEFAULT NEWID(),
    admin_user_id NVARCHAR(36) NOT NULL,
    action_type NVARCHAR(100) NOT NULL,
    target_user_id NVARCHAR(36) NULL,
    target_resource_type NVARCHAR(50) NULL,
    target_resource_id NVARCHAR(36) NULL,
    details NVARCHAR(MAX) NULL, -- JSON
    ip_address NVARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_admin_audit_logs_admin_user_id ON dbo.admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action_type ON dbo.admin_audit_logs(action_type);
CREATE INDEX idx_admin_audit_logs_created_at ON dbo.admin_audit_logs(created_at);

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
PRINT 'CustomCoachPro Azure SQL Schema created successfully!';
