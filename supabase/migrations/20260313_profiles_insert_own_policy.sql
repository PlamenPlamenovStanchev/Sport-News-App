-- ============================================================
-- Migration: Allow users to create their own profile row
-- Date: 2026-03-13
-- Description: Needed so authenticated users can self-heal missing
--              profile rows required by comments_user_id_profiles_fk.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY profiles_insert_own ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;
