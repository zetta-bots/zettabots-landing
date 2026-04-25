-- Tabela de sessões de conversa (substitui Redis no workflow n8n)
-- TTL controlado via expires_at — bot filtra expiradas no GET
CREATE TABLE IF NOT EXISTS public.sessions (
  key        TEXT PRIMARY KEY,
  value      TEXT        NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions (expires_at);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa (n8n usa a service key)
CREATE POLICY "service_role_sessions_all" ON public.sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
