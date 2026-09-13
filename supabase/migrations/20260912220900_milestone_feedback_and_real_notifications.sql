-- Lets the assigned expert leave feedback/a rating on a milestone without
-- going through the general-purpose admin-only UPDATE policy on milestones.
CREATE OR REPLACE FUNCTION public.set_milestone_feedback(_milestone_id UUID, _feedback TEXT, _rating SMALLINT DEFAULT NULL)
RETURNS public.milestones LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m public.milestones;
  p public.projects;
BEGIN
  SELECT * INTO m FROM public.milestones WHERE id = _milestone_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Milestone not found'; END IF;
  SELECT * INTO p FROM public.projects WHERE id = m.project_id;
  IF p.expert_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only the assigned expert can leave feedback';
  END IF;

  UPDATE public.milestones SET feedback = _feedback, rating = COALESCE(_rating, rating)
  WHERE id = _milestone_id RETURNING * INTO m;

  RETURN m;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_milestone_feedback(UUID, TEXT, SMALLINT) FROM PUBLIC, anon;

-- Real notifications on confirmation, instead of a toast that only the
-- confirming user's own browser ever sees.
CREATE OR REPLACE FUNCTION public.confirm_milestone(_milestone_id UUID)
RETURNS public.milestones LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m public.milestones;
  p public.projects;
  caller_role TEXT;
  other_user_id UUID;
BEGIN
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

    -- Both sides get a real notification that payout was released.
    INSERT INTO public.notifications (user_id, type, title, description, link)
    VALUES (p.expert_id, 'milestone', 'Milestone completed - payout released',
            '"' || m.title || '" is complete. ₦' || m.net_amount || ' has been released to your balance.',
            '/expert/project/' || p.id);
    INSERT INTO public.notifications (user_id, type, title, description, link)
    VALUES (p.student_id, 'milestone', 'Milestone completed',
            '"' || m.title || '" has been marked complete by both you and your expert.',
            '/project/' || p.id);
  ELSIF other_user_id IS NOT NULL THEN
    -- One side confirmed; let the other side know their confirmation is what's pending.
    INSERT INTO public.notifications (user_id, type, title, description, link)
    VALUES (other_user_id, 'milestone', 'Milestone awaiting your confirmation',
            'Your ' || (CASE WHEN caller_role = 'student' THEN 'student' ELSE 'expert' END) ||
            ' confirmed "' || m.title || '". Confirm on your side to release payout.',
            CASE WHEN caller_role = 'student' THEN '/expert/project/' || p.id ELSE '/project/' || p.id END);
  END IF;

  RETURN m;
END;
$$;
