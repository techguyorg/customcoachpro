-- =============================================
-- CustomCoachPro Database Schema - Phase 1
-- Role-based access with abstraction for portability
-- =============================================

-- 1. Create Role Enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'coach', 'client');

-- 2. Create User Roles Table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create Coach Profiles Table (extends profiles for coaches)
CREATE TABLE public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  specializations TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  certifications TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  is_accepting_clients BOOLEAN DEFAULT true,
  max_clients INTEGER DEFAULT 50,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Create Client Profiles Table (extends profiles for clients)
CREATE TABLE public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  height_cm DECIMAL(5, 2),
  current_weight_kg DECIMAL(5, 2),
  target_weight_kg DECIMAL(5, 2),
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  fitness_goals TEXT[] DEFAULT '{}',
  medical_conditions TEXT,
  dietary_restrictions TEXT[] DEFAULT '{}',
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'past_due')),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Create Coach-Client Relationship Table
CREATE TABLE public.coach_client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'terminated')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (coach_id, client_id)
);

-- 7. Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_client_relationships ENABLE ROW LEVEL SECURITY;

-- 8. Create Security Definer Function for Role Checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 9. Create Function to Get User Roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- 10. Create Function to Check if User is Coach of Client
CREATE OR REPLACE FUNCTION public.is_coach_of_client(_coach_id UUID, _client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coach_client_relationships
    WHERE coach_id = _coach_id
      AND client_id = _client_id
      AND status = 'active'
  )
$$;

-- 11. RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 12. RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches can view their clients profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coach') AND
    EXISTS (
      SELECT 1 FROM public.coach_client_relationships
      WHERE coach_id = auth.uid()
        AND client_id = profiles.user_id
        AND status = 'active'
    )
  );

CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 13. RLS Policies for coach_profiles
CREATE POLICY "Public can view coach profiles"
  ON public.coach_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coaches can update their own coach profile"
  ON public.coach_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can insert their own coach profile"
  ON public.coach_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Super admins can manage all coach profiles"
  ON public.coach_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 14. RLS Policies for client_profiles
CREATE POLICY "Clients can view their own client profile"
  ON public.client_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Clients can update their own client profile"
  ON public.client_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Clients can insert their own client profile"
  ON public.client_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches can view their clients client profiles"
  ON public.client_profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coach') AND
    EXISTS (
      SELECT 1 FROM public.coach_client_relationships
      WHERE coach_id = auth.uid()
        AND client_id = client_profiles.user_id
        AND status = 'active'
    )
  );

CREATE POLICY "Super admins can manage all client profiles"
  ON public.client_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 15. RLS Policies for coach_client_relationships
CREATE POLICY "Coaches can view their relationships"
  ON public.coach_client_relationships FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid() AND public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Clients can view their relationships"
  ON public.coach_client_relationships FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can manage their relationships"
  ON public.coach_client_relationships FOR ALL
  TO authenticated
  USING (coach_id = auth.uid() AND public.has_role(auth.uid(), 'coach'))
  WITH CHECK (coach_id = auth.uid() AND public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Clients can request relationships"
  ON public.coach_client_relationships FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Super admins can manage all relationships"
  ON public.coach_client_relationships FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 16. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 17. Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON public.coach_client_relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata or default to 'client'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'client'::app_role
  );
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- Create role-specific profile
  IF user_role = 'coach' THEN
    INSERT INTO public.coach_profiles (user_id)
    VALUES (NEW.id);
  ELSE
    INSERT INTO public.client_profiles (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 19. Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 20. Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_coach_profiles_user_id ON public.coach_profiles(user_id);
CREATE INDEX idx_client_profiles_user_id ON public.client_profiles(user_id);
CREATE INDEX idx_client_profiles_coach_id ON public.client_profiles(coach_id);
CREATE INDEX idx_relationships_coach_id ON public.coach_client_relationships(coach_id);
CREATE INDEX idx_relationships_client_id ON public.coach_client_relationships(client_id);
CREATE INDEX idx_relationships_status ON public.coach_client_relationships(status);