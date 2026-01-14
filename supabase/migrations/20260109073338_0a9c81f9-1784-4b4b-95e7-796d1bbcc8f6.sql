-- Add email notification preferences to client_profiles
ALTER TABLE public.client_profiles 
ADD COLUMN IF NOT EXISTS email_checkin_submitted BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_checkin_reviewed BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_plan_assigned BOOLEAN NOT NULL DEFAULT true;

-- Add email preferences to coach_profiles as well
ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS email_checkin_received BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_plan_assigned BOOLEAN NOT NULL DEFAULT true;

-- Add next_checkin_date field to client_checkins for coach to set custom date
ALTER TABLE public.client_checkins
ADD COLUMN IF NOT EXISTS next_checkin_date DATE DEFAULT NULL;