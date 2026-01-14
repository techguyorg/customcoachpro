-- Fix the overly permissive INSERT policy on notifications
-- Replace "true" with proper authentication check

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only authenticated users and system can create notifications
-- Notifications should be created by the system or by users for other users (coaches creating for clients)
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Allow coaches to create notifications for their clients
CREATE POLICY "Coaches can create notifications for their clients" ON public.notifications
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'coach') AND
    is_coach_of_client(auth.uid(), user_id)
  );