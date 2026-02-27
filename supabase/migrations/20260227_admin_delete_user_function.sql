-- Migration: Server-side function to fully delete a user (including auth.users)
-- Date: 2026-02-27
-- Reason: Deleting from auth.users is not possible via the anon key / client SDK.
--         This SECURITY DEFINER function runs as the DB owner and can delete
--         from auth.users. It is restricted to admins via get_my_role().

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER          -- runs with the privileges of the function owner (postgres)
SET search_path = public  -- prevent search_path hijacking
AS $$
BEGIN
  -- Only admins may call this
  IF public.get_my_role() <> 'admin' THEN
    RAISE EXCEPTION 'Permission denied: only admins can delete users';
  END IF;

  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account from the admin panel';
  END IF;

  -- Delete from public tables first (FK cascade from auth.users would do it,
  -- but being explicit is clearer and avoids relying on cascade order).
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles   WHERE id      = target_user_id;

  -- Delete the auth user (cascades to news_articles, comments, favorites, etc.)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
