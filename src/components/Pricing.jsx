import './Pricing.css'

const plans = [
  {
    name: 'Start',
    price: '127',
    period: '/mês',
    desc: 'Ideal para pequenos negócios e profissionais liberais',
    highlight: false,
    features: [
      '1 número de WhatsApp',
      'Treinamento de IA Básico',
      'Atendimento 24/7 ilimitado',
      'Dashboard do Cliente',
      'Suporte por e-mail',
    ],
    cta: 'Começar agora',
    badge: null,
  },
  {
    name: 'Pro',
    price: '247',
    period: '/mês',
    desc: 'Para empresas que buscam excelência no atendimento',
    highlight: true,
    features: [
      '1 número de WhatsApp',
      'IA com Tom de Voz da Marca',
      'Treinamento com PDFs e Sites',
      'Integração Mercado Pago',
      'Dashboard Avançado',
      'Suporte prioritário via WhatsApp',
    ],
    cta: 'Escolher Plano Pro',
    badge: '🔥 Mais popular',
  },
  {
    name: 'Enterprise',
    price: '997',
    period: '/mês',
    desc: 'Solução para grandes operações e agências',
    highlight: false,
    features: [
      'Até 5 números de WhatsApp',
      'Painel Multi-instâncias',
      'Suporte à Revenda (White-label)',
      'Treinamento de IA Customizado',
      'Prioridade de Processamento',
      'Gerente de conta dedicado',
    ],
    cta: 'Falar com consultor',
    badge: null,
  },
]

export default function Pricing() {
  return (
    <section className="pricing section" id="planos">
      <div className="container">
        <div className="pricing-header">
          <span className="section-label">💰 Planos e preços</span>
          <h2 className="section-title">
            Investimento que se paga<br />
            <span className="gradient-text">no primeiro mês</span>
          </h2>
          <p className="section-subtitle">
            Sem contrato de fidelidade. Cancele quando quiser. Todos os planos incluem 7 dias grátis.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <div className={`pricing-card ${plan.highlight ? 'highlight' : ''}`} key={i}>
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price">
                <span className="pricing-currency">R$</span>
                <span className="pricing-amount">{plan.price}</span>
                <span className="pricing-period">{plan.period}</span>
              </div>
              <p className="pricing-desc">{plan.desc}</p>
              <ul className="pricing-features">
                {plan.features.map((f, j) => (
                  <li key={j}>
                    <span className="check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#contato"
                className={plan.highlight ? 'btn-whatsapp pricing-btn' : 'btn-outline pricing-btn'}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="pricing-guarantee">
          <span className="guarantee-icon">🛡️</span>
          <div>
            <strong>Garantia de 7 dias grátis</strong>
            <span> — Teste sem compromisso. Se não gostar, não cobra nada.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
