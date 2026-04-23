-- ============================================================
-- ZETTABOTS — Migration 003
-- Adiciona email ao profiles para rastreamento de contatos
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

COMMENT ON COLUMN public.profiles.email IS
  'Email do usuário - sincronizado com auth.users.email';
