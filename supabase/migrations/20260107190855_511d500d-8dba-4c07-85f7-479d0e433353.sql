-- =============================================
-- CLIENT PROGRESS TRACKING SYSTEM
-- =============================================

-- 1. Client Measurements Table (Comprehensive body metrics)
CREATE TABLE public.client_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Core measurement (mandatory)
  weight_kg NUMERIC(5,2) NOT NULL,
  
  -- Optional body composition
  body_fat_pct NUMERIC(4,1),
  muscle_mass_kg NUMERIC(5,2),
  
  -- Optional body measurements (cm)
  chest_cm NUMERIC(5,1),
  waist_cm NUMERIC(5,1),
  hips_cm NUMERIC(5,1),
  left_arm_cm NUMERIC(4,1),
  right_arm_cm NUMERIC(4,1),
  left_thigh_cm NUMERIC(5,1),
  right_thigh_cm NUMERIC(5,1),
  left_calf_cm NUMERIC(4,1),
  right_calf_cm NUMERIC(4,1),
  neck_cm NUMERIC(4,1),
  shoulders_cm NUMERIC(5,1),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Progress Photos Table
CREATE TABLE public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Photo details
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  pose_type TEXT NOT NULL CHECK (pose_type IN ('front', 'back', 'side_left', 'side_right', 'other')),
  
  -- Metadata
  notes TEXT,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Client Goals Table
CREATE TABLE public.client_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Goal definition
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight', 'body_fat', 'measurement', 'strength', 'habit', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Progress tracking
  target_value NUMERIC(10,2),
  starting_value NUMERIC(10,2),
  current_value NUMERIC(10,2),
  unit TEXT,
  
  -- Timeline
  target_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Check-in Configuration (Coach defines what's required per client)
CREATE TABLE public.checkin_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = default template for all clients
  
  -- Template details
  name TEXT NOT NULL DEFAULT 'Weekly Check-in',
  description TEXT,
  frequency_days INTEGER NOT NULL DEFAULT 7,
  
  -- Required fields configuration (JSON for flexibility)
  required_fields JSONB NOT NULL DEFAULT '{
    "weight": true,
    "measurements": false,
    "photos": false,
    "diet_adherence": true,
    "workout_adherence": true,
    "sleep_quality": false,
    "energy_level": false,
    "stress_level": false,
    "notes": true
  }'::jsonb,
  
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Client Check-ins Table
CREATE TABLE public.client_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.checkin_templates(id) ON DELETE SET NULL,
  
  -- Check-in period
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE,
  period_end DATE,
  
  -- Measurements snapshot (optional)
  measurement_id UUID REFERENCES public.client_measurements(id) ON DELETE SET NULL,
  
  -- Adherence ratings (1-10 scale)
  diet_adherence INTEGER CHECK (diet_adherence >= 1 AND diet_adherence <= 10),
  workout_adherence INTEGER CHECK (workout_adherence >= 1 AND workout_adherence <= 10),
  
  -- Wellness metrics (1-10 scale)
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  
  -- Notes
  diet_notes TEXT,
  workout_notes TEXT,
  general_notes TEXT,
  wins TEXT, -- What went well
  challenges TEXT, -- What was difficult
  
  -- Photo references (array of photo IDs)
  photo_ids UUID[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'acknowledged')),
  submitted_at TIMESTAMPTZ,
  
  -- Coach review
  coach_feedback TEXT,
  coach_rating INTEGER CHECK (coach_rating >= 1 AND coach_rating <= 5),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Coach-Client Notes Table
CREATE TABLE public.coach_client_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Note content
  title TEXT,
  content TEXT NOT NULL,
  
  -- Categorization
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'call_notes', 'observation', 'reminder', 'milestone', 'concern')),
  tags TEXT[] DEFAULT '{}',
  
  -- Importance
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Optional date reference (e.g., for a call)
  reference_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Notifications Table (Real-time)
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL CHECK (type IN (
    'checkin_submitted', 'checkin_reviewed', 
    'plan_assigned', 'plan_updated',
    'goal_achieved', 'goal_reminder',
    'measurement_logged', 'photo_uploaded',
    'coach_note', 'reminder', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Reference data
  reference_type TEXT, -- 'checkin', 'plan', 'goal', etc.
  reference_id UUID,
  data JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Plan Assignments Table (Workout/Diet plans to clients)
CREATE TABLE public.plan_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan reference (workout template for now, diet later)
  plan_type TEXT NOT NULL CHECK (plan_type IN ('workout', 'diet')),
  workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  diet_plan_id UUID, -- Placeholder for future diet plans table
  
  -- Assignment details
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  
  -- Notes
  coach_notes TEXT,
  client_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Workout Logs (Client tracks actual workouts)
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assignment reference (optional - can log without assignment)
  assignment_id UUID REFERENCES public.plan_assignments(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  template_day_id UUID REFERENCES public.workout_template_days(id) ON DELETE SET NULL,
  
  -- Workout details
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Overall ratings
  perceived_effort INTEGER CHECK (perceived_effort >= 1 AND perceived_effort <= 10),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  
  -- Notes
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped', 'partial')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Workout Log Exercises (Individual exercise performance)
CREATE TABLE public.workout_log_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  
  -- Exercise details
  exercise_name TEXT NOT NULL, -- Denormalized for history
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Performance data
  sets_completed INTEGER NOT NULL DEFAULT 0,
  set_data JSONB DEFAULT '[]', -- Array of {reps, weight_kg, rest_seconds, notes}
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_client_measurements_client_date ON public.client_measurements(client_id, recorded_at DESC);
CREATE INDEX idx_progress_photos_client_date ON public.progress_photos(client_id, recorded_at DESC);
CREATE INDEX idx_client_goals_client_status ON public.client_goals(client_id, status);
CREATE INDEX idx_client_checkins_client_date ON public.client_checkins(client_id, checkin_date DESC);
CREATE INDEX idx_client_checkins_coach_status ON public.client_checkins(coach_id, status);
CREATE INDEX idx_coach_client_notes_coach_client ON public.coach_client_notes(coach_id, client_id);
CREATE INDEX idx_coach_client_notes_pinned ON public.coach_client_notes(coach_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_plan_assignments_client ON public.plan_assignments(client_id, status);
CREATE INDEX idx_plan_assignments_coach ON public.plan_assignments(coach_id, status);
CREATE INDEX idx_workout_logs_client_date ON public.workout_logs(client_id, workout_date DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.client_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log_exercises ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Client Measurements Policies
CREATE POLICY "Clients can manage their own measurements" ON public.client_measurements
  FOR ALL USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches can view their clients measurements" ON public.client_measurements
  FOR SELECT USING (
    has_role(auth.uid(), 'coach') AND 
    is_coach_of_client(auth.uid(), client_id)
  );

CREATE POLICY "Super admins can manage all measurements" ON public.client_measurements
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Progress Photos Policies
CREATE POLICY "Clients can manage their own photos" ON public.progress_photos
  FOR ALL USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches can view their clients photos" ON public.progress_photos
  FOR SELECT USING (
    has_role(auth.uid(), 'coach') AND 
    is_coach_of_client(auth.uid(), client_id)
  );

CREATE POLICY "Super admins can manage all photos" ON public.progress_photos
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Client Goals Policies
CREATE POLICY "Clients can manage their own goals" ON public.client_goals
  FOR ALL USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches can view and update their clients goals" ON public.client_goals
  FOR ALL USING (
    has_role(auth.uid(), 'coach') AND 
    is_coach_of_client(auth.uid(), client_id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'coach') AND 
    is_coach_of_client(auth.uid(), client_id)
  );

CREATE POLICY "Super admins can manage all goals" ON public.client_goals
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Check-in Templates Policies
CREATE POLICY "Coaches can manage their own templates" ON public.checkin_templates
  FOR ALL USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Clients can view templates assigned to them" ON public.checkin_templates
  FOR SELECT USING (
    client_id = auth.uid() OR 
    (client_id IS NULL AND EXISTS (
      SELECT 1 FROM public.coach_client_relationships 
      WHERE coach_id = checkin_templates.coach_id 
      AND client_id = auth.uid() 
      AND status = 'active'
    ))
  );

CREATE POLICY "Super admins can manage all templates" ON public.checkin_templates
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Client Check-ins Policies
CREATE POLICY "Clients can manage their own checkins" ON public.client_checkins
  FOR ALL USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches can view and review their clients checkins" ON public.client_checkins
  FOR ALL USING (
    coach_id = auth.uid() OR (
      has_role(auth.uid(), 'coach') AND 
      is_coach_of_client(auth.uid(), client_id)
    )
  )
  WITH CHECK (
    coach_id = auth.uid() OR (
      has_role(auth.uid(), 'coach') AND 
      is_coach_of_client(auth.uid(), client_id)
    )
  );

CREATE POLICY "Super admins can manage all checkins" ON public.client_checkins
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Coach Client Notes Policies
CREATE POLICY "Coaches can manage their own notes" ON public.coach_client_notes
  FOR ALL USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Super admins can manage all notes" ON public.coach_client_notes
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can manage all notifications" ON public.notifications
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Plan Assignments Policies
CREATE POLICY "Coaches can manage their own assignments" ON public.plan_assignments
  FOR ALL USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Clients can view their own assignments" ON public.plan_assignments
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can update their notes on assignments" ON public.plan_assignments
  FOR UPDATE USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Super admins can manage all assignments" ON public.plan_assignments
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Workout Logs Policies
CREATE POLICY "Clients can manage their own workout logs" ON public.workout_logs
  FOR ALL USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches can view their clients workout logs" ON public.workout_logs
  FOR SELECT USING (
    has_role(auth.uid(), 'coach') AND 
    is_coach_of_client(auth.uid(), client_id)
  );

CREATE POLICY "Super admins can manage all workout logs" ON public.workout_logs
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Workout Log Exercises Policies
CREATE POLICY "Users can manage exercises in their logs" ON public.workout_log_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs 
      WHERE id = workout_log_exercises.workout_log_id 
      AND client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs 
      WHERE id = workout_log_exercises.workout_log_id 
      AND client_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view their clients log exercises" ON public.workout_log_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_log_exercises.workout_log_id 
      AND has_role(auth.uid(), 'coach') 
      AND is_coach_of_client(auth.uid(), wl.client_id)
    )
  );

CREATE POLICY "Super admins can manage all log exercises" ON public.workout_log_exercises
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_client_measurements_updated_at
  BEFORE UPDATE ON public.client_measurements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_goals_updated_at
  BEFORE UPDATE ON public.client_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checkin_templates_updated_at
  BEFORE UPDATE ON public.checkin_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_checkins_updated_at
  BEFORE UPDATE ON public.client_checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_client_notes_updated_at
  BEFORE UPDATE ON public.coach_client_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_assignments_updated_at
  BEFORE UPDATE ON public.plan_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_logs_updated_at
  BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE REALTIME FOR NOTIFICATIONS
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_checkins;