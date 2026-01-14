-- =====================================================
-- DATA EXPORT SCRIPT: Supabase → Azure SQL
-- =====================================================
-- Run this in Supabase SQL Editor to generate INSERT statements
-- Then run the generated INSERT statements in Azure Data Studio
-- =====================================================

-- =====================================================
-- STEP 1: EXPORT EXERCISES (148 rows)
-- =====================================================
-- Run this in Supabase SQL Editor:

SELECT 
  'INSERT INTO exercises (id, name, description, primary_muscle, secondary_muscles, equipment, difficulty, exercise_type, instructions, tips, common_mistakes, video_url, image_url, is_system, created_at, updated_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(name, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || primary_muscle || ''', ' ||
  COALESCE('''' || secondary_muscles::text || '''', 'NULL') || ', ' ||
  '''' || equipment || ''', ' ||
  '''' || difficulty || ''', ' ||
  '''' || exercise_type || ''', ' ||
  COALESCE('''' || REPLACE(instructions::text, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(tips::text, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(common_mistakes::text, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || video_url || '''', 'NULL') || ', ' ||
  COALESCE('''' || image_url || '''', 'NULL') || ', ' ||
  CASE WHEN is_system THEN '1' ELSE '0' END || ', ' ||
  '''' || created_at || ''', ' ||
  '''' || updated_at || ''');'
AS insert_statement
FROM exercises
ORDER BY created_at;

-- =====================================================
-- STEP 2: EXPORT WORKOUT TEMPLATES (136 rows)
-- =====================================================

SELECT 
  'INSERT INTO workout_templates (id, name, description, difficulty, duration_weeks, days_per_week, goal, template_type, is_periodized, is_system, created_at, updated_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(name, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || difficulty || ''', ' ||
  COALESCE(duration_weeks::text, 'NULL') || ', ' ||
  days_per_week::text || ', ' ||
  COALESCE('''' || REPLACE(goal, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || template_type || '''', 'NULL') || ', ' ||
  CASE WHEN is_periodized THEN '1' ELSE '0' END || ', ' ||
  CASE WHEN is_system THEN '1' ELSE '0' END || ', ' ||
  '''' || created_at || ''', ' ||
  '''' || updated_at || ''');'
AS insert_statement
FROM workout_templates
ORDER BY created_at;

-- =====================================================
-- STEP 3: EXPORT WORKOUT TEMPLATE WEEKS (1,367 rows)
-- =====================================================

SELECT 
  'INSERT INTO workout_template_weeks (id, template_id, week_number, name, focus, notes, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || template_id || ''', ' ||
  week_number::text || ', ' ||
  COALESCE('''' || REPLACE(name, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(focus, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(notes, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || created_at || ''');'
AS insert_statement
FROM workout_template_weeks
ORDER BY template_id, week_number;

-- =====================================================
-- STEP 4: EXPORT WORKOUT TEMPLATE DAYS (544 rows)
-- =====================================================

SELECT 
  'INSERT INTO workout_template_days (id, template_id, week_id, day_number, name, notes, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || template_id || ''', ' ||
  COALESCE('''' || week_id || '''', 'NULL') || ', ' ||
  day_number::text || ', ' ||
  '''' || REPLACE(name, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(notes, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || created_at || ''');'
AS insert_statement
FROM workout_template_days
ORDER BY template_id, day_number;

-- =====================================================
-- STEP 5: EXPORT WORKOUT TEMPLATE EXERCISES (206 rows)
-- =====================================================

SELECT 
  'INSERT INTO workout_template_exercises (id, day_id, exercise_id, custom_exercise_name, order_index, sets_min, sets_max, reps_min, reps_max, rest_seconds_min, rest_seconds_max, notes, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || day_id || ''', ' ||
  COALESCE('''' || exercise_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(custom_exercise_name, '''', '''''') || '''', 'NULL') || ', ' ||
  order_index::text || ', ' ||
  sets_min::text || ', ' ||
  COALESCE(sets_max::text, 'NULL') || ', ' ||
  reps_min::text || ', ' ||
  COALESCE(reps_max::text, 'NULL') || ', ' ||
  COALESCE(rest_seconds_min::text, 'NULL') || ', ' ||
  COALESCE(rest_seconds_max::text, 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(notes, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || created_at || ''');'
AS insert_statement
FROM workout_template_exercises
ORDER BY day_id, order_index;

-- =====================================================
-- STEP 6: EXPORT FOODS (448 rows)
-- =====================================================

SELECT 
  'INSERT INTO foods (id, name, brand, category, subcategory, barcode, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, default_serving_size, default_serving_unit, is_system, created_at, updated_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(name, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(brand, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || category || ''', ' ||
  COALESCE('''' || subcategory || '''', 'NULL') || ', ' ||
  COALESCE('''' || barcode || '''', 'NULL') || ', ' ||
  calories_per_100g::text || ', ' ||
  protein_per_100g::text || ', ' ||
  carbs_per_100g::text || ', ' ||
  fat_per_100g::text || ', ' ||
  COALESCE(fiber_per_100g::text, 'NULL') || ', ' ||
  COALESCE(sugar_per_100g::text, 'NULL') || ', ' ||
  default_serving_size::text || ', ' ||
  '''' || default_serving_unit || ''', ' ||
  CASE WHEN is_system THEN '1' ELSE '0' END || ', ' ||
  '''' || created_at || ''', ' ||
  '''' || updated_at || ''');'
AS insert_statement
FROM foods
ORDER BY category, name;

-- =====================================================
-- STEP 7: EXPORT RECIPES (14 rows)
-- =====================================================

SELECT 
  'INSERT INTO recipes (id, name, description, category, instructions, prep_time_minutes, cook_time_minutes, servings, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, is_system, created_at, updated_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(name, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || category || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(instructions, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE(prep_time_minutes::text, 'NULL') || ', ' ||
  COALESCE(cook_time_minutes::text, 'NULL') || ', ' ||
  servings::text || ', ' ||
  COALESCE(calories_per_serving::text, 'NULL') || ', ' ||
  COALESCE(protein_per_serving::text, 'NULL') || ', ' ||
  COALESCE(carbs_per_serving::text, 'NULL') || ', ' ||
  COALESCE(fat_per_serving::text, 'NULL') || ', ' ||
  CASE WHEN is_system THEN '1' ELSE '0' END || ', ' ||
  '''' || created_at || ''', ' ||
  '''' || updated_at || ''');'
AS insert_statement
FROM recipes
ORDER BY name;

-- =====================================================
-- STEP 8: EXPORT DIET PLANS (7 rows)
-- =====================================================

SELECT 
  'INSERT INTO diet_plans (id, name, description, calories_target, protein_grams, carbs_grams, fat_grams, meals_per_day, dietary_type, goal, is_system, is_active, created_at, updated_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(name, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE(calories_target::text, 'NULL') || ', ' ||
  COALESCE(protein_grams::text, 'NULL') || ', ' ||
  COALESCE(carbs_grams::text, 'NULL') || ', ' ||
  COALESCE(fat_grams::text, 'NULL') || ', ' ||
  COALESCE(meals_per_day::text, 'NULL') || ', ' ||
  COALESCE('''' || dietary_type || '''', 'NULL') || ', ' ||
  COALESCE('''' || goal || '''', 'NULL') || ', ' ||
  CASE WHEN is_system THEN '1' ELSE '0' END || ', ' ||
  CASE WHEN is_active THEN '1' ELSE '0' END || ', ' ||
  '''' || created_at || ''', ' ||
  '''' || updated_at || ''');'
AS insert_statement
FROM diet_plans
ORDER BY name;

-- =====================================================
-- STEP 9: EXPORT RECIPE INGREDIENTS
-- =====================================================

SELECT 
  'INSERT INTO recipe_ingredients (id, recipe_id, food_id, quantity, unit, notes, order_index, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || recipe_id || ''', ' ||
  '''' || food_id || ''', ' ||
  quantity::text || ', ' ||
  '''' || unit || ''', ' ||
  COALESCE('''' || REPLACE(notes, '''', '''''') || '''', 'NULL') || ', ' ||
  order_index::text || ', ' ||
  '''' || created_at || ''');'
AS insert_statement
FROM recipe_ingredients
ORDER BY recipe_id, order_index;

-- =====================================================
-- VALIDATION QUERIES (Run in Azure SQL after import)
-- =====================================================

/*
-- Run these in Azure Data Studio to validate:

SELECT 'exercises' as table_name, COUNT(*) as row_count FROM exercises
UNION ALL
SELECT 'workout_templates', COUNT(*) FROM workout_templates
UNION ALL
SELECT 'workout_template_weeks', COUNT(*) FROM workout_template_weeks
UNION ALL
SELECT 'workout_template_days', COUNT(*) FROM workout_template_days
UNION ALL
SELECT 'workout_template_exercises', COUNT(*) FROM workout_template_exercises
UNION ALL
SELECT 'foods', COUNT(*) FROM foods
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL
SELECT 'diet_plans', COUNT(*) FROM diet_plans
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients;

-- Expected counts:
-- exercises: 148
-- workout_templates: 136
-- workout_template_weeks: 1,367
-- workout_template_days: 544
-- workout_template_exercises: 206
-- foods: 448
-- recipes: 14
-- diet_plans: 7
*/
