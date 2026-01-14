-- =====================================================
-- Super Admin Bootstrap Migration
-- CustomCoachPro Platform - Initial Admin Setup
-- Author: Susheel Bhatt (s.susheel9@gmail.com)
-- =====================================================

-- Create a function to easily assign super_admin role by email
-- This can be called after users sign up to grant them admin access
CREATE OR REPLACE FUNCTION public.assign_super_admin_by_email(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  result_msg TEXT;
BEGIN
  -- Find the user by email in profiles table
  SELECT user_id INTO target_user_id
  FROM public.profiles
  WHERE LOWER(email) = LOWER(target_email);
  
  IF target_user_id IS NULL THEN
    RETURN 'ERROR: No user found with email: ' || target_email;
  END IF;
  
  -- Check if already has super_admin role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id AND role = 'super_admin'
  ) THEN
    RETURN 'INFO: User already has super_admin role: ' || target_email;
  END IF;
  
  -- Assign super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'super_admin');
  
  RETURN 'SUCCESS: Super admin role assigned to: ' || target_email;
END;
$$;

-- Create a function to list all super admins (useful for auditing)
CREATE OR REPLACE FUNCTION public.list_super_admins()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id,
    p.email,
    p.full_name,
    ur.created_at
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role = 'super_admin'
  ORDER BY ur.created_at;
$$;

-- Create a function to remove super_admin role (for security)
CREATE OR REPLACE FUNCTION public.revoke_super_admin_by_email(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT user_id INTO target_user_id
  FROM public.profiles
  WHERE LOWER(email) = LOWER(target_email);
  
  IF target_user_id IS NULL THEN
    RETURN 'ERROR: No user found with email: ' || target_email;
  END IF;
  
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'super_admin';
  
  IF NOT FOUND THEN
    RETURN 'INFO: User did not have super_admin role: ' || target_email;
  END IF;
  
  RETURN 'SUCCESS: Super admin role revoked from: ' || target_email;
END;
$$;

-- Grant execute permissions to authenticated users (functions are security definer)
-- Only super_admins can actually use these due to RLS on user_roles
GRANT EXECUTE ON FUNCTION public.assign_super_admin_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_super_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_super_admin_by_email(TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.assign_super_admin_by_email IS 
  'Assigns super_admin role to a user by email. User must exist in profiles table first (via signup).';
COMMENT ON FUNCTION public.list_super_admins IS 
  'Lists all users with super_admin role. Useful for auditing.';
COMMENT ON FUNCTION public.revoke_super_admin_by_email IS 
  'Removes super_admin role from a user by email.';