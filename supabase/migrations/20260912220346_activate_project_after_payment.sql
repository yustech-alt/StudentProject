-- Called only by the paystack-webhook edge function (service role).
-- Marks the project paid and generates the right number of milestones
-- for the package actually purchased, with a fair net payout split.
CREATE OR REPLACE FUNCTION public.activate_project_after_payment(_project_id UUID)
RETURNS public.projects LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  proj public.projects;
  pkg public.packages;
  templates TEXT[];
  i INTEGER;
  net_total INTEGER;
  fee_total INTEGER;
  share INTEGER;
  remainder INTEGER;
BEGIN
  SELECT * INTO proj FROM public.projects WHERE id = _project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;

  SELECT * INTO pkg FROM public.packages WHERE id = proj.package_id;

  fee_total := ROUND(pkg.price_ngn * 0.10);
  net_total := pkg.price_ngn - fee_total;
  share := net_total / pkg.milestone_count;
  remainder := net_total - (share * pkg.milestone_count);

  templates := CASE pkg.milestone_count
    WHEN 1 THEN ARRAY['Milestone Support']
    WHEN 3 THEN ARRAY['Topic Selection & Proposal', 'Core Documentation & Design', 'Implementation & Review']
    ELSE ARRAY['Topic Selection & Proposal', 'Chapters 1-3 Documentation', 'Database Design',
               'Frontend Implementation', 'Backend Integration', 'Testing & Chapters 4-5', 'Defense Preparation']
  END;

  FOR i IN 1..pkg.milestone_count LOOP
    INSERT INTO public.milestones (project_id, seq, title, gross_amount, platform_fee_amount, net_amount)
    VALUES (
      _project_id, i, templates[i],
      ROUND((share + CASE WHEN i = pkg.milestone_count THEN remainder ELSE 0 END) / 0.9),
      ROUND((share + CASE WHEN i = pkg.milestone_count THEN remainder ELSE 0 END) / 0.9) - (share + CASE WHEN i = pkg.milestone_count THEN remainder ELSE 0 END),
      share + CASE WHEN i = pkg.milestone_count THEN remainder ELSE 0 END
    );
  END LOOP;

  UPDATE public.projects SET
    payment_status = 'paid',
    status = 'pending',
    current_stage = 'Awaiting Expert Assignment',
    start_date = CURRENT_DATE
  WHERE id = _project_id
  RETURNING * INTO proj;

  RETURN proj;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_project_after_payment(UUID) FROM PUBLIC, authenticated, anon;
