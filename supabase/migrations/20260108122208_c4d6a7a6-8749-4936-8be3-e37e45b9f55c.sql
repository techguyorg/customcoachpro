-- Create admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'role_granted', 'role_revoked', 'user_updated', 'content_deleted', etc.
  target_user_id UUID,
  target_resource_type TEXT, -- 'user', 'exercise', 'workout_template', 'diet_plan', etc.
  target_resource_id UUID,
  details JSONB, -- Additional context about the action
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform settings table
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'string', -- 'string', 'boolean', 'number', 'json'
  category TEXT NOT NULL DEFAULT 'general', -- 'features', 'defaults', 'notifications'
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Super admins can insert audit logs
CREATE POLICY "Super admins can create audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Super admins can view platform settings
CREATE POLICY "Super admins can view platform settings"
ON public.platform_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Super admins can manage platform settings
CREATE POLICY "Super admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Create trigger for updated_at on platform_settings
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('coach_marketplace_enabled', 'true', 'boolean', 'features', 'Enable coach marketplace for clients to find coaches'),
  ('client_self_signup_enabled', 'true', 'boolean', 'features', 'Allow clients to sign up without coach invitation'),
  ('workout_logging_enabled', 'true', 'boolean', 'features', 'Enable workout logging for clients'),
  ('nutrition_logging_enabled', 'true', 'boolean', 'features', 'Enable nutrition logging for clients'),
  ('progress_photos_enabled', 'true', 'boolean', 'features', 'Enable progress photo uploads'),
  ('messaging_enabled', 'true', 'boolean', 'features', 'Enable in-app messaging between coaches and clients'),
  ('max_clients_per_coach', '50', 'number', 'defaults', 'Maximum number of clients a coach can have'),
  ('default_trial_period_days', '14', 'number', 'defaults', 'Default trial period for new clients in days'),
  ('checkin_frequency_days', '7', 'number', 'defaults', 'Default check-in frequency in days'),
  ('session_timeout_hours', '24', 'number', 'defaults', 'Session timeout in hours'),
  ('email_notifications_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications'),
  ('checkin_reminders_enabled', 'true', 'boolean', 'notifications', 'Send check-in reminder emails'),
  ('new_client_alerts_enabled', 'true', 'boolean', 'notifications', 'Alert coaches when new clients sign up'),
  ('system_alerts_enabled', 'true', 'boolean', 'notifications', 'Send system alert emails to admins');

-- Create indexes for better query performance
CREATE INDEX idx_audit_logs_admin_user ON public.admin_audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_platform_settings_category ON public.platform_settings(category);