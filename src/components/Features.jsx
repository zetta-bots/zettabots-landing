import './Features.css'

const features = [
  {
    icon: '🧠',
    color: '#7c3aed',
    title: 'Cérebro de Dados (RAG)',
    desc: 'Treine sua IA com o conhecimento específico da sua empresa via PDF, DOC ou Link. Ela responde baseada em fatos, não em alucinações.',
  },
  {
    icon: '💬',
    color: '#25d366',
    title: 'Cognição de Vendas',
    desc: 'IA que entende contexto, gírias e intenções de compra. Sarah atua como uma vendedora sênior, conduzindo o lead até o fechamento.',
  },
  {
    icon: '💳',
    color: '#f59e0b',
    title: 'Checkout no WhatsApp',
    desc: 'Gere links de pagamento (Mercado Pago/Pix) integrados à conversa. Reduza a fricção e venda em segundos sem sair do chat.',
  },
  {
    icon: '🔐',
    color: '#06b6d4',
    title: 'Monitor Human-in-the-Loop',
    desc: 'Controle total. Intervenha em qualquer conversa em tempo real através do Dashboard. A IA pausa automaticamente quando você assume.',
  },
  {
    icon: '📅',
    color: '#ec4899',
    title: 'Agendamento Inteligente',
    desc: 'Sincronização com calendários para pré-agendamento de reuniões. A Sarah qualifica o interesse antes de marcar o horário.',
  },
  {
    icon: '🔗',
    color: '#f97316',
    title: 'Ecossistema via Webhooks',
    desc: 'Envie leads qualificados direto para seu CRM ou Planilha. Automação ponta-a-ponta para escalar sua operação.',
  },
  {
    icon: '🎙️',
    color: '#f59e0b',
    title: 'Audição Ativa (Whisper)',
    desc: 'Sua IA entende áudios perfeitamente. Transcrição e interpretação de voz com precisão de última geração para não perder nenhum lead.',
  },
  {
    icon: '🧠',
    color: '#8b5cf6',
    title: 'Retenção de Memória',
    desc: 'Memória persistente de longo prazo. Sarah lembra de detalhes de conversas passadas, criando uma experiência VIP para o cliente.',
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
