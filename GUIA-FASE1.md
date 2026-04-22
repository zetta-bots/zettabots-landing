# Guia Fase 1 — ZettaBots

## A) Formspree (receber leads por e-mail)

1. Acesse https://formspree.io e crie uma conta gratuita
2. Clique em "New Form" e dê o nome "ZettaBots Leads"
3. Copie o ID gerado (ex: `xpzvwqab`)
4. Abra o arquivo `src/components/LeadForm.jsx`
5. Substitua `SEU_ID_AQUI` pelo ID copiado:
   ```js
   const FORMSPREE_ID = 'xpzvwqab'
   ```
6. A partir de agora, cada cadastro chega no seu e-mail automaticamente

**Plano gratuito:** 50 envios/mês. Plano pago ($8/mês): ilimitado.

---

## B) Google Sheets — Controle de Trials

1. Abra o Google Sheets e crie uma nova planilha chamada "ZettaBots Trials"
2. Importe o arquivo `planilha-trials.csv` (Arquivo > Importar)
3. Configure formatação condicional na coluna STATUS:
   - "Trial ativo" → fundo amarelo
   - "Convertido ✅" → fundo verde
   - "Cancelado ❌" → fundo vermelho
   - "Trial vencendo" → fundo laranja

4. Adicione uma coluna fórmula para dias restantes:
   ```
   =DATA_FIM_TRIAL - HOJE()
   ```

5. Todo dia de manhã, veja quem está no dia 5 (enviar follow-up) e dia 7 (enviar link de pagamento)

**Script de alerta automático (opcional):**
No Google Sheets → Extensões → Apps Script → cole:
```javascript
function verificarTrials() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dados = sheet.getDataRange().getValues();
  const hoje = new Date();

  dados.slice(1).forEach((row, i) => {
    const fimTrial = new Date(row[6]); // coluna DATA_FIM_TRIAL
    const diasRestantes = Math.ceil((fimTrial - hoje) / (1000 * 60 * 60 * 24));
    const nome = row[0];
    const whatsapp = row[2];

    if (diasRestantes === 2) {
      MailApp.sendEmail('seu@email.com',
        `⚠️ Trial vencendo: ${nome}`,
        `${nome} (${whatsapp}) tem trial vencendo em 2 dias. Envie o link de pagamento!`
      );
    }
  });
}
```
Configure o gatilho para rodar todo dia às 8h.

---

## C) Link de Pagamento (Mercado Pago — recomendado no Brasil)

### Mercado Pago (mais fácil para brasileiros)
1. Acesse https://www.mercadopago.com.br
2. Crie uma conta como empresa
3. Vá em "Cobrar" → "Link de pagamento"
4. Configure:
   - Nome: "ZettaBots — Plano [Starter/Growth/Enterprise]"
   - Valor: R$ 297 / R$ 597 / R$ 1.497
   - Recorrência: mensal
5. Copie o link e envie para o cliente no 7º dia do trial

### Stripe (aceita cartão internacional)
1. Acesse https://stripe.com/br
2. Crie uma conta
3. Dashboard → Products → Add product
4. Configure o produto com recorrência mensal
5. Payment Links → Create link
6. Envie o link para o cliente

---

## D) Fluxo manual de operação diária

### Quando chegar um lead (e-mail do Formspree):
1. Adicione na planilha Google Sheets
2. Preencha DATA_INICIO e DATA_FIM (+ 7 dias)
3. Entre em contato via WhatsApp:
   > "Olá [Nome]! 👋 Aqui é da ZettaBots. Vi que você se cadastrou para o trial grátis! Vou te ajudar a configurar seu agente de IA agora. Quando tiver uns 30 minutinhos?"

### Dia 5 do trial — follow-up:
> "Oi [Nome]! Como está indo o teste do ZettaBots? 🚀 Tem mais 2 dias de trial. Posso te ajudar com alguma configuração? Se quiser continuar depois do trial, já consigo te dar um desconto especial 😉"

### Dia 7 — link de pagamento:
> "Olá [Nome]! Seu trial gratuito encerra hoje. Espero que tenha gostado! 🎉 Para continuar tendo seu vendedor IA no WhatsApp, é só assinar por R$ [valor]/mês: [LINK DE PAGAMENTO]. Qualquer dúvida, estou aqui! 💬"

---

## E) Número do WhatsApp no site

Abra os arquivos abaixo e substitua `5511999999999` pelo seu número real:
- `src/App.jsx` — linha 5
- `src/components/LeadForm.jsx` — linha 7

Formato: DDI + DDD + número (ex: Brasil SP: `5511999990000`)
