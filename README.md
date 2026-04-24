# ZettaBots — Plataforma SaaS de IA para WhatsApp

Site e painel do cliente de [zettabots.ia.br](https://zettabots.ia.br) — agente de IA para automação de vendas no WhatsApp.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 5 |
| Deploy | Vercel (Serverless Functions em `api/`) |
| Banco de dados | Supabase (PostgreSQL + Auth + RLS) |
| WhatsApp | Evolution API (instâncias por cliente) |
| Automações | n8n (onboarding, billing, bot master) |
| Pagamentos | Mercado Pago (assinaturas recorrentes) |
| E-mail transacional | Brevo (SMTP API) |

## Estrutura

```
├── api/                      # Vercel Serverless Functions
│   ├── subscribe.js          # Cadastro → cria usuário Supabase + dispara onboarding
│   ├── auth-request.js       # Login: gera OTP e envia via WhatsApp
│   ├── auth-verify.js        # Login: valida OTP e retorna sessão
│   ├── get-qr.js             # Busca QR code da instância no Evolution API
│   ├── dashboard-core.js     # Dados do painel (leads, chats, stats)
│   ├── get-config.js         # Configurações da instância (prompt, webhook)
│   ├── update-prompt.js      # Salva system prompt personalizado
│   ├── checkout.js           # Inicia checkout Mercado Pago
│   ├── create-payment.js     # Cria pagamento/assinatura
│   ├── create-pix.js         # Gera PIX para pagamento
│   ├── link-subscription.js  # Vincula assinatura MP ao perfil
│   └── webhook-billing.js    # Recebe webhooks do Mercado Pago
├── src/
│   ├── components/           # Seções da landing page
│   ├── pages/
│   │   ├── LandingPage.jsx   # Página principal
│   │   ├── Login.jsx         # Login via OTP WhatsApp
│   │   └── Dashboard.jsx     # Painel do cliente
│   └── lib/
│       └── supabase.js       # Client Supabase
├── public/
│   ├── images/               # Assets públicos
│   ├── privacidade.html      # Política de privacidade (LGPD)
│   └── termos.html           # Termos de uso
├── supabase/                 # Migrations SQL
├── vercel.json               # Config de rotas Vercel
└── vite.config.js
```

## Fluxo principal

```
1. Cadastro   → subscribe.js → Supabase Auth + profile → n8n zetta-welcome → n8n zetta-onboarding
2. Onboarding → Evolution API cria instância → registro em instances → WhatsApp com link do painel
3. Login      → /login → auth-request.js envia OTP → auth-verify.js valida → sessão localStorage
4. Painel     → Dashboard.jsx → get-qr.js → QR code com timer 40s para conectar WhatsApp do negócio
5. Bot ativo  → Evolution API recebe mensagens → n8n zetta-bot-master → resposta com IA (Gemini/Groq)
```

## Planos

| Plano | Valor | Recursos |
|---|---|---|
| Trial | Grátis 7 dias | Funcionalidades completas |
| Start | R$ 127/mês | Bot + CRM básico |
| Pro | R$ 247/mês | Start + relatórios + follow-up |
| Enterprise | R$ 997/mês | Pro + múltiplos atendentes + white-label |

## Variáveis de ambiente (Vercel)

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Evolution API
EVOLUTION_URL=
EVOLUTION_APIKEY=

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=
MP_PLAN_START_ID=
MP_PLAN_PRO_ID=
MP_PLAN_ENTERPRISE_ID=

# n8n
N8N_WEBHOOK_BASE=

# Brevo (e-mail)
BREVO_API_KEY=
```

## Desenvolvimento local

```bash
git clone git@github.com:zetta-bots/zettabots-landing.git
cd zettabots-landing
npm install
cp .env.example .env.local   # preencher as variáveis
npm run dev                  # http://localhost:5173
```

> As funções `api/` rodam via Vercel CLI localmente (`vercel dev`).

## Deploy

Push para `main` dispara deploy automático na Vercel.

```bash
npm run build   # gera dist/ para validação local
```

## Links

- **Site:** https://zettabots.ia.br
- **Painel:** https://zettabots.ia.br/login
- **n8n:** https://seriousokapi-n8n.cloudfy.live
- **Evolution API:** https://seriousokapi-evolution.cloudfy.live
