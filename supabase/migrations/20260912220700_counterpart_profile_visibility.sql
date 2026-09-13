-- A student and their assigned expert need to see each other's basic profile
-- (name, avatar, institution) to work together. Without this, RLS blocks it
-- entirely since the base "own profile only" policy is restrictive.
CREATE POLICY "Project counterparts can view each other's profile"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE (p.student_id = auth.uid() AND p.expert_id = profiles.user_id)
       OR (p.expert_id = auth.uid() AND p.student_id = profiles.user_id)
  )
);
