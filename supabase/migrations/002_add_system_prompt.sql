-- ============================================================
-- ZETTABOTS — Migration 002
-- Adiciona system_prompt ao profiles para personalização do bot
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT '';

COMMENT ON COLUMN public.profiles.system_prompt IS
  'Prompt personalizado do cliente. Vazio = usar persona padrão Zettabots.';
