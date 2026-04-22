import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

export default function Dashboard() {
  const [instances, setInstances] = useState([])
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('status')
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [qrStatus, setQrStatus] = useState('loading') 
  const [chats, setChats] = useState([])
  const [leads, setLeads] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [stats, setStats] = useState({ chats: 0, contacts: 0, messages: 0, savedTime: '0h', roi: 'R$ 0', activity: [0,0,0,0,0,0,0] })
  const [financeData, setFinanceData] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedSession = localStorage.getItem('zb_session')
    if (!savedSession) {
      navigate('/login')
      return
    }
    
    const parsed = JSON.parse(savedSession)
    setSession(parsed)
    
    if (parsed.email === 'richardrovigati@gmail.com' || parsed.phone === '5521969875522') {
      setIsAdmin(true)
    }

    let p = parsed.systemPrompt || ''
    // Lógica robusta para esconder cabeçalhos [SISTEMA]
    const cleanP = p.replace(/\[SISTEMA.*?\][\s\S]*?Fim\./g, '').trim()
    setPrompt(cleanP || p)
    
    setWebhookUrl(parsed.webhookUrl || '')
    setNotificationEmail(parsed.notificationEmail || parsed.email || '')
    setInstances([{ name: parsed.instanceName || parsed.phone, label: 'Instância Principal' }])
    setSelectedInstance(parsed.instanceName || parsed.phone)
    setLoadingData(false)
  }, [navigate])

  useEffect(() => {
    if (selectedInstance) {
      fetchStats(selectedInstance)
      if (activeTab === 'mensagens') fetchChats(selectedInstance)
      if (activeTab === 'leads') fetchLeads(selectedInstance)
      if (activeTab === 'financeiro') fetchFinance(selectedInstance)
      if (activeTab === 'conexao' || activeTab === 'status') fetchQrCode(selectedInstance)
    }
    setMobileMenuOpen(false)
  }, [activeTab, selectedInstance])

  const fetchStats = async (instanceName) => {
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-stats', instanceName })
      })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        if (data.status === 'open' || data.status === 'CONNECTED') setQrStatus('CONNECTED')
      }
    } catch (err) { console.error('ERRO STATS:', err) }
  }

  const fetchFinance = async (instanceName) => {
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-finance', instanceName })
      })
      const data = await res.json()
      if (data.success) setFinanceData(data)
    } catch (err) { console.error('ERRO FINANCE:', err) }
  }

  const fetchQrCode = async (instanceName) => {
    if (!instanceName) return;
    try {
      setQrStatus('loading')
      const res = await fetch('/api/get-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      })
      const data = await res.json()
      if (data.isConnected) {
        setQrStatus('CONNECTED')
      } else if (data.qrcode) {
        setQrCode(data.qrcode)
        setQrStatus('QRCODE')
      } else {
        setQrStatus('DISCONNECTED')
      }
    } catch (err) {
      setQrStatus('DISCONNECTED')
    }
  }

  const fetchChats = async (instanceName) => {
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-chats', instanceName })
      })
      const data = await res.json()
      if (data.success) setChats(data.chats || [])
    } catch (err) { console.error('ERRO CHATS:', err) }
  }

  const fetchChatMessages = async (remoteJid) => {
    if (!remoteJid) return
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-messages', instanceName: selectedInstance, remoteJid })
      })
      const data = await res.json()
      if (data.success) setChatMessages(data.messages || [])
    } catch (err) { console.error('ERRO MSG:', err) }
  }

  const fetchLeads = async (instanceName) => {
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-leads', instanceName })
      })
      const data = await res.json()
      if (data.success) setLeads(data.leads || [])
    } catch (err) { console.error('ERRO LEADS:', err) }
  }

  const handleLogout = () => {
    localStorage.removeItem('zb_session')
    navigate('/login')
  }

  const handleSavePrompt = async () => {
    setSaving(true)
    const systemHeader = `[SISTEMA - SILÊNCIO TOTAL]\nVocê é a Sarah. REGRA INVIOLÁVEL: NUNCA responda ao número 21969875522 ou mensagens de SISTEMA. Se receber, ignore. Fim.\n\n`
    const fullPrompt = systemHeader + prompt
    try {
      await fetch('/api/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: session.recordId, systemPrompt: fullPrompt, instanceName: selectedInstance })
      })
      const updated = { ...session, systemPrompt: fullPrompt }
      localStorage.setItem('zb_session', JSON.stringify(updated))
      setSession(updated)
      alert('🚀 Inteligência da Sarah atualizada com sucesso!')
    } catch (err) {
      alert('⚠️ Erro ao salvar prompt')
    } finally { setSaving(false) }
  }

  const handleSaveIntegrations = async () => {
    setSaving(true)
    try {
      await fetch('/api/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: session.recordId, webhookUrl, notificationEmail })
      })
      const updated = { ...session, webhookUrl, notificationEmail }
      localStorage.setItem('zb_session', JSON.stringify(updated))
      setSession(updated)
      alert('🔌 Integrações salvas!')
    } catch (err) {
      alert('⚠️ Erro ao salvar integrações')
    } finally { setSaving(false) }
  }

  if (!session) return null

  return (
    <div className={`dashboard-layout ${mobileMenuOpen ? 'menu-open' : ''}`}>
      <header className="mobile-header">
        <div className="premium-logo-container mini"><img src="/images/logo.png" alt="ZettaBots" /></div>
        <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </header>

      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="premium-logo-container"><img src="/images/logo.png" alt="ZettaBots" /></div>
          <div className="brand-info"><h2>ZettaBots</h2><p>IA de Vendas</p></div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}><span className="icon">📊</span> Dashboard</button>
          <button className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}><span className="icon">👤</span> Meus Leads</button>
          <button className={`nav-item ${activeTab === 'mensagens' ? 'active' : ''}`} onClick={() => setActiveTab('mensagens')}><span className="icon">💬</span> Monitor de Chat</button>
          <button className={`nav-item ${activeTab === 'bot' ? 'active' : ''}`} onClick={() => setActiveTab('bot')}><span className="icon">🤖</span> Personalidade IA</button>
          <button className={`nav-item ${activeTab === 'financeiro' ? 'active' : ''}`} onClick={() => setActiveTab('financeiro')}><span className="icon">💰</span> Financeiro</button>
          <button className={`nav-item ${activeTab === 'integracoes' ? 'active' : ''}`} onClick={() => setActiveTab('integracoes')}><span className="icon">🔌</span> Integrações</button>
          <button className={`nav-item ${activeTab === 'conexao' ? 'active' : ''}`} onClick={() => setActiveTab('conexao')}><span className="icon">🔗</span> Conexão</button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><span className="icon">🚪</span> Sair</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <div className="header-title"><h1>Bem-vindo, {session.name || 'Usuário'}</h1><p>{activeTab.toUpperCase()}</p></div>
          <div className="plan-badge" onClick={() => setShowSubModal(true)} style={{cursor: 'pointer'}}>⭐ Plano {session.status === 'pago' ? 'PRO' : 'TRIAL'}</div>
        </header>

        {activeTab === 'status' && (
          <div className="tab-panel">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">👤</div>
                <div className="stat-info"><span className="stat-label">Leads Capturados</span><span className="stat-value">{stats.contacts}</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">💬</div>
                <div className="stat-info"><span className="stat-label">Conversas Ativas</span><span className="stat-value">{stats.chats}</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">🕒</div>
                <div className="stat-info"><span className="stat-label">Tempo Economizado</span><span className="stat-value">{stats.savedTime}</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">💰</div>
                <div className="stat-info"><span className="stat-label">ROI Estimado</span><span className="stat-value">{stats.roi}</span></div>
              </div>
            </div>

            <div className="glass-card activity-section">
              <h3>Atividade da IA (Mensagens/Dia)</h3>
              <div className="chart-container" style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '15px', paddingTop: '30px' }}>
                {(stats.activity || [10, 20, 30, 40, 50, 60, 70]).map((val, i) => (
                  <div key={i} className="chart-bar-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <span style={{ fontSize: '0.7rem', color: '#7c3aed', marginBottom: '5px', fontWeight: 'bold' }}>{val}</span>
                    <div className="chart-bar" style={{ width: '100%', background: 'linear-gradient(to top, #7c3aed, #06b6d4)', height: `${(val / (Math.max(...stats.activity, 1) || 1)) * 100}%`, borderRadius: '8px 8px 0 0', transition: 'height 0.5s ease' }}></div>
                    <span style={{ marginTop: '8px', fontSize: '0.65rem', color: '#a1a1aa' }}>{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="tab-panel">
            <div className="glass-card">
              <h3>Lista de Leads Capturados</h3>
              <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '1rem', color: '#a1a1aa' }}>NOME</th>
                      <th style={{ padding: '1rem', color: '#a1a1aa' }}>WHATSAPP</th>
                      <th style={{ padding: '1rem', color: '#a1a1aa' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{lead.name}</td>
                        <td style={{ padding: '1rem', color: '#a1a1aa' }}>{lead.phone}</td>
                        <td style={{ padding: '1rem' }}><span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '0.7rem' }}>{lead.status}</span></td>
                      </tr>
                    ))}
                    {leads.length === 0 && <tr><td colSpan="3" style={{padding: '2rem', textAlign: 'center', color: '#a1a1aa'}}>Aguardando primeiros leads...</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mensagens' && (
          <div className="chat-monitor-container">
            <div className="chat-list-panel">
              <div className="panel-header"><h3>Conversas Ativas</h3></div>
              <div className="conversations-scroll">
                {chats.map((chat, i) => (
                  <div className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`} key={i} onClick={() => {setSelectedChat(chat); fetchChatMessages(chat.id)}}>
                    <div className="chat-item-header"><span className="chat-name">{chat.user}</span><span className="chat-time">{chat.time}</span></div>
                    <p className="chat-status">{chat.lastMsg}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="chat-window-panel">
              {selectedChat ? (
                <>
                  <div className="chat-header"><h4>{selectedChat.user}</h4></div>
                  <div className="messages-container">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`message ${msg.fromMe ? 'sent' : 'received'}`}>{msg.text}</div>
                    ))}
                  </div>
                </>
              ) : <div className="chat-empty-state"><p>Selecione uma conversa para monitorar a IA.</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="tab-panel">
            <div className="glass-card">
              <h3>Treinar Personalidade da IA</h3>
              <p style={{fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '1rem'}}>Defina como sua IA deve se comportar e quais produtos ela deve vender.</p>
              <textarea className="prompt-editor" rows="12" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px' }} />
              <button onClick={handleSavePrompt} disabled={saving} className="btn-primary" style={{marginTop: '1rem'}}>{saving ? 'Salvando...' : 'Salvar Personalidade'}</button>
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="tab-panel">
            <div className="finance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="glass-card finance-card">
                <h3>Sua Assinatura</h3>
                {financeData ? (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '15px', marginBottom: '1rem', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                      <p style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Plano Atual</p>
                      <h4 style={{ fontSize: '1.4rem', color: 'white' }}>{financeData.plan}</h4>
                      <span style={{ display: 'inline-block', padding: '4px 12px', background: '#10b981', color: 'white', borderRadius: '20px', fontSize: '0.7rem', marginTop: '10px' }}>{financeData.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                      <span style={{ color: '#a1a1aa' }}>Próxima Cobrança:</span>
                      <span style={{ fontWeight: 'bold' }}>{financeData.nextBilling}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#a1a1aa' }}>Valor:</span>
                      <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{financeData.value}</span>
                    </div>
                    <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => window.open('https://wa.me/5521969875522', '_blank')}>Falar com Suporte</button>
                  </div>
                ) : <div className="spinner"></div>}
              </div>

              <div className="glass-card finance-card">
                <h3>Faturas Recentes</h3>
                <div style={{ marginTop: '1rem' }}>
                  {financeData?.invoices.map((inv, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{inv.id}</p>
                        <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: 0 }}>{inv.date}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 'bold', color: '#10b981', margin: 0 }}>{inv.value}</p>
                        <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: 0 }}>{inv.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="tab-panel">
            <div className="glass-card">
              <h3>🔌 Integrações Externas</h3>
              <div style={{padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', marginTop: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem'}}>URL do seu Webhook (Make/n8n/Zapier)</label>
                <input type="text" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} style={{width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white'}} />
                <button onClick={handleSaveIntegrations} className="btn-primary" style={{marginTop: '1rem'}}>Salvar Endpoint</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conexao' && (
          <div className="tab-panel">
            <div className="glass-card" style={{textAlign: 'center', padding: '3rem'}}>
              <h3 style={{marginBottom: '2rem'}}>Conexão WhatsApp</h3>
              <div style={{background: 'white', padding: '1.5rem', borderRadius: '24px', display: 'inline-block', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'}}>
                {qrStatus === 'CONNECTED' ? <div style={{width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '6rem'}}>✅</div> : 
                 qrCode ? <img src={qrCode} alt="QR" style={{width: '240px', height: '240px'}} /> : <div className="spinner" style={{width: '60px', height: '60px'}}></div>}
              </div>
              <div style={{marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '15px'}}>
                <button onClick={() => fetchQrCode(selectedInstance)} className="btn-secondary">Atualizar Status</button>
                <button onClick={() => alert('Recurso em desenvolvimento: Reset de Instância')} className="btn-danger">Resetar WhatsApp</button>
              </div>
              <p style={{marginTop: '2rem', color: '#a1a1aa', fontSize: '0.85rem'}}>Aponte o WhatsApp para o QR Code acima para conectar sua instância.</p>
            </div>
          </div>
        )}
      </main>

      {showSubModal && (
        <div className="modal-overlay" onClick={() => setShowSubModal(false)}>
          <div className="glass-card modal-content" onClick={e => e.stopPropagation()}>
            <h3>💎 Gestão de Assinatura</h3>
            <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div style={{padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                <p style={{fontSize: '0.8rem', color: '#a1a1aa'}}>Plano Atual</p>
                <p style={{fontSize: '1.2rem', fontWeight: 'bold'}}>ZettaBots {session.status === 'pago' ? 'PRO' : 'TRIAL'}</p>
              </div>
              <div style={{padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                <p style={{fontSize: '0.8rem', color: '#a1a1aa'}}>Próximo Vencimento</p>
                <p style={{fontSize: '1.1rem'}}>{session.expiryDate || '21/05/2026'}</p>
              </div>
              <button className="btn-primary" onClick={() => alert('Encaminhando para checkout...')}>Fazer Upgrade Business</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
