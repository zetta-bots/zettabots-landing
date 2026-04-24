import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const MediaMessage = ({ msg, instanceName }) => {
  const [media, setMedia] = useState(null);
  useEffect(() => {
    if (msg.id && (msg.type === 'image' || msg.type === 'audio')) {
      fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-media', instanceName, messageId: msg.id })
      }).then(r => r.json()).then(data => {
        if(data.success) setMedia(`data:${data.mimetype};base64,${data.base64}`);
      }).catch(e => console.error(e));
    }
  }, [msg.id, msg.type, instanceName]);

  if (!media) return <span>{msg.text} <small style={{opacity: 0.6}}>(Carregando mídia...)</small></span>;
  
  if (msg.type === 'image') return <img src={media} alt="Mídia" style={{maxWidth: '100%', borderRadius: '8px', marginTop: '5px'}} />;
  if (msg.type === 'audio') return <audio controls src={media} style={{maxWidth: '240px', height: '40px', marginTop: '5px'}} />;
  return <span>{msg.text}</span>;
}

export default function Dashboard() {
  const [instances, setInstances] = useState([])
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('status')
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [qrStatus, setQrStatus] = useState('loading')
  const [qrTimer, setQrTimer] = useState(40)
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
  const [allInstances, setAllInstances] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [showSubModal, setShowSubModal] = useState(false)
  const [isAIPaused, setIsAIPaused] = useState(false)
  const [checkoutPix, setCheckoutPix] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const navigate = useNavigate()

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

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
      if (activeTab === 'admin' && isAdmin) fetchAllInstances()
    }
    setMobileMenuOpen(false)
  }, [activeTab, selectedInstance])

  const fetchAllInstances = async () => {
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-all-instances', instanceName: selectedInstance, email: session.email })
      })
      const data = await res.json()
      if (data.success) setAllInstances(data.instances)
    } catch (err) { console.error('ERRO ADMIN:', err) }
  }

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
        body: JSON.stringify({ action: 'get-finance', instanceName, email: session.email })
      })
      const data = await res.json()
      if (data.success) setFinanceData(data)
    } catch (err) { console.error('ERRO FINANCE:', err) }
  }

  const fetchQrCode = async (instanceName) => {
    if (!instanceName) return;
    try {
      setQrStatus('loading')
      setQrCode(null)
      const res = await fetch('/api/get-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      })
      const data = await res.json()
      if (data._debug) console.warn('[get-qr debug]', data._debug)
      if (data.status === 'CONNECTED') {
        setQrStatus('CONNECTED')
      } else if (data.qrcode) {
        setQrCode(data.qrcode)
        setQrStatus('QRCODE')
        setQrTimer(40)
      } else if (data.status === 'NOT_FOUND') {
        setQrStatus('NOT_FOUND')
      } else {
        setQrStatus('DISCONNECTED')
      }
    } catch (err) {
      console.error('[get-qr error]', err)
      setQrStatus('DISCONNECTED')
    }
  }

  useEffect(() => {
    if (qrStatus !== 'QRCODE') return
    if (qrTimer <= 0) {
      fetchQrCode(selectedInstance)
      return
    }
    const t = setTimeout(() => setQrTimer(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [qrStatus, qrTimer])

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
        body: JSON.stringify({ action: 'get-leads', instanceName, email: session.email })
      })
      const data = await res.json()
      if (data.success) setLeads(data.leads || [])
    } catch (err) { console.error('LEADS ERROR:', err) }
  }

  const handleToggleAI = async () => {
    const nextState = !isAIPaused;
    setIsAIPaused(nextState);
    showToast(nextState ? 'Pausando IA...' : 'Reativando IA...', 'info');
    
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'toggle-ai',
          instanceName: selectedInstance, 
          enabled: !nextState,
          systemPrompt: session.systemPrompt || prompt 
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(nextState ? 'IA Sarah Pausada. Você está no controle.' : 'IA Sarah Reativada!', 'success');
      } else {
        setIsAIPaused(!nextState);
        showToast('Erro ao alterar status da IA', 'error');
      }
    } catch (err) {
      setIsAIPaused(!nextState);
      showToast('Erro de conexão ao alterar IA', 'error');
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('zb_session')
    navigate('/login')
  }

  const handleGeneratePix = async (method = 'pix') => {
    try {
      setCheckoutLoading(true)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recordId: session.recordId || session.id, 
          email: session.email, 
          name: session.name,
          payment_method: method,
          instanceName: selectedInstance
        })
      })
      const data = await res.json()
      if (data.success) {
        if (method === 'pix') {
          setCheckoutPix(data)
        } else if (data.init_point) {
          window.open(data.init_point, '_blank')
          setShowSubModal(false)
        }
      } else {
        showToast('Erro ao gerar cobrança', 'error')
      }
    } catch (err) {
      showToast('Erro de conexão com Mercado Pago', 'error')
    } finally {
      setCheckoutLoading(false)
    }
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
      showToast('🚀 Inteligência da Sarah atualizada com sucesso!', 'success')
    } catch (err) {
      showToast('⚠️ Erro ao salvar prompt', 'error')
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
      showToast('🔌 Integrações salvas!', 'success')
    } catch (err) {
      showToast('⚠️ Erro ao salvar integrações', 'error')
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
           {isAdmin && (
             <button className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')} style={{marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', color: '#fbbf24'}}><span className="icon">👑</span> Painel Admin</button>
           )}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><span className="icon">🚪</span> Sair</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <div className="header-title">
            <h1>{isAdmin ? 'ZettaBots Master' : `Bem-vindo, ${session.name || session.instanceName || ''}`}</h1>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <p>{activeTab === 'conexao' ? 'CONEXÃO' : activeTab.toUpperCase()}</p>
              {isAdmin && allInstances.length > 0 && (
                <select 
                  className="instance-selector-mini"
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                >
                  {allInstances.map(i => (
                    <option key={i.id} value={i.instance_name}>{i.instance_name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="plan-badge-v2">
            ⭐ PLANO {['pago', 'admin'].includes(session.status) ? 'PRO' : 'TRIAL'}
          </div>
        </header>

        {activeTab === 'status' && (
          <div className="tab-panel">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">👤</div>
                <div className="stat-info"><span className="stat-label">Leads Capturados</span><span className="stat-value">{leads.length || stats.contacts}</span></div>
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
                <div className="chat-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h4>{selectedChat.user}</h4>
                  <button 
                    className={`btn-${isAIPaused ? 'danger' : 'secondary'}`} 
                    onClick={handleToggleAI} 
                    style={{fontSize: '0.7rem', padding: '0.4rem 0.8rem'}}
                  >
                    {isAIPaused ? '🚫 IA PAUSADA' : '🤖 IA ATIVA'}
                  </button>
                </div>
                <div className="messages-container">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`message ${msg.fromMe ? 'sent' : 'received'} ${msg.type || 'text'}`}>
                      {['image', 'audio'].includes(msg.type) ? <MediaMessage msg={msg} instanceName={selectedInstance} /> : msg.text}
                      <span className="message-time">{msg.time}</span>
                    </div>
                  ))}
                  {chatMessages.length === 0 && <div className="chat-empty-state">Carregando histórico...</div>}
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
          <div className="tab-panel finance-container">
            <div className="finance-top-row">
              <div className="premium-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <h3 style={{margin: 0, fontSize: '1.4rem'}}>Sua Assinatura</h3>
                    <p style={{color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px'}}>Gestão de plano e faturamento</p>
                  </div>
                  <span className={`finance-badge ${financeData?.status || 'trial'}`}>
                    {financeData?.status === 'pago' ? 'PRO Ativo' : 'Trial'}
                  </span>
                </div>

                {financeData ? (
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                      <div className="stat-info">
                        <span className="stat-label">Plano Atual</span>
                        <span style={{fontSize: '1.1rem', fontWeight: '700'}}>{financeData.plan}</span>
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">Valor Mensal</span>
                        <span style={{fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-primary)'}}>{financeData.value}</span>
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">Próxima Cobrança</span>
                        <span style={{fontSize: '0.9rem', fontWeight: '600'}}>{financeData.nextBilling}</span>
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">ID do Cliente</span>
                        <span style={{fontSize: '0.9rem', fontWeight: '600', opacity: 0.5}}>{session.phone}</span>
                      </div>
                    </div>
                    
                    <div style={{display: 'flex', gap: '12px'}}>
                      <button className="btn-primary" style={{flex: 1}} onClick={() => setShowSubModal(true)}>🚀 Renovar / Mudar Plano</button>
                      <button className="btn-secondary" style={{padding: '0.8rem'}} onClick={() => window.open('https://wa.me/5521969875522', '_blank')}>💬 Suporte</button>
                    </div>
                  </div>
                ) : <div className="spinner"></div>}
              </div>

              <div className="premium-card">
                <h3 style={{fontSize: '1.1rem', marginBottom: '1.5rem'}}>Faturas Recentes</h3>
                <div className="invoice-list">
                  {financeData?.invoices.map((inv, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p style={{ fontWeight: '700', margin: 0, fontSize: '0.95rem' }}>{inv.id}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{inv.date}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '800', color: '#10b981', margin: 0 }}>{inv.value}</p>
                        <span style={{ fontSize: '0.65rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>{inv.status.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                  {!financeData?.invoices.length && <p style={{color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem'}}>Nenhuma fatura encontrada.</p>}
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
              <h3 style={{marginBottom: '0.5rem'}}>Conexão WhatsApp</h3>
              <p style={{color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '2rem'}}>
                {qrStatus === 'CONNECTED' && 'WhatsApp conectado e funcionando'}
                {qrStatus === 'QRCODE' && 'Abra o WhatsApp do seu negócio → Configurações → Aparelhos Conectados → Escanear QR'}
                {qrStatus === 'DISCONNECTED' && 'Instância desconectada. Gere um novo QR para conectar.'}
                {qrStatus === 'NOT_FOUND' && 'Instância não encontrada. Entre em contato com o suporte.'}
                {qrStatus === 'loading' && 'Verificando status da conexão...'}
              </p>

              <div style={{background: 'white', padding: '1.5rem', borderRadius: '24px', display: 'inline-block', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', position: 'relative'}}>
                {qrStatus === 'CONNECTED' && (
                  <div style={{width: '240px', height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#10b981'}}>
                    <div style={{fontSize: '5rem'}}>✅</div>
                    <div style={{fontSize: '1rem', fontWeight: 700, color: '#10b981', marginTop: '0.5rem'}}>Conectado</div>
                  </div>
                )}
                {qrStatus === 'QRCODE' && qrCode && (
                  <div style={{position: 'relative'}}>
                    <img src={qrCode} alt="QR Code WhatsApp" style={{width: '240px', height: '240px', display: 'block'}} />
                    <div style={{position: 'absolute', bottom: '8px', right: '8px', background: qrTimer <= 10 ? '#ef4444' : '#10b981', color: 'white', borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700}}>
                      {qrTimer}s
                    </div>
                  </div>
                )}
                {(qrStatus === 'loading' || (qrStatus === 'QRCODE' && !qrCode)) && (
                  <div style={{width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="spinner" style={{width: '60px', height: '60px'}}></div>
                  </div>
                )}
                {(qrStatus === 'DISCONNECTED' || qrStatus === 'NOT_FOUND') && (
                  <div style={{width: '240px', height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem'}}>
                    <div style={{fontSize: '3.5rem'}}>📵</div>
                    <div style={{fontSize: '0.9rem', fontWeight: 600, color: '#a1a1aa'}}>
                      {qrStatus === 'NOT_FOUND' ? 'Instância não encontrada' : 'Desconectado'}
                    </div>
                  </div>
                )}
              </div>

              {qrStatus === 'QRCODE' && (
                <p style={{marginTop: '1rem', color: qrTimer <= 10 ? '#ef4444' : '#a1a1aa', fontSize: '0.82rem', fontWeight: qrTimer <= 10 ? 700 : 400}}>
                  {qrTimer <= 10 ? `⚠️ QR expira em ${qrTimer}s — prepare o WhatsApp` : `QR atualiza automaticamente em ${qrTimer}s`}
                </p>
              )}

              <div style={{marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap'}}>
                <button onClick={() => fetchQrCode(selectedInstance)} className="btn-secondary" disabled={qrStatus === 'loading'}>
                  {qrStatus === 'loading' ? 'Carregando...' : qrStatus === 'CONNECTED' ? 'Verificar Status' : 'Gerar novo QR'}
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'admin' && isAdmin && (
          <div className="tab-panel">
            <div className="premium-card">
              <h3 style={{fontSize: '1.4rem'}}>👑 Gerenciamento Global</h3>
              <p style={{color: 'var(--color-text-muted)', marginBottom: '2rem'}}>Administre todos os clientes e instâncias do ecossistema ZettaBots.</p>
              
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--color-border)', textAlign: 'left'}}>
                      <th style={{padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>INSTÂNCIA</th>
                      <th style={{padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>WHATSAPP</th>
                      <th style={{padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>PLANO</th>
                      <th style={{padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>STATUS</th>
                      <th style={{padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allInstances.map((inst, i) => (
                      <tr key={i} style={{borderBottom: '1px solid rgba(255,255,255,0.02)'}}>
                        <td style={{padding: '1rem', fontWeight: 'bold'}}>{inst.instance_name}</td>
                        <td style={{padding: '1rem'}}>{inst.phone}</td>
                        <td style={{padding: '1rem'}}>{inst.plan || 'PRO'}</td>
                        <td style={{padding: '1rem'}}>
                          <span className={`finance-badge ${inst.status === 'pago' ? 'pago' : 'trial'}`} style={{fontSize: '0.6rem'}}>
                            {inst.status === 'pago' ? 'PAGO' : 'TRIAL'}
                          </span>
                        </td>
                        <td style={{padding: '1rem'}}>
                           <button className="btn-secondary" style={{padding: '4px 10px', fontSize: '0.7rem'}} onClick={() => alert('Recurso: Gerenciar Cliente')}>Abrir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {showSubModal && (
        <div className="modal-overlay" onClick={() => {setShowSubModal(false); setCheckoutPix(null)}}>
          <div className="premium-card" style={{ width: '90%', maxWidth: '450px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <h3 style={{fontSize: '1.3rem', textAlign: 'center', marginBottom: '0.5rem'}}>💎 Escolha seu Plano</h3>
            <p style={{color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem'}}>Assine o ZettaBots PRO e libere todo o poder da IA.</p>
            
            <div style={{padding: '1rem', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '16px', border: '1px solid rgba(124, 58, 237, 0.2)', textAlign: 'center', marginBottom: '1.5rem'}}>
               <p style={{fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px'}}>Oferta Especial</p>
               <h4 style={{fontSize: '2rem', margin: 0}}>R$ 247<span style={{fontSize: '0.9rem', opacity: 0.6}}>/mês</span></h4>
            </div>

            <div className="payment-options">
               <button className={`method-btn ${!checkoutPix ? '' : 'selected'}`} onClick={() => handleGeneratePix('pix')}>
                  <span style={{fontSize: '1.5rem'}}>⚡</span>
                  <span style={{fontSize: '0.8rem', fontWeight: '700'}}>Pix Instantâneo</span>
               </button>
               <button className="method-btn" onClick={() => handleGeneratePix('card')}>
                  <span style={{fontSize: '1.5rem'}}>💳</span>
                  <span style={{fontSize: '0.8rem', fontWeight: '700'}}>Cartão / Outros</span>
               </button>
            </div>

            {checkoutLoading && <div className="spinner" style={{marginTop: '2rem'}}></div>}

            {checkoutPix && (
              <div className="pix-display-area">
                <img src={`data:image/jpeg;base64,${checkoutPix.qr_code_base64}`} alt="PIX QR Code" style={{width: '200px', height: '200px'}} />
                <p style={{color: '#18181b', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center'}}>Aponte a câmera do seu banco para o QR Code acima</p>
                <button 
                  onClick={() => {navigator.clipboard.writeText(checkoutPix.qr_code); showToast('Código Copiado!', 'success')}} 
                  className="btn-primary" 
                  style={{width: '100%', marginTop: '15px', padding: '0.6rem'}}
                >
                  📋 Copiar Código PIX
                </button>
              </div>
            )}
            
            <button className="btn-secondary" style={{width: '100%', marginTop: '1rem', fontSize: '0.8rem'}} onClick={() => {setShowSubModal(false); setCheckoutPix(null)}}>Cancelar</button>
          </div>
        </div>
      )}


      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && '✅'}
            {t.type === 'error' && '❌'}
            {t.type === 'info' && 'ℹ️'}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
