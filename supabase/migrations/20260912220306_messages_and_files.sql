CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'expert', 'admin')),
  content TEXT NOT NULL CHECK (length(content) <= 5000),
  attachment_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view messages" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.student_id = auth.uid() OR p.expert_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.student_id = auth.uid() OR p.expert_id = auth.uid())));
CREATE POLICY "Participants mark messages read" ON public.messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.student_id = auth.uid() OR p.expert_id = auth.uid())));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE TABLE public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploader_role TEXT NOT NULL CHECK (uploader_role IN ('student', 'expert')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view project files" ON public.project_files FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.student_id = auth.uid() OR p.expert_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Participants add project files" ON public.project_files FOR INSERT
  WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.student_id = auth.uid() OR p.expert_id = auth.uid())));
