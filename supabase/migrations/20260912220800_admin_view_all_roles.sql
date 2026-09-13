-- Admins need to list all users by role (e.g. "show me all experts to assign").
-- This was missing: admins could update roles but never SELECT the full list.
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
