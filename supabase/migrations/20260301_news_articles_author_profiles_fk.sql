-- ============================================================
-- Migration: FK from news_articles.author_id → profiles.id
-- Date: 2026-03-01
-- Description: Adds a second FK so PostgREST can resolve the
--              join news_articles → profiles (for author name).
-- ============================================================

ALTER TABLE public.news_articles
  ADD CONSTRAINT news_articles_author_id_profiles_fk
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
