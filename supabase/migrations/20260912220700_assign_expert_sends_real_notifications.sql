CREATE OR REPLACE FUNCTION public.assign_expert(_project_id UUID, _expert_id UUID)
RETURNS public.projects LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.projects;
  expert_ok BOOLEAN;
  expert_name TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign experts';
  END IF;
  SELECT (verified AND verification_status = 'approved'), full_name INTO expert_ok, expert_name
  FROM public.profiles WHERE user_id = _expert_id;
  IF NOT COALESCE(expert_ok, false) THEN
    RAISE EXCEPTION 'Expert is not verified';
  END IF;

  UPDATE public.projects SET expert_id = _expert_id, status = 'in_progress'
  WHERE id = _project_id RETURNING * INTO p;

  INSERT INTO public.project_events (project_id, event_type, user_id, user_role, data)
  VALUES (_project_id, 'expert_assigned', auth.uid(), 'admin', jsonb_build_object('expert_id', _expert_id));

  -- Real, persisted notifications for both parties (not just a toast in the
  -- admin's own browser). This is what actually lets them find out.
  INSERT INTO public.notifications (user_id, type, title, description, link)
  VALUES (_expert_id, 'assignment', 'New project assigned',
          'You have been assigned to "' || p.title || '". Take a look and get started.',
          '/expert/project/' || p.id);

  INSERT INTO public.notifications (user_id, type, title, description, link)
  VALUES (p.student_id, 'assignment', 'Expert assigned to your project',
          COALESCE(expert_name, 'An expert') || ' has been assigned to "' || p.title || '".',
          '/project/' || p.id);

  RETURN p;
END;
$$;
