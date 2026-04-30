# 🧠 Handover Técnico & Master Task List - ZettaBots SaaS (29/04/2026)

Este documento é a bússola do projeto. Ele contém o estado atual, as credenciais e o roadmap de evolução.

## 📍 Estado Atual: PRODUÇÃO + FEATURES NOVAS
O sistema está em produção. Hoje implementamos **Zetta-Cost (4.2)** e **Transbordo Inteligente (2.3)**.

---

## 🔑 Credenciais de Produção (Cloudfy/Supabase)
- **Evolution API:** `https://seriousokapi-evolution.cloudfy.live`
- **Supabase:** `https://ugtsqlhkyrjmmopakyho.supabase.co`
- **OpenRouter:** (Stored in env vars)
- **Mercado Pago:** (Stored in env vars)

---

## 🎯 O QUE FOI FEITO HOJE (29/04/2026)

### 1. ✅ Zetta-Cost (4.2) — Monitor de Consumo de Tokens
**Status:** COMPLETO E TESTADO ✅

**O que foi implementado:**
- Criada tabela `token_logs` no Supabase com SQL (prompt_tokens, completion_tokens, total_tokens, cost_usd)
- n8n: modificado "Filtro de Resposta" para passar `usage` adiante
- n8n: adicionado node "Log de Tokens" que calcula custo e insere no Supabase
- Dashboard: criado `ZettaCostPanel.jsx` com stats e gráfico de custos
- Sidebar: adicionada aba "Custos IA 💸"
- Preço Gemini 2.5 Flash: $0.15/1M input, $0.60/1M output
- **Commits:** `700cbe2` (Dashboard), `9e7be57` (Push)

**Como funciona:**
1. Cliente envia mensagem via WhatsApp
2. OpenRouter retorna tokens usados
3. Node "Log de Tokens" calcula custo e salva em Supabase
4. Dashboard "Custos IA" mostra stats em tempo real

**Verificação:**
- ✅ Tabela `token_logs` recebendo dados corretos
- ✅ Custo sendo calculado (e.g., 111 prompt + 87 completion = $0.000069)

---

### 2. ✅ Transbordo Inteligente (2.3) — Smart Handoff para Humano
**Status:** COMPLETO E TESTADO ✅ (30/04/2026)

**O que foi implementado:**
- n8n: novo node "Detector de Transbordo" com detecção dupla (palavras-chave + IA)
- **Detecção:**
  - Cliente: "atendente", "gerente", "reclamação", "cancelar", "reembolso", "supervisor"
  - IA: "vou transferir", "encaminhar para", "humano irá", "atendente irá", "nossa equipe irá"
- **Ação ao acionar:**
  - ✅ Pausa bot: `instances.ai_paused = true`
  - ✅ Envia mensagem para cliente: "Aguarde, um atendente irá te ajudar em breve! 👋"
  - ✅ Insere em `human_takeovers` com timestamp e dados da conversa
- **Dashboard:**
  - ✅ Badge 🔴 ESPERA em conversas pausadas (ChatMonitorPanel)
  - ✅ Botão mostra "🤖 IA ATIVA" ou "🚫 IA PAUSADA" com sincronização em tempo real
  - ✅ Admin consegue despausar clicando no botão
  - ✅ Polling de 5s atualiza o status automaticamente
- **Commits:** `4170a87`, `333d917`, `9231d9d`

**Verificação (30/04):**
- ✅ Detector detecta palavras-chave corretamente
- ✅ `instances.ai_paused` é setado para true no Supabase
- ✅ `human_takeovers` é preenchido com dados do handoff
- ✅ Dashboard mostra badge e botão corretos
- ✅ Botão "IA PAUSADA" consegue despausar (volta para "IA ATIVA")
- ✅ Polling sincroniza estado em tempo real

**Fluxo Completo (testado):**
1. Cliente manda: "quero falar com um atendente"
2. Detector identifica palavra-chave
3. Bot pausa (`ai_paused = true`)
4. Cliente recebe: "Aguarde, um atendente irá te ajudar em breve! 👋"
5. Dashboard mostra badge 🔴 ESPERA + botão "IA PAUSADA"
6. Admin clica botão → bot retoma (`ai_paused = false`)
7. Dashboard atualiza automaticamente

**PENDENTE - PRÓXIMO PASSO:**
- ⚠️ **Cliente (quem contratou o bot) precisa saber que o bot pausou**
  - Atualmente: apenas o admin (dono) sabe pelo Dashboard
  - Solução: notificar cliente que atendente está a caminho (WhatsApp/Email/In-app)

---

## 📋 Master Task List (Atualizado)

### Fase 1: Inteligência Híbrida e Memória (O Cérebro)
- [x] **1.1 Integração OpenRouter:** Chave master e créditos iniciais.
- [x] **1.2 Roteador Zetta-Brain:** Lógica Groq (Texto) vs. Gemini (Arquivos/Mídia).
- [x] **1.3 Gestão de Contexto:** Nó de Window Buffer Memory no n8n funcional.
- [x] **1.4 Zetta-Knowledge (RAG):** Já implementada no Dashboard (upload de PDFs)

### Fase 2: Diferenciais Premium e Agendamento
- [x] **2.1 Safety Switch:** Lógica de pausa do bot via Supabase.
- [ ] **2.2 Zetta-Scheduler:** Agendamento via IA integrado ao Google Calendar.
- [x] **2.3 Transbordo Inteligente:** ✅ IMPLEMENTADO (teste pendente de sincronização Dashboard)
- [ ] **2.4 Recuperação Ativa:** Follow-up automático de 24h.

### Fase 3: Experiência do Cliente e UX (Painel)
- [ ] **3.1 Onboarding Guiado:** Tutorial interativo (Intro.js).
- [x] **3.2 Dashboard de ROI:** ✅ Implementado
- [x] **3.3 Módulo de Treinamento:** ✅ Já está no Dashboard (AIConfigPanel com upload)

### Fase 4: Automação Financeira e Provisão (O Motor do SaaS)
- [x] **4.1 Webhook de Provisão Automática:** ✅ Implementado no onboarding
- [x] **4.2 Zetta-Cost (Monitor de Custos):** ✅ COMPLETO
- [x] **4.3 Checkout Mercado Pago:** ✅ Integrado

### Fase 5: Marketing, Vitrine e Escala
- [ ] **5.1 Vitrine Live Zettabots:** Bot vendedor oficial no site.
- [ ] **Health Check:** Sinalizador de saúde.

---

## 🐛 Issues Conhecidos (29/04)

### 1. Dashboard Transbordo — Cache não sincroniza
**Descrição:** Após acionamento de Transbordo, `instances.ai_paused = true` no Supabase mas Dashboard mostra "IA ATIVA"
**Causa provável:** React state `isAIPaused` carregado uma única vez, sem polling
**Solução:**
- Opção A (rápida): Adicionar polling a cada 3-5s para sincronizar `instances.ai_paused`
- Opção B (ideal): Usar Supabase Realtime (websocket) para atualizar em tempo real
**Impacto:** Medium (funcionalidade funciona, é só visual)

---

## 📊 Commits de Hoje

| Hash | Mensagem | Status |
|------|----------|--------|
| 700cbe2 | feat: implement Zetta-Cost (4.2) | ✅ Merged |
| 9e7be57 | feat: implement Transbordo Inteligente (2.3) | ✅ Merged |

---

## 🚀 Próximas Prioridades

1. **HOJE:** 
   - [ ] Resolver sincronização Dashboard Transbordo (polling ou realtime)
   - [ ] Testar Transbordo end-to-end completo

2. **PRÓXIMA SESSÃO:**
   - [ ] **2.2 Zetta-Scheduler** — Agendamento de mensagens (1-2 dias)
   - [ ] **5.1 Vitrine Live** — Bot vendedor no site (1-2 dias)
   - [ ] Admin Cost Dashboard — Ver custos de todos os clientes (2-3 horas)

---

## 💡 Notas Técnicas

**n8n Workflow (Zetta_Master_SaaS_Ultimate.json):**
- "Filtro de Resposta": Mantém `usage` field para downstream
- "Detector de Transbordo": Novo node, detecta palavras-chave, pausa bot, notifica dono
- "Log de Tokens": Calcula e registra custo via Supabase POST
- "Remover Markdown": Passa `usage` adiante

**Supabase Estrutura:**
- `token_logs`: Registra tokens/custo por resposta (Gemini 2.5 Flash pricing)
- `human_takeovers`: Registra handoff automático com timestamp
- `instances.ai_paused`: Verificado pelo n8n antes de responder
- `profiles.whatsapp_number`: Número do dono para notificações WhatsApp

**Dashboard State Problem:**
- `isAIPaused` state inicializado no useEffect mas não faz polling
- Supabase tem Realtime API (websocket) — considerar usar para sync automático

---

## ⚠️ Alertas de Manutenção
- **NUNCA** usar a URL `evolution.zettabots.ia.br` nas variáveis da Vercel
- **n8n:** Sempre fazer import manual do JSON (não está no git por .gitignore)
- **DevTools Cache:** Se estado desatualizado, usar "Clear site data" no DevTools
- **Realtime Sync:** Considerar migrar para Supabase Realtime para melhor UX

---

**Status Final (29/04 22:00):** Zetta-Cost ✅ + Transbordo ✅ (sync issue pendente). Pronto para próxima sessão. 🦾🚀
