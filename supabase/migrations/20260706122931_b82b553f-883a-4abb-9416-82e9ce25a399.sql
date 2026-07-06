
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Learner',
  village TEXT,
  class_level INT DEFAULT 5,
  total_xp INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  last_active DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read all authed" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- SUBJECTS
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#e85d3a',
  icon TEXT NOT NULL DEFAULT 'sparkles'
);
GRANT SELECT ON public.subjects TO authenticated, anon;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects readable" ON public.subjects FOR SELECT TO authenticated, anon USING (true);

-- QUESTS
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  xp_reward INT NOT NULL DEFAULT 25,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.quests TO authenticated, anon;
GRANT ALL ON public.quests TO service_role;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quests readable" ON public.quests FOR SELECT TO authenticated, anon USING (true);

-- QUEST COMPLETIONS
CREATE TABLE public.quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  xp_earned INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);
GRANT SELECT, INSERT ON public.quest_completions TO authenticated;
GRANT ALL ON public.quest_completions TO service_role;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "completions read all authed" ON public.quest_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "completions insert own" ON public.quest_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- BADGES
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  xp_threshold INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.badges TO authenticated, anon;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges readable" ON public.badges FOR SELECT TO authenticated, anon USING (true);

-- USER BADGES
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges read all authed" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_badges insert own" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- AUTO PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Learner'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COMPLETE QUEST RPC (award XP + auto grant threshold badges)
CREATE OR REPLACE FUNCTION public.complete_quest(_quest_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _xp INT;
  _new_total INT;
  _already BOOLEAN;
  _new_badges JSONB := '[]'::jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT xp_reward INTO _xp FROM public.quests WHERE id = _quest_id;
  IF _xp IS NULL THEN RAISE EXCEPTION 'Quest not found'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.quest_completions WHERE user_id = _uid AND quest_id = _quest_id) INTO _already;
  IF _already THEN
    SELECT total_xp INTO _new_total FROM public.profiles WHERE id = _uid;
    RETURN jsonb_build_object('already', true, 'xp_earned', 0, 'total_xp', _new_total, 'new_badges', _new_badges);
  END IF;

  INSERT INTO public.quest_completions (user_id, quest_id, xp_earned) VALUES (_uid, _quest_id, _xp);

  UPDATE public.profiles
    SET total_xp = total_xp + _xp,
        last_active = CURRENT_DATE,
        streak_days = CASE
          WHEN last_active = CURRENT_DATE THEN streak_days
          WHEN last_active = CURRENT_DATE - 1 THEN streak_days + 1
          ELSE 1
        END
    WHERE id = _uid
    RETURNING total_xp INTO _new_total;

  -- award any badge whose threshold met and not yet earned
  WITH inserted AS (
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT _uid, b.id
    FROM public.badges b
    WHERE b.xp_threshold <= _new_total
      AND NOT EXISTS (SELECT 1 FROM public.user_badges ub WHERE ub.user_id = _uid AND ub.badge_id = b.id)
    RETURNING badge_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'icon', b.icon)), '[]'::jsonb)
  INTO _new_badges
  FROM inserted i JOIN public.badges b ON b.id = i.badge_id;

  RETURN jsonb_build_object('already', false, 'xp_earned', _xp, 'total_xp', _new_total, 'new_badges', _new_badges);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_quest(UUID) TO authenticated;

-- SEED SUBJECTS
INSERT INTO public.subjects (slug, name, description, color, icon) VALUES
  ('math', 'Math Missions', 'Number quests & puzzle boss fights', '#e85d3a', 'rocket'),
  ('story', 'Story Realm', 'Read tales & unlock chapters', '#4a9d5f', 'book'),
  ('science', 'Science Lab', 'Experiments with animated mentors', '#e8a83a', 'sparkles'),
  ('language', 'Bhasha Battle', 'English + mother-tongue word duels', '#7c4ad4', 'languages');

-- SEED QUESTS (3 per subject)
INSERT INTO public.quests (subject_id, title, description, difficulty, xp_reward, question, options, correct_index, sort_order)
SELECT s.id, q.title, q.description, q.difficulty, q.xp_reward, q.question, q.options::jsonb, q.correct_index, q.sort_order
FROM public.subjects s
JOIN (VALUES
  ('math','Number Ninja','Warm up your addition powers','easy',20,'What is 17 + 25?','["32","42","41","52"]',1,1),
  ('math','Multiplication Mountain','Climb the times table','medium',35,'What is 12 × 8?','["86","96","108","94"]',1,2),
  ('math','Fraction Fortress','Defeat the fraction boss','hard',50,'Which is larger: 3/4 or 5/8?','["3/4","5/8","Equal","Cannot tell"]',0,3),
  ('story','Panchatantra Path','A wise fox tale','easy',20,'In the Panchatantra, who is famously known for cleverness?','["Lion","Fox","Elephant","Deer"]',1,1),
  ('story','Rhyme Realm','Find the rhyming pair','easy',25,'Which word rhymes with "star"?','["sun","car","cloud","tree"]',1,2),
  ('story','Grammar Guardian','Pick the correct sentence','medium',40,'Choose the correct sentence:','["She go to school.","She goes to school.","She going to school.","She gone to school."]',1,3),
  ('science','Plant Power','Photosynthesis basics','easy',25,'Plants make food using which gas?','["Oxygen","Nitrogen","Carbon dioxide","Hydrogen"]',2,1),
  ('science','Solar System Sprint','Zoom around the planets','medium',35,'Which planet is closest to the Sun?','["Venus","Earth","Mercury","Mars"]',2,2),
  ('science','Water Cycle Wizard','Master the H2O journey','hard',50,'What is the process where water vapor becomes liquid?','["Evaporation","Condensation","Precipitation","Transpiration"]',1,3),
  ('language','Word Warrior','Basic English','easy',20,'Which is a noun?','["run","quickly","apple","green"]',2,1),
  ('language','Opposite Odyssey','Find the antonym','medium',35,'What is the opposite of "brave"?','["bold","cowardly","strong","fast"]',1,2),
  ('language','Idiom Island','Decode the phrase','hard',50,'"Piece of cake" means:','["Very tasty","Something very easy","A dessert","A puzzle"]',1,3)
) q(subject_slug, title, description, difficulty, xp_reward, question, options, correct_index, sort_order)
ON s.slug = q.subject_slug;

-- SEED BADGES
INSERT INTO public.badges (slug, name, description, icon, xp_threshold) VALUES
  ('first-quest','First Quest','Complete your very first quest','sparkles',1),
  ('rising-star','Rising Star','Earn 100 XP','star',100),
  ('math-wizard','Math Wizard','Earn 250 XP','rocket',250),
  ('story-master','Story Master','Earn 500 XP','book',500),
  ('village-champ','Village Champion','Earn 1000 XP','trophy',1000),
  ('legend','VidyaQuest Legend','Earn 2000 XP','award',2000);
