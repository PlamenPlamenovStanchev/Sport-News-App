-- Migration: Allow admins to SELECT all profiles
-- Date: 2026-02-27
-- Reason: The admin panel needs to list all registered users,
--         but the existing profiles_select_own policy restricts
--         SELECT to auth.uid() = id only.

-- Admins can read ALL profiles (needed for User Management tab)
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Admins can also delete profiles (for user removal from admin panel)
CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE
  USING (public.get_my_role() = 'admin');
