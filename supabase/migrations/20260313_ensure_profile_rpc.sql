-- ============================================================
-- Migration: RPC to ensure current user's profile/role exists
-- Date: 2026-03-13
-- Description: Lets authenticated clients safely self-heal missing
--              profile/role rows without requiring direct INSERT
--              permission on public.profiles.
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_current_user_profile()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_user_id UUID;
  auth_email TEXT;
  auth_meta JSONB;
  resolved_username TEXT;
BEGIN
  auth_user_id := auth.uid();

  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.email, u.raw_user_meta_data
  INTO auth_email, auth_meta
  FROM auth.users u
  WHERE u.id = auth_user_id;

  resolved_username := COALESCE(
    NULLIF(auth_meta ->> 'username', ''),
    NULLIF(REGEXP_REPLACE(COALESCE(auth_meta ->> 'full_name', ''), '\\s+', '', 'g'), ''),
    SPLIT_PART(COALESCE(auth_email, ''), '@', 1),
    'user'
  );

  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    auth_user_id,
    LOWER(resolved_username),
    auth_meta ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth_user_id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_current_user_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_current_user_profile() TO authenticated;
