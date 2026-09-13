ALTER TABLE public.expert_applications
  ADD CONSTRAINT expert_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
