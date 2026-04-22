import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-grid"></div>
      </div>

      <div className="container hero-inner">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          Tecnologia de IA de última geração
        </div>

        <h1 className="hero-title">
          Sua empresa com <span className="gradient-text-green">IA Própria</span>
          <br />
          venda no <span className="gradient-text">WhatsApp 24h</span>
        </h1>

        <p className="hero-subtitle">
          Treine sua IA com seus dados em minutos. <strong>ZettaBots</strong> atende, qualifica e vende 
          com a naturalidade de um humano, enquanto você foca no que importa.
        </p>

        <div className="hero-actions">
          <a href="#contato" className="btn-primary hero-btn">
            Testar Grátis por 7 Dias
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <a href="#como-funciona" className="btn-outline hero-btn">
            Ver como funciona
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        <div className="hero-trust">
          <span className="trust-text">TECNOLOGIA DE PONTA:</span>
          <div className="trust-logos">
            <span className="trust-logo">OpenAI</span>
            <span className="trust-logo">Meta</span>
            <span className="trust-logo">Anthropic</span>
            <span className="trust-logo">Google Cloud</span>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">100%</span>
            <span className="stat-label">Autônomo</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Online</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">{'< 2s'}</span>
            <span className="stat-label">Resposta</span>
          </div>
        </div>

        <div className="hero-chat">
          <div className="chat-header">
            <div className="chat-avatar">Z</div>
            <div className="chat-info">
              <span className="chat-name">ZettaBot para Empresa</span>
              <span className="chat-status">
                <span className="online-dot"></span> Online agora
              </span>
            </div>
          </div>
          <div className="chat-messages">
            <div className="message message-received">
              Olá! Qual o valor do treinamento? 🚀
            </div>
            <div className="message message-sent">
              Oi! Tudo bem? Temos planos a partir de R$ 127/mês. Posso te enviar os detalhes de cada um? 😊
            </div>
            <div className="message message-received">
              Quero o plano PRO. Como faço para assinar?
            </div>
            <div className="message message-sent">
              Excelente escolha! Vou te enviar o link de pagamento agora mesmo. Só um instante... 💳
            </div>
            <div className="message-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div className="chat-tag">Respondido em 2 segundos pelo ZettaBot ⚡</div>
        </div>
      </div>
    </section>
  )
}
