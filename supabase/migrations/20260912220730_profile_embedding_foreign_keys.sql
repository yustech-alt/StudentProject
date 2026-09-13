-- Adds a second FK on each of these columns (they already reference auth.users)
-- so PostgREST can embed profile data directly in one query, e.g.
-- .select('*, student:profiles!projects_student_profile_fkey(full_name)')
ALTER TABLE public.projects ADD CONSTRAINT projects_student_profile_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(user_id);
ALTER TABLE public.projects ADD CONSTRAINT projects_expert_profile_fkey
  FOREIGN KEY (expert_id) REFERENCES public.profiles(user_id);
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_profile_fkey
  FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id);
ALTER TABLE public.project_files ADD CONSTRAINT project_files_uploader_profile_fkey
  FOREIGN KEY (uploaded_by) REFERENCES public.profiles(user_id);
ALTER TABLE public.payouts ADD CONSTRAINT payouts_expert_profile_fkey
  FOREIGN KEY (expert_id) REFERENCES public.profiles(user_id);
