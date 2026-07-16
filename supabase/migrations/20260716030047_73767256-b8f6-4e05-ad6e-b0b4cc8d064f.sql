
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- SCHOOLS
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_code TEXT NOT NULL UNIQUE,
  student_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools readable to authed" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "schools insert by authed" ON public.schools FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- PROFILES: add school_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, school_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles read own or same-school" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

-- HELPERS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_school_member(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND school_id = _school_id);
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin' AND school_id = _school_id);
$$;

CREATE OR REPLACE FUNCTION public.is_school_teacher(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('teacher','admin') AND school_id = _school_id);
$$;

-- VIDEO LESSONS
CREATE TABLE public.video_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  description TEXT,
  video_path TEXT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_lessons TO authenticated;
GRANT ALL ON public.video_lessons TO service_role;
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons read same school" ON public.video_lessons FOR SELECT TO authenticated
  USING (public.is_school_member(auth.uid(), school_id));
CREATE POLICY "lessons insert by school teacher" ON public.video_lessons FOR INSERT TO authenticated
  WITH CHECK (public.is_school_teacher(auth.uid(), school_id) AND teacher_id = auth.uid());
CREATE POLICY "lessons update by owner or admin" ON public.video_lessons FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.is_school_admin(auth.uid(), school_id));
CREATE POLICY "lessons delete by owner or admin" ON public.video_lessons FOR DELETE TO authenticated
  USING (teacher_id = auth.uid() OR public.is_school_admin(auth.uid(), school_id));

-- LESSON QUESTIONS
CREATE TABLE public.lesson_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_questions TO authenticated;
GRANT ALL ON public.lesson_questions TO service_role;
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions read same school" ON public.lesson_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.video_lessons l WHERE l.id = lesson_id AND public.is_school_member(auth.uid(), l.school_id)));
CREATE POLICY "questions write by teacher owner" ON public.lesson_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.video_lessons l WHERE l.id = lesson_id AND (l.teacher_id = auth.uid() OR public.is_school_admin(auth.uid(), l.school_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.video_lessons l WHERE l.id = lesson_id AND (l.teacher_id = auth.uid() OR public.is_school_admin(auth.uid(), l.school_id))));

-- LESSON SUBMISSIONS
CREATE TABLE public.lesson_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  xp_earned INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, student_id)
);
GRANT SELECT, INSERT ON public.lesson_submissions TO authenticated;
GRANT ALL ON public.lesson_submissions TO service_role;
ALTER TABLE public.lesson_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs read own" ON public.lesson_submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.video_lessons l WHERE l.id = lesson_id AND public.is_school_teacher(auth.uid(), l.school_id)));
CREATE POLICY "subs insert own" ON public.lesson_submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- RPC: create school (caller becomes admin + teacher)
CREATE OR REPLACE FUNCTION public.create_school(_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _school_id uuid;
  _tc text;
  _sc text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _tc := 'T-' || upper(substring(md5(random()::text) for 6));
  _sc := 'S-' || upper(substring(md5(random()::text) for 6));
  INSERT INTO public.schools (name, teacher_code, student_code, created_by)
    VALUES (_name, _tc, _sc, _uid) RETURNING id INTO _school_id;
  INSERT INTO public.user_roles (user_id, role, school_id) VALUES (_uid, 'admin', _school_id);
  INSERT INTO public.user_roles (user_id, role, school_id) VALUES (_uid, 'teacher', _school_id);
  UPDATE public.profiles SET school_id = _school_id WHERE id = _uid;
  RETURN jsonb_build_object('school_id', _school_id, 'teacher_code', _tc, 'student_code', _sc);
END; $$;

-- RPC: join school by code
CREATE OR REPLACE FUNCTION public.join_school(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _sid uuid;
  _role app_role;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id, 'teacher'::app_role INTO _sid, _role FROM public.schools WHERE teacher_code = _code;
  IF _sid IS NULL THEN
    SELECT id, 'student'::app_role INTO _sid, _role FROM public.schools WHERE student_code = _code;
  END IF;
  IF _sid IS NULL THEN RAISE EXCEPTION 'Invalid code'; END IF;
  INSERT INTO public.user_roles (user_id, role, school_id) VALUES (_uid, _role, _sid)
    ON CONFLICT (user_id, role, school_id) DO NOTHING;
  UPDATE public.profiles SET school_id = _sid WHERE id = _uid;
  RETURN jsonb_build_object('school_id', _sid, 'role', _role);
END; $$;

-- RPC: submit lesson quiz
CREATE OR REPLACE FUNCTION public.submit_lesson(_lesson_id uuid, _answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _total int;
  _score int := 0;
  _xp int;
  _lesson_xp int;
  _new_total int;
  _already boolean;
  _q RECORD;
  _ans int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT xp_reward INTO _lesson_xp FROM public.video_lessons WHERE id = _lesson_id;
  IF _lesson_xp IS NULL THEN RAISE EXCEPTION 'Lesson not found'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.lesson_submissions WHERE lesson_id = _lesson_id AND student_id = _uid) INTO _already;
  IF _already THEN RAISE EXCEPTION 'Already submitted'; END IF;

  SELECT count(*) INTO _total FROM public.lesson_questions WHERE lesson_id = _lesson_id;
  FOR _q IN SELECT id, correct_index FROM public.lesson_questions WHERE lesson_id = _lesson_id LOOP
    _ans := (_answers ->> _q.id::text)::int;
    IF _ans = _q.correct_index THEN _score := _score + 1; END IF;
  END LOOP;

  _xp := CASE WHEN _total = 0 THEN 0 ELSE (_lesson_xp * _score / _total)::int END;

  INSERT INTO public.lesson_submissions (lesson_id, student_id, answers, score, total, xp_earned)
    VALUES (_lesson_id, _uid, _answers, _score, _total, _xp);

  UPDATE public.profiles SET total_xp = total_xp + _xp, last_active = CURRENT_DATE WHERE id = _uid
    RETURNING total_xp INTO _new_total;

  RETURN jsonb_build_object('score', _score, 'total', _total, 'xp_earned', _xp, 'total_xp', _new_total);
END; $$;

-- STORAGE POLICIES on lesson-videos bucket
-- Read: any authed same-school member (path starts with school_id/)
CREATE POLICY "lesson videos read same school" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lesson-videos' AND public.is_school_member(auth.uid(), (split_part(name,'/',1))::uuid));
CREATE POLICY "lesson videos insert by teacher" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lesson-videos' AND public.is_school_teacher(auth.uid(), (split_part(name,'/',1))::uuid));
CREATE POLICY "lesson videos delete by teacher" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lesson-videos' AND public.is_school_teacher(auth.uid(), (split_part(name,'/',1))::uuid));
