-- ============================================================
-- Kith — Personal Relationship Manager  |  Initial Migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────

-- Public user profiles (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT,
  avatar_url  TEXT,
  email       TEXT UNIQUE NOT NULL,
  onboarded   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Contacts / people
CREATE TABLE IF NOT EXISTS public.people (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  avatar_url        TEXT,
  relation          TEXT CHECK (relation IN ('Friend','Family','Mentor','Colleague')),
  circle            TEXT CHECK (circle IN ('Inner Circle','Close Friends','Social Circle','Reconnect')),
  email             TEXT,
  phone             TEXT,
  location          TEXT,
  birthday          DATE,
  how_met           TEXT,
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}',
  last_contacted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Interaction log
CREATE TABLE IF NOT EXISTS public.interactions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  person_id   UUID REFERENCES public.people(id) ON DELETE CASCADE NOT NULL,
  type        TEXT CHECK (type IN ('call','message','meetup','note','birthday')) NOT NULL,
  note        TEXT,
  duration_s  INTEGER,           -- call duration in seconds
  event_url   TEXT,              -- Google Calendar event link
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Check-in reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  person_id     UUID REFERENCES public.people(id) ON DELETE CASCADE NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 30,
  next_due_at   TIMESTAMPTZ NOT NULL,
  enabled       BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, person_id)
);

-- ──────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_people_user_id            ON public.people(user_id);
CREATE INDEX IF NOT EXISTS idx_people_circle             ON public.people(circle);
CREATE INDEX IF NOT EXISTS idx_people_last_contacted     ON public.people(last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id      ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_person_id    ON public.interactions(person_id);
CREATE INDEX IF NOT EXISTS idx_interactions_occurred_at  ON public.interactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id         ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_next_due        ON public.reminders(next_due_at);

-- ──────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders    ENABLE ROW LEVEL SECURITY;

-- users policies
CREATE POLICY "users_select_own"  ON public.users FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "users_insert_own"  ON public.users FOR INSERT  WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE  USING (auth.uid() = id);

-- people policies
CREATE POLICY "people_select_own" ON public.people FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "people_insert_own" ON public.people FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "people_update_own" ON public.people FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "people_delete_own" ON public.people FOR DELETE  USING (auth.uid() = user_id);

-- interactions policies
CREATE POLICY "int_select_own" ON public.interactions FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "int_insert_own" ON public.interactions FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "int_update_own" ON public.interactions FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "int_delete_own" ON public.interactions FOR DELETE  USING (auth.uid() = user_id);

-- reminders policies
CREATE POLICY "rem_select_own" ON public.reminders FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "rem_insert_own" ON public.reminders FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rem_update_own" ON public.reminders FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "rem_delete_own" ON public.reminders FOR DELETE  USING (auth.uid() = user_id);

-- ──────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────
-- TRIGGER: update last_contacted_at
-- ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_last_contacted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.people
  SET last_contacted_at = NEW.occurred_at
  WHERE id = NEW.person_id
    AND (last_contacted_at IS NULL OR NEW.occurred_at > last_contacted_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_interaction_created ON public.interactions;
CREATE TRIGGER on_interaction_created
  AFTER INSERT ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_last_contacted();

-- ──────────────────────────────────────
-- HELPER VIEWS (optional, nice for dashboards)
-- ──────────────────────────────────────
CREATE OR REPLACE VIEW public.overdue_contacts AS
  SELECT
    p.*,
    EXTRACT(DAY FROM NOW() - p.last_contacted_at)::INT AS days_since_contact
  FROM public.people p
  WHERE p.last_contacted_at < NOW() - INTERVAL '30 days'
     OR p.last_contacted_at IS NULL;

CREATE OR REPLACE VIEW public.upcoming_birthdays AS
  SELECT
    p.*,
    DATE_PART('doy',
      TO_DATE(
        EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
        LPAD(EXTRACT(MONTH FROM p.birthday)::TEXT, 2, '0') || '-' ||
        LPAD(EXTRACT(DAY FROM p.birthday)::TEXT, 2, '0'),
        'YYYY-MM-DD'
      )
    ) - DATE_PART('doy', NOW()) AS days_until_birthday
  FROM public.people p
  WHERE p.birthday IS NOT NULL;
