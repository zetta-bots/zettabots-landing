import './HowItWorks.css'

const steps = [
  {
    number: '01',
    title: 'Conecte seu WhatsApp',
    desc: 'Escaneie o QR Code e integre seu número em menos de 30 segundos. Simples assim.',
    icon: '📱',
  },
  {
    number: '02',
    title: 'Treinamento Relâmpago',
    desc: 'Cole o link do seu site ou suba um PDF. Nossa IA absorve todo o seu conhecimento instantaneamente.',
    icon: '⚡',
  },
  {
    number: '03',
    title: 'Lucro no Piloto Automático',
    desc: 'Ative o bot e veja ele transformar conversas em vendas enquanto você foca no crescimento.',
    icon: '💰',
  },
]

export default function HowItWorks() {
  return (
    <section className="how section" id="como-funciona">
      <div className="container">
        <div className="how-header">
          <span className="section-label">⚙️ Como funciona</span>
          <h2 className="section-title">
            Seu novo atendente em{' '}
            <span className="gradient-text">apenas 5 minutos</span>
          </h2>
          <p className="section-subtitle">
            Sem código, sem complicação. Configuração guiada e suporte especializado do começo ao fim.
          </p>
        </div>

        <div className="how-steps">
          {steps.map((step, i) => (
            <div className="how-step" key={i}>
              <div className="step-connector">
                <div className="step-number">{step.number}</div>
                {i < steps.length - 1 && <div className="step-line"></div>}
              </div>
              <div className="step-content">
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="how-cta">
          <a href="#contato" className="btn-primary">
            Começar gratuitamente agora
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
