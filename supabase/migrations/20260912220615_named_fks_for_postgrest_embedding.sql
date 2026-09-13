-- The frontend embeds profile data into projects/messages queries using
-- PostgREST's named-FK syntax (e.g. profiles!projects_student_profile_fkey).
-- student_id/expert_id/sender_id reference auth.users for integrity; these
-- additional FKs to profiles(user_id) exist purely so PostgREST can embed
-- the profile row directly, since PostgREST can't join through auth.users.
ALTER TABLE public.projects
  ADD CONSTRAINT projects_student_profile_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(user_id);
ALTER TABLE public.projects
  ADD CONSTRAINT projects_expert_profile_fkey FOREIGN KEY (expert_id) REFERENCES public.profiles(user_id);
ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_profile_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id);
