# 🗂 Painel de Tasks — Zettabots.ia.br

> **Última atualização:** 2026-04-25  
> **Legenda:** `[x]` Concluído · `[/]` Em andamento · `[ ]` Pendente · `[~]` Adiado/Fora do escopo

---

## 🐛 Bugs Ativos (resolver antes de avançar)

| # | Status | Bug | Detalhe |
|---|---|---|---|
| B-01 | `[x]` | Dashboard: "Bem-vindo, zb4d0297b460b6" em vez do nome do negócio | Causa raiz: Login.jsx não salvava `name` no localStorage. Fix: Login.jsx + auth-verify.js + Dashboard.jsx ✅ |
| B-02 | `[x]` | Remover logs 🔍 de debug do auth-verify.js | Removido junto com o fix de B-01 ✅ |

---

## 🔧 Infraestrutura Base

| # | Status | Task | Observação |
|---|---|---|---|
| I-1 | `[x]` | Deploy Vercel ativo | zettabots.ia.br → Ready, SSL ativo |
| I-2 | `[x]` | Supabase configurado | URL + keys no `.env` |
| I-3 | `[x]` | Evolution API configurada | Manager ativo, API Key OK |
| I-4 | `[x]` | n8n online | seriousokapi-n8n.cloudfy.live |
| I-5 | `[x]` | Mercado Pago token configurado | No `.env` |
| I-6 | `[ ]` | Redis integrado ao n8n | Cache de sessões — cloudfy.live:6387 |
| I-7 | `[ ]` | PostgreSQL + pgvector habilitado | cloudfy.live:8814 — para embeddings |
| I-8 | `[ ]` | Chatwoot configurado | 1º login + criar inbox WhatsApp |
| I-9 | `[x]` | Domínio zettabots.ia.br com SSL | Vercel — Confirmado ✅ |

---

## 💳 Sprint 1 — Motor Financeiro

> **Objetivo:** Cobrança e controle de planos funcionando.

### 1.1 — Schema Supabase
| # | Status | Task |
|---|---|---|
| S1-01 | `[x]` | Verificar tabela `users` existente no Supabase |
| S1-02 | `[x]` | Criar `public.profiles` com `plan_type` |
| S1-03 | `[x]` | Adicionar `plan_expires_at` + trial 7 dias automático |
| S1-04 | `[x]` | Adicionar `mercadopago_subscription_id` + `mercadopago_payer_id` |
| S1-05 | `[x]` | Adicionar `instance_name` UNIQUE |
| S1-06 | `[x]` | Adicionar `is_active` (BOOLEAN, default true) |
| S1-07 | `[x]` | Criar tabela `audit_log` |
| S1-08 | `[x]` | Criar tabela `crm_leads` |
| S1-09 | `[x]` | Criar tabela `human_takeovers` |
| S1-10 | `[x]` | Configurar RLS no Supabase |
| S1-10b | `[x]` | Trigger `on_auth_user_created` |
| S1-10c | `[x]` | Função `check_plan_feature()` |
| S1-10d | `[x]` | View `admin_overview` |
| S1-10e | `[x]` | Migration 001 rodada ✅ |
| S1-10f | `[x]` | Migration 003 — coluna `email` em `profiles` ✅ |

### 1.2 — Mercado Pago (Planos)
| # | Status | Task | Observação |
|---|---|---|---|
| S1-11 | `[x]` | Criar plano **Start** R$ 127/mês | ID: `9b8bd701cb91458c9ee44d5de078ac22` |
| S1-12 | `[x]` | Criar plano **Pro** R$ 247/mês | ID: `0b5aaeae72934debb68b11c8d525a3f1` |
| S1-13 | `[x]` | Criar plano **Enterprise** R$ 997/mês | ID: `774fa8b6775245dfb8301942ca7fbd8a` |
| S1-14 | `[x]` | Configurar URL webhook MP → `https://zettabots.ia.br/api/webhook-billing` | Modo produção + Pagamentos + Planos e assinaturas ✅ |
| S1-15 | `[x]` | Testar checkout ponta-a-ponta (sandbox) | Simulação MP → 200 OK ✅ |

### 1.3 — Webhook Financeiro (implementado em Vercel, não n8n)
| # | Status | Task |
|---|---|---|
| S1-16 | `[x]` | `api/webhook-billing.js` — handler completo no Vercel | Subscription, pagamento, PIX ✅ |
| S1-17 | `[x]` | Receber POST do Mercado Pago + validar assinatura HMAC | ✅ |
| S1-18 | `[x]` | Extrair user_id (por e-mail ou subscription_id) + plan_id + status | ✅ |
| S1-19 | `[x]` | `subscription_authorized_payment` → ativar plan_type + plan_expires_at | ✅ |
| S1-20 | `[x]` | `subscription_preapproval cancelled` → bloquear + logout Evolution | ✅ |
| S1-21 | `[x]` | audit_log em todos os eventos de billing | ✅ |
| S1-21b | `[x]` | `api/create-subscription.js` — cria assinatura recorrente (preapproval) | ✅ |
| S1-22 | `[x]` | Testar webhook com payload real do MP | Simulação MP → 200 OK ✅ |

### 1.4 — Kill Switch Diário
| # | Status | Task |
|---|---|---|
| S1-23 | `[x]` | Cron 03:00 UTC (meia-noite BRT) no n8n | `n8n/zetta-kill-switch.json` ✅ |
| S1-24 | `[x]` | Query: `plan_expires_at < NOW()` e `is_active=true` | ✅ |
| S1-25 | `[x]` | Loop: logout instância Evolution p/ cada expirado | ✅ |
| S1-26 | `[x]` | Loop: `is_active=false`, `plan_type='blocked'` no Supabase | ✅ |
| S1-27 | `[x]` | Enviar mensagem de aviso ao cliente via WhatsApp | ✅ |
| S1-28 | `[x]` | Importar kill-switch no n8n + ativar workflow | ✅ |

---

## 🚀 Sprint 1.5 — Fluxo Cadastro → Painel (Onboarding)

> **Status:** Email ✅ · WA ✅ · Login ✅ · QR ✅ · Nome no header ✅

| # | Status | Task | Observação |
|---|---|---|---|
| F-01 | `[x]` | subscribe.js cria usuário Supabase Auth + profile | ✅ |
| F-02 | `[x]` | `zetta-welcome` envia email de boas-vindas | Email chegando ✅ |
| F-03 | `[x]` | `zetta-onboarding` cria instância Evolution + WA | QR removido do WA ✅ |
| F-04 | `[x]` | Onboarding cria registro na tabela `instances` | Upsert por `instance_name` ✅ |
| F-05 | `[x]` | WA: 1 mensagem limpa com link do painel + número | ✅ |
| F-06 | `[x]` | Email: botão CTA "Acessar meu Painel →" + layout dark | ✅ |
| F-07 | `[x]` | Aba Conexão: QR com timer 40s, auto-refresh, estados | ✅ |
| F-08 | `[ ]` | Teste end-to-end completo: cadastro → email → login → QR → bot | Fazer após S1-14 |

---

## 🤖 Sprint 2 — Workflow Mestre + Motor de IA

| # | Status | Task |
|---|---|---|
| S2-01 | `[x]` | Workflow base existe (`bot-por-cliente-ULTIMATE.json`) |
| S2-02 | `[x]` | `zetta-bot-master-v3.json` — workflow mestre atualizado | ✅ |
| S2-03 | `[x]` | Receber mensagem via Evolution webhook | Filtro anti-loop incluído ✅ |
| S2-04 | `[x]` | Buscar sessão no Redis (cache 30 min TTL=1800s) | ✅ |
| S2-05 | `[x]` | Se não tem sessão → buscar perfil no Supabase | profiles + instances ✅ |
| S2-06 | `[x]` | IF `is_active=false` → "Serviço suspenso" + STOP | ✅ |
| S2-07 | `[ ]` | Switch por `plan_type` (limitar features por plano) | Próximo passo |
| S2-08 | `[ ]` | Checar Safety Switch | Sprint 3 |
| S2-09 | `[x]` | Salvar sessão no Redis (TTL 1800s, últimas 20 msgs) | ✅ |
| S2-10 | `[x]` | Humanização: typing indicator + delay proporcional ao tamanho | `options.presence=composing` + delay 40ms/char ✅ |
| S2-11 | `[x]` | Enviar resposta via Evolution | ✅ |
| S2-12 | `[ ]` | Extração CRM assíncrona (Gemini) | Sprint 3 |
| S2-13 | `[x]` | Groq llama-3.3-70b integrado | ✅ |
| S2-17 | `[x]` | Whisper Groq para transcrição de áudio | ✅ |
| S2-18 | `[x]` | Fix null-pointer Groq (retorna [] se vazio) | ✅ |
| S2-18b | `[x]` | Fix critical: system_prompt buscado de `instances` (não `profiles`) | Era bug — prompt customizado nunca chegava na IA ✅ |
| S2-19 | `[ ]` | Roteador: Groq (rápido) → Gemini (complexo) | Pós-validação |
| S2-20 | `[ ]` | Fallback: Groq falha → Gemini automático | Pós-validação |

---

## ⭐ Sprint 3 — Diferenciais Premium

| # | Status | Task |
|---|---|---|
| S3-01 | `[x]` | Safety Switch — tabela + nó no workflow | ai_paused silencioso ✅ |
| S3-08 | `[ ]` | Análise de sentimento + transbordo automático | |
| S3-12 | `[x]` | Humanização — delay básico existe | ✅ |
| S3-13 | `[ ]` | Delay proporcional ao tamanho da resposta | |
| S3-17 | `[ ]` | Follow-up ativo (Enterprise) | |
| S3-23 | `[ ]` | Relatório semanal via WhatsApp | |
| S3-26 | `[~]` | Zetta-Warm-up — REMOVIDO DO ESCOPO | |

---

## 🖥 Sprint 4 — Dashboard Profissional

| # | Status | Task |
|---|---|---|
| S4-01 | `[x]` | Dashboard modularizado em `/components/dashboard/` |
| S4-02 | `[x]` | FeedIAPanel.jsx (UI e lógica de limites) |
| S4-03 | `[x]` | Backend: Endpoint para processamento de arquivos (n8n) |
| S4-04 | `[x]` | Notificação de "Treinamento Concluído" |
| S4-05 | `[x]` | Integração Recharts no Status |
| S4-06 | `[x]` | Gráfico de Atividade (Mensagens) |
| S4-07 | `[x]` | Gráfico de Leads Capturados |
| S4-08 | `[x]` | Limite de arquivos por plano (UI) |
| S4-09 | `[x]` | Upload de arquivos com progresso (Real via Supabase) |
| S4-13 | `[x]` | Monitor de conversas em tempo real |
| S4-15 | `[x]` | Botão "Assumir Conversa" (Safety Switch) |
| S4-17 | `[x]` | Botão de Emergência Global (Kill Switch) |

---

## 🌐 Sprint 5 — Vitrine / Bot de Vendas

| # | Status | Task |
|---|---|---|
| S5-01 | `[ ]` | Instância Evolution: `zettabots-vendas` | |
| S5-02 | `[ ]` | Workflow `zetta-bot-vendas` | |
| S5-06 | `[ ]` | Página `/demo` | |

---

## 👑 Sprint 6 — Zetta-Admin

| # | Status | Task |
|---|---|---|
| S6-01 | `[x]` | Rota `/admin` protegida | Integrada na aba do Dashboard ✅ |
| S6-02 | `[x]` | View SQL `admin_overview` | ✅ |
| S6-03 | `[x]` | Tabela de clientes com plano + status | ✅ |
| S6-06 | `[x]` | Card MRR em tempo real | ✅ |
| S6-09 | `[x]` | Alerta: clientes prestes a expirar | ✅ |

---

## 📊 Progresso Geral

| Sprint | Descrição | Concluídas | Total | % |
|---|---|---|---|---|
| Bugs | Bugs ativos | 2 | 2 | 100% |
| Infra | Base | 6 | 9 | 67% |
| Sprint 1 | Billing | 32 | 32 | 100% |
| Sprint 1.5 | Onboarding | 8 | 8 | 100% |
| Sprint 2 | Motor IA | 13 | 18 | 72% |
| Sprint 3 | Premium | 2 | 7 | 28% |
| Sprint 4 | Dashboard | 14 | 14 | 100% |
| Sprint 5 | Vitrine | 0 | 3 | 0% |
| Sprint 6 | Admin | 5 | 5 | 100% |

---

## ⚡ Próxima Ação
**Gestão**  
- [x] Painel Admin Avançado (Zetta-Admin)
    - [x] Filtros e Busca de clientes
    - [x] Botões de Sobrescrita Manual (Pausar/Play/Presentear)
    - [x] UX Sênior: Optimistic UI e Normalização de Dados (case-insensitive)
- [x] Automação de Faturamento (SaaS Sênior)
    - [x] Motor de Cron Job para Bloqueio Automático (`api/billing-cron.js`) + agendado no `vercel.json` (03:00 UTC)
    - [ ] Webhook de Integração Mercado Pago (Auto-liberação)
- [ ] Log de Atividades do Sistema (Audit Log)
