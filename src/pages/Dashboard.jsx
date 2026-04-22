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
  const [stats, setStats] = useState({ chats: 0, contacts: 0, messages: 0 })
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [knowledgeLinks, setKnowledgeLinks] = useState(['https://zettabots.ia.br'])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [modalView, setModalView] = useState('manage') 
  const navigate = useNavigate()

  useEffect(() => {
    const savedSession = localStorage.getItem('zb_session')
    if (!savedSession) {
      navigate('/login')
      return
    }
    
    const parsed = JSON.parse(savedSession)
    setSession(parsed)
    if (parsed.email === 'richardrovigati@gmail.com' || parsed.phone === '5511999999999') {
      setIsAdmin(true)
    }
    setPrompt(parsed.systemPrompt || '')
    setWebhookUrl(parsed.webhookUrl || '')
    setNotificationEmail(parsed.notificationEmail || parsed.email || '')
    setInstances([{ name: parsed.instanceName || parsed.phone, label: 'Instância Principal' }])
    setSelectedInstance(parsed.instanceName || parsed.phone)

    setTimeout(() => setLoadingData(false), 500)
  }, [navigate])

  useEffect(() => {
    if (selectedInstance) {
      fetchStats(selectedInstance)
      if (activeTab === 'mensagens') fetchChats(selectedInstance)
      if (activeTab === 'leads') fetchLeads(selectedInstance)
      if (activeTab === 'conexao' || activeTab === 'status') fetchQrCode(selectedInstance)
    }
    setMobileMenuOpen(false)
  }, [activeTab, selectedInstance])

  const fetchStats = async (instanceName) => {
    try {
      const res = await fetch('/api/get-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      })
      const data = await res.json()
      if (data.success && data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('ERRO STATS:', err)
    }
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
      console.error('ERRO CONEXAO:', err)
      setQrStatus('DISCONNECTED')
    }
  }

  const fetchChats = async (instanceName) => {
    try {
      const res = await fetch('/api/get-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      })
      const data = await res.json()
      if (data.success) {
        setChats(data.chats || [])
      }
    } catch (err) {
      console.error('ERRO CHATS:', err)
    }
  }

  const fetchChatMessages = async (remoteJid) => {
    if (!remoteJid) return
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const headers = { 'apikey': apikey, 'Content-Type': 'application/json' }
      const EVOLUTION_URL = url.trim().replace(/\/$/, '')

      const response = await fetch(`${EVOLUTION_URL}/chat/findMessages/${selectedInstance}`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({ where: { remoteJid }, take: 50 })
      })
      const data = await response.json()
      const rawMsgs = Array.isArray(data) ? data : (data.messages || [])
      
      setChatMessages(rawMsgs.reverse().map(m => ({
        text: m.message?.conversation || m.message?.extendedTextMessage?.text || (m.message?.audioMessage ? '🎤 Mensagem de Áudio' : 'Mensagem não suportada'),
        fromMe: m.key?.fromMe,
        time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
      })))
    } catch (err) {
      console.error('ERRO MSG:', err)
    }
  }

  const handleSelectChat = (chat) => {
    setSelectedChat(chat)
    setChatMessages([])
    fetchChatMessages(chat.remoteJid || chat.id)
  }

  const fetchLeads = async (instanceName) => {
    try {
      const res = await fetch('/api/get-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      })
      const data = await res.json()
      if (data.success) {
        setLeads(data.leads || [])
      }
    } catch (err) {
      console.error('ERRO LEADS:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('zb_session')
    navigate('/login')
  }

  const handleSavePrompt = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: session.recordId, systemPrompt: prompt, instanceName: selectedInstance })
      })
      if (!res.ok) throw new Error('Erro ao salvar prompt')
      const updated = { ...session, systemPrompt: prompt }
      localStorage.setItem('zb_session', JSON.stringify(updated))
      setSession(updated)
      alert('IA atualizada com sucesso!')
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveIntegrations = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: session.recordId, webhookUrl, notificationEmail })
      })
      if (!res.ok) throw new Error('Erro ao salvar integrações')
      const updated = { ...session, webhookUrl, notificationEmail }
      localStorage.setItem('zb_session', JSON.stringify(updated))
      setSession(updated)
      alert('Integrações salvas!')
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!session) return null

  return (
    <div className={`dashboard-layout ${mobileMenuOpen ? 'menu-open' : ''} ${showSubModal ? 'blur-bg' : ''}`}>
      <header className="mobile-header">
        <div className="premium-logo-container mini"><img src="/images/logo.png" alt="ZettaBots" /></div>
        <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </header>

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
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><span className="icon">🚪</span> Sair</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <div className="header-title"><h1>Painel de Controle</h1><p className="breadcrumb">Início &gt; {activeTab}</p></div>
          <div className="plan-badge">⭐ Plano PRO</div>
        </header>

        {activeTab === 'status' && (
          <div className="tab-panel">
            {(qrStatus !== 'CONNECTED' || prompt.length < 50 || stats.messages === 0) && (
              <div className="glass-card">
                <h3>🚀 Comece por aqui</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: qrStatus === 'CONNECTED' ? '4px solid #10b981' : '4px solid #ef4444' }}>
                    <strong>1. Conectar WhatsApp</strong>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{qrStatus === 'CONNECTED' ? '✅ Conectado' : '❌ Desconectado'}</p>
                    {qrStatus !== 'CONNECTED' && <button onClick={() => setActiveTab('conexao')} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem' }}>Configurar →</button>}
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: prompt.length >= 50 ? '4px solid #10b981' : '4px solid #ef4444' }}>
                    <strong>2. Treinar IA</strong>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{prompt.length >= 50 ? '✅ Configurado' : '❌ Aguardando regras'}</p>
                    {prompt.length < 50 && <button onClick={() => setActiveTab('bot')} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem' }}>Treinar →</button>}
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: stats.messages > 0 ? '4px solid #10b981' : '4px solid #ef4444' }}>
                    <strong>3. Primeiro Teste</strong>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{stats.messages > 0 ? '✅ IA operando' : '❌ Pendente'}</p>
                    <a href={`https://wa.me/${session.phone}`} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', fontSize: '0.8rem', textDecoration: 'none', display: 'block', marginTop: '0.5rem' }}>Testar IA →</a>
                  </div>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">👤</div>
                <div className="stat-info"><span className="stat-label">Leads Capturados</span><span className="stat-value">{stats.contacts || 0}</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">💬</div>
                <div className="stat-info"><span className="stat-label">Conversas Ativas</span><span className="stat-value">{stats.chats || 0}</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">🕒</div>
                <div className="stat-info"><span className="stat-label">Tempo Economizado</span><span className="stat-value">{Math.floor(((stats.messages || 0) * 2) / 60)}h</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">💰</div>
                <div className="stat-info"><span className="stat-label">ROI Estimado (Mês)</span><span className="stat-value">R$ {Math.floor((stats.messages || 0) * 1.5).toLocaleString('pt-BR')}</span></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div className="glass-card">
                <h3>Atividade da IA</h3>
                <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingTop: '20px' }}>
                  {[30, 45, 60, 20, 85, 40, 95].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: 'linear-gradient(to top, #7c3aed, #06b6d4)', height: `${h}%`, borderRadius: '6px 6px 0 0', position: 'relative' }}>
                      <span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: '#a1a1aa' }}>{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="glass-card">
                <h3>💰 Financeiro</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Plano Ativo</span>
                    <p style={{ fontWeight: '700', color: '#10b981' }}>ZettaBots PRO</p>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Próxima Cobrança</span>
                    <p style={{ fontWeight: '700' }}>{session.expiryDate || '21/05/2026'}</p>
                  </div>
                  <button onClick={() => setShowSubModal(true)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>Gerenciar Assinatura</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="tab-panel">
            <div className="glass-card">
              <h3>Leads Capturados pela Sarah</h3>
              <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.85rem' }}>NOME</th>
                      <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.85rem' }}>WHATSAPP</th>
                      <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.85rem' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>Buscando leads...</td></tr> : 
                      leads.map((lead, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '1rem', fontWeight: '600' }}>{lead.name}</td>
                          <td style={{ padding: '1rem', color: '#a1a1aa' }}>{lead.phone}</td>
                          <td style={{ padding: '1rem' }}><span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '0.75rem' }}>{lead.status}</span></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mensagens' && (
          <div className="chat-monitor-container">
            <div className="chat-list-panel">
              <div className="panel-header"><h3>Conversas</h3><button className="refresh-btn" onClick={() => fetchChats(selectedInstance)}>🔄</button></div>
              <div className="conversations-scroll">
                {chats.length === 0 ? <p style={{ padding: '1rem', textAlign: 'center', color: '#a1a1aa' }}>Nenhuma conversa encontrada...</p> : 
                  chats.map((chat, i) => (
                    <div className={`chat-item ${selectedChat?.remoteJid === (chat.remoteJid || chat.id) ? 'active' : ''}`} key={i} onClick={() => handleSelectChat(chat)}>
                      <div className="chat-item-header"><span className="chat-name">{chat.user}</span><span className="chat-time">{chat.time}</span></div>
                      <p className="chat-status">{(chat.lastMsg || '').substring(0, 40)}...</p>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="chat-window-panel">
              {selectedChat ? (
                <>
                  <div className="chat-header"><h4>{selectedChat.user}</h4><span style={{ fontSize: '0.8rem', color: '#10b981' }}>● Monitorando IA</span></div>
                  <div className="messages-container">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`message ${msg.fromMe ? 'sent' : 'received'}`}>{msg.text}<span className="message-time">{msg.time}</span></div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="chat-empty-state"><div className="empty-icon">💬</div><p>Selecione uma conversa para monitorar o agente em tempo real.</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
            <div className="glass-card">
              <h3>Personalidade da IA</h3>
              <textarea className="prompt-editor" rows="15" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{prompt.length} caracteres</span>
                <button onClick={handleSavePrompt} disabled={saving} style={{ padding: '0.8rem 1.5rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>{saving ? 'Salvando...' : 'Salvar Inteligência'}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="glass-card">
            <h3>🔌 Integrações</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '20px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a1a1aa' }}>E-mail para Notificações</label>
                  <input type="email" placeholder="seu-email@exemplo.com" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a1a1aa' }}>URL do Webhook (Opcional)</label>
                  <input type="text" placeholder="https://sua-url.com/webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }} />
                </div>
                <button onClick={handleSaveIntegrations} disabled={saving} style={{ width: '100%', padding: '0.8rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Salvar Configurações'}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conexao' && (
          <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <h3>🔗 Conectar WhatsApp</h3>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', display: 'inline-block', marginTop: '2rem' }}>
              {qrStatus === 'CONNECTED' ? <div style={{ width: '250px', height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><span style={{ fontSize: '4rem' }}>✅</span><strong>Conectado</strong></div> : 
                qrCode ? <img src={qrCode} alt="QR" style={{ width: '250px', height: '250px' }} /> : <div className="spinner"></div>
              }
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE ASSINATURA */}
      {showSubModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '2rem' }} onClick={() => setShowSubModal(false)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Gerenciar Assinatura</h2>
              <button onClick={() => setShowSubModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: '#a1a1aa', marginBottom: '0.5rem' }}>Plano Atual: <strong>PRO (R$ 97,00/mês)</strong></p>
              <p style={{ color: '#a1a1aa' }}>Vencimento: <strong>21/05/2026</strong></p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '15px', marginBottom: '2rem' }}>
              <h4>Histórico de Faturas</h4>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Fatura Abril 2026</span>
                <span style={{ color: '#10b981' }}>Paga ✅</span>
              </div>
            </div>
            <button style={{ width: '100%', padding: '1rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Upgrade para Plano Business</button>
          </div>
        </div>
      )}
    </div>
  )
}
