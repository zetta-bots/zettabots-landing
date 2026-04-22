import './Features.css'

const features = [
  {
    icon: '🧠',
    color: '#7c3aed',
    title: 'Treinamento via Link ou PDF',
    desc: 'Basta colar o link do seu site ou subir um manual em PDF para a IA aprender tudo sobre seus produtos e serviços.',
  },
  {
    icon: '💬',
    color: '#25d366',
    title: 'Respostas Humanizadas',
    desc: 'Nada de robôs mecânicos. Nossa IA entende gírias, erros de português e responde com naturalidade e empatia.',
  },
  {
    icon: '💳',
    color: '#f59e0b',
    title: 'Pagamento via WhatsApp',
    desc: 'Gere links de pagamento (Mercado Pago) direto na conversa e transforme o atendimento em venda imediata.',
  },
  {
    icon: '🔐',
    color: '#06b6d4',
    title: 'Dashboard do Cliente',
    desc: 'Tenha controle total sobre sua IA através de um painel exclusivo para gerenciar mensagens e treinamentos.',
  },
  {
    icon: '📅',
    color: '#ec4899',
    title: 'Agendamento de Clientes',
    desc: 'Sua IA qualifica o interesse e realiza o pré-agendamento de reuniões ou consultas automaticamente.',
  },
  {
    icon: '🔗',
    color: '#f97316',
    title: 'Integração via Webhooks',
    desc: 'Conecte sua IA com CRMs, planilhas ou qualquer sistema que você já utilize para automatizar seu fluxo.',
  },
  {
    icon: '🎙️',
    color: '#f59e0b',
    title: 'Interpretação de Áudio',
    desc: 'Seu cliente prefere mandar áudio? Sem problemas. Nossa IA transcreve e entende cada palavra perfeitamente.',
  },
  {
    icon: '🧠',
    color: '#8b5cf6',
    title: 'Memória Contextual',
    desc: 'O bot não esquece. Ele lembra de conversas passadas para oferecer um atendimento muito mais humano e personalizado.',
  },
]

export default function Features() {
  return (
    <section className="features section" id="recursos">
      <div className="container">
        <div className="features-header">
          <span className="section-label">🚀 RECURSOS</span>
          <h2 className="section-title">
            Tudo que você precisa para<br />
            <span className="gradient-text">vender mais no WhatsApp</span>
          </h2>
          <p className="section-subtitle">
            Um agente de IA completo que trabalha igual (ou melhor) que o seu melhor vendedor — sem folga, sem cansaço.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon" style={{ '--icon-color': f.color }}>
                <span role="img" aria-label={f.title}>{f.icon}</span>
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
