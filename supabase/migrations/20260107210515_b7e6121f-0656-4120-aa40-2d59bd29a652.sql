-- Create table for coaching requests from clients to coaches
CREATE TABLE public.coaching_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT,
  coach_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(client_id, coach_id, status)
);

-- Enable RLS
ALTER TABLE public.coaching_requests ENABLE ROW LEVEL SECURITY;

-- Clients can view their own requests
CREATE POLICY "Clients can view their own requests"
ON public.coaching_requests
FOR SELECT
USING (auth.uid() = client_id);

-- Coaches can view requests sent to them
CREATE POLICY "Coaches can view requests sent to them"
ON public.coaching_requests
FOR SELECT
USING (auth.uid() = coach_id);

-- Clients can create requests
CREATE POLICY "Clients can create coaching requests"
ON public.coaching_requests
FOR INSERT
WITH CHECK (auth.uid() = client_id AND public.has_role(auth.uid(), 'client'));

-- Clients can cancel their pending requests
CREATE POLICY "Clients can cancel their pending requests"
ON public.coaching_requests
FOR UPDATE
USING (auth.uid() = client_id AND status = 'pending')
WITH CHECK (status = 'cancelled');

-- Coaches can respond to pending requests
CREATE POLICY "Coaches can respond to requests"
ON public.coaching_requests
FOR UPDATE
USING (auth.uid() = coach_id AND status = 'pending')
WITH CHECK (status IN ('accepted', 'declined'));

-- Add trigger for updated_at
CREATE TRIGGER update_coaching_requests_updated_at
BEFORE UPDATE ON public.coaching_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_coaching_requests_client ON public.coaching_requests(client_id);
CREATE INDEX idx_coaching_requests_coach ON public.coaching_requests(coach_id);
CREATE INDEX idx_coaching_requests_status ON public.coaching_requests(status);