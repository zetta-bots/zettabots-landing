import './Results.css'

const stats = [
  { number: '100%', label: 'Autônomo', desc: 'Sua IA resolve dúvidas e qualifica leads sem precisar de supervisão humana' },
  { number: '24/7', label: 'Disponibilidade total', desc: 'Seu atendimento nunca dorme, não tira férias e não para em feriados' },
  { number: '< 2s', label: 'Tempo de resposta', desc: 'Respostas instantâneas que aumentam em 3x a taxa de conversão' },
  { number: 'Grátis', label: '7 Dias de Teste', desc: 'Comece a usar agora sem precisar de cartão de crédito' },
]

const testimonials = [
  {
    name: 'Atlas da Fé',
    role: 'Plataforma de Infoprodutos',
    avatar: 'A',
    color: '#7c3aed',
    text: 'O ZettaBots revolucionou o suporte do Atlas da Fé. A IA consegue explicar nossos conteúdos e tirar dúvidas de acesso dos alunos de forma tão natural que muitos nem percebem que é um robô.',
  },
  {
    name: 'Marcos Vinícius',
    role: 'Consultoria de Marketing',
    avatar: 'M',
    color: '#06b6d4',
    text: 'A maior vantagem é a facilidade de treinamento. Coloquei o link do meu site e em 5 minutos a IA já sabia tudo sobre meus serviços. O agendamento de reuniões disparou.',
  },
  {
    name: 'Loja Conceito',
    role: 'E-commerce de Moda',
    avatar: 'L',
    color: '#ec4899',
    text: 'Excelente ferramenta para quem quer escalar o atendimento sem aumentar a equipe. O suporte da ZettaBots é impecável e a IA é muito inteligente.',
  },
]

export default function Results() {
  return (
    <section className="results section" id="resultados">
      <div className="container">
        <div className="results-header">
          <span className="section-label">📈 Resultados reais</span>
          <h2 className="section-title">
            Números que provam<br />
            <span className="gradient-text">o impacto do ZettaBots</span>
          </h2>
        </div>

        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-card-number">{s.number}</div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="testimonials-header">
          <h3 className="testimonials-title">O que nossos clientes dizem</h3>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div className="testimonial-card" key={i}>
              <div className="testimonial-quote">"</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
