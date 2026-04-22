import { useState, useEffect } from 'react'
import { validateForm, loadRecaptcha } from '../utils/validation'
import { trackFormSubmit } from '../utils/analytics'
import './LeadForm.css'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER

export default function LeadForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', segment: '', businessName: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')

  const segments = [
    'E-commerce / Loja virtual',
    'Moda e vestuário',
    'Alimentação / Restaurante',
    'Serviços / Consultoria',
    'Saúde e beleza',
    'Imóveis',
    'Educação',
    'Outro',
  ]

  useEffect(() => {
    loadRecaptcha()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setLoading(true)

    // Validate form
    const { isValid, errors: validationErrors } = validateForm(form)
    if (!isValid) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          segment: form.segment,
          businessName: form.businessName,
        }),
      })

      if (res.ok) {
        trackFormSubmit(form)
        setSubmitted(true)
        setForm({ name: '', email: '', phone: '', segment: '', businessName: '' })
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Subscribe error:', res.status, errorData)
        setError('Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.')
      }
    } catch (err) {
      console.error('Form submit error:', err)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Me cadastrei no ZettaBots e quero começar meu teste grátis de 7 dias!')}`

  if (!WHATSAPP_NUMBER) {
    return (
      <section className="lead-form section" id="contato">
        <div className="container">
          <p style={{ color: 'red', padding: '20px' }}>
            ⚠️ Erro: variáveis de ambiente não configuradas. Verifique .env.local
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="lead-form section" id="contato">
      <div className="container">
        <div className="lead-form-inner">
          <div className="lead-form-left">
            <span className="section-label">🎯 Comece agora</span>
            <h2 className="section-title">
              Teste o ZettaBots<br />
              <span className="gradient-text-green">grátis por 7 dias</span>
            </h2>
            <p className="section-subtitle">
              Sem cartão de crédito. Sem contrato. Configure em <strong>apenas 5 minutos</strong> e veja os resultados ainda hoje.
            </p>

            <div className="form-benefits">
              {[
                { icon: '✨', text: '7 dias completamente grátis' },
                { icon: '🚀', text: 'Configuração guiada passo a passo' },
                { icon: '👨‍💻', text: 'Suporte humano via WhatsApp' },
                { icon: '🛡️', text: 'Cancele quando quiser' },
              ].map((b, i) => (
                <div className="form-benefit" key={i}>
                  <span className="benefit-icon">{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>

          </div>

          <div className="lead-form-right">
            {submitted ? (
              <div className="form-success">
                <div className="success-icon">🎉</div>
                <h3>Cadastro recebido!</h3>
                <p>Nossa equipe vai entrar em contato via WhatsApp em até <strong>2 horas</strong> para liberar seu acesso.</p>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Falar agora no WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form" noValidate>
                <h3 className="form-title">Criar conta grátis</h3>

                <div className="form-group">
                  <label htmlFor="name">Seu nome</label>
                  <input type="text" id="name" name="name" placeholder="João Silva"
                    value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
                  {errors.name && <span className="form-field-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">E-mail</label>
                  <input type="email" id="email" name="email" placeholder="joao@empresa.com.br"
                    value={form.email} onChange={handleChange} aria-invalid={!!errors.email} />
                  {errors.email && <span className="form-field-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">WhatsApp</label>
                  <input type="tel" id="phone" name="phone" placeholder="(11) 99999-9999"
                    value={form.phone} onChange={handleChange} aria-invalid={!!errors.phone} />
                  {errors.phone && <span className="form-field-error">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="segment">Segmento do negócio</label>
                  <select id="segment" name="segment" value={form.segment} onChange={handleChange} aria-invalid={!!errors.segment}>
                    <option value="">Selecione...</option>
                    {segments.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.segment && <span className="form-field-error">{errors.segment}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="businessName">Nome do seu negócio</label>
                  <input type="text" id="businessName" name="businessName" placeholder="Ex: Restaurante do João"
                    value={form.businessName} onChange={handleChange} aria-invalid={!!errors.businessName} />
                  {errors.businessName && <span className="form-field-error">{errors.businessName}</span>}
                </div>

                {error && <p className="form-error">{error}</p>}

                <button type="submit" className="btn-whatsapp form-submit" disabled={loading}>
                  {loading ? <span>Enviando...</span> : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Quero testar grátis por 7 dias
                    </>
                  )}
                </button>

                <div className="form-trust">
                  <div className="form-trust-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Sem cartão de crédito
                  </div>
                  <div className="form-trust-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Ambiente 100% seguro
                  </div>
                </div>

                <p className="form-privacy">🔒 Seus dados estão seguros. Não enviamos spam.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
