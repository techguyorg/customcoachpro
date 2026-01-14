-- Create template_type enum
CREATE TYPE public.template_type AS ENUM (
  'push_pull_legs',
  'upper_lower',
  'full_body',
  'bro_split',
  'strength',
  'hypertrophy',
  'powerbuilding',
  'sport_specific',
  'cardio_conditioning',
  'functional',
  'bodyweight',
  'beginner'
);

-- Add template_type column to workout_templates
ALTER TABLE public.workout_templates 
ADD COLUMN template_type public.template_type DEFAULT 'full_body'::template_type;