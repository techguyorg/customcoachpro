-- Create diet_plans table
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT, -- weight_loss, muscle_gain, maintenance, etc.
  calories_target INTEGER,
  protein_grams INTEGER,
  carbs_grams INTEGER,
  fat_grams INTEGER,
  meals_per_day INTEGER DEFAULT 4,
  dietary_type TEXT, -- standard, vegetarian, vegan, keto, etc.
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diet_plan_meals table for meal structure
CREATE TABLE public.diet_plan_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  meal_number INTEGER NOT NULL,
  meal_name TEXT NOT NULL, -- Breakfast, Lunch, etc.
  time_suggestion TEXT, -- e.g., "7:00 AM"
  calories INTEGER,
  protein_grams INTEGER,
  carbs_grams INTEGER,
  fat_grams INTEGER,
  food_suggestions TEXT[], -- Array of suggested foods
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plan_meals ENABLE ROW LEVEL SECURITY;

-- Diet plans policies
CREATE POLICY "Anyone can view system diet plans"
  ON public.diet_plans FOR SELECT
  USING (is_system = true);

CREATE POLICY "Users can view their own diet plans"
  ON public.diet_plans FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Coaches can create diet plans"
  ON public.diet_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND is_system = false AND created_by = auth.uid());

CREATE POLICY "Users can update their own diet plans"
  ON public.diet_plans FOR UPDATE
  USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete their own diet plans"
  ON public.diet_plans FOR DELETE
  USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Super admin can manage all diet plans"
  ON public.diet_plans FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Clients can view plans assigned to them
CREATE POLICY "Clients can view assigned diet plans"
  ON public.diet_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      WHERE pa.diet_plan_id = diet_plans.id
      AND pa.client_id = auth.uid()
      AND pa.status = 'active'
    )
  );

-- Diet plan meals policies
CREATE POLICY "Anyone can view system diet plan meals"
  ON public.diet_plan_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_plan_meals.plan_id AND dp.is_system = true
    )
  );

CREATE POLICY "Users can view their own plan meals"
  ON public.diet_plan_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_plan_meals.plan_id AND dp.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage meals for their plans"
  ON public.diet_plan_meals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_plan_meals.plan_id 
      AND dp.created_by = auth.uid() 
      AND dp.is_system = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_plan_meals.plan_id 
      AND dp.created_by = auth.uid() 
      AND dp.is_system = false
    )
  );

CREATE POLICY "Super admin can manage all diet plan meals"
  ON public.diet_plan_meals FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Clients can view meals from assigned plans
CREATE POLICY "Clients can view assigned plan meals"
  ON public.diet_plan_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      JOIN public.diet_plans dp ON dp.id = pa.diet_plan_id
      WHERE dp.id = diet_plan_meals.plan_id
      AND pa.client_id = auth.uid()
      AND pa.status = 'active'
    )
  );

-- Add foreign key to plan_assignments
ALTER TABLE public.plan_assignments
  ADD CONSTRAINT plan_assignments_diet_plan_id_fkey
  FOREIGN KEY (diet_plan_id) REFERENCES public.diet_plans(id);

-- Create indexes
CREATE INDEX idx_diet_plans_created_by ON public.diet_plans(created_by);
CREATE INDEX idx_diet_plans_is_system ON public.diet_plans(is_system);
CREATE INDEX idx_diet_plan_meals_plan_id ON public.diet_plan_meals(plan_id);

-- Update trigger for diet_plans
CREATE TRIGGER update_diet_plans_updated_at
  BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();