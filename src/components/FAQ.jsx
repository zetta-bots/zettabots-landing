import { useState } from 'react'
import './FAQ.css'

const faqs = [
  {
    question: "Como funciona o teste grátis de 7 dias?",
    answer: "É muito simples! Você preenche o cadastro e nossa equipe libera seu acesso em até 2 horas. Você poderá treinar sua IA com seus dados e testar todas as funcionalidades sem pagar nada e sem precisar cadastrar cartão de crédito."
  },
  {
    question: "A IA fala português corretamente?",
    answer: "Sim! Utilizamos os modelos de linguagem mais avançados do mundo (GPT-4 e equivalentes), treinados com bilhões de parâmetros em português. Ela entende gírias, contextos regionais e até erros gramaticais, respondendo sempre de forma profissional e humana."
  },
  {
    question: "Consigo integrar com o meu site ou PDF?",
    answer: "Com certeza. Você pode simplesmente colar a URL do seu site ou fazer o upload de manuais, tabelas de preços e catálogos em PDF. A IA 'lê' esse conteúdo e aprende tudo sobre o seu negócio em poucos minutos."
  },
  {
    question: "Como funciona o pagamento via WhatsApp?",
    answer: "Nossa IA pode ser configurada para gerar links de pagamento (como Mercado Pago) diretamente na conversa. Quando o cliente decide comprar, a IA envia o link, facilitando a conversão imediata."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim. Não trabalhamos com contratos de fidelidade. Você pode cancelar sua assinatura quando desejar diretamente pelo painel do cliente ou solicitando ao nosso suporte."
  }
]

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null)

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section className="faq section" id="faq">
      <div className="container">
        <div className="faq-header">
          <span className="section-label">🤔 DÚVIDAS FREQUENTES</span>
          <h2 className="section-title">
            Perguntas que<br />
            <span className="gradient-text">nossos clientes fazem</span>
          </h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              className={`faq-item ${activeIndex === index ? 'active' : ''}`} 
              key={index}
              onClick={() => toggleFAQ(index)}
            >
              <div className="faq-question">
                {faq.question}
                <span className="faq-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </span>
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
