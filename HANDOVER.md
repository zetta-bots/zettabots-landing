# ðŸ§  Handover TÃ©cnico & Master Task List - ZettaBots SaaS (29/04/2026)

Este documento Ã© a bÃºssola do projeto. Ele contÃ©m o estado atual, as credenciais e o roadmap de evoluÃ§Ã£o.

## ðŸ“� Estado Atual: PRODUÃ‡ÃƒO + FEATURES NOVAS
O sistema estÃ¡ em produÃ§Ã£o. Hoje implementamos **Zetta-Cost (4.2)** e **Transbordo Inteligente (2.3)**.

---

## ðŸ”‘ Credenciais de ProduÃ§Ã£o (Cloudfy/Supabase)
- **Evolution API:** `https://seriousokapi-evolution.cloudfy.live`
- **Supabase:** `https://ugtsqlhkyrjmmopakyho.supabase.co`
- **OpenRouter:** (Stored in env vars)
- **Mercado Pago:** (Stored in env vars)

---

## ðŸŽ¯ O QUE FOI FEITO HOJE (29/04/2026)

### 1. âœ… Zetta-Cost (4.2) â€” Monitor de Consumo de Tokens
**Status:** COMPLETO E TESTADO âœ…

**O que foi implementado:**
- Criada tabela `token_logs` no Supabase com SQL (prompt_tokens, completion_tokens, total_tokens, cost_usd)
- n8n: modificado "Filtro de Resposta" para passar `usage` adiante
- n8n: adicionado node "Log de Tokens" que calcula custo e insere no Supabase
- Dashboard: criado `ZettaCostPanel.jsx` com stats e grÃ¡fico de custos
- Sidebar: adicionada aba "Custos IA ðŸ’¸"
- PreÃ§o Gemini 2.5 Flash: $0.15/1M input, $0.60/1M output
- **Commits:** `700cbe2` (Dashboard), `9e7be57` (Push)

**Como funciona:**
1. Cliente envia mensagem via WhatsApp
2. OpenRouter retorna tokens usados
3. Node "Log de Tokens" calcula custo e salva em Supabase
4. Dashboard "Custos IA" mostra stats em tempo real

**VerificaÃ§Ã£o:**
- âœ… Tabela `token_logs` recebendo dados corretos
- âœ… Custo sendo calculado (e.g., 111 prompt + 87 completion = $0.000069)

---

### 2. âœ… Transbordo Inteligente (2.3) â€” Smart Handoff para Humano
**Status:** COMPLETO E TESTADO âœ… (30/04/2026 â†’ Expandido 01/05 14:30 â€” Email 100% funcional)

**O que foi implementado:**
- n8n: novo node "Detector de Transbordo" com detecÃ§Ã£o dupla (palavras-chave + IA)
- **DetecÃ§Ã£o:**
  - Cliente: "atendente", "gerente", "reclamaÃ§Ã£o", "cancelar", "reembolso", "supervisor"
  - IA: "vou transferir", "encaminhar para", "humano irÃ¡", "atendente irÃ¡", "nossa equipe irÃ¡"
- **AÃ§Ã£o ao acionar (4 passos automÃ¡ticos):**
  - âœ… **Step 1:** Pausa bot: `instances.ai_paused = true`
  - âœ… **Step 2:** Insere em `human_takeovers` com timestamp e dados da conversa
  - âœ… **Step 2.5:** Insere em `notifications` para alertar no Dashboard
  - âœ… **Step 3:** Envia mensagem para cliente: *"VocÃª serÃ¡ transferido para um atendente humano. Aguarde um momento, por favor! ðŸ‘‹"* (mensagem melhorada)
  - âœ… **Step 4:** Envia email ao dono via Brevo com info do cliente
- **Dashboard â€” NotificaÃ§Ãµes em Tempo Real:**
  - âœ… Sino ðŸ”” no header com badge mostrando count de nÃ£o-lidos
  - âœ… Dropdown "Central de Alertas" com histÃ³rico de notificaÃ§Ãµes
  - âœ… Badge ðŸ”´ ESPERA em conversas pausadas (ChatMonitorPanel)
  - âœ… BotÃ£o "ðŸ¤– IA ATIVA" / "ðŸš« IA PAUSADA" com sincronizaÃ§Ã£o em tempo real
  - âœ… Polling contÃ­nuo a cada 10 segundos para notificaÃ§Ãµes
  - âœ… `markAsRead` funcional no dropdown
- **Commits (30/04 23:15):** `2511853` (email), `faf2274` (notificaÃ§Ãµes + polling)

**VerificaÃ§Ã£o (30/04 23:15):**
- âœ… Detector detecta palavras-chave corretamente
- âœ… `instances.ai_paused = true` no Supabase
- âœ… `human_takeovers` preenchido com dados do handoff
- âœ… `notifications` recebendo alertas de Transbordo
- âœ… Email enviado ao dono via Brevo (Brevo API integrado)
- âœ… Dashboard mostra badge ðŸ”´ ESPERA + botÃ£o "IA PAUSADA"
- âœ… Sino ðŸ”” aparece com count de novos alertas
- âœ… BotÃ£o "IA PAUSADA" consegue despausar (volta para "IA ATIVA")
- âœ… Polling sincroniza estado em tempo real
- âœ… markAsRead marca notificaÃ§Ãµes como lidas

**Fluxo Completo (end-to-end):**
```
1. Cliente: "quero falar com um atendente"
   â†“
2. Detector identifica palavra-chave
   â†“
3. Step 1: ai_paused = true (bot pausa)
4. Step 2: INSERT em human_takeovers
5. Step 2.5: INSERT em notifications
6. Step 3: Envia WhatsApp: "VocÃª serÃ¡ transferido..."
7. Step 4: Envia EMAIL ao dono com info do cliente
   â†“
8. Dashboard:
   - Sino ðŸ”” ativa com "1 novo"
   - Dropdown mostra alerta: "ðŸš¨ Transbordo Ativo â€” Cliente X"
   - Badge ðŸ”´ ESPERA aparece na conversa
   - BotÃ£o "IA PAUSADA" ativo
   â†“
9. Admin lÃª notificaÃ§Ã£o no Dashboard
10. Admin clica botÃ£o "IA PAUSADA" â†’ ai_paused = false
11. Bot retoma, Dashboard atualiza automaticamente
```

**Arquitetura de Email:**
- **ServiÃ§o:** Brevo (reutiliza chave jÃ¡ existente em env vars)
- **Endpoint:** `/api/dashboard-core` â†’ action `send-transbordo-email`
- **Template:** Email com info do cliente + botÃ£o direto para Dashboard
- **SeguranÃ§a:** API key armazenada no backend (nÃ£o expÃµe ao n8n)

---

## ðŸ“‹ Master Task List (Atualizado)

### Fase 1: InteligÃªncia HÃ­brida e MemÃ³ria (O CÃ©rebro)
- [x] **1.1 IntegraÃ§Ã£o OpenRouter:** Chave master e crÃ©ditos iniciais.
- [x] **1.2 Roteador Zetta-Brain:** LÃ³gica Groq (Texto) vs. Gemini (Arquivos/MÃ­dia).
- [x] **1.3 GestÃ£o de Contexto:** NÃ³ de Window Buffer Memory no n8n funcional.
- [x] **1.4 Zetta-Knowledge (RAG):** JÃ¡ implementada no Dashboard (upload de PDFs)

### Fase 2: Diferenciais Premium e Agendamento
- [x] **2.1 Safety Switch:** LÃ³gica de pausa do bot via Supabase.
- [ ] **2.2 Zetta-Scheduler:** Agendamento via IA integrado ao Google Calendar.
- [x] **2.3 Transbordo Inteligente:** âœ… COMPLETO (DetecÃ§Ã£o + Pausa + NotificaÃ§Ãµes + Email)
- [ ] **2.4 RecuperaÃ§Ã£o Ativa:** Follow-up automÃ¡tico de 24h.

### Fase 3: ExperiÃªncia do Cliente e UX (Painel)
- [ ] **3.1 Onboarding Guiado:** Tutorial interativo (Intro.js).
- [x] **3.2 Dashboard de ROI:** âœ… Implementado
- [x] **3.3 MÃ³dulo de Treinamento:** âœ… JÃ¡ estÃ¡ no Dashboard (AIConfigPanel com upload)

### Fase 4: AutomaÃ§Ã£o Financeira e ProvisÃ£o (O Motor do SaaS)
- [x] **4.1 Webhook de ProvisÃ£o AutomÃ¡tica:** âœ… Implementado no onboarding
- [x] **4.2 Zetta-Cost (Monitor de Custos):** âœ… COMPLETO
- [x] **4.3 Checkout Mercado Pago:** âœ… Integrado

### Fase 5: Marketing, Vitrine e Escala
- [ ] **5.1 Vitrine Live Zettabots:** Bot vendedor oficial no site.
- [ ] **Health Check:** Sinalizador de saÃºde.

---

## ðŸ�› Issues Conhecidos

**Nenhum issue crÃ­tico no momento.** Todas as features de Transbordo funcionando corretamente.

### Melhorias Futuras (nÃ£o crÃ­ticas):
- **Supabase Realtime:** Migrar polling (10s) para websocket para UX ainda melhor (reduz latÃªncia)
- **NotificaÃ§Ãµes SMS:** Adicionar notificaÃ§Ã£o por SMS ao dono como alternativa ao email

---

## ðŸ“Š Commits de Hoje (30/04/2026)

| Hash | Mensagem | Status |
|------|----------|--------|
| 700cbe2 | feat: implement Zetta-Cost (4.2) | âœ… Merged |
| 9e7be57 | feat: implement Transbordo Inteligente (2.3) base | âœ… Merged |
| 4170a87 | fix: Detector de Transbordo com dados corretos | âœ… Merged |
| 333d917 | fix: sincronizar isAIPaused com Supabase | âœ… Merged |
| 9231d9d | fix: remover duplicate toggle-ai case | âœ… Merged |
| 5680de3 | docs: atualizar HANDOVER com Transbordo completo | âœ… Merged |
| 2511853 | feat: adicione endpoint send-transbordo-email | âœ… Merged |
| faf2274 | feat: adicione polling contÃ­nuo de notificaÃ§Ãµes | âœ… Merged |
| 0056c08 | fix: ajustar extraÃ§Ã£o de action para suportar query params | âœ… Merged |

---

## ðŸš€ PrÃ³ximas Prioridades

1. **AGORA (30/04 - Testem):** 
   - [ ] â­� **Testar Transbordo end-to-end:**
     - [ ] Palavra-chave dispara Transbordo?
     - [ ] Cliente recebe mensagem melhorada?
     - [ ] Sino ðŸ”” aparece no Dashboard?
     - [ ] Email recebido no dono?
     - [ ] Badge ðŸ”´ ESPERA aparece?
     - [ ] BotÃ£o IA PAUSADA funciona?
   - [ ] Importar JSON atualizado no n8n

2. **PRÃ“XIMA SESSÃƒO (apÃ³s testes):**
   - [ ] **2.2 Zetta-Scheduler** â€” Agendamento de mensagens (1-2 dias)
   - [ ] **5.1 Vitrine Live** â€” Bot vendedor no site (1-2 dias)
   - [ ] Admin Cost Dashboard â€” Ver custos de todos os clientes (2-3 horas)

---

## ðŸ’¡ Notas TÃ©cnicas

**n8n Workflow (Zetta_Master_SaaS_Ultimate.json) â€” Detector de Transbordo (4 steps):**
```
1. Pausa bot: PATCH instances.ai_paused = true
2. Registra handoff: POST human_takeovers (contact_phone, activation_reason, last_ai_message)
3. Notifica Dashboard: POST notifications (title, message, instance_name)
4. Envia email ao dono: POST /api/dashboard-core?action=send-transbordo-email
5. Envia WhatsApp ao cliente: POST Evolution API /message/sendText
```

**Backend Endpoint (api/dashboard-core.js):**
- Case `send-transbordo-email`: Busca email do dono em `profiles.email`, envia via Brevo API
- Reutiliza `BREVO_API_KEY` jÃ¡ configurada em env vars
- Template HTML com info do cliente + botÃ£o Dashboard

**Supabase Estrutura:**
- `token_logs`: tokens/custo por resposta (Gemini 2.5 Flash: $0.15/1M input, $0.60/1M output)
- `human_takeovers`: handoff automÃ¡tico com timestamp (contact_phone, is_active)
- `notifications`: alertas do sistema (title, message, is_read, created_at)
- `instances.ai_paused`: flag de pausa verificado antes de responder
- `profiles.email`: email do dono para notificaÃ§Ãµes
- `profiles.whatsapp_number`: nÃºmero para mapeamento instance â†’ usuÃ¡rio

**Dashboard Polling:**
- `fetchChats`: 5 segundos quando aba "mensagens" ativa
- `fetchNotifications`: 10 segundos contÃ­nuo (todas as abas)
- `isAIPaused`: sincroniza com Supabase em cada fetch de chats

**Mensagem ao Cliente (melhorada):**
- Antes: "Aguarde, um atendente irÃ¡ te ajudar em breve! ðŸ‘‹"
- Depois: "VocÃª serÃ¡ transferido para um atendente humano. Aguarde um momento, por favor! ðŸ‘‹"
- Mais explÃ­cita sobre transferÃªncia para humano

---

## âš ï¸� Alertas de ManutenÃ§Ã£o
- **NUNCA** usar a URL `evolution.zettabots.ia.br` nas variÃ¡veis da Vercel
- **n8n:** Sempre fazer import manual do JSON (nÃ£o estÃ¡ no git por .gitignore)
- **DevTools Cache:** Se estado desatualizado, usar "Clear site data" no DevTools
- **Realtime Sync:** Considerar migrar para Supabase Realtime para melhor UX

---

---

## ðŸ“� HistÃ³rico de AtualizaÃ§Ãµes

### 29/04/2026 (22:00)
- âœ… Zetta-Cost (4.2) implementado e testado
- âœ… Transbordo Inteligente (2.3) base implementado
- âš ï¸� Issue: SincronizaÃ§Ã£o de estado ai_paused no Dashboard

### 30/04/2026 (23:30)  
- âœ… **Transbordo Inteligente 100% COMPLETO E TESTADO**  
- âœ… **Email Premium:** Resolvido problema de entrega. Agora usa `api/send-email.js` (chamado pelo n8n) e `api/dashboard-core.js`.
- âœ… **Busca Robusta:** Sistema identifica o dono do bot por ID interno ou Nome de ExibiÃ§Ã£o ("Atlas da FÃ©", etc).
- âœ… **Design Dark Mode:** Template profissional e assunto dinÃ¢mico: `ðŸš¨ Transbordo: [Nome do Bot]`.
- âœ… **CorreÃ§Ã£o CrÃ­tica:** Sincronizadas variÃ¡veis de ambiente (`VITE_SUPABASE_URL`) para funcionamento em produÃ§Ã£o.

---

**Status Final:**  
âœ… **Zetta-Cost (4.2)** â€” Monitoramento de custos IA  
âœ… **Transbordo Inteligente (2.3)** â€” DetecÃ§Ã£o + Pausa + NotificaÃ§Ãµes + Email (100% FUNCIONAL)

ðŸš€ **PRÃ“XIMO PASSO:**  
**2.2 Zetta-Scheduler** â€” Implementar o agendamento de mensagens/lembretes via IA integrado ao Google Calendar e disparo automÃ¡tico pelo WhatsApp.

---

## ?? Zetta-Scheduler: Status da Implementação (30/04)
✅ **Zetta-Cost (4.2)** — Monitoramento de custos IA  
✅ **Transbordo Inteligente (2.3)** — Detecção + Pausa + Notificações + Email (100% FUNCIONAL)

🚀 **PRÓXIMO PASSO:**  
**n8n Integration** — Concluir a conexão entre o n8n e a tabela `schedules` para habilitar a inteligência de agendamento.

---

## 📅 Zetta-Scheduler: Status da Implementação (01/05)

✅ **Dashboard UI:** Nova aba "Agendamentos" funcional com monitor em tempo real.
✅ **Backend Motor:** `scheduler-cron` ativo na Vercel (disparos a cada 5 min).
✅ **IA Sarah:** Calibrada para gerar o comando `[SCHED: ...]` quando solicitada.

**Próximos Passos Agendamento:**
1. Configurar o **n8n** (Webhook -> IF -> Code -> Supabase) com o JSON fornecido.
2. Ativar integração com Google Calendar no n8n.

---
*Próximo passo: Apoiar na configuração do n8n.*
