-- ==========================================
-- 002_lms.sql - LMS + Knowledge Center
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Update profiles: add school, program, teacher_id + allow new roles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS program text,
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop old role constraint and add new one with teacher + school_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'school_admin', 'admin'));

-- 2. Assignments table (teachers create assignments for students)
CREATE TABLE IF NOT EXISTS public.assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program       text NOT NULL DEFAULT 'general',
  title         text NOT NULL,
  description   text,
  due_date      timestamptz,
  module_number int DEFAULT 1,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 3. Submissions table (students submit work for assignments)
CREATE TABLE IF NOT EXISTS public.submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_urls      text[] NOT NULL DEFAULT '{}',
  note            text,
  status          text NOT NULL DEFAULT 'submitted'
                  CHECK (status IN ('submitted', 'pending_feedback', 'needs_revision', 'done')),
  teacher_feedback text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Trigger updated_at for submissions
CREATE TRIGGER IF NOT EXISTS submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Articles table (knowledge center)
CREATE TABLE IF NOT EXISTS public.articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  body         text NOT NULL,
  category     text NOT NULL DEFAULT 'general',
  image_url    text,
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- RLS Policies
-- ==========================================

-- Assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_select_all" ON public.assignments
  FOR SELECT USING (true);

CREATE POLICY "assignments_insert_teacher" ON public.assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "assignments_update_teacher" ON public.assignments
  FOR UPDATE USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "assignments_delete_teacher" ON public.assignments
  FOR DELETE USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_select" ON public.submissions
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'school_admin')
    )
  );

CREATE POLICY "submissions_insert_student" ON public.submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "submissions_update" ON public.submissions
  FOR UPDATE USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles_select" ON public.articles
  FOR SELECT USING (
    is_published = true OR
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'school_admin')
    )
  );

CREATE POLICY "articles_insert" ON public.articles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "articles_update" ON public.articles
  FOR UPDATE USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "articles_delete" ON public.articles
  FOR DELETE USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
