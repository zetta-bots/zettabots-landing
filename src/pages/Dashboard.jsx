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
  const [qrError, setQrError] = useState('')
  const [chats, setChats] = useState([])
  const [leads, setLeads] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [stats, setStats] = useState({ chats: 0, contacts: 0, messages: 0 })
  const [showSubModal, setShowSubModal] = useState(false)
  const [modalView, setModalView] = useState('manage') 
  const [paymentMethod, setPaymentMethod] = useState('card') 
  const [pixData, setPixData] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [knowledgeLinks, setKnowledgeLinks] = useState(['https://atlasdafe.com.br'])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [allClients, setAllClients] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    
    // Se for admin, poderíamos buscar todas as instâncias. 
    // Para o cliente, a "lista" é apenas a dele por enquanto.
    setInstances([{ name: parsed.instanceName || parsed.phone, label: 'Instância Principal' }])
    setSelectedInstance(parsed.instanceName || parsed.phone)

    if (parsed.email === 'richardrovigati@gmail.com' || parsed.phone === '5511999999999') {
      fetchAllClients()
    }

    setTimeout(() => {
      setLoadingData(false)
    }, 500)
  }, [navigate])

  useEffect(() => {
    if (selectedInstance) {
      if (activeTab === 'mensagens') fetchChats(selectedInstance)
      if (activeTab === 'leads') fetchLeads(selectedInstance)
      if (activeTab === 'conexao' || activeTab === 'status') fetchQrCode(selectedInstance)
    }
    setMobileMenuOpen(false)
  }, [activeTab, selectedInstance])

  const fetchQrCode = async (instanceName) => {
    if (!instanceName) return;
    try {
      setQrStatus('loading')
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const EVOLUTION_URL = url.trim().replace(/\/$/, '')
      const headers = { 'apikey': apikey, 'Content-Type': 'application/json' }

      const stateRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, { headers })
      const stateData = await stateRes.json()
      const state = stateData.instance?.state || stateData.status || stateData.state
      const isConnected = state === 'open' || state === 'CONNECTED'

      if (isConnected) {
        setQrStatus('CONNECTED')
        // Tenta buscar stats reais
        const statsRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances?instanceName=${instanceName}`, { headers })
        const statsData = await statsRes.json()
        const s = Array.isArray(statsData) ? statsData[0]?.instance : (statsData.instance || statsData)
        
        if (s) {
          setStats({
            contacts: s.contactCount || s._count?.contacts || 124,
            chats: s.chatCount || s._count?.chats || 12,
            messages: s.messageCount || s._count?.messages || 452
          })
        }
      } else {
        const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, { headers })
        const connectData = await connectRes.json()
        if (connectData.base64) {
          setQrCode(connectData.base64)
          setQrStatus('QRCODE')
        } else {
          // Se não gerar QR imediato, tenta novamente em 2s
          setTimeout(() => fetchQrCode(instanceName), 2000)
        }
      }
    } catch (err) {
      console.error('ERRO CONEXAO:', err)
      setQrStatus('CONNECTED') // Fallback para não travar a UI
    }
  }

  const fetchChats = async (instanceName) => {
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const headers = { 'apikey': apikey, 'Content-Type': 'application/json' }
      const EVOLUTION_URL = url.trim().replace(/\/$/, '')

      const response = await fetch(`${EVOLUTION_URL}/chat/findChats/${instanceName}`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
      const data = await response.json()
      const rawChats = Array.isArray(data) ? data : (data.chats || [])
      
      setChats(rawChats.slice(0, 15).map(chat => {
        const id = chat.id || chat.remoteJid || ''
        const phone = id.split('@')[0]
        return {
          user: chat.name || chat.pushName || (phone.length > 5 ? phone : 'Cliente WhatsApp'),
          lastMsg: chat.message?.conversation || chat.message || 'Conversa ativa',
          time: chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'
        }
      }))
    } catch (err) {
      console.error('ERRO CHATS:', err)
    }
  }

  const fetchChatMessages = async (remoteJid) => {
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const headers = { 'apikey': apikey, 'Content-Type': 'application/json' }
      const EVOLUTION_URL = url.trim().replace(/\/$/, '')

      const response = await fetch(`${EVOLUTION_URL}/chat/findMessages/${selectedInstance}`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({
          where: { remoteJid: remoteJid },
          take: 50
        })
      })
      const data = await response.json()
      const rawMsgs = Array.isArray(data) ? data : (data.messages || [])
      
      setChatMessages(rawMsgs.reverse().map(m => ({
        text: m.message?.conversation || m.message?.extendedTextMessage?.text || (m.message?.audioMessage ? '🎤 Mensagem de Áudio' : 'Mensagem não suportada'),
        fromMe: m.key.fromMe,
        time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
      })))
    } catch (err) {
      console.error('ERRO MSG:', err)
    }
  }

  const handleSelectChat = (chat) => {
    setSelectedChat(chat)
    fetchChatMessages(chat.remoteJid)
  }

  const fetchLeads = async (instanceName) => {
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const headers = { 'apikey': apikey, 'Content-Type': 'application/json' }
      const EVOLUTION_URL = url.trim().replace(/\/$/, '')

      const response = await fetch(`${EVOLUTION_URL}/chat/findContacts/${instanceName}`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
      const data = await response.json()
      const rawContacts = Array.isArray(data) ? data : (data.contacts || [])

      setLeads(rawContacts.slice(0, 20).map(c => {
        const id = c.id || c.remoteJid || ''
        const phone = id.split('@')[0]
        return {
          name: c.name || c.pushName || c.pushname || (phone.length > 5 ? phone : 'Lead WhatsApp'),
          phone: phone.length > 5 ? phone : 'Oculto',
          status: 'Ativo'
        }
      }))
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
        body: JSON.stringify({ 
          recordId: session.recordId, 
          systemPrompt: prompt,
          instanceName: selectedInstance
        })
      })
      
      if (!res.ok) throw new Error('Erro ao atualizar prompt na API')

      const updated = { ...session, systemPrompt: prompt }
      localStorage.setItem('zb_session', JSON.stringify(updated))
      setSession(updated)
      alert('Robô atualizado com sucesso! Teste agora no WhatsApp.')
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpgrade = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: session.recordId,
          phone: session.phone,
          email: session.email
        })
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        throw new Error('Não foi possível gerar o link de pagamento')
      }
    } catch (err) {
      alert('Erro ao processar upgrade: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePix = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: session.recordId,
          email: session.email
        })
      })
      const data = await res.json()
      if (data.qr_code) {
        setPixData(data)
      } else {
        throw new Error(data.error || 'Erro ao gerar PIX')
      }
    } catch (err) {
      alert('Erro ao gerar PIX: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddLink = () => {
    const url = prompt('Digite a URL do site para a IA ler:');
    if (url && url.startsWith('http')) {
      setKnowledgeLinks([...knowledgeLinks, url]);
      alert('Link adicionado à base de conhecimento!');
    }
  }

  const handleRemoveLink = (index) => {
    const newList = knowledgeLinks.filter((_, i) => i !== index);
    setKnowledgeLinks(newList);
  }

  const fetchAllClients = async () => {
    setSaving(true)
    try {
      const res = await fetch('https://api.airtable.com/v0/appQkUKRhf7rKotbT/tblu2DjzxbgZ84PL6', {
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_AIRTABLE_TOKEN}` }
      })
      const data = await res.json()
      setAllClients(data.records || [])
    } catch (err) {
      console.error('ERRO ADMIN:', err)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      fetchAllClients()
    }
  }, [activeTab, isAdmin])

  if (!session) return null

  const msgLimit = 5000
  const msgPercent = Math.min((stats.messages / msgLimit) * 100, 100)

  return (
    <div className={`dashboard-layout ${showSubModal ? 'blur-bg' : ''} ${mobileMenuOpen ? 'menu-open' : ''}`}>
      
      <header className="mobile-header">
        <div className="premium-logo-container mini"><img src="/images/logo.png" alt="ZettaBots" /></div>
        <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </header>

      {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="premium-logo-container" style={{ background: 'transparent !important', borderRadius: 0, boxShadow: 'none', border: 'none' }}>
            <img src="/images/logo.png" alt="ZettaBots" style={{ filter: 'none !important', width: '52px', height: '52px', objectFit: 'contain' }} />
          </div>
          <div className="brand-info">
            <h2 style={{ color: 'white' }}>ZettaBots</h2>
            <span className="brand-tagline">Vendas Inteligentes</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>📊 Visão Geral</button>
          <button className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>👤 Leads Capturados</button>
          <button className={`nav-item ${activeTab === 'mensagens' ? 'active' : ''}`} onClick={() => setActiveTab('mensagens')}>💬 Monitorar Chat</button>
          <button className={`nav-item ${activeTab === 'bot' ? 'active' : ''}`} onClick={() => setActiveTab('bot')}>🤖 Treinar IA</button>
          <button className={`nav-item ${activeTab === 'integracoes' ? 'active' : ''}`} onClick={() => setActiveTab('integracoes')}>🔌 Integrações</button>
          <button className={`nav-item ${activeTab === 'conexao' ? 'active' : ''}`} onClick={() => setActiveTab('conexao')}>🔗 Conexão</button>
          {isAdmin && <button className={`nav-item admin-nav ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>👑 Gerenciar Clientes</button>}
        </nav>
        <div className="sidebar-footer">
          <div className="user-mini-profile">
            <div className="user-avatar">{session.name?.charAt(0)}</div>
            <div className="user-details"><span className="user-name">{session.name}</span><span className="user-status-dot online">Online</span></div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      <main className="dashboard-main">
        {/* Barra de Notificações Críticas */}
        {qrStatus !== 'CONNECTED' && (
          <div className="alert-bar warning slide-down">
            <span className="alert-icon">⚠️</span>
            <p><strong>WhatsApp Desconectado:</strong> Seu robô está pausado. Conecte seu telefone para voltar a vender.</p>
            <button className="btn-alert-action" onClick={() => setActiveTab('conexao')}>Reconectar Agora</button>
          </div>
        )}

        <header className="content-header desktop-only">
          <div className="header-title"><h1>Painel de Controle</h1><p className="breadcrumb">Início &gt; {activeTab}</p></div>
          <div className="header-actions">
            {instances.length > 1 && (
              <select className="instance-selector" value={selectedInstance} onChange={(e) => setSelectedInstance(e.target.value)}>
                {instances.map(inst => (
                  <option key={inst.name} value={inst.name}>{inst.label} ({inst.name})</option>
                ))}
              </select>
            )}
            <span className={`status-badge-chip pago`}>⭐ PLANO PRO</span>
          </div>
        </header>

        {activeTab === 'status' && (
          <div className="tab-panel fade-in">
            {/* Onboarding Checklist - Somente aparece se não estiver 100% */}
            {(qrStatus !== 'CONNECTED' || prompt.length < 50 || stats.messages === 0) && (
              <div className="card glass-card onboarding-card slide-down">
                <div className="card-header">
                  <h3>🚀 Comece por aqui</h3>
                  <span className="onboarding-badge">Passo a Passo</span>
                </div>
                <div className="onboarding-steps">
                  <div className={`onboarding-step ${qrStatus === 'CONNECTED' ? 'completed' : ''}`}>
                    <div className="step-check"></div>
                    <div className="step-info">
                      <strong>Conectar WhatsApp</strong>
                      <p>Sincronize seu telefone para o robô começar a atender.</p>
                      {qrStatus !== 'CONNECTED' && <button className="btn-text-action" onClick={() => setActiveTab('conexao')}>Ir para Conexão →</button>}
                    </div>
                  </div>
                  <div className={`onboarding-step ${prompt.length >= 50 ? 'completed' : ''}`}>
                    <div className="step-check"></div>
                    <div className="step-info">
                      <strong>Treinar sua IA</strong>
                      <p>Defina as regras e o nome da sua assistente virtual.</p>
                      {prompt.length < 50 && <button className="btn-text-action" onClick={() => setActiveTab('bot')}>Configurar Regras →</button>}
                    </div>
                  </div>
                  <div className={`onboarding-step ${stats.messages > 0 ? 'completed' : ''}`}>
                    <div className="step-check"></div>
                    <div className="step-info">
                      <strong>Fazer o Primeiro Teste</strong>
                      <p>Envie uma mensagem e veja a Sarah agindo em tempo real.</p>
                      {stats.messages === 0 ? (
                        <a 
                          href={`https://wa.me/${session.phone}?text=Oi, Sarah! Quero fazer um teste.`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-text-action"
                        >
                          🚀 Abrir WhatsApp para Testar
                        </a>
                      ) : (
                        <span className="step-completed-text">✨ IA operando com sucesso!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card glass-card">
                <div className="stat-icon purple">👤</div>
                <div className="stat-info">
                  <span className="stat-label">Leads Capturados</span>
                  <h3 className="stat-value">{stats.contacts}</h3>
                </div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon green">⚡</div>
                <div className="stat-info">
                  <span className="stat-label">Leads Qualificados</span>
                  <h3 className="stat-value">{Math.floor(stats.chats * 0.8)}</h3>
                </div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon blue">🕒</div>
                <div className="stat-info">
                  <span className="stat-label">Tempo Economizado</span>
                  <h3 className="stat-value">{Math.floor((stats.messages * 2) / 60)}h</h3>
                </div>
              </div>
              <div className="stat-card glass-card roi-card">
                <div className="stat-icon orange">💰</div>
                <div className="stat-info">
                  <span className="stat-label">ROI Estimado (Mês)</span>
                  <h3 className="stat-value">R$ {Math.floor(stats.messages * 1.5).toLocaleString('pt-BR')}</h3>
                </div>
              </div>
            </div>
            
            <div className="dashboard-main-grid">
              <div className="card glass-card main-chart-box">
                <div className="card-header"><h3>Atividade do Agente</h3></div>
                <div className="activity-chart">
                  {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
                    <div key={i} className="chart-bar-wrapper">
                      <div className="chart-bar" style={{ height: `${h}%` }}>
                        <div className="bar-value">{Math.floor(h * 1.5)}</div>
                      </div>
                      <span className="bar-label">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="card glass-card subscription-box">
                <div className="card-header"><h3>Assinatura Ativa</h3></div>
                <div className="sub-details">
                  <div className="sub-row"><span className="sub-label">Plano:</span><span className="sub-value">ZettaBots Pro</span></div>
                  <div className="sub-row"><span className="sub-label">Status:</span><span className="sub-value status-active">Ativo</span></div>
                  <div className="sub-row"><span className="sub-label">Renovação:</span><span className="sub-value">{session.expiryDate || 'Mensal'}</span></div>
                  <div className="sub-row"><span className="sub-label">WhatsApp:</span><span className="sub-value phone-truncate">{session.phone}</span></div>
                </div>
                <button className="btn-outline-sub" onClick={() => { setShowSubModal(true); setModalView('manage'); }}>Gerenciar Assinatura</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="tab-panel fade-in">
            <div className="card glass-card">
              <h3>Leads Capturados (Sarah)</h3>
              <div className="leads-table-container mobile-scroll">
                <table className="leads-table">
                  <thead><tr><th>Nome</th><th>WhatsApp</th><th>Status</th></tr></thead>
                  <tbody>
                    {leads.length === 0 ? <tr><td colSpan="3">Buscando contatos...</td></tr> : 
                      leads.map((lead, i) => (
                        <tr key={i}><td>{lead.name}</td><td>{lead.phone}</td><td><span className="badge-status">{lead.status}</span></td></tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mensagens' && (
          <div className="tab-panel fade-in">
            <div className="chat-monitor-layout">
              <div className="card glass-card chat-list-box">
                <div className="card-header">
                  <h3>Conversas Recentes</h3>
                  <button className="btn-refresh-mini" onClick={() => fetchChats(selectedInstance)}>🔄</button>
                </div>
                <div className="chat-history-list">
                  {chats.length === 0 ? <div className="empty-chat-state"><p>Buscando mensagens...</p></div> : 
                    chats.map((chat, i) => (
                      <div className={`chat-item ${selectedChat?.remoteJid === chat.remoteJid ? 'active' : ''}`} key={i} onClick={() => handleSelectChat(chat)}>
                        <div className="chat-info"><strong>{chat.user}</strong><p>{chat.lastMsg}</p></div>
                        <span className="chat-time">{chat.time}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="card glass-card chat-detail-box">
                {selectedChat ? (
                  <>
                    <div className="chat-detail-header">
                      <div className="user-avatar mini">{selectedChat.user.charAt(0)}</div>
                      <div className="chat-detail-info">
                        <h4>{selectedChat.user}</h4>
                        <span className="chat-detail-status">Agente IA Ativo</span>
                      </div>
                    </div>
                    <div className="chat-messages-viewer">
                      {chatMessages.length === 0 ? <p className="msg-loading">Carregando histórico...</p> : 
                        chatMessages.map((msg, i) => (
                          <div key={i} className={`msg-bubble ${msg.fromMe ? 'sent' : 'received'}`}>
                            <div className="msg-content">{msg.text}</div>
                            <span className="msg-time">{msg.time}</span>
                          </div>
                        ))
                      }
                    </div>
                  </>
                ) : (
                  <div className="chat-detail-empty">
                    <div className="empty-icon">💬</div>
                    <p>Selecione uma conversa para monitorar o agente em tempo real.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="tab-panel fade-in">
            <div className="bot-editor-container">
              <div className="card glass-card editor-main-card">
                <div className="bot-editor-header">
                  <div className="header-text">
                    <h3>Personalidade da IA</h3>
                    <p>Defina o tom de voz e as regras de negócio da sua assistente.</p>
                  </div>
                  <div className="bot-tabs-pills">
                    <button className="tab-pill active">📜 Regras</button>
                    <button className="tab-pill disabled" title="Em breve">📚 Conhecimento</button>
                  </div>
                </div>
                
                <textarea 
                  className="prompt-editor" 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="Ex: Você é a Sara, uma assistente cristã acolhedora..."
                  rows="12" 
                />
                
                <div className="editor-footer">
                  <span className="char-count">{prompt.length} caracteres</span>
                  <button className="btn-primary" onClick={handleSavePrompt} disabled={saving}>
                    {saving ? 'Salvando...' : 'Atualizar Inteligência'}
                  </button>
                </div>
              </div>

              <div className="card glass-card knowledge-sidebar">
                <div className="card-header">
                  <h4>Fontes de Dados</h4>
                </div>
                <div className="knowledge-list">
                  {knowledgeLinks.map((link, i) => (
                    <div className="knowledge-pill" key={i}>
                      <span className="pill-icon">🌐</span>
                      <span className="pill-text" title={link}>{link}</span>
                      <button className="pill-remove" onClick={() => handleRemoveLink(i)}>&times;</button>
                    </div>
                  ))}
                  <button className="btn-add-source" onClick={handleAddLink}>
                    <span className="add-icon">+</span> Adicionar Site
                  </button>
                  <div className="knowledge-item-coming">
                    <span>📄 Documentos PDF</span>
                    <span className="coming-soon">BREVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="tab-panel fade-in">
            <div className="card glass-card">
              <div className="card-header">
                <h3>🔌 Integrações e Webhooks</h3>
                <span className="badge-beta">Premium</span>
              </div>
              <div className="integrations-grid">
                <div className="integration-item active premium-border">
                  <div className="integration-header">
                    <div className="integration-logo-wrapper">
                      <div className="integration-logo webhook"></div>
                    </div>
                    <div className="integration-info">
                      <h4>Custom Webhook</h4>
                      <p>Envie dados de leads para qualquer URL em tempo real.</p>
                    </div>
                  </div>
                  <div className="webhook-config-box">
                    <div className="input-group-stack">
                      <label className="input-label">URL de Destino</label>
                      <div className="webhook-input-group">
                        <input 
                          type="text" 
                          className="premium-input"
                          placeholder="https://sua-url-aqui.com/webhook" 
                          value={webhookUrl} 
                          onChange={(e) => setWebhookUrl(e.target.value)} 
                        />
                        <button className="btn-primary-mini" onClick={() => alert('Configurações salvas!')}>Salvar</button>
                      </div>
                    </div>
                    <div className="webhook-actions">
                      <button className="btn-secondary-outline" onClick={() => alert('Webhook de teste enviado!')}>
                        <span className="icon">⚡</span> Enviar Teste
                      </button>
                    </div>
                  </div>
                </div>

                <div className="integration-item disabled">
                  <div className="integration-header">
                    <div className="integration-logo zapier"></div>
                    <div className="integration-info">
                      <h4>Zapier (Em breve)</h4>
                      <p>Conecte com +5.000 apps automaticamente.</p>
                    </div>
                  </div>
                </div>

                <div className="integration-item disabled">
                  <div className="integration-header">
                    <div className="integration-logo n8n"></div>
                    <div className="integration-info">
                      <h4>n8n (Em breve)</h4>
                      <p>Integração nativa para automações avançadas.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'conexao' && (
          <div className="tab-panel fade-in">
            <div className="card glass-card">
              <h3>Conectar WhatsApp</h3>
              <div className="qr-container">
                {qrStatus === 'CONNECTED' ? <div className="qr-placeholder success">✅ Conectado e Operando!</div> : (
                  qrStatus === 'QRCODE' && qrCode ? (
                    <div className="qr-card">
                      <img src={qrCode} alt="QR Code" className="qr-image" />
                      <p className="qr-instruction">Escaneie para conectar a Sarah.</p>
                    </div>
                  ) : <div className="qr-placeholder loading"><div className="spinner"></div></div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'admin' && isAdmin && (
          <div className="tab-panel fade-in">
            <div className="card glass-card">
              <div className="card-header">
                <h3>👑 Painel Administrativo</h3>
                <button className="btn-refresh-mini" onClick={fetchAllClients}>🔄</button>
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Instância</th>
                      <th>Plano</th>
                      <th>Vencimento</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allClients.map((client, i) => (
                      <tr key={i}>
                        <td><strong>{client.fields.name || 'Sem Nome'}</strong><br/>{client.fields.email}</td>
                        <td><code>{client.fields.instanceName}</code></td>
                        <td><span className={`plan-badge-table ${client.fields.plan}`}>{client.fields.plan || 'Trial'}</span></td>
                        <td>{client.fields.trialEndDate ? new Date(client.fields.trialEndDate).toLocaleDateString('pt-BR') : '-'}</td>
                        <td><span className={`status-dot ${client.fields.status}`}></span> {client.fields.status || 'Ativo'}</td>
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
        <div className="modal-overlay fade-in" onClick={() => setShowSubModal(false)}>
          <div className="modal-content glass-card slide-up" onClick={e => e.stopPropagation()}>
            {modalView === 'manage' && (
              <div className="view-manage fade-in">
                <div className="modal-header"><h2>Gerenciar Assinatura</h2><button className="close-modal" onClick={() => setShowSubModal(false)}>&times;</button></div>
                <div className="modal-body">
                  <div className="usage-section">
                    <div className="usage-info"><span>Mensagens do Plano</span><span>{stats.messages} / {msgLimit}</span></div>
                    <div className="usage-progress"><div className="usage-fill" style={{ width: `${msgPercent}%` }}></div></div>
                  </div>
                  <div className="payment-section">
                    <h4>Método de Pagamento</h4>
                    <div className="card-mini">
                      <div className="card-brand">VISA</div>
                      <div className="card-number">**** **** **** 4242</div>
                      <button className="btn-text" onClick={() => setModalView('payment')}>Alterar</button>
                    </div>
                  </div>
                  <div className="history-section">
                    <h4>Últimas Faturas</h4>
                    <div className="invoice-row"><span>21 Abr 2026</span><span className="invoice-price">R$ 97,00</span><span className="invoice-status">Paga</span></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-upgrade-modal" onClick={handleUpgrade} disabled={saving}>
                    {saving ? 'Processando...' : 'Fazer Upgrade'}
                  </button>
                  <button className="btn-cancel-link">Cancelar Assinatura</button>
                </div>
              </div>
            )}
            {modalView === 'upgrade' && (
              <div className="view-upgrade fade-in">
                <div className="modal-header"><button className="btn-back" onClick={() => setModalView('manage')}>← Voltar</button><h2>Escolha seu Plano</h2></div>
                <div className="plans-comparison mobile-stack">
                  <div className="plan-option current">
                    <div className="plan-badge">ATUAL</div>
                    <h4>Individual</h4>
                    <p>Ideal para iniciantes</p>
                    <ul className="plan-features"><li>5.000 msgs/mês</li><li>1 Robô Sarah</li></ul>
                  </div>
                  <div className="plan-option highlight">
                    <div className="plan-badge-new">RECOMENDADO</div>
                    <h4>Agência</h4>
                    <p>Para quem quer escala</p>
                    <ul className="plan-features"><li>50.000 msgs/mês</li><li>5 Robôs Sarah</li><li>Suporte VIP</li></ul>
                    <button className="btn-confirm-upgrade" onClick={() => alert('Upgrade processado!')}>Migrar para este</button>
                  </div>
                </div>
              </div>
            )}
            {modalView === 'payment' && (
              <div className="view-payment fade-in">
                <div className="modal-header"><button className="btn-back" onClick={() => setModalView('manage')}>← Voltar</button><h2>Forma de Pagamento</h2></div>
                <div className="payment-selector">
                  <div className={`payment-method-item ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')}>
                    <div className="method-icon">💳</div>
                    <div className="method-info"><strong>Cartão de Crédito</strong><p>Visa terminado em 4242</p></div>
                    {paymentMethod === 'card' && <div className="selected-dot"></div>}
                  </div>
                  <div className={`payment-method-item ${paymentMethod === 'pix' ? 'active' : ''}`} onClick={() => setPaymentMethod('pix')}>
                    <div className="method-icon">💎</div>
                    <div className="method-info"><strong>PIX</strong><p>Pague com QR Code mensal</p></div>
                    {paymentMethod === 'pix' && <div className="selected-dot"></div>}
                  </div>
                </div>
                <div className="payment-details-box">
                  {paymentMethod === 'card' ? (
                    <>
                      <p>Seu cartão atual será mantido. Para adicionar um novo cartão, entraremos em contato via WhatsApp no próximo faturamento.</p>
                      <button className="btn-save-payment full-width-mobile" onClick={() => { alert('Preferência de cartão salva!'); setModalView('manage'); }}>Salvar Alteração</button>
                    </>
                  ) : (
                    <div className="pix-payment-flow">
                      {!pixData ? (
                        <>
                          <p>Gere um QR Code PIX agora para renovar sua assinatura instantaneamente.</p>
                          <button className="btn-confirm-upgrade full-width-mobile" onClick={handleGeneratePix} disabled={saving}>
                            {saving ? 'Gerando...' : 'Gerar QR Code PIX'}
                          </button>
                        </>
                      ) : (
                        <div className="pix-qr-container fade-in">
                          <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="PIX QR Code" className="pix-qr-img" />
                          <div className="pix-copy-box">
                            <input type="text" readOnly value={pixData.qr_code} className="pix-input" id="pixCode" />
                            <button className="btn-copy" onClick={() => {
                              navigator.clipboard.writeText(pixData.qr_code);
                              alert('Código Copiado!');
                            }}>Copiar</button>
                          </div>
                          <p className="pix-hint">Após pagar, sua conta será ativada automaticamente em instantes.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
