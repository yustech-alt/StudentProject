CREATE TYPE public.transaction_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ngn INTEGER NOT NULL CHECK (amount_ngn > 0),
  gateway TEXT NOT NULL DEFAULT 'paystack',
  gateway_reference TEXT NOT NULL UNIQUE,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
-- No client INSERT/UPDATE policy: rows are only ever written by edge functions
-- using the service role key, which bypasses RLS. This is deliberate: a payment
-- record must never be created or confirmed directly from the browser.

CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ngn INTEGER NOT NULL CHECK (amount_ngn > 0),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL CHECK (account_number ~ '^[0-9]{10}$'),
  account_name TEXT,
  status public.payout_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experts view own payouts" ON public.payouts FOR SELECT
  USING (expert_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Experts request own payouts" ON public.payouts FOR INSERT
  WITH CHECK (expert_id = auth.uid());
CREATE POLICY "Admins update payouts" ON public.payouts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Server-checked payout request: caps the request at the expert's real
-- available balance (released milestones minus already-requested payouts).
CREATE OR REPLACE FUNCTION public.request_payout(_amount_ngn INTEGER, _bank_name TEXT, _account_number TEXT, _account_name TEXT)
RETURNS public.payouts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  available INTEGER;
  already_requested INTEGER;
  result public.payouts;
BEGIN
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

-- Expert application / review queue
CREATE TABLE public.expert_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  specialization TEXT NOT NULL,
  credentials TEXT NOT NULL CHECK (length(credentials) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experts view own application" ON public.expert_applications FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Experts submit own application" ON public.expert_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins review applications" ON public.expert_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.review_expert_application(_application_id UUID, _approve BOOLEAN)
RETURNS public.expert_applications LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  app public.expert_applications;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can review applications';
  END IF;

  UPDATE public.expert_applications SET
    status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = _application_id
  RETURNING * INTO app;

  UPDATE public.profiles SET
    verified = _approve,
    verification_status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END
  WHERE user_id = app.user_id;

  RETURN app;
END;
$$;
