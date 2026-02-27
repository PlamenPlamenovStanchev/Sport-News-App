-- ============================================================
-- Migration: Enable RLS & Define Policies
-- Date: 2026-02-27
-- Description: Enables Row-Level Security on all tables and
--              creates role-based access policies.
-- ============================================================

-- ─── Helper: resolve the current user's role ─────────────────
-- Returns the role text for the authenticated user, or NULL.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ═════════════════════════════════════════════════════════════
-- 1. PROFILES
-- ═════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read only their own profile
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ═════════════════════════════════════════════════════════════
-- 2. USER_ROLES
-- ═════════════════════════════════════════════════════════════
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Admins can read all roles (needed for admin panel)
CREATE POLICY user_roles_select_admin ON public.user_roles
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Any authenticated user can read their own role
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can insert roles (assign roles to users)
CREATE POLICY user_roles_insert_admin ON public.user_roles
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

-- Only admins can update roles (change a user's role)
CREATE POLICY user_roles_update_admin ON public.user_roles
  FOR UPDATE
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Only admins can delete roles (remove a user's role)
CREATE POLICY user_roles_delete_admin ON public.user_roles
  FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ═════════════════════════════════════════════════════════════
-- 3. NEWS_ARTICLES
-- ═════════════════════════════════════════════════════════════
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read published articles
CREATE POLICY news_select_published ON public.news_articles
  FOR SELECT
  USING (is_published = TRUE);

-- Authors can also see their own unpublished drafts
CREATE POLICY news_select_own_drafts ON public.news_articles
  FOR SELECT
  USING (
    auth.uid() = author_id
    AND public.get_my_role() = 'author'
  );

-- Editors can see all articles (including unpublished) for moderation
CREATE POLICY news_select_editor ON public.news_articles
  FOR SELECT
  USING (public.get_my_role() = 'editor');

-- Admins can see all articles
CREATE POLICY news_select_admin ON public.news_articles
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Authors can insert articles only under their own author_id.
-- New articles are NOT published by default (is_published = FALSE
-- is enforced by the table default; the CHECK ensures they cannot
-- override it to TRUE on insert).
CREATE POLICY news_insert_author ON public.news_articles
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND public.get_my_role() = 'author'
    AND is_published = FALSE
  );

-- Admins can insert articles (full access)
CREATE POLICY news_insert_admin ON public.news_articles
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

-- Editors can update any article (approve / edit)
CREATE POLICY news_update_editor ON public.news_articles
  FOR UPDATE
  USING  (public.get_my_role() = 'editor')
  WITH CHECK (public.get_my_role() = 'editor');

-- Admins can update any article
CREATE POLICY news_update_admin ON public.news_articles
  FOR UPDATE
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Editors can delete articles
CREATE POLICY news_delete_editor ON public.news_articles
  FOR DELETE
  USING (public.get_my_role() = 'editor');

-- Admins can delete articles
CREATE POLICY news_delete_admin ON public.news_articles
  FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ═════════════════════════════════════════════════════════════
-- 4. COMMENTS
-- ═════════════════════════════════════════════════════════════
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on published articles
CREATE POLICY comments_select_all ON public.comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.news_articles
      WHERE id = article_id AND is_published = TRUE
    )
  );

-- Authenticated users can insert comments with their own user_id
CREATE POLICY comments_insert_own ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own comments
CREATE POLICY comments_delete_own ON public.comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ═════════════════════════════════════════════════════════════
-- 5. CATEGORIES (read-only for everyone, admin-managed)
-- ═════════════════════════════════════════════════════════════
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY categories_select_all ON public.categories
  FOR SELECT
  USING (TRUE);

-- Only admins can manage categories
CREATE POLICY categories_insert_admin ON public.categories
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY categories_update_admin ON public.categories
  FOR UPDATE
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY categories_delete_admin ON public.categories
  FOR DELETE
  USING (public.get_my_role() = 'admin');
