-- Add remaining super_admin policies (skipping those that already exist)
-- Using DROP IF EXISTS to avoid conflicts

-- Coaching Requests
DROP POLICY IF EXISTS "Super admins can manage all coaching requests" ON public.coaching_requests;
CREATE POLICY "Super admins can manage all coaching requests"
ON public.coaching_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Client Measurements
DROP POLICY IF EXISTS "Super admins can manage all client measurements" ON public.client_measurements;
CREATE POLICY "Super admins can manage all client measurements"
ON public.client_measurements
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Client Goals
DROP POLICY IF EXISTS "Super admins can manage all client goals" ON public.client_goals;
CREATE POLICY "Super admins can manage all client goals"
ON public.client_goals
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Client Checkins
DROP POLICY IF EXISTS "Super admins can manage all client checkins" ON public.client_checkins;
CREATE POLICY "Super admins can manage all client checkins"
ON public.client_checkins
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Progress Photos
DROP POLICY IF EXISTS "Super admins can manage all progress photos" ON public.progress_photos;
CREATE POLICY "Super admins can manage all progress photos"
ON public.progress_photos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Coach Client Notes
DROP POLICY IF EXISTS "Super admins can manage all coach client notes" ON public.coach_client_notes;
CREATE POLICY "Super admins can manage all coach client notes"
ON public.coach_client_notes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Exercises
DROP POLICY IF EXISTS "Super admins can manage all exercises" ON public.exercises;
CREATE POLICY "Super admins can manage all exercises"
ON public.exercises
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Workout Templates
DROP POLICY IF EXISTS "Super admins can manage all workout templates" ON public.workout_templates;
CREATE POLICY "Super admins can manage all workout templates"
ON public.workout_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Workout Template Weeks
DROP POLICY IF EXISTS "Super admins can manage all workout template weeks" ON public.workout_template_weeks;
CREATE POLICY "Super admins can manage all workout template weeks"
ON public.workout_template_weeks
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Workout Template Days
DROP POLICY IF EXISTS "Super admins can manage all workout template days" ON public.workout_template_days;
CREATE POLICY "Super admins can manage all workout template days"
ON public.workout_template_days
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Workout Template Exercises
DROP POLICY IF EXISTS "Super admins can manage all workout template exercises" ON public.workout_template_exercises;
CREATE POLICY "Super admins can manage all workout template exercises"
ON public.workout_template_exercises
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Diet Plans
DROP POLICY IF EXISTS "Super admins can manage all diet plans" ON public.diet_plans;
CREATE POLICY "Super admins can manage all diet plans"
ON public.diet_plans
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Diet Plan Meals
DROP POLICY IF EXISTS "Super admins can manage all diet plan meals" ON public.diet_plan_meals;
CREATE POLICY "Super admins can manage all diet plan meals"
ON public.diet_plan_meals
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Foods
DROP POLICY IF EXISTS "Super admins can manage all foods" ON public.foods;
CREATE POLICY "Super admins can manage all foods"
ON public.foods
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Recipes
DROP POLICY IF EXISTS "Super admins can manage all recipes" ON public.recipes;
CREATE POLICY "Super admins can manage all recipes"
ON public.recipes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Recipe Ingredients
DROP POLICY IF EXISTS "Super admins can manage all recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Super admins can manage all recipe ingredients"
ON public.recipe_ingredients
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Meal Templates
DROP POLICY IF EXISTS "Super admins can manage all meal templates" ON public.meal_templates;
CREATE POLICY "Super admins can manage all meal templates"
ON public.meal_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Meal Template Items
DROP POLICY IF EXISTS "Super admins can manage all meal template items" ON public.meal_template_items;
CREATE POLICY "Super admins can manage all meal template items"
ON public.meal_template_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Meal Food Items
DROP POLICY IF EXISTS "Super admins can manage all meal food items" ON public.meal_food_items;
CREATE POLICY "Super admins can manage all meal food items"
ON public.meal_food_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Plan Assignments
DROP POLICY IF EXISTS "Super admins can manage all plan assignments" ON public.plan_assignments;
CREATE POLICY "Super admins can manage all plan assignments"
ON public.plan_assignments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Workout Logs
DROP POLICY IF EXISTS "Super admins can manage all workout logs" ON public.workout_logs;
CREATE POLICY "Super admins can manage all workout logs"
ON public.workout_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Workout Log Exercises
DROP POLICY IF EXISTS "Super admins can manage all workout log exercises" ON public.workout_log_exercises;
CREATE POLICY "Super admins can manage all workout log exercises"
ON public.workout_log_exercises
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Client Nutrition Logs
DROP POLICY IF EXISTS "Super admins can manage all nutrition logs" ON public.client_nutrition_logs;
CREATE POLICY "Super admins can manage all nutrition logs"
ON public.client_nutrition_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Messages
DROP POLICY IF EXISTS "Super admins can manage all messages" ON public.messages;
CREATE POLICY "Super admins can manage all messages"
ON public.messages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Notifications
DROP POLICY IF EXISTS "Super admins can manage all notifications" ON public.notifications;
CREATE POLICY "Super admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- User Favorites
DROP POLICY IF EXISTS "Super admins can manage all favorites" ON public.user_favorites;
CREATE POLICY "Super admins can manage all favorites"
ON public.user_favorites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Checkin Templates
DROP POLICY IF EXISTS "Super admins can manage all checkin templates" ON public.checkin_templates;
CREATE POLICY "Super admins can manage all checkin templates"
ON public.checkin_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Exercise Alternatives
DROP POLICY IF EXISTS "Super admins can manage all exercise alternatives" ON public.exercise_alternatives;
CREATE POLICY "Super admins can manage all exercise alternatives"
ON public.exercise_alternatives
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Food Alternatives
DROP POLICY IF EXISTS "Super admins can manage all food alternatives" ON public.food_alternatives;
CREATE POLICY "Super admins can manage all food alternatives"
ON public.food_alternatives
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));