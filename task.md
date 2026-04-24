# 🗂 Painel de Tasks — Zettabots.ia.br

> **Última atualização:** 2026-04-24  
> **Legenda:** `[x]` Concluído · `[/]` Em andamento · `[ ]` Pendente · `[~]` Adiado/Fora do escopo

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

## 💳 Sprint 1 — Motor Financeiro (Supabase + Billing)

> **Objetivo:** Cobrança e controle de planos funcionando.

### 1.1 — Schema Supabase
| # | Status | Task |
|---|---|---|
| S1-01 | `[x]` | Verificar tabela `users` existente no Supabase — é `auth.users` (interno) |
| S1-02 | `[x]` | Criar `public.profiles` com `plan_type` (start/pro/enterprise/trial/blocked) |
| S1-03 | `[x]` | Adicionar `plan_expires_at` + trial de 7 dias automático |
| S1-04 | `[x]` | Adicionar `mercadopago_subscription_id` + `mercadopago_payer_id` |
| S1-05 | `[x]` | Adicionar `instance_name` UNIQUE (link com Evolution API) |
| S1-06 | `[x]` | Adicionar `is_active` (BOOLEAN, default true) |
| S1-07 | `[x]` | Criar tabela `audit_log` |
| S1-08 | `[x]` | Criar tabela `crm_leads` |
| S1-09 | `[x]` | Criar tabela `human_takeovers` |
| S1-10 | `[x]` | Configurar RLS no Supabase |
| S1-10b | `[x]` | Criar trigger `on_auth_user_created` |
| S1-10c | `[x]` | Criar função `check_plan_feature()` |
| S1-10d | `[x]` | Criar view `admin_overview` |
| S1-10e | `[x]` | Migration rodada no Supabase SQL Editor ✅ |
| S1-10f | `[x]` | Migration 003 — adicionar coluna `email` em `profiles` ✅ |

### 1.2 — Mercado Pago (Planos)
| # | Status | Task |
|---|---|---|
| S1-11 | `[ ]` | Criar plano **Start** no MP — R$ 127/mês — salvar ID no `.env` |
| S1-12 | `[ ]` | Criar plano **Pro** no MP — R$ 247/mês — salvar ID no `.env` |
| S1-13 | `[ ]` | Criar plano **Enterprise** no MP — R$ 997/mês — salvar ID no `.env` |
| S1-14 | `[ ]` | Configurar URL de webhook do MP apontando para n8n |
| S1-15 | `[ ]` | Testar checkout de assinatura ponta-a-ponta (sandbox) |

### 1.3 — Webhook Financeiro n8n
| # | Status | Task |
|---|---|---|
| S1-16 | `[ ]` | Criar workflow `zetta-billing-webhook` no n8n |
| S1-17 | `[ ]` | Nó: receber POST do Mercado Pago |
| S1-18 | `[ ]` | Nó: extrair user_id, plan_id, status do payload |
| S1-19 | `[ ]` | Nó IF: status = `authorized` → ativar plano no Supabase |
| S1-20 | `[ ]` | Nó IF: status = `cancelled/expired` → bloquear + logout Evolution |
| S1-21 | `[ ]` | Nó: inserir em `audit_log` a cada mudança de plano |
| S1-22 | `[ ]` | Testar webhook com payload real do Mercado Pago |

### 1.4 — Kill Switch Diário
| # | Status | Task |
|---|---|---|
| S1-23 | `[ ]` | Criar Cron Job n8n — dispara às 00:00 todo dia |
| S1-24 | `[ ]` | Query: buscar usuários com `plan_expires_at < NOW()` e `is_active=true` |
| S1-25 | `[ ]` | Loop: para cada expirado → logout instância Evolution API |
| S1-26 | `[ ]` | Loop: atualizar `is_active=false`, `plan_type='blocked'` no Supabase |
| S1-27 | `[ ]` | Enviar mensagem de aviso ao cliente via bot Zettabots |
| S1-28 | `[ ]` | Testar simulando expiração manual de um plano |

---

## 🤖 Sprint 1.5 — Fluxo de Cadastro → Acesso ao Painel (NOVO — PRIORIDADE ALTA)

> **Objetivo:** Cliente que se cadastra no site consegue logar no painel e escanear o QR.  
> **Status atual:** Email ✅ · Onboarding WhatsApp ✅ · Login no painel ✅ · QR no painel 🔧

| # | Status | Task | Observação |
|---|---|---|---|
| F-01 | `[x]` | subscribe.js cria usuário em Supabase Auth + profile | Funcionando ✅ |
| F-02 | `[x]` | Workflow `zetta-welcome` envia email de boas-vindas | Email chegando ✅ |
| F-03 | `[x]` | Workflow `zetta-onboarding` cria instância Evolution + envia mensagem WhatsApp | QR removido do WA — cliente usa painel ✅ |
| F-04 | `[x]` | Onboarding: criar registro em `instances` após criar instância Evolution | Nó "Criar Registro Instances" adicionado — upsert por `instance_name` ✅ |
| F-05 | `[x]` | Onboarding: enviar WhatsApp com link do painel + instrução de login | 1 mensagem limpa com link + número ✅ |
| F-06 | `[x]` | Email de boas-vindas: botão CTA "Acessar meu Painel →" + layout dark | zetta-welcome.json atualizado ✅ |
| F-07 | `[x]` | Aba "Conexão" no dashboard: QR com timer 40s, auto-refresh, estados corretos | Dashboard.jsx + get-qr.js corrigidos ✅ |
| F-08 | `[ ]` | Testar fluxo completo: cadastro → email → login → QR no painel → bot conectado | Validação end-to-end — reimportar JSONs no n8n primeiro |

---

## 🤖 Sprint 2 — Workflow Mestre + Motor de IA

| # | Status | Task |
|---|---|---|
| S2-01 | `[x]` | Workflow base existe (`bot-por-cliente-ULTIMATE.json`) |
| S2-02 | `[ ]` | Migrar lógica para novo workflow `zetta-bot-master` |
| S2-03 | `[ ]` | Nó 1: Receber mensagem via Evolution API webhook |
| S2-04 | `[ ]` | Nó 2: Buscar sessão no Redis (cache 30 min) |
| S2-05 | `[ ]` | Nó 3: Se não tem sessão → buscar usuário no Supabase |
| S2-06 | `[ ]` | Nó 4: IF `is_active = false` → responder "Serviço suspenso" e STOP |
| S2-07 | `[ ]` | Nó 5: Switch por `plan_type` (start / pro / enterprise) |
| S2-08 | `[ ]` | Nó 6: Checar Safety Switch → se sim, STOP |
| S2-09 | `[ ]` | Nó 7: Salvar sessão atualizada no Redis (TTL 1800s) |
| S2-10 | `[ ]` | Nó 8: Humanização (delay + "digitando" via Evolution API) |
| S2-11 | `[ ]` | Nó 9: Enviar resposta via Evolution API |
| S2-12 | `[ ]` | Nó 10: Extração CRM assíncrona (Gemini analisa conversa) |
| S2-13 | `[x]` | Gemini integrado no workflow atual |
| S2-14 | `[ ]` | Conectar ao branch `start` do Switch do workflow mestre |
| S2-17 | `[x]` | Groq integrado (com null-pointer — a corrigir) |
| S2-18 | `[ ]` | Corrigir null-pointer Groq — wrapper try/catch + filtrar mensagens nulas |
| S2-19 | `[ ]` | Lógica do roteador: Groq (rápido) → Gemini (complexo) |
| S2-20 | `[ ]` | Fallback: se Groq falhar → Gemini automaticamente |

---

## ⭐ Sprint 3 — Diferenciais Premium

| # | Status | Task |
|---|---|---|
| S3-01 | `[ ]` | Safety Switch — tabela + nó no workflow mestre |
| S3-08 | `[ ]` | Análise de sentimento + transbordo automático |
| S3-12 | `[/]` | Humanização — delay básico existe, falta calcular por tamanho |
| S3-13 | `[ ]` | Delay proporcional ao tamanho da resposta (45 palavras/min) |
| S3-17 | `[ ]` | Follow-up ativo (Enterprise) — workflow `zetta-followup` |
| S3-23 | `[ ]` | Zetta-Report — relatório semanal via WhatsApp |
| S3-26 | `[~]` | Zetta-Warm-up — **REMOVIDO DO ESCOPO** |

---

## 🖥 Sprint 4 — Frontend: Dashboard Profissional

| # | Status | Task |
|---|---|---|
| S4-01 | `[ ]` | Quebrar Dashboard.jsx (33KB) em módulos |
| S4-02 | `[ ]` | Criar FeedIAPanel.jsx |
| S4-03 | `[ ]` | Criar EmergencyPanel.jsx |
| S4-04 | `[ ]` | Criar ROIPanel.jsx |
| S4-05 | `[ ]` | Criar CRMPanel.jsx |
| S4-06 | `[ ]` | Criar SettingsPanel.jsx |
| S4-08 | `[ ]` | Mostrar limite de arquivos por plano |
| S4-09 | `[ ]` | Upload de arquivos com barra de progresso |
| S4-13 | `[ ]` | Monitor de conversas em tempo real |
| S4-15 | `[ ]` | Botão "Assumir Conversa" (Safety Switch) |
| S4-17 | `[ ]` | Botão de Emergência Global |
| S4-19 | `[ ]` | Instalar Chart.js ou Recharts |
| S4-20 | `[ ]` | Gráfico: total de leads capturados |
| S4-21 | `[ ]` | Gráfico: taxa de conversão |

---

## 🌐 Sprint 5 — Vitrine Zettabots

| # | Status | Task |
|---|---|---|
| S5-01 | `[ ]` | Criar instância Evolution: `zettabots-vendas` |
| S5-02 | `[ ]` | Criar workflow `zetta-bot-vendas` |
| S5-06 | `[ ]` | Criar página `/demo` |

---

## 👑 Sprint 6 — Zetta-Admin (Painel do Dono)

| # | Status | Task |
|---|---|---|
| S6-01 | `[ ]` | Rota `/admin` protegida |
| S6-02 | `[ ]` | View SQL `admin_overview` |
| S6-03 | `[ ]` | Tabela de clientes com plano + status + expiração |
| S6-06 | `[ ]` | Card MRR em tempo real |
| S6-09 | `[ ]` | Alerta: clientes prestes a expirar |

---

## 📊 Progresso Geral

| Sprint | Descrição | Concluídas | Total | % |
|---|---|---|---|---|
| Infraestrutura | Base | 6 | 9 | 67% |
| Sprint 1 | Billing | 15 | 32 | 47% |
| Sprint 1.5 | Cadastro → Painel | 3 | 8 | 38% |
| Sprint 2 | Motor IA | 3 | 14 | 21% |
| Sprint 3 | Premium | 1 | 10 | 10% |
| Sprint 4 | Frontend | 0 | 14 | 0% |
| Sprint 5 | Vitrine | 0 | 3 | 0% |
| Sprint 6 | Admin | 0 | 5 | 0% |

---

## ⚡ Próxima Ação Imediata

> **F-04** — Adicionar nó no `zetta-onboarding.json` que cria registro na tabela `instances` após criar a instância Evolution.  
> Sem isso, o cliente que se cadastra no site não consegue fazer login no painel.
>
> Campos necessários em `instances`: `phone`, `instance_name`, `status='trial'`, `name`, `email`
