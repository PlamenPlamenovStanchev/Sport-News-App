-- ============================================================
-- Migration: Allow public read on article_likes
-- Date: 2026-03-01
-- Description: Adds a permissive SELECT policy so anyone can
--              read / count article likes (needed for counters).
-- ============================================================

CREATE POLICY article_likes_select_all ON public.article_likes
  FOR SELECT
  USING (TRUE);
