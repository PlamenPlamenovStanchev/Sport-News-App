-- Migration: Allow admins to INSERT into profiles
-- Date: 2026-02-27
-- Reason: When the admin creates a new user from the Admin Panel,
--         the profile upsert was silently blocked by RLS because
--         no INSERT policy existed for admins on the profiles table.

CREATE POLICY profiles_insert_admin ON public.profiles
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');
