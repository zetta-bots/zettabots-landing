# ZettaBots — Landing Page

Landing page do [ZettaBots](https://zettabots.ia.br) — agente de IA para automação de vendas no WhatsApp.

## Stack

- **Frontend:** React 18 + Vite 5
- **Estilização:** CSS com variáveis (sem framework)
- **Captura de leads:** Netlify Functions → Brevo API
- **Analytics:** Google Analytics 4
- **Proteção de formulário:** reCAPTCHA v3
- **Deploy:** Netlify (domínio: zettabots.ia.br)

## Estrutura

```
├── netlify/
│   └── functions/
│       └── subscribe.js      # Serverless function — integração Brevo
├── public/
│   ├── images/               # Logo, favicon, og-image
│   ├── privacidade.html      # Política de privacidade (LGPD)
│   ├── termos.html           # Termos de uso
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/           # Seções da página
│   │   ├── Navbar.jsx/css
│   │   ├── Hero.jsx/css
│   │   ├── Problems.jsx/css
│   │   ├── Features.jsx/css
│   │   ├── HowItWorks.jsx/css
│   │   ├── Results.jsx/css
│   │   ├── Pricing.jsx/css
│   │   ├── LeadForm.jsx/css
│   │   └── Footer.jsx/css
│   └── utils/
│       ├── analytics.js      # Google Analytics 4
│       └── validation.js     # Validação + reCAPTCHA
├── index.html                # Meta tags, OG, JSON-LD
├── netlify.toml              # Config de build e functions
└── vite.config.js
```

## Configuração local

```bash
git clone git@github.com:zetta-bots/zettabots-landing.git
cd zettabots-landing
npm install
```

Crie `.env.local` na raiz:

```env
VITE_WHATSAPP_NUMBER=5561993956378
VITE_GA_ID=G-XXXXXXXXXX
VITE_RECAPTCHA_SITE_KEY=           # opcional
```

```bash
npm run dev
# http://localhost:5173
```

> As variáveis `BREVO_API_KEY`, `BREVO_LIST_ID` e `NOTIFY_EMAIL` ficam **somente no servidor** (Netlify env vars) — nunca no `.env.local`.

## Variáveis de ambiente (Netlify)

| Variável | Onde configurar | Descrição |
|---|---|---|
| `VITE_WHATSAPP_NUMBER` | Netlify → Environment | Número do WhatsApp (DDI+DDD+número) |
| `VITE_GA_ID` | Netlify → Environment | ID do Google Analytics 4 |
| `VITE_RECAPTCHA_SITE_KEY` | Netlify → Environment | Site key do reCAPTCHA v3 (opcional) |
| `BREVO_API_KEY` | Netlify → Environment | Chave de API da Brevo (servidor) |
| `BREVO_LIST_ID` | Netlify → Environment | ID da lista de contatos no Brevo |
| `NOTIFY_EMAIL` | Netlify → Environment | E-mail que recebe notificação de novo lead |

## Como funciona o formulário

1. Usuário preenche o formulário na landing page
2. Frontend chama `/.netlify/functions/subscribe`
3. A função serverless (Node.js) usa a `BREVO_API_KEY` para:
   - Adicionar o contato à lista no Brevo
   - Enviar e-mail de notificação para o admin
4. Usuário vê mensagem de sucesso com botão para o WhatsApp

## Deploy

O deploy é automático via Netlify ao fazer push para `main`.

Build manual:

```bash
npm run build   # gera dist/
```

## SEO

- Meta tags Open Graph e Twitter Card em `index.html`
- JSON-LD (SoftwareApplication) em `index.html`
- `public/robots.txt` e `public/sitemap.xml` configurados para `zettabots.ia.br`
- Após mudanças no sitemap: submeter no [Google Search Console](https://search.google.com/search-console)

## Links

- **Site:** https://zettabots.ia.br
- **Instagram:** https://instagram.com/zettabots
- **LinkedIn:** https://linkedin.com/company/zettabots
- **WhatsApp:** https://wa.me/5561993956378
