-- Create messages table for coach-client communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages only to their coach/clients
CREATE POLICY "Users can send messages to coach or client"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    -- Coach sending to client
    (has_role(auth.uid(), 'coach') AND is_coach_of_client(auth.uid(), recipient_id))
    OR
    -- Client sending to coach (check if recipient is their coach)
    (has_role(auth.uid(), 'client') AND is_coach_of_client(recipient_id, auth.uid()))
  )
);

-- Users can update (mark as read) messages they received
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create index for faster queries
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);