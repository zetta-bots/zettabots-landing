-- Adiciona coluna ai_paused à tabela instances
-- Permite pausar o bot por instância via dashboard (Safety Switch)
ALTER TABLE instances ADD COLUMN IF NOT EXISTS ai_paused BOOLEAN DEFAULT FALSE;
