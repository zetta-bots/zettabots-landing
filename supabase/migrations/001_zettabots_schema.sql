-- ============================================================
-- ZETTABOTS — Migration 001
-- Criado em: 2026-04-23
-- IMPORTANTE: Rodar no Supabase SQL Editor
-- NÃO modificar auth.users — criar tabelas públicas separadas
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. TABELA: public.profiles
-- Extensão de auth.users com dados do negócio Zettabots
-- Criada automaticamente via trigger quando usuário se registra
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plano e cobrança
  plan_type TEXT NOT NULL DEFAULT 'trial'
    CONSTRAINT plan_type_valid CHECK (plan_type IN ('trial', 'start', 'pro', 'enterprise', 'blocked')),
  plan_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- 7 dias de trial padrão
  mercadopago_subscription_id TEXT,
  mercadopago_payer_id TEXT,
  
  -- Instância Evolution API
  instance_name TEXT UNIQUE, -- nome único da instância no Evolution API
  instance_status TEXT DEFAULT 'pending'
    CONSTRAINT instance_status_valid CHECK (instance_status IN ('pending', 'connected', 'disconnected', 'banned')),
  
  -- Controle de acesso
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Dados do cliente
  full_name TEXT,
  company_name TEXT,
  whatsapp_number TEXT,
  
  -- White Label (Enterprise)
  white_label_logo_url TEXT,
  white_label_primary_color TEXT DEFAULT '#7c3aed',
  white_label_company_name TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para buscas frequentes no n8n
CREATE INDEX IF NOT EXISTS idx_profiles_instance_name ON public.profiles(instance_name);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_expires_at ON public.profiles(plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_mp_subscription ON public.profiles(mercadopago_subscription_id);

COMMENT ON TABLE public.profiles IS 'Dados de negócio dos usuários Zettabots. Extensão de auth.users.';


-- ──────────────────────────────────────────────────────────
-- 2. TRIGGER: Auto-criar profile quando usuário se registra
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan_type, plan_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'trial',
    NOW() + INTERVAL '7 days'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ──────────────────────────────────────────────────────────
-- 3. TRIGGER: Atualizar updated_at automaticamente
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ──────────────────────────────────────────────────────────
-- 4. TABELA: public.audit_log
-- Rastreia toda mudança de plano para compliance e debug
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  instance_name TEXT,
  action TEXT NOT NULL, -- 'plan_activated', 'plan_blocked', 'plan_upgraded', 'plan_downgraded', 'trial_expired', 'instance_logout'
  old_value TEXT,
  new_value TEXT,
  triggered_by TEXT DEFAULT 'system', -- 'system', 'webhook_mp', 'admin', 'cron'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

COMMENT ON TABLE public.audit_log IS 'Log imutável de todas as mudanças de plano e ações críticas do sistema.';


-- ──────────────────────────────────────────────────────────
-- 5. TABELA: public.crm_leads
-- Leads extraídos automaticamente pelas conversas do bot
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL, -- qual instância capturou o lead
  
  -- Dados do contato
  phone TEXT NOT NULL, -- número do WhatsApp (identificador único por instância)
  name TEXT,
  email TEXT,
  
  -- Classificação
  interest TEXT, -- produto/serviço de interesse detectado pela IA
  stage TEXT NOT NULL DEFAULT 'lead'
    CONSTRAINT stage_valid CHECK (stage IN ('lead', 'prospect', 'qualified', 'customer', 'no_interest', 'follow_up')),
  sentiment TEXT DEFAULT 'neutral'
    CONSTRAINT sentiment_valid CHECK (sentiment IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  
  -- Controle de follow-up
  last_contact_at TIMESTAMPTZ DEFAULT NOW(),
  follow_up_count INTEGER DEFAULT 0,
  follow_up_max INTEGER DEFAULT 3,
  
  -- Dados extras extraídos pela IA
  ai_notes TEXT, -- anotações automáticas da IA sobre o lead
  tags TEXT[] DEFAULT '{}',
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Um lead é único por instância + telefone
  CONSTRAINT crm_leads_unique_contact UNIQUE (instance_name, phone)
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_instance ON public.crm_leads(instance_name);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON public.crm_leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_last_contact ON public.crm_leads(last_contact_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_phone ON public.crm_leads(phone);

CREATE TRIGGER crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.crm_leads IS 'CRM de leads capturados automaticamente pelas conversas do bot IA.';


-- ──────────────────────────────────────────────────────────
-- 6. TABELA: public.human_takeovers
-- Safety Switch — controla quando um humano assume a conversa
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.human_takeovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  
  -- Quem ativou e por quê
  activated_by TEXT, -- email do operador
  activation_reason TEXT DEFAULT 'manual', -- 'manual', 'auto_sentiment', 'emergency'
  
  -- Timestamps
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Contexto para o operador humano
  last_ai_message TEXT, -- última mensagem que a IA mandou antes do handoff
  operator_notes TEXT
);

-- Index crítico: o n8n consulta isso A CADA mensagem recebida
CREATE INDEX IF NOT EXISTS idx_human_takeovers_lookup 
  ON public.human_takeovers(instance_name, contact_phone, is_active);

COMMENT ON TABLE public.human_takeovers IS 'Safety Switch: registra quando um humano assumiu uma conversa da IA.';


-- ──────────────────────────────────────────────────────────
-- 7. TABELA: public.knowledge_files
-- Metadados dos arquivos enviados para Zetta-Knowledge
-- (os embeddings ficam no PostgreSQL próprio — cloudfy.live)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL,
  
  file_name TEXT NOT NULL,
  file_type TEXT, -- 'pdf', 'txt', 'docx', 'url'
  file_size_bytes INTEGER,
  storage_path TEXT, -- caminho no Supabase Storage
  
  status TEXT DEFAULT 'processing'
    CONSTRAINT knowledge_status_valid CHECK (status IN ('processing', 'active', 'error', 'deleted')),
  
  chunk_count INTEGER DEFAULT 0, -- quantos chunks foram gerados
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT knowledge_files_unique UNIQUE (instance_name, file_name)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_files_instance ON public.knowledge_files(instance_name);

CREATE TRIGGER knowledge_files_updated_at
  BEFORE UPDATE ON public.knowledge_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.knowledge_files IS 'Metadados dos arquivos de treinamento da IA por instância.';


-- ──────────────────────────────────────────────────────────
-- 8. VIEW: admin_overview
-- Painel do dono (Zetta-Admin) com visão consolidada
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.admin_overview AS
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.company_name,
  p.plan_type,
  p.is_active,
  p.instance_name,
  p.instance_status,
  p.plan_expires_at,
  p.mercadopago_subscription_id,
  p.created_at AS member_since,
  -- Métricas de leads
  COUNT(cl.id) AS total_leads,
  COUNT(cl.id) FILTER (WHERE cl.stage = 'customer') AS total_customers,
  MAX(cl.last_contact_at) AS last_bot_activity,
  -- Status de expiração
  CASE 
    WHEN p.plan_expires_at < NOW() THEN 'expired'
    WHEN p.plan_expires_at < NOW() + INTERVAL '3 days' THEN 'expiring_soon'
    ELSE 'ok'
  END AS expiration_status
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN public.crm_leads cl ON cl.instance_name = p.instance_name
GROUP BY p.id, u.email;

COMMENT ON VIEW public.admin_overview IS 'Visão consolidada para o painel Zetta-Admin.';


-- ──────────────────────────────────────────────────────────
-- 9. RLS (Row Level Security)
-- Cada usuário só vê seus próprios dados
-- ──────────────────────────────────────────────────────────

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_takeovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- PROFILES: usuário vê apenas o próprio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- CRM_LEADS: usuário vê apenas leads da sua instância
CREATE POLICY "crm_leads_select_own" ON public.crm_leads
  FOR SELECT USING (
    instance_name IN (
      SELECT instance_name FROM public.profiles WHERE id = auth.uid()
    )
  );

-- HUMAN_TAKEOVERS: usuário vê apenas da sua instância
CREATE POLICY "human_takeovers_select_own" ON public.human_takeovers
  FOR SELECT USING (
    instance_name IN (
      SELECT instance_name FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "human_takeovers_insert_own" ON public.human_takeovers
  FOR INSERT WITH CHECK (
    instance_name IN (
      SELECT instance_name FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "human_takeovers_update_own" ON public.human_takeovers
  FOR UPDATE USING (
    instance_name IN (
      SELECT instance_name FROM public.profiles WHERE id = auth.uid()
    )
  );

-- KNOWLEDGE_FILES: usuário vê apenas os próprios arquivos
CREATE POLICY "knowledge_files_select_own" ON public.knowledge_files
  FOR SELECT USING (
    instance_name IN (
      SELECT instance_name FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "knowledge_files_insert_own" ON public.knowledge_files
  FOR INSERT WITH CHECK (
    instance_name IN (
      SELECT instance_name FROM public.profiles WHERE id = auth.uid()
    )
  );

-- AUDIT_LOG: usuário vê apenas seu próprio log
CREATE POLICY "audit_log_select_own" ON public.audit_log
  FOR SELECT USING (user_id = auth.uid());

-- SERVICE ROLE: o n8n usa service_role key, que bypassa RLS automaticamente
-- Nenhuma política extra necessária para o backend


-- ──────────────────────────────────────────────────────────
-- 10. FUNÇÕES UTILITÁRIAS para o n8n
-- ──────────────────────────────────────────────────────────

-- Função: verificar se instância tem permissão para feature
-- Usar no n8n: SELECT * FROM check_plan_feature('minha-instancia', 'followup')
CREATE OR REPLACE FUNCTION public.check_plan_feature(
  p_instance_name TEXT,
  p_feature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_is_active BOOLEAN;
  v_expires_at TIMESTAMPTZ;
  v_has_access BOOLEAN := FALSE;
BEGIN
  SELECT plan_type, is_active, plan_expires_at
  INTO v_plan, v_is_active, v_expires_at
  FROM public.profiles
  WHERE instance_name = p_instance_name;
  
  -- Usuário não encontrado
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'instance_not_found');
  END IF;
  
  -- Plano bloqueado ou inativo
  IF NOT v_is_active OR v_plan = 'blocked' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'account_blocked', 'plan', v_plan);
  END IF;
  
  -- Trial expirado
  IF v_plan = 'trial' AND v_expires_at < NOW() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'trial_expired');
  END IF;
  
  -- Matriz de features por plano
  v_has_access := CASE p_feature
    WHEN 'basic_ai'       THEN v_plan IN ('start', 'pro', 'enterprise', 'trial')
    WHEN 'router_ai'      THEN v_plan IN ('pro', 'enterprise')
    WHEN 'knowledge'      THEN v_plan IN ('start', 'pro', 'enterprise', 'trial')
    WHEN 'crm'            THEN v_plan IN ('start', 'pro', 'enterprise')
    WHEN 'sentiment'      THEN v_plan IN ('pro', 'enterprise')
    WHEN 'transbordo'     THEN v_plan IN ('pro', 'enterprise')
    WHEN 'followup'       THEN v_plan IN ('enterprise')
    WHEN 'report'         THEN v_plan IN ('pro', 'enterprise')
    WHEN 'white_label'    THEN v_plan IN ('enterprise')
    WHEN 'multi_instance' THEN v_plan IN ('enterprise')
    ELSE FALSE
  END;
  
  RETURN jsonb_build_object(
    'allowed', v_has_access,
    'plan', v_plan,
    'expires_at', v_expires_at,
    'reason', CASE WHEN v_has_access THEN 'ok' ELSE 'plan_insufficient' END
  );
END;
$$;

COMMENT ON FUNCTION public.check_plan_feature IS 'Verificar se instância tem acesso a uma feature. Usar no nó n8n antes de cada recurso premium.';


-- ──────────────────────────────────────────────────────────
-- FIM DA MIGRATION 001
-- Próximo passo: Migration 002 — Configuração Mercado Pago
-- ──────────────────────────────────────────────────────────
