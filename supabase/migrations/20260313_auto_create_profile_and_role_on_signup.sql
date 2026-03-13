-- ============================================================
-- Migration: Auto-create profile and default role on signup
-- Date: 2026-03-13
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
BEGIN
  generated_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
    NULLIF(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), '\\s+', '', 'g'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    LOWER(generated_username),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_auth_user ON auth.users;

CREATE TRIGGER trg_handle_new_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

INSERT INTO public.profiles (id, username, avatar_url)
SELECT
  u.id,
  LOWER(
    COALESCE(
      NULLIF(u.raw_user_meta_data ->> 'username', ''),
      NULLIF(REGEXP_REPLACE(COALESCE(u.raw_user_meta_data ->> 'full_name', ''), '\\s+', '', 'g'), ''),
      SPLIT_PART(u.email, '@', 1)
    )
  ),
  u.raw_user_meta_data ->> 'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;
