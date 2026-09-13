CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  type TEXT NOT NULL CHECK (type IN ('message', 'milestone', 'assignment', 'system', 'review', 'payment', 'file_upload')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE USING (user_id = auth.uid());

CREATE TABLE public.project_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('milestone_confirmed', 'file_uploaded', 'message_sent', 'milestone_started', 'expert_assigned', 'payment_received', 'payout_released')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('student', 'expert', 'admin')),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project events"
ON public.project_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own events"
ON public.project_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.validate_project_event()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.data IS NOT NULL AND length(NEW.data::text) > 10000 THEN
    RAISE EXCEPTION 'Event data must be 10KB or less';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_project_event_trigger
BEFORE INSERT OR UPDATE ON public.project_events
FOR EACH ROW EXECUTE FUNCTION public.validate_project_event();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_events;
