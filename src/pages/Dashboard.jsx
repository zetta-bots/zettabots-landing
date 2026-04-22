import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('status')
  const [instances, setInstances] = useState([])
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [qrStatus, setQrStatus] = useState('loading') 
  const [chats, setChats] = useState([])
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({ chats: 0, contacts: 0, messages: 0 })
  const [showSubModal, setShowSubModal] = useState(false)
  const [pixData, setPixData] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [allClients, setAllClients] = useState([])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  // 1. Inicialização da Sessão (Lógica Original)
  useEffect(() => {
    const saved = localStorage.getItem('zb_session')
    if (!saved) { navigate('/login'); return; }
    const parsed = JSON.parse(saved)
    setSession(parsed)
    setPrompt(parsed.systemPrompt || '')
    const inst = parsed.instanceName || parsed.phone
    setSelectedInstance(inst)
    setInstances([{ name: inst, label: 'Principal' }])
    
    if (parsed.email === 'richardrovigati@gmail.com' || parsed.phone === '5511999999999') {
      setIsAdmin(true)
    }
  }, [navigate])

  // 2. Motor de Sincronização (Robustez Sênior)
  const syncDashboard = useCallback(async () => {
    if (!selectedInstance) return
    try {
      // Busca Status e Métricas via Proxy Seguro
      const res = await fetch('/api/get-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: selectedInstance })
      })
      const data = await res.json()

      if (data.status === 'CONNECTED') {
        setQrStatus('CONNECTED')
        if (data.stats) {
          setStats({
            chats: data.stats.chats || 0,
            contacts: data.stats.contacts || 0,
            messages: data.stats.messages || 0
          })
        }
      } else if (data.status === 'QRCODE') {
        setQrStatus('QRCODE')
        setQrCode(data.qrcode)
      } else {
        setQrStatus('DISCONNECTED')
      }
    } catch (err) {
      console.error('Erro de Sincronização:', err)
    }
  }, [selectedInstance])

  useEffect(() => {
    syncDashboard()
    const interval = setInterval(syncDashboard, 15000) // Refresh a cada 15s
    return () => clearInterval(interval)
  }, [syncDashboard])

  // 3. Gerenciamento de Conteúdo (Leads, Chats, Mensagens)
  useEffect(() => {
    if (selectedInstance && activeTab === 'mensagens') fetchChats()
    if (selectedInstance && activeTab === 'leads') fetchLeads()
    if (isAdmin && activeTab === 'admin') fetchAllClients()
  }, [activeTab, selectedInstance, isAdmin])

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/get-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: selectedInstance })
      })
      const data = await res.json()
      setChats(data.chats || data || [])
    } catch (err) { console.error(err) }
  }

  const fetchChatMessages = async (remoteJid) => {
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const res = await fetch(`${url}/chat/findMessages/${selectedInstance}`, {
        method: 'POST',
        headers: { 'apikey': apikey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: { remoteJid }, take: 50 })
      })
      const data = await res.json()
      const msgs = Array.isArray(data) ? data : (data.messages || [])
      setChatMessages(msgs.reverse())
    } catch (err) { console.error(err) }
  }

  const fetchLeads = async () => {
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const res = await fetch(`${url}/chat/findContacts/${selectedInstance}`, {
        method: 'POST', headers: { 'apikey': apikey }, body: JSON.stringify({})
      })
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : (data.contacts || []))
    } catch (err) { console.error(err) }
  }

  const fetchAllClients = async () => {
    try {
      const res = await fetch('https://api.airtable.com/v0/appQkUKRhf7rKotbT/tblu2DjzxbgZ84PL6', {
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_AIRTABLE_TOKEN}` }
      })
      const data = await res.json()
      setAllClients(data.records || [])
    } catch (err) { console.error(err) }
  }

  const handleSavePrompt = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: session.recordId, systemPrompt: prompt })
      })
      if (res.ok) alert('Inteligência Sarah Atualizada!')
    } finally { setSaving(false) }
  }

  const handleUpgrade = async () => {
    const res = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: session.recordId, email: session.email })
    })
    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
  }

  const handleGeneratePix = async () => {
    const res = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: session.recordId, email: session.email })
    })
    const data = await res.json()
    if (data.qr_code_base64) setPixData(data)
  }

  if (!session) return null
  const msgLimit = 5000
  const msgPercent = Math.min((stats.messages / msgLimit) * 100, 100)

  return (
    <div className={`dashboard-layout ${showSubModal ? 'modal-open' : ''} ${mobileMenuOpen ? 'menu-open' : ''}`}>
      
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="premium-logo-container mini"><img src="/images/logo.png" alt="ZettaBots" /></div>
        <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><span></span><span></span><span></span></button>
      </header>

      {/* Sidebar Completa Restaurada */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="premium-logo-container"><img src="/images/logo.png" alt="ZettaBots" /></div>
          <div className="brand-info"><h2>ZettaBots</h2><p>Vendas Inteligentes</p></div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}><span className="icon">📊</span> Visão Geral</button>
          <button className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}><span className="icon">👤</span> Leads Capturados</button>
          <button className={`nav-item ${activeTab === 'mensagens' ? 'active' : ''}`} onClick={() => setActiveTab('mensagens')}><span className="icon">💬</span> Monitorar Chat</button>
          <button className={`nav-item ${activeTab === 'bot' ? 'active' : ''}`} onClick={() => setActiveTab('bot')}><span className="icon">🤖</span> Treinar IA</button>
          <button className={`nav-item ${activeTab === 'integracoes' ? 'active' : ''}`} onClick={() => setActiveTab('integracoes')}><span className="icon">🔌</span> Integrações</button>
          <button className={`nav-item ${activeTab === 'conexao' ? 'active' : ''}`} onClick={() => setActiveTab('conexao')}><span className="icon">🔗</span> Conexão</button>
          {isAdmin && <button className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}><span className="icon">👑</span> Admin Master</button>}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => { localStorage.removeItem('zb_session'); navigate('/login'); }}><span className="icon">🚪</span> Sair</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <div className="header-title"><h1>{activeTab.toUpperCase()}</h1><p className="breadcrumb">Início &gt; {activeTab}</p></div>
          <div className="plan-badge" onClick={() => setShowSubModal(true)} style={{ cursor: 'pointer' }}>⭐ {session.plan === 'pago' ? 'PLANO PRO' : 'PLANO TRIAL'}</div>
        </header>

        {/* Abas e Conteúdo Restaurados */}
        {activeTab === 'status' && (
          <div className="tab-panel">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon purple">👤</div><div className="stat-info"><span className="stat-label">Leads</span><span className="stat-value">{stats.contacts}</span></div></div>
              <div className="stat-card"><div className="stat-icon blue">💬</div><div className="stat-info"><span className="stat-label">Conversas</span><span className="stat-value">{stats.chats}</span></div></div>
              <div className="stat-card"><div className="stat-icon green">🕒</div><div className="stat-info"><span className="stat-label">Economia</span><span className="stat-value">{Math.floor((stats.messages * 2) / 60)}h</span></div></div>
              <div className="stat-card"><div className="stat-icon orange">💰</div><div className="stat-info"><span className="stat-label">ROI (Mês)</span><span className="stat-value">R$ {(stats.messages * 1.5).toLocaleString('pt-BR')}</span></div></div>
            </div>
            <div className="glass-card">
              <h3>🚀 Status da Operação</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                <div className="onboarding-step-mini" style={{ borderLeft: qrStatus === 'CONNECTED' ? '4px solid #10b981' : '4px solid #7c3aed' }}>
                  <strong>WhatsApp</strong><p>{qrStatus === 'CONNECTED' ? '✅ Conectado' : '❌ Pendente'}</p>
                </div>
                <div className="onboarding-step-mini" style={{ borderLeft: prompt.length > 20 ? '4px solid #10b981' : '4px solid #7c3aed' }}>
                  <strong>Cérebro IA</strong><p>{prompt.length > 20 ? '✅ Configurado' : '❌ Treinar Sarah'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="glass-card">
            <h3>Leads Identificados pela Sarah</h3>
            <div className="table-container" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
              <table className="leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left', color: '#a1a1aa', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{ padding: '1rem' }}>Nome</th><th style={{ padding: '1rem' }}>WhatsApp</th><th style={{ padding: '1rem' }}>Status</th></tr></thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>{l.name || l.pushName || 'Lead'}</td>
                      <td style={{ padding: '1rem' }}>{(l.id || '').split('@')[0]}</td>
                      <td style={{ padding: '1rem' }}><span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Ativo</span></td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Buscando contatos...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mensagens' && (
          <div className="chat-monitor-container">
            <div className="chat-list-panel">
              <div className="panel-header"><h3>Chats Ativos</h3></div>
              <div className="conversations-scroll">
                {chats.map((c, i) => (
                  <div className={`chat-item ${selectedChat?.id === c.id ? 'active' : ''}`} key={i} onClick={() => { setSelectedChat(c); fetchChatMessages(c.id || c.remoteJid); }}>
                    <div className="chat-item-header"><strong>{c.name || c.pushName || 'Cliente'}</strong></div>
                    <p className="chat-status">Aguardando resposta...</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="chat-window-panel">
              {selectedChat ? (
                <div className="messages-container">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`message ${m.key?.fromMe ? 'sent' : 'received'}`}>{m.message?.conversation || m.message?.extendedTextMessage?.text || 'Mídia'}</div>
                  ))}
                </div>
              ) : <div className="chat-empty-state"><p>Selecione uma conversa para monitorar a Sarah.</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="glass-card">
            <h3>Treinar Inteligência da Sarah</h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Defina como a Sarah deve se comportar e quais as regras de negócio.</p>
            <textarea className="prompt-editor" rows="18" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '1.5rem', borderRadius: '12px', lineHeight: '1.6' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}><button onClick={handleSavePrompt} disabled={saving} style={{ padding: '1rem 2rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Salvar e Treinar IA</button></div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="glass-card">
            <h3>Plug-ins e Webhooks</h3>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(124, 58, 237, 0.3)', marginTop: '1.5rem', maxWidth: '500px' }}>
              <h4>📧 Alertas por E-mail</h4><p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.5rem 0 1.5rem' }}>Receba novos leads no seu e-mail em tempo real.</p>
              <input type="email" placeholder="seu@email.com" defaultValue={session.email} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', marginBottom: '1rem' }} />
              <button style={{ width: '100%', padding: '0.8rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600' }} onClick={() => alert('Configurado!')}>Ativar Alertas</button>
            </div>
          </div>
        )}

        {activeTab === 'conexao' && (
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <h3>WhatsApp Sync</h3>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', display: 'inline-block', marginTop: '2rem' }}>
              {qrStatus === 'CONNECTED' ? <div style={{ color: '#10b981' }}>✅ Conectado com Sucesso!</div> : (qrCode ? <img src={qrCode} alt="QR" style={{ width: '250px' }} /> : <div className="spinner"></div>)}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="glass-card">
            <h3>👑 Gerenciar Clientes (Master)</h3>
            <div className="table-container" style={{ marginTop: '1.5rem' }}>
              <table className="leads-table" style={{ width: '100%' }}>
                <thead><tr style={{ textAlign: 'left', color: '#a1a1aa' }}><th>Cliente</th><th>Instância</th><th>Plano</th><th>Status</th></tr></thead>
                <tbody>{allClients.map((c, i) => (<tr key={i}><td style={{ padding: '1rem' }}>{c.fields.name}</td><td style={{ padding: '1rem' }}>{c.fields.instanceName}</td><td style={{ padding: '1rem' }}>{c.fields.plan}</td><td style={{ padding: '1rem' }}>{c.fields.status}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Financeiro Restaurado */}
      {showSubModal && (
        <div className="modal-overlay" onClick={() => setShowSubModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%' }}>
            <h2>Gerenciar Assinatura</h2>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '15px', margin: '1.5rem 0' }}>
              <p>Mensagens Enviadas: {stats.messages} / {msgLimit}</p>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginTop: '10px' }}><div style={{ width: `${msgPercent}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', borderRadius: '10px' }}></div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button onClick={handleUpgrade} style={{ padding: '1rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Pagar com Cartão</button>
              <button onClick={handleGeneratePix} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>Pagar via PIX</button>
            </div>
            {pixData && (
              <div style={{ marginTop: '2rem', textAlign: 'center', background: 'white', padding: '1.5rem', borderRadius: '20px' }}>
                <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="PIX" style={{ width: '220px' }} />
                <p style={{ color: '#333', fontSize: '0.9rem', marginTop: '1rem' }}>Pague via PIX para liberação imediata</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
