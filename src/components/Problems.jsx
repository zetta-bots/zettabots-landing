import './Problems.css'

const problems = [
  {
    icon: '⏳',
    title: 'Demora no Atendimento',
    desc: 'Se o seu lead demora mais de 5 minutos para ser respondido, a chance de conversão cai em 80%. Você está perdendo dinheiro agora.',
  },
  {
    icon: '📉',
    title: 'Baixa Taxa de Conversão',
    desc: 'Muitos curiosos e poucos compradores. Sem uma qualificação automática, sua equipe perde tempo com quem não vai comprar.',
  },
  {
    icon: '🚫',
    title: 'Limitação de Horário',
    desc: 'Seu cliente quer comprar às 22h, mas sua empresa está fechada. Sem IA, você só vende 8 horas por dia.',
  },
  {
    icon: '💸',
    title: 'Falta de Follow-up',
    desc: '80% das vendas precisam de 5 contatos para fechar. Sua equipe consegue lembrar de cobrar todos os clientes todos os dias?',
  },
]

export default function Problems() {
  return (
    <section className="problems section">
      <div className="container">
        <div className="problems-header">
          <span className="section-label">🧐 VOCÊ RECONHECE ESSA DOR?</span>
          <h2 className="section-title">
            Quanto custa para sua empresa<br />
            <span className="gradient-text">perder vendas todos os dias?</span>
          </h2>
          <p className="section-subtitle">
            O problema não é a falta de clientes, é a demora e a falta de processos no seu WhatsApp. 
            A maioria dos negócios ainda ignora esses prejuízos invisíveis:
          </p>
        </div>

        <div className="problems-grid">
          {problems.map((p, i) => (
            <div className="problem-card" key={i}>
              <div className="problem-icon">{p.icon}</div>
              <h3 className="problem-title">{p.title}</h3>
              <p className="problem-desc">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="problems-cta">
          <div className="problems-cta-text">
            O ZettaBots resolve <strong>todos esses problemas</strong> de uma vez.
          </div>
          <a href="#como-funciona" className="btn-primary">Ver a solução →</a>
        </div>
      </div>
    </section>
  )
}
