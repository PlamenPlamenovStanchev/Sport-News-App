-- ============================================================
-- Migration: Add article_views table for tracking reads
-- Date: 2026-03-01
-- Description: Tracks unique user reads per article using a
--              composite primary key (user_id, article_id).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.article_views (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON public.article_views(article_id);

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own view
CREATE POLICY article_views_insert_own ON public.article_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read views (needed for public counters)
CREATE POLICY article_views_select_all ON public.article_views
  FOR SELECT
  USING (TRUE);
