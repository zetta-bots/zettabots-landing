import './Footer.css'

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '5521969875522'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/images/logo.png" alt="ZettaBots" />
              <span>ZettaBots</span>
            </div>
            <p className="footer-desc">
              Agente de IA para vendas no WhatsApp. Automatize seu atendimento e venda mais, todos os dias.
            </p>
            <div className="footer-social">
              <a href="https://www.instagram.com/zetta.bots/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-links-group">
            <h4>Produto</h4>
            <ul>
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#planos">Planos</a></li>
              <li><a href="#resultados">Resultados</a></li>
              <li><a href="#faq">Dúvidas</a></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>Contato</h4>
            <ul>
              <li>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </li>
              <li>
                <a href="https://www.instagram.com/zetta.bots/" target="_blank" rel="noopener noreferrer">Instagram</a>
              </li>
              <li><a href="mailto:contato@zettabots.ia.br">contato@zettabots.ia.br</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 ZettaBots. Todos os direitos reservados.</p>
          <div className="footer-legal">
            <a href="/privacidade.html">Privacidade</a>
            <a href="/termos.html">Termos de uso</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
