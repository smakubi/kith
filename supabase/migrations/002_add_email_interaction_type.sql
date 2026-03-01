-- ============================================================
-- Kith — Migration 002: Add 'email' as a valid interaction type
-- ============================================================

-- Drop the existing check constraint and recreate it with 'email' included
ALTER TABLE public.interactions
  DROP CONSTRAINT IF EXISTS interactions_type_check;

ALTER TABLE public.interactions
  ADD CONSTRAINT interactions_type_check
  CHECK (type IN ('call', 'message', 'email', 'meetup', 'note', 'birthday'));
