-- ============================================================
-- Migration: Add image_url column & create article-images bucket
-- Date: 2026-02-27
-- Description: Adds an image_url column to news_articles and
--              sets up a public Supabase Storage bucket for images.
-- ============================================================

-- ─── Add image_url column ────────────────────────────────────
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ─── Storage bucket ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload images
CREATE POLICY "Authenticated users can upload article images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'article-images'
    AND auth.role() = 'authenticated'
  );

-- Anyone can view article images (public bucket)
CREATE POLICY "Anyone can view article images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');
