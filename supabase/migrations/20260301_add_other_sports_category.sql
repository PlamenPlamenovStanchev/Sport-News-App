-- ============================================================
-- Migration: Add "Other Sports" category
-- Date: 2026-03-01
-- Description: Adds a catch-all category for articles that
--              don't fit an existing sport category.
-- ============================================================

INSERT INTO public.categories (name)
VALUES ('Other Sports')
ON CONFLICT (name) DO NOTHING;
