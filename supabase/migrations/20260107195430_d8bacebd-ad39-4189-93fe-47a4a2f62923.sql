-- =====================================================
-- PHASE 1: COMPREHENSIVE DIET PLAN SYSTEM
-- =====================================================

-- 1. FOODS DATABASE TABLE
CREATE TABLE public.foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Macros per 100g (standard unit for calculations)
  calories_per_100g DECIMAL NOT NULL DEFAULT 0,
  protein_per_100g DECIMAL NOT NULL DEFAULT 0,
  carbs_per_100g DECIMAL NOT NULL DEFAULT 0,
  fat_per_100g DECIMAL NOT NULL DEFAULT 0,
  fiber_per_100g DECIMAL DEFAULT 0,
  sugar_per_100g DECIMAL DEFAULT 0,
  sodium_mg_per_100g DECIMAL DEFAULT 0,
  
  -- Default serving info
  default_serving_size DECIMAL NOT NULL DEFAULT 100,
  default_serving_unit TEXT NOT NULL DEFAULT 'g',
  
  -- Metadata
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  barcode TEXT,
  image_url TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. RECIPES TABLE
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  total_weight_g DECIMAL DEFAULT 0,
  servings INTEGER NOT NULL DEFAULT 1,
  calories_per_serving DECIMAL DEFAULT 0,
  protein_per_serving DECIMAL DEFAULT 0,
  carbs_per_serving DECIMAL DEFAULT 0,
  fat_per_serving DECIMAL DEFAULT 0,
  fiber_per_serving DECIMAL DEFAULT 0,
  
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  instructions TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. RECIPE INGREDIENTS TABLE (no generated columns - calc in app)
CREATE TABLE public.recipe_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  
  quantity DECIMAL NOT NULL DEFAULT 100,
  unit TEXT NOT NULL DEFAULT 'g',
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. MEAL FOOD ITEMS TABLE
CREATE TABLE public.meal_food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.diet_plan_meals(id) ON DELETE CASCADE,
  
  food_id UUID REFERENCES public.foods(id) ON DELETE RESTRICT,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE RESTRICT,
  
  quantity DECIMAL NOT NULL DEFAULT 100,
  unit TEXT NOT NULL DEFAULT 'g',
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  
  -- Cached calculated values (updated by app when saved)
  calculated_calories DECIMAL DEFAULT 0,
  calculated_protein DECIMAL DEFAULT 0,
  calculated_carbs DECIMAL DEFAULT 0,
  calculated_fat DECIMAL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT food_or_recipe CHECK (
    (food_id IS NOT NULL AND recipe_id IS NULL) OR 
    (food_id IS NULL AND recipe_id IS NOT NULL)
  )
);

-- 5. FOOD ALTERNATIVES TABLE
CREATE TABLE public.food_alternatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  alternative_food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  
  reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT different_foods CHECK (food_id != alternative_food_id),
  CONSTRAINT unique_alternative UNIQUE (food_id, alternative_food_id)
);

-- 6. MEAL TEMPLATES TABLE
CREATE TABLE public.meal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  total_calories DECIMAL DEFAULT 0,
  total_protein DECIMAL DEFAULT 0,
  total_carbs DECIMAL DEFAULT 0,
  total_fat DECIMAL DEFAULT 0,
  
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. MEAL TEMPLATE ITEMS TABLE
CREATE TABLE public.meal_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.meal_templates(id) ON DELETE CASCADE,
  
  food_id UUID REFERENCES public.foods(id) ON DELETE RESTRICT,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE RESTRICT,
  
  quantity DECIMAL NOT NULL DEFAULT 100,
  unit TEXT NOT NULL DEFAULT 'g',
  order_index INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT template_food_or_recipe CHECK (
    (food_id IS NOT NULL AND recipe_id IS NULL) OR 
    (food_id IS NULL AND recipe_id IS NOT NULL)
  )
);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_template_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FOODS POLICIES
-- =====================================================

CREATE POLICY "Anyone can view system foods"
  ON public.foods FOR SELECT USING (is_system = true);

CREATE POLICY "Users can view their own foods"
  ON public.foods FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create custom foods"
  ON public.foods FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND is_system = false AND created_by = auth.uid());

CREATE POLICY "Users can update their own foods"
  ON public.foods FOR UPDATE
  USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete their own foods"
  ON public.foods FOR DELETE
  USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Super admin can manage all foods"
  ON public.foods FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- RECIPES POLICIES
-- =====================================================

CREATE POLICY "Anyone can view system recipes"
  ON public.recipes FOR SELECT USING (is_system = true);

CREATE POLICY "Users can view their own recipes"
  ON public.recipes FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND is_system = false AND created_by = auth.uid());

CREATE POLICY "Users can update their own recipes"
  ON public.recipes FOR UPDATE USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete their own recipes"
  ON public.recipes FOR DELETE USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Super admin can manage all recipes"
  ON public.recipes FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- RECIPE INGREDIENTS POLICIES
-- =====================================================

CREATE POLICY "View ingredients of viewable recipes"
  ON public.recipe_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.recipes r 
    WHERE r.id = recipe_ingredients.recipe_id 
    AND (r.is_system = true OR r.created_by = auth.uid())
  ));

CREATE POLICY "Manage ingredients of own recipes"
  ON public.recipe_ingredients FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.recipes r 
    WHERE r.id = recipe_ingredients.recipe_id 
    AND r.created_by = auth.uid() AND r.is_system = false
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.recipes r 
    WHERE r.id = recipe_ingredients.recipe_id 
    AND r.created_by = auth.uid() AND r.is_system = false
  ));

CREATE POLICY "Super admin can manage all recipe ingredients"
  ON public.recipe_ingredients FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- MEAL FOOD ITEMS POLICIES
-- =====================================================

CREATE POLICY "View meal items of viewable plans"
  ON public.meal_food_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diet_plan_meals m
    JOIN public.diet_plans p ON p.id = m.plan_id
    WHERE m.id = meal_food_items.meal_id 
    AND (p.is_system = true OR p.created_by = auth.uid())
  ));

CREATE POLICY "Clients can view assigned plan meal items"
  ON public.meal_food_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diet_plan_meals m
    JOIN public.plan_assignments pa ON pa.diet_plan_id = m.plan_id
    WHERE m.id = meal_food_items.meal_id 
    AND pa.client_id = auth.uid() AND pa.status = 'active'
  ));

CREATE POLICY "Manage meal items of own plans"
  ON public.meal_food_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.diet_plan_meals m
    JOIN public.diet_plans p ON p.id = m.plan_id
    WHERE m.id = meal_food_items.meal_id 
    AND p.created_by = auth.uid() AND p.is_system = false
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diet_plan_meals m
    JOIN public.diet_plans p ON p.id = m.plan_id
    WHERE m.id = meal_food_items.meal_id 
    AND p.created_by = auth.uid() AND p.is_system = false
  ));

CREATE POLICY "Super admin can manage all meal food items"
  ON public.meal_food_items FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- FOOD ALTERNATIVES POLICIES
-- =====================================================

CREATE POLICY "Anyone can view food alternatives"
  ON public.food_alternatives FOR SELECT USING (true);

CREATE POLICY "Super admin can manage food alternatives"
  ON public.food_alternatives FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- MEAL TEMPLATES POLICIES
-- =====================================================

CREATE POLICY "Anyone can view system meal templates"
  ON public.meal_templates FOR SELECT USING (is_system = true);

CREATE POLICY "Users can view their own meal templates"
  ON public.meal_templates FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create meal templates"
  ON public.meal_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND is_system = false AND created_by = auth.uid());

CREATE POLICY "Users can update their own meal templates"
  ON public.meal_templates FOR UPDATE USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete their own meal templates"
  ON public.meal_templates FOR DELETE USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Super admin can manage all meal templates"
  ON public.meal_templates FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- MEAL TEMPLATE ITEMS POLICIES
-- =====================================================

CREATE POLICY "View template items of viewable templates"
  ON public.meal_template_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meal_templates t 
    WHERE t.id = meal_template_items.template_id 
    AND (t.is_system = true OR t.created_by = auth.uid())
  ));

CREATE POLICY "Manage template items of own templates"
  ON public.meal_template_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.meal_templates t 
    WHERE t.id = meal_template_items.template_id 
    AND t.created_by = auth.uid() AND t.is_system = false
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meal_templates t 
    WHERE t.id = meal_template_items.template_id 
    AND t.created_by = auth.uid() AND t.is_system = false
  ));

CREATE POLICY "Super admin can manage all meal template items"
  ON public.meal_template_items FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_foods_category ON public.foods(category);
CREATE INDEX idx_foods_is_system ON public.foods(is_system);
CREATE INDEX idx_foods_created_by ON public.foods(created_by);
CREATE INDEX idx_foods_name_search ON public.foods USING gin(to_tsvector('english', name));

CREATE INDEX idx_recipes_created_by ON public.recipes(created_by);
CREATE INDEX idx_recipes_is_system ON public.recipes(is_system);

CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_food_id ON public.recipe_ingredients(food_id);

CREATE INDEX idx_meal_food_items_meal_id ON public.meal_food_items(meal_id);
CREATE INDEX idx_meal_food_items_food_id ON public.meal_food_items(food_id);
CREATE INDEX idx_meal_food_items_recipe_id ON public.meal_food_items(recipe_id);

CREATE INDEX idx_food_alternatives_food_id ON public.food_alternatives(food_id);

CREATE INDEX idx_meal_templates_created_by ON public.meal_templates(created_by);
CREATE INDEX idx_meal_template_items_template_id ON public.meal_template_items(template_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_foods_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meal_templates_updated_at
  BEFORE UPDATE ON public.meal_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();