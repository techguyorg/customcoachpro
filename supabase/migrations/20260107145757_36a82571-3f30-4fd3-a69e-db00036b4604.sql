
-- Create enum for muscle groups
CREATE TYPE public.muscle_group AS ENUM (
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 
  'forearms', 'quadriceps', 'hamstrings', 'glutes', 
  'calves', 'abs', 'obliques', 'lower_back', 'traps', 'lats'
);

-- Create enum for equipment types
CREATE TYPE public.equipment_type AS ENUM (
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 
  'kettlebell', 'resistance_band', 'ez_bar', 'smith_machine',
  'pull_up_bar', 'dip_station', 'bench', 'cardio_machine', 'other'
);

-- Create enum for difficulty levels
CREATE TYPE public.difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create enum for exercise type
CREATE TYPE public.exercise_type AS ENUM ('compound', 'isolation', 'cardio', 'plyometric', 'stretching');

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT[],
  tips TEXT[],
  common_mistakes TEXT[],
  primary_muscle muscle_group NOT NULL,
  secondary_muscles muscle_group[] DEFAULT '{}',
  equipment equipment_type NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'intermediate',
  exercise_type exercise_type NOT NULL DEFAULT 'compound',
  video_url TEXT,
  image_url TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise alternatives (for substitutions)
CREATE TABLE public.exercise_alternatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  alternative_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exercise_id, alternative_exercise_id)
);

-- Create workout templates table
CREATE TABLE public.workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT, -- e.g., 'muscle_building', 'fat_loss', 'strength', 'general_fitness'
  difficulty difficulty_level NOT NULL DEFAULT 'intermediate',
  duration_weeks INTEGER DEFAULT 1,
  days_per_week INTEGER NOT NULL DEFAULT 3,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_periodized BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cloned_from UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout template weeks (for periodized programs)
CREATE TABLE public.workout_template_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  name TEXT,
  focus TEXT, -- e.g., 'volume', 'intensity', 'deload'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, week_number)
);

-- Create workout template days
CREATE TABLE public.workout_template_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  week_id UUID REFERENCES public.workout_template_weeks(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL, -- e.g., 'Push Day', 'Leg Day'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout template exercises
CREATE TABLE public.workout_template_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.workout_template_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  custom_exercise_name TEXT, -- For when coach adds unlisted exercise
  order_index INTEGER NOT NULL DEFAULT 0,
  sets_min INTEGER NOT NULL DEFAULT 3,
  sets_max INTEGER DEFAULT NULL,
  reps_min INTEGER NOT NULL DEFAULT 8,
  reps_max INTEGER DEFAULT 12,
  rest_seconds_min INTEGER DEFAULT 60,
  rest_seconds_max INTEGER DEFAULT 90,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;

-- EXERCISES RLS POLICIES
-- Everyone can view all exercises (system + custom)
CREATE POLICY "Anyone can view exercises"
ON public.exercises FOR SELECT
USING (true);

-- Super admin can manage all exercises
CREATE POLICY "Super admin can manage all exercises"
ON public.exercises FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Users can create their own custom exercises
CREATE POLICY "Users can create custom exercises"
ON public.exercises FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND is_system = false AND created_by = auth.uid());

-- Users can update their own custom exercises
CREATE POLICY "Users can update their custom exercises"
ON public.exercises FOR UPDATE
USING (created_by = auth.uid() AND is_system = false);

-- Users can delete their own custom exercises
CREATE POLICY "Users can delete their custom exercises"
ON public.exercises FOR DELETE
USING (created_by = auth.uid() AND is_system = false);

-- EXERCISE ALTERNATIVES RLS POLICIES
CREATE POLICY "Anyone can view exercise alternatives"
ON public.exercise_alternatives FOR SELECT
USING (true);

CREATE POLICY "Super admin can manage exercise alternatives"
ON public.exercise_alternatives FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- WORKOUT TEMPLATES RLS POLICIES
CREATE POLICY "Anyone can view workout templates"
ON public.workout_templates FOR SELECT
USING (true);

CREATE POLICY "Super admin can manage all templates"
ON public.workout_templates FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can create custom templates"
ON public.workout_templates FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND is_system = false AND created_by = auth.uid());

CREATE POLICY "Users can update their custom templates"
ON public.workout_templates FOR UPDATE
USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete their custom templates"
ON public.workout_templates FOR DELETE
USING (created_by = auth.uid() AND is_system = false);

-- WORKOUT TEMPLATE WEEKS RLS POLICIES
CREATE POLICY "Anyone can view template weeks"
ON public.workout_template_weeks FOR SELECT
USING (true);

CREATE POLICY "Super admin can manage all template weeks"
ON public.workout_template_weeks FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can manage weeks for their templates"
ON public.workout_template_weeks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workout_templates 
    WHERE id = template_id 
    AND created_by = auth.uid() 
    AND is_system = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_templates 
    WHERE id = template_id 
    AND created_by = auth.uid() 
    AND is_system = false
  )
);

-- WORKOUT TEMPLATE DAYS RLS POLICIES
CREATE POLICY "Anyone can view template days"
ON public.workout_template_days FOR SELECT
USING (true);

CREATE POLICY "Super admin can manage all template days"
ON public.workout_template_days FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can manage days for their templates"
ON public.workout_template_days FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workout_templates 
    WHERE id = template_id 
    AND created_by = auth.uid() 
    AND is_system = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_templates 
    WHERE id = template_id 
    AND created_by = auth.uid() 
    AND is_system = false
  )
);

-- WORKOUT TEMPLATE EXERCISES RLS POLICIES
CREATE POLICY "Anyone can view template exercises"
ON public.workout_template_exercises FOR SELECT
USING (true);

CREATE POLICY "Super admin can manage all template exercises"
ON public.workout_template_exercises FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can manage exercises for their template days"
ON public.workout_template_exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workout_template_days d
    JOIN public.workout_templates t ON d.template_id = t.id
    WHERE d.id = day_id 
    AND t.created_by = auth.uid() 
    AND t.is_system = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_template_days d
    JOIN public.workout_templates t ON d.template_id = t.id
    WHERE d.id = day_id 
    AND t.created_by = auth.uid() 
    AND t.is_system = false
  )
);

-- Create indexes for performance
CREATE INDEX idx_exercises_primary_muscle ON public.exercises(primary_muscle);
CREATE INDEX idx_exercises_equipment ON public.exercises(equipment);
CREATE INDEX idx_exercises_difficulty ON public.exercises(difficulty);
CREATE INDEX idx_exercises_is_system ON public.exercises(is_system);
CREATE INDEX idx_workout_templates_is_system ON public.workout_templates(is_system);
CREATE INDEX idx_workout_templates_goal ON public.workout_templates(goal);
CREATE INDEX idx_workout_template_days_template_id ON public.workout_template_days(template_id);
CREATE INDEX idx_workout_template_exercises_day_id ON public.workout_template_exercises(day_id);

-- Add update triggers
CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at
BEFORE UPDATE ON public.workout_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
