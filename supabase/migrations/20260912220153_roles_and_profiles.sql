-- App roles
CREATE TYPE public.app_role AS ENUM ('student', 'expert', 'admin');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1 $$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    institution TEXT,
    bio TEXT,
    avatar_url TEXT,
    specialization TEXT,
    verified BOOLEAN DEFAULT false,
    verification_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (verification_status IN ('not_applicable', 'pending', 'approved', 'rejected')),
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public, safe-to-share view (no email/phone) for showing experts to students etc.
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, user_id, full_name, avatar_url, bio, location, institution,
         specialization, verified, verification_status, onboarding_completed, created_at, updated_at
  FROM public.profiles;

CREATE POLICY "Users can only view own profile"
ON public.profiles FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_profile()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.bio IS NOT NULL AND length(NEW.bio) > 1000 THEN
    RAISE EXCEPTION 'Bio must be 1000 characters or less';
  END IF;
  IF length(NEW.full_name) > 100 THEN
    RAISE EXCEPTION 'Full name must be 100 characters or less';
  END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF length(NEW.phone) > 20 THEN
      RAISE EXCEPTION 'Phone number must be 20 characters or less';
    END IF;
    IF NEW.phone !~ '^[0-9+\-\s()]+$' THEN
      RAISE EXCEPTION 'Phone number contains invalid characters';
    END IF;
  END IF;
  IF NEW.location IS NOT NULL AND length(NEW.location) > 200 THEN
    RAISE EXCEPTION 'Location must be 200 characters or less';
  END IF;
  IF NEW.institution IS NOT NULL AND length(NEW.institution) > 200 THEN
    RAISE EXCEPTION 'Institution must be 200 characters or less';
  END IF;
  IF NEW.specialization IS NOT NULL AND length(NEW.specialization) > 200 THEN
    RAISE EXCEPTION 'Specialization must be 200 characters or less';
  END IF;
  IF NEW.avatar_url IS NOT NULL AND length(NEW.avatar_url) > 2000 THEN
    RAISE EXCEPTION 'Avatar URL must be 2000 characters or less';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile();

-- New-user bootstrap: profile + role. Experts start unverified with a pending review flag.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role app_role;
BEGIN
  new_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  -- Nobody can self-register as admin
  IF new_role = 'admin' THEN
    new_role := 'student';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, verification_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE WHEN new_role = 'expert' THEN 'pending' ELSE 'not_applicable' END
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, new_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
