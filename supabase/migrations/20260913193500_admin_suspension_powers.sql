ALTER TABLE public.profiles
  ADD COLUMN suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN suspended_reason TEXT,
  ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION public.is_suspended(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((SELECT suspended FROM public.profiles WHERE user_id = _user_id), false) $$;
REVOKE EXECUTE ON FUNCTION public.is_suspended(UUID) FROM PUBLIC, anon;

-- Admin-only. Cannot suspend another admin, and cannot suspend yourself -
-- both would let an admin lock the platform (or themselves) out.
CREATE OR REPLACE FUNCTION public.set_user_suspension(_user_id UUID, _suspended BOOLEAN, _reason TEXT DEFAULT NULL)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result public.profiles;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can suspend accounts';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot suspend your own account';
  END IF;
  IF public.has_role(_user_id, 'admin') THEN
    RAISE EXCEPTION 'Admins cannot be suspended from here';
  END IF;

  UPDATE public.profiles SET
    suspended = _suspended,
    suspended_reason = CASE WHEN _suspended THEN _reason ELSE NULL END,
    suspended_at = CASE WHEN _suspended THEN now() ELSE NULL END
  WHERE user_id = _user_id
  RETURNING * INTO result;

  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  INSERT INTO public.notifications (user_id, type, title, description)
  VALUES (
    _user_id, 'system',
    CASE WHEN _suspended THEN 'Your account has been suspended' ELSE 'Your account has been reinstated' END,
    CASE WHEN _suspended THEN COALESCE('Reason: ' || _reason, 'Contact support for details.')
         ELSE 'You can resume using ProjectSupport normally.' END
  );

  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_user_suspension(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;

-- Enforce suspension at the point actions actually happen, not just in the UI.
CREATE OR REPLACE FUNCTION public.confirm_milestone(_milestone_id UUID)
RETURNS public.milestones LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m public.milestones;
  p public.projects;
  caller_role TEXT;
  other_user_id UUID;
BEGIN
  IF public.is_suspended(auth.uid()) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
  SELECT * INTO m FROM public.milestones WHERE id = _milestone_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;
  SELECT * INTO p FROM public.projects WHERE id = m.project_id;

  IF p.student_id = auth.uid() THEN
    caller_role := 'student'; other_user_id := p.expert_id;
  ELSIF p.expert_id = auth.uid() THEN
    caller_role := 'expert'; other_user_id := p.student_id;
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

    INSERT INTO public.notifications (user_id, type, title, description, link)
    VALUES (p.expert_id, 'milestone', 'Milestone completed - payout released',
            '"' || m.title || '" is complete. ₦' || m.net_amount || ' has been released to your balance.',
            '/expert/project/' || p.id);
    INSERT INTO public.notifications (user_id, type, title, description, link)
    VALUES (p.student_id, 'milestone', 'Milestone completed',
            '"' || m.title || '" has been marked complete by both you and your expert.',
            '/project/' || p.id);
  ELSIF other_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, description, link)
    VALUES (other_user_id, 'milestone', 'Milestone awaiting your confirmation',
            'Your ' || (CASE WHEN caller_role = 'student' THEN 'student' ELSE 'expert' END) ||
            ' confirmed "' || m.title || '". Confirm on your side to release payout.',
            CASE WHEN caller_role = 'student' THEN '/expert/project/' || p.id ELSE '/project/' || p.id END);
  END IF;

  RETURN m;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_payout(_amount_ngn INTEGER, _bank_name TEXT, _account_number TEXT, _account_name TEXT)
RETURNS public.payouts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  available INTEGER;
  already_requested INTEGER;
  result public.payouts;
BEGIN
  IF public.is_suspended(auth.uid()) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;

  SELECT COALESCE(SUM(m.net_amount), 0) INTO available
  FROM public.milestones m JOIN public.projects p ON p.id = m.project_id
  WHERE p.expert_id = auth.uid() AND m.payout_released = true;

  SELECT COALESCE(SUM(amount_ngn), 0) INTO already_requested
  FROM public.payouts WHERE expert_id = auth.uid() AND status IN ('pending', 'processing', 'paid');

  IF _amount_ngn > (available - already_requested) THEN
    RAISE EXCEPTION 'Amount exceeds available balance';
  END IF;

  INSERT INTO public.payouts (expert_id, amount_ngn, bank_name, account_number, account_name)
  VALUES (auth.uid(), _amount_ngn, _bank_name, _account_number, _account_name)
  RETURNING * INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_milestone(_milestone_id UUID)
RETURNS public.milestones LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m public.milestones;
  p public.projects;
BEGIN
  IF public.is_suspended(auth.uid()) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
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

-- Suspended users can't create new projects or send new messages either.
DROP POLICY IF EXISTS "Students create own projects" ON public.projects;
CREATE POLICY "Students create own projects" ON public.projects FOR INSERT
  WITH CHECK (student_id = auth.uid() AND NOT public.is_suspended(auth.uid()));

DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND NOT public.is_suspended(auth.uid()) AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.student_id = auth.uid() OR p.expert_id = auth.uid())));
