-- ============================================================
-- Migration: Initial Schema
-- Date: 2026-02-27
-- Description: Creates profiles, user_roles, categories,
--              news_articles, and comments tables.
-- NOTE: No RLS or policies — those belong in a separate migration.
-- ============================================================

-- ─── PROFILES ────────────────────────────────────────────────
-- Mirrors auth.users for public-facing profile data.
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USER ROLES ──────────────────────────────────────────────
-- Maps each user to a role. Four possible roles:
--   admin | user | author | editor
CREATE TABLE IF NOT EXISTS public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL DEFAULT 'user'
            CHECK (role IN ('admin', 'user', 'author', 'editor')),
  UNIQUE (user_id)
);

-- ─── CATEGORIES ──────────────────────────────────────────────
-- Grouping / structuring news articles by sport.
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default categories
INSERT INTO public.categories (name) VALUES
  ('Football'),
  ('Motor Sports'),
  ('Tennis'),
  ('Basketball'),
  ('Volleyball'),
  ('Winter Sports'),
  ('Athletics')
ON CONFLICT (name) DO NOTHING;

-- ─── NEWS ARTICLES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news_articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COMMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_news_articles_author_id   ON public.news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_category_id ON public.news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_published   ON public.news_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at  ON public.news_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_article_id       ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id          ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id        ON public.user_roles(user_id);

-- ─── AUTO-UPDATE updated_at TRIGGER ──────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
