import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRequestCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Auto adiciona o '55' do Brasil se a pessoa digitar só o DDD + Número
    let formattedPhone = phone
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = '55' + formattedPhone
    }
    
    try {
      const response = await fetch('/api/auth-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      })
      
      if (!response.ok) {
        throw new Error('Número não encontrado. Verifique se você já é cliente ZettaBots.')
      }
      
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    let formattedPhone = phone
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = '55' + formattedPhone
    }
    
    try {
      const response = await fetch('/api/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code })
      })
      
      if (!response.ok) {
        throw new Error('Código inválido ou expirado.')
      }
      
      const data = await response.json()
      // Guarda a sessão (simples via localStorage para o MVP)
      localStorage.setItem('zb_session', JSON.stringify({
        recordId: data.recordId,
        instanceName: data.instanceName,
        phone: data.phone,
        status: data.status,
        systemPrompt: data.systemPrompt
      }))
      
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-glass-panel">
        <div className="login-header">
          <img src="/images/logo.png" alt="ZettaBots Logo" className="login-logo" style={{ background: 'transparent !important', filter: 'none !important' }} />
          <h2>Painel do Cliente</h2>
          <p>Gerencie sua IA e conecte seu WhatsApp</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="login-form">
            <div className="input-group">
              <label htmlFor="phone">Seu WhatsApp (com DDD)</label>
              <input
                type="text"
                id="phone"
                placeholder="Ex: 11999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                required
                maxLength="13"
              />
              <small>Enviaremos um código de acesso para este número.</small>
            </div>
            <button type="submit" className="btn-primary" disabled={loading || phone.length < 10}>
              {loading ? 'Enviando...' : 'Receber Código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="login-form">
            <div className="input-group">
              <label htmlFor="code">Código de Acesso</label>
              <input
                type="text"
                id="code"
                placeholder="Digite os 4 dígitos"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 4))}
                disabled={loading}
                required
                maxLength="4"
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem' }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || code.length < 4}>
              {loading ? 'Verificando...' : 'Entrar no Painel'}
            </button>
            <button type="button" className="btn-link" onClick={() => setStep(1)} disabled={loading}>
              Tentar outro número
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
