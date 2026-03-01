-- ============================================================
-- Migration: Add contact_messages table
-- Date: 2026-03-01
-- Description: Stores messages from the "Contact Us" form.
--   - Anyone can INSERT (including unauthenticated users).
--   - Only admins can SELECT, UPDATE, or DELETE.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (no auth required)
CREATE POLICY contact_messages_insert_anon ON public.contact_messages
  FOR INSERT
  WITH CHECK (TRUE);

-- Only admins can read messages
CREATE POLICY contact_messages_select_admin ON public.contact_messages
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Only admins can update messages
CREATE POLICY contact_messages_update_admin ON public.contact_messages
  FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Only admins can delete messages
CREATE POLICY contact_messages_delete_admin ON public.contact_messages
  FOR DELETE
  USING (public.get_my_role() = 'admin');
