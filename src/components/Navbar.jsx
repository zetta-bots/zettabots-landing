import { useState, useEffect } from 'react'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = [
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Recursos', href: '#recursos' },
    { label: 'Resultados', href: '#resultados' },
    { label: 'Planos', href: '#planos' },
    { label: 'Acessar Painel', href: '/login', isBtn: true },
  ]

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <a href="/" className="logo" aria-label="ZettaBots Home" title="ZettaBots — Voltar para Home">
          <img src="/images/logo.png" alt="ZettaBots Logo" className="logo-img" />
          <span className="logo-text">Zetta<span className="logo-accent">Bots</span></span>
        </a>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map(link => (
            <li key={link.href}>
              <a 
                href={link.href} 
                className={link.isBtn ? 'login-nav-btn' : ''}
                onClick={() => setMenuOpen(false)}
                aria-label={`Ir para ${link.label}`}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#contato" className="btn-primary nav-cta" onClick={() => setMenuOpen(false)}>
              Começar Agora
            </a>
          </li>
        </ul>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
        </button>
      </div>
    </nav>
  )
}
