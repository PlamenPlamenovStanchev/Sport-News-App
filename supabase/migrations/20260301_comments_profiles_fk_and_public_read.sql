-- ============================================================
-- Migration: Comments → Profiles FK + Public Profile Read
-- Date: 2026-03-01
-- Description:
--   1. Adds a FK from comments.user_id to profiles.id so that
--      PostgREST / Supabase can resolve the join
--      `comments → profiles(username)`.
--   2. Adds a public SELECT policy on profiles so all users
--      (including anonymous) can read profile info like usernames
--      displayed alongside comments.
-- ============================================================

-- 1. Foreign key from comments.user_id → profiles.id
--    (comments.user_id already references auth.users; this second FK
--     lets PostgREST detect the comments ↔ profiles relationship.)
ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Allow anyone to read profiles (usernames shown on comments, etc.)
CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT
  USING (TRUE);
