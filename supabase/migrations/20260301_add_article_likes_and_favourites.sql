-- ============================================================
-- Migration: Add article_likes & article_favourites tables
-- Date: 2026-03-01
-- Description: Creates tables for user likes and favourites
--              with composite primary keys, RLS, and policies.
-- ============================================================

-- ─── ARTICLE LIKES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_likes (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON public.article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user_id    ON public.article_likes(user_id);

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY article_likes_select_own ON public.article_likes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY article_likes_insert_own ON public.article_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY article_likes_delete_own ON public.article_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ─── ARTICLE FAVOURITES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_favourites (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_article_favourites_article_id ON public.article_favourites(article_id);
CREATE INDEX IF NOT EXISTS idx_article_favourites_user_id    ON public.article_favourites(user_id);

ALTER TABLE public.article_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY article_favourites_select_own ON public.article_favourites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY article_favourites_insert_own ON public.article_favourites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY article_favourites_delete_own ON public.article_favourites
  FOR DELETE
  USING (auth.uid() = user_id);
