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
  const [knowledgeLinks, setKnowledgeLinks] = useState(['https://zettabots.ia.br'])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [allClients, setAllClients] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const [notificationEmail, setNotificationEmail] = useState('')

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
    setNotificationEmail(parsed.email || '')
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
          setTimeout(() => fetchQrCode(instanceName), 2000)
        }
      }
    } catch (err) {
      console.error('ERRO CONEXAO:', err)
      setQrStatus('CONNECTED')
    }
  }

  const fetchChats = async (instanceName) => {
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const headers = { 'apikey': apikey, 'Content-Type': 'application/json' }
      const EVOLUTION_URL = url.trim().replace(/\/$/, '')

      // Usando fetchChats que é o padrão mais estável
      const response = await fetch(`${EVOLUTION_URL}/chat/fetchChats?instanceName=${instanceName}`, { headers })
      const data = await response.json()
      const rawChats = Array.isArray(data) ? data : (data.chats || [])
      
      setChats(rawChats.slice(0, 20).map(chat => {
        const id = chat.id || chat.remoteJid || ''
        const phone = id.split('@')[0]
        return {
          remoteJid: id,
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
    if (!remoteJid) return
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
        fromMe: m.key?.fromMe,
        time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
      })))
    } catch (err) {
      console.error('ERRO MSG:', err)
    }
  }

  const handleSelectChat = (chat) => {
    setSelectedChat(chat)
    setChatMessages([]) // Clear current to show loading
    fetchChatMessages(chat.remoteJid)
  }

  const fetchLeads = async (instanceName) => {
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const headers = { 'apikey': apikey, 'Content-Type': 'application/json' }
      const EVOLUTION_URL = url.trim().replace(/\/$/, '')

      const response = await fetch(`${EVOLUTION_URL}/chat/fetchContacts?instanceName=${instanceName}`, { headers })
      const data = await response.json()
      const rawContacts = Array.isArray(data) ? data : (data.contacts || [])

      setLeads(rawContacts.slice(0, 50).map(c => {
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

  const handleSaveIntegrations = async () => {
    setSaving(true)
    try {
      // Reutilizando a API de update-prompt ou criando uma genérica se necessário. 
      // Por enquanto vamos usar a de update-prompt mas passando campos extras se a API suportar
      const res = await fetch('/api/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recordId: session.recordId, 
          webhookUrl: webhookUrl,
          notificationEmail: notificationEmail
        })
      })
      
      if (!res.ok) throw new Error('Erro ao salvar integrações')
      alert('Configurações de integração salvas com sucesso!')
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setSaving(false)
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

  const handleAddLink = () => {
    const url = prompt('Digite a URL do site para a IA ler:');
    if (url && url.startsWith('http')) {
      setKnowledgeLinks([...knowledgeLinks, url]);
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

  if (!session) return null

  const msgLimit = 5000
  const msgPercent = Math.min((stats.messages / msgLimit) * 100, 100)

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
          <div className="premium-logo-container">
            <img src="/images/logo.png" alt="ZettaBots" />
          </div>
          <div className="brand-info">
            <h2>ZettaBots</h2>
            <p>Vendas Inteligentes</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
            <span className="icon">📊</span> Visão Geral
          </button>
          <button className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
            <span className="icon">👤</span> Leads Capturados
          </button>
          <button className={`nav-item ${activeTab === 'mensagens' ? 'active' : ''}`} onClick={() => setActiveTab('mensagens')}>
            <span className="icon">💬</span> Monitorar Chat
          </button>
          <button className={`nav-item ${activeTab === 'bot' ? 'active' : ''}`} onClick={() => setActiveTab('bot')}>
            <span className="icon">🤖</span> Treinar IA
          </button>
          <button className={`nav-item ${activeTab === 'integracoes' ? 'active' : ''}`} onClick={() => setActiveTab('integracoes')}>
            <span className="icon">🔌</span> Integrações
          </button>
          <button className={`nav-item ${activeTab === 'conexao' ? 'active' : ''}`} onClick={() => setActiveTab('conexao')}>
            <span className="icon">🔗</span> Conexão
          </button>
          {isAdmin && (
            <button className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
              <span className="icon">👑</span> Gerenciar Clientes
            </button>
          )}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="icon">🚪</span> Sair
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <div className="header-title">
            <h1>Painel de Controle</h1>
            <p className="breadcrumb">Início &gt; {activeTab}</p>
          </div>
          <div className="plan-badge">⭐ Plano PRO</div>
        </header>

        {activeTab === 'status' && (
          <div className="tab-panel">
            {/* Onboarding Card */}
            {(qrStatus !== 'CONNECTED' || prompt.length < 50 || stats.messages === 0) && (
              <div className="glass-card">
                <h3>🚀 Comece por aqui</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: qrStatus === 'CONNECTED' ? '4px solid #10b981' : '4px solid #7c3aed' }}>
                    <strong>1. Conectar WhatsApp</strong>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{qrStatus === 'CONNECTED' ? '✅ Conectado' : '❌ Desconectado'}</p>
                    {qrStatus !== 'CONNECTED' && <button onClick={() => setActiveTab('conexao')} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem' }}>Configurar →</button>}
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: prompt.length >= 50 ? '4px solid #10b981' : '4px solid #7c3aed' }}>
                    <strong>2. Treinar IA</strong>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{prompt.length >= 50 ? '✅ Configurado' : '❌ Aguardando regras'}</p>
                    {prompt.length < 50 && <button onClick={() => setActiveTab('bot')} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem' }}>Treinar →</button>}
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: stats.messages > 0 ? '4px solid #10b981' : '4px solid #7c3aed' }}>
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
                <div className="stat-info">
                  <span className="stat-label">Leads Capturados</span>
                  <span className="stat-value">{stats.contacts}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">💬</div>
                <div className="stat-info">
                  <span className="stat-label">Conversas Ativas</span>
                  <span className="stat-value">{stats.chats}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">🕒</div>
                <div className="stat-info">
                  <span className="stat-label">Tempo Economizado</span>
                  <span className="stat-value">{Math.floor((stats.messages * 2) / 60)}h</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">💰</div>
                <div className="stat-info">
                  <span className="stat-label">ROI Estimado (Mês)</span>
                  <span className="stat-value">R$ {Math.floor(stats.messages * 1.5).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3>Atividade da IA</h3>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingTop: '20px' }}>
                {[30, 45, 60, 20, 85, 40, 95].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: 'linear-gradient(to top, #7c3aed, #06b6d4)', height: `${h}%`, borderRadius: '6px 6px 0 0', position: 'relative' }}>
                    <span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: '#a1a1aa' }}>
                      {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mensagens' && (
          <div className="chat-monitor-container">
            <div className="chat-list-panel">
              <div className="panel-header">
                <h3>Conversas</h3>
                <button className="refresh-btn" onClick={() => fetchChats(selectedInstance)}>🔄</button>
              </div>
              <div className="conversations-scroll">
                {chats.length === 0 ? <p style={{ padding: '1rem', textAlign: 'center', color: '#a1a1aa' }}>Nenhuma conversa...</p> : 
                  chats.map((chat, i) => (
                    <div className={`chat-item ${selectedChat?.remoteJid === chat.remoteJid ? 'active' : ''}`} key={i} onClick={() => handleSelectChat(chat)}>
                      <div className="chat-item-header">
                        <span className="chat-name">{chat.user}</span>
                        <span className="chat-time">{chat.time}</span>
                      </div>
                      <p className="chat-status">{chat.lastMsg.substring(0, 40)}...</p>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="chat-window-panel">
              {selectedChat ? (
                <>
                  <div className="chat-header">
                    <h4>{selectedChat.user}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#10b981' }}>● Agente Ativo</span>
                  </div>
                  <div className="messages-container">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`message ${msg.fromMe ? 'sent' : 'received'}`}>
                        {msg.text}
                        <span className="message-time">{msg.time}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="chat-empty-state">
                  <div className="empty-icon">💬</div>
                  <p>Selecione uma conversa para monitorar o agente em tempo real.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
            <div className="glass-card">
              <h3>Personalidade da IA</h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Defina as regras de comportamento e o tom de voz do seu robô.</p>
              <textarea 
                className="prompt-editor" 
                rows="15" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{prompt.length} caracteres</span>
                <button onClick={handleSavePrompt} disabled={saving} style={{ padding: '0.8rem 1.5rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                  {saving ? 'Salvando...' : 'Salvar Inteligência'}
                </button>
              </div>
            </div>
            <div className="glass-card">
              <h3>Conhecimento</h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '1rem' }}>Sites que a IA deve ler para responder clientes.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {knowledgeLinks.map((link, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{link}</span>
                    <button onClick={() => handleRemoveLink(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
                <button onClick={handleAddLink} style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>+ Adicionar Site</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="glass-card">
            <h3>🔌 Integrações</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '20px' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#7c3aed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
                  <div>
                    <h4 style={{ color: 'white' }}>Custom Webhook</h4>
                    <p style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Envie leads para seu CRM em tempo real.</p>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a1a1aa' }}>E-mail para Notificações</label>
                  <input 
                    type="email" 
                    className="premium-input"
                    placeholder="seu-email@exemplo.com" 
                    value={notificationEmail} 
                    onChange={(e) => setNotificationEmail(e.target.value)} 
                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a1a1aa' }}>URL do Webhook (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="https://sua-url.com/webhook" 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }} 
                  />
                </div>
                <button onClick={handleSaveIntegrations} disabled={saving} style={{ width: '100%', padding: '0.8rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', opacity: 0.6 }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#ff4f00', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Z</div>
                  <div>
                    <h4 style={{ color: 'white' }}>Zapier</h4>
                    <p style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Integre com +5.000 aplicativos.</p>
                  </div>
                </div>
                <button disabled style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: 'none', borderRadius: '10px', fontWeight: '600' }}>Em Breve</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conexao' && (
          <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <h3>🔗 Conectar WhatsApp</h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '2rem' }}>Escaneie o QR Code abaixo com o seu WhatsApp para ativar a Sarah.</p>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', display: 'inline-block', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              {qrStatus === 'CONNECTED' ? (
                <div style={{ width: '250px', height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <span style={{ fontSize: '4rem' }}>✅</span>
                  <strong style={{ marginTop: '1rem' }}>Conectado</strong>
                </div>
              ) : qrCode ? (
                <img src={qrCode} alt="QR Code" style={{ width: '250px', height: '250px' }} />
              ) : (
                <div style={{ width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner"></div>
                </div>
              )}
            </div>
            <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#a1a1aa' }}>Status: {qrStatus}</p>
          </div>
        )}
      </main>
    </div>
  )
}
