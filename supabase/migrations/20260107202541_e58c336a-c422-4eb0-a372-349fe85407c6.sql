-- Create user_favorites table for saving favorite items
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('diet_plan', 'recipe', 'workout_template', 'exercise')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add their own favorites"
ON public.user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
ON public.user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Create client_nutrition_logs table for daily food tracking
CREATE TABLE public.client_nutrition_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  food_id UUID REFERENCES public.foods(id),
  recipe_id UUID REFERENCES public.recipes(id),
  custom_food_name TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'serving',
  calories NUMERIC,
  protein_grams NUMERIC,
  carbs_grams NUMERIC,
  fat_grams NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT food_or_recipe_or_custom CHECK (
    food_id IS NOT NULL OR recipe_id IS NOT NULL OR custom_food_name IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE public.client_nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Clients can view their own logs
CREATE POLICY "Clients can view their own nutrition logs"
ON public.client_nutrition_logs FOR SELECT
USING (auth.uid() = client_id);

-- Clients can add their own logs
CREATE POLICY "Clients can add their own nutrition logs"
ON public.client_nutrition_logs FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Clients can update their own logs
CREATE POLICY "Clients can update their own nutrition logs"
ON public.client_nutrition_logs FOR UPDATE
USING (auth.uid() = client_id);

-- Clients can delete their own logs
CREATE POLICY "Clients can delete their own nutrition logs"
ON public.client_nutrition_logs FOR DELETE
USING (auth.uid() = client_id);

-- Coaches can view their clients' nutrition logs
CREATE POLICY "Coaches can view client nutrition logs"
ON public.client_nutrition_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_client_relationships ccr
    WHERE ccr.coach_id = auth.uid()
    AND ccr.client_id = client_nutrition_logs.client_id
    AND ccr.status = 'active'
  )
);

-- Create index for faster queries
CREATE INDEX idx_client_nutrition_logs_client_date ON public.client_nutrition_logs(client_id, log_date);
CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_item ON public.user_favorites(item_type, item_id);

-- Add trigger for updated_at
CREATE TRIGGER update_client_nutrition_logs_updated_at
BEFORE UPDATE ON public.client_nutrition_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();