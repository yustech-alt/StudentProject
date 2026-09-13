-- Server-side source of truth for pricing (was hardcoded in the frontend before)
CREATE TABLE public.packages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price_ngn INTEGER NOT NULL CHECK (price_ngn > 0),
  milestone_count INTEGER NOT NULL CHECK (milestone_count > 0),
  description TEXT NOT NULL
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view packages" ON public.packages FOR SELECT USING (true);

INSERT INTO public.packages (id, title, price_ngn, milestone_count, description) VALUES
  ('single', 'Single Milestone', 15000, 1, 'Get help with one specific milestone'),
  ('standard', 'Standard Package', 45000, 3, 'Support for 3 major milestones'),
  ('full', 'Full Project', 75000, 7, 'Complete project support from start to finish');

CREATE TYPE public.project_status AS ENUM ('pending_payment', 'pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'refunded');

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(title) <= 200),
  description TEXT NOT NULL CHECK (length(description) <= 5000),
  status public.project_status NOT NULL DEFAULT 'pending_payment',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  package_id TEXT NOT NULL REFERENCES public.packages(id),
  current_stage TEXT NOT NULL DEFAULT 'Awaiting Payment',
  deadline DATE,
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Students view own projects" ON public.projects FOR SELECT
  USING (student_id = auth.uid() OR expert_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students create own projects" ON public.projects FOR INSERT
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins update any project" ON public.projects FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants update limited project fields" ON public.projects FOR UPDATE
  USING (student_id = auth.uid() OR expert_id = auth.uid());

CREATE TYPE public.milestone_status AS ENUM ('pending', 'in_progress', 'pending_review', 'completed');

CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  title TEXT NOT NULL,
  status public.milestone_status NOT NULL DEFAULT 'pending',
  deliverables JSONB NOT NULL DEFAULT '[]',
  feedback TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  student_confirmed BOOLEAN NOT NULL DEFAULT false,
  expert_confirmed BOOLEAN NOT NULL DEFAULT false,
  gross_amount INTEGER NOT NULL DEFAULT 0,
  platform_fee_amount INTEGER NOT NULL DEFAULT 0,
  net_amount INTEGER NOT NULL DEFAULT 0,
  payout_released BOOLEAN NOT NULL DEFAULT false,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, seq)
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view milestones" ON public.milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.student_id = auth.uid() OR p.expert_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Admins manage milestones" ON public.milestones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Safe, server-checked milestone confirmation (client can never set both flags directly)
CREATE OR REPLACE FUNCTION public.confirm_milestone(_milestone_id UUID)
RETURNS public.milestones LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m public.milestones;
  p public.projects;
  caller_role TEXT;
BEGIN
  SELECT * INTO m FROM public.milestones WHERE id = _milestone_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;
  SELECT * INTO p FROM public.projects WHERE id = m.project_id;

  IF p.student_id = auth.uid() THEN caller_role := 'student';
  ELSIF p.expert_id = auth.uid() THEN caller_role := 'expert';
  ELSE RAISE EXCEPTION 'Not a participant on this project'; END IF;

  UPDATE public.milestones SET
    student_confirmed = CASE WHEN caller_role = 'student' THEN true ELSE student_confirmed END,
    expert_confirmed = CASE WHEN caller_role = 'expert' THEN true ELSE expert_confirmed END
  WHERE id = _milestone_id
  RETURNING * INTO m;

  IF m.student_confirmed AND m.expert_confirmed THEN
    UPDATE public.milestones SET status = 'completed', completed_date = CURRENT_DATE, payout_released = true
    WHERE id = _milestone_id RETURNING * INTO m;

    INSERT INTO public.project_events (project_id, event_type, user_id, user_role, data)
    VALUES (m.project_id, 'milestone_confirmed', auth.uid(), caller_role, jsonb_build_object('milestone_id', m.id, 'milestone_title', m.title));
  END IF;

  RETURN m;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_milestone(_milestone_id UUID)
RETURNS public.milestones LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m public.milestones;
  p public.projects;
BEGIN
  SELECT * INTO m FROM public.milestones WHERE id = _milestone_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;
  SELECT * INTO p FROM public.projects WHERE id = m.project_id;
  IF p.expert_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only the assigned expert can start a milestone';
  END IF;
  IF m.status != 'pending' THEN RETURN m; END IF;

  UPDATE public.milestones SET status = 'in_progress' WHERE id = _milestone_id RETURNING * INTO m;
  UPDATE public.projects SET current_stage = m.title WHERE id = m.project_id;
  RETURN m;
END;
$$;

-- Admin-only expert assignment, keeps project state consistent
CREATE OR REPLACE FUNCTION public.assign_expert(_project_id UUID, _expert_id UUID)
RETURNS public.projects LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.projects;
  expert_ok BOOLEAN;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign experts';
  END IF;
  SELECT (verified AND verification_status = 'approved') INTO expert_ok
  FROM public.profiles WHERE user_id = _expert_id;
  IF NOT COALESCE(expert_ok, false) THEN
    RAISE EXCEPTION 'Expert is not verified';
  END IF;

  UPDATE public.projects SET expert_id = _expert_id, status = 'in_progress'
  WHERE id = _project_id RETURNING * INTO p;

  INSERT INTO public.project_events (project_id, event_type, user_id, user_role, data)
  VALUES (_project_id, 'expert_assigned', auth.uid(), 'admin', jsonb_build_object('expert_id', _expert_id));

  RETURN p;
END;
$$;
