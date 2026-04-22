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

  const DEFAULT_PROMPT = `Você é a Sarah, a assistente virtual ultra-inteligente da ZettaBots. 
Seu objetivo é atender clientes no WhatsApp de forma humana, rápida e focada em vendas.
Regras de Comportamento:
1. Seja sempre educada, profissional e use um tom levemente informal (use emojis moderadamente).
2. Se o cliente perguntar sobre preços, explique que temos planos sob medida a partir de R$ 97,00.
3. Se o cliente demonstrar interesse real, peça o nome e o e-mail dele para agendar uma demonstração.
4. Nunca diga que você é um robô, a menos que seja perguntada diretamente. Diga que é a assistente digital da equipe.
5. Baseie suas respostas nos links de conhecimento fornecidos.`;

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
    setPrompt(parsed.systemPrompt || localStorage.getItem('zb_last_prompt') || DEFAULT_PROMPT)
    setInstances([{ name: parsed.instanceName || parsed.phone, label: 'Instância Principal' }])
    setSelectedInstance(parsed.instanceName || parsed.phone)

    if (parsed.email === 'richardrovigati@gmail.com' || parsed.phone === '5511999999999') {
      fetchAllClients()
    }

    setTimeout(() => setLoadingData(false), 500)
  }, [navigate])

  useEffect(() => {
    if (selectedInstance) {
      if (activeTab === 'mensagens') fetchChats(selectedInstance)
      if (activeTab === 'leads') fetchLeads(selectedInstance)
      if (activeTab === 'conexao' || activeTab === 'status') fetchQrCode(selectedInstance)
      if (activeTab === 'admin' && isAdmin) fetchAllClients()
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
        const instancesRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, { headers })
        const instancesData = await instancesRes.json()
        const current = Array.isArray(instancesData) ? instancesData.find(i => i.instanceName === instanceName) : null
        if (current) {
          setStats({
            contacts: current._count?.Contact || 124,
            chats: current._count?.Chat || 42,
            messages: current._count?.Message || 856
          })
        }
      } else {
        const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, { headers })
        const connectData = await connectRes.json()
        if (connectData.base64) {
          setQrCode(connectData.base64)
          setQrStatus('QRCODE')
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
      const response = await fetch(`${EVOLUTION_URL}/chat/findChats/${instanceName}`, { method: 'POST', headers, body: JSON.stringify({}) })
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
    } catch (err) { console.error('ERRO CHATS:', err) }
  }

  const fetchChatMessages = async (remoteJid) => {
    try {
      const configRes = await fetch('/api/get-config')
      const { url, apikey } = await configRes.json()
      const headers = { 'apikey': apikey, 'Content-Type': 'application/json' }
      const EVOLUTION_URL = url.trim().replace(/\/$/, '')
      const response = await fetch(`${EVOLUTION_URL}/chat/findMessages/${selectedInstance}`, { method: 'POST', headers, body: JSON.stringify({ where: { remoteJid: remoteJid }, take: 30 }) })
      const data = await response.json()
      const rawMsgs = Array.isArray(data) ? data : (data.messages || data.records || [])
      setChatMessages(rawMsgs.reverse().map(m => ({
        text: m.message?.conversation || m.message?.extendedTextMessage?.text || m.content || 'Mensagem de mídia',
        fromMe: m.key?.fromMe || m.fromMe,
        time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
      })))
    } catch (err) { console.error('ERRO MSG:', err) }
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
      const response = await fetch(`${EVOLUTION_URL}/chat/findContacts/${instanceName}`, { method: 'POST', headers, body: JSON.stringify({}) })
      const data = await response.json()
      const rawContacts = Array.isArray(data) ? data : (data.contacts || [])
      setLeads(rawContacts.slice(0, 30).map(c => {
        const id = c.id || c.remoteJid || ''
        const phone = id.split('@')[0]
        return { name: c.name || c.pushName || (phone.length > 5 ? phone : 'Lead WhatsApp'), phone: phone, status: 'Interessado' }
      }))
    } catch (err) { console.error('ERRO LEADS:', err) }
  }

  const handleSavePrompt = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/update-prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId: session.recordId, systemPrompt: prompt, instanceName: selectedInstance }) })
      if (!res.ok) throw new Error('Erro na API')
      localStorage.setItem('zb_last_prompt', prompt)
      alert('Inteligência atualizada com sucesso!')
    } catch (err) { alert('Erro ao salvar: ' + err.message) } finally { setSaving(false) }
  }

  const handleUpgrade = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/create-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId: session.recordId, phone: session.phone, email: session.email }) })
      const data = await res.json()
      if (data.init_point) window.location.href = data.init_point
      else throw new Error('Link não gerado')
    } catch (err) { alert('Erro: ' + err.message) } finally { setSaving(false) }
  }

  const handleGeneratePix = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/create-pix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId: session.recordId, email: session.email }) })
      const data = await res.json()
      if (data.qr_code) setPixData(data)
      else throw new Error('PIX não gerado')
    } catch (err) { alert('Erro PIX: ' + err.message) } finally { setSaving(false) }
  }

  const fetchAllClients = async () => {
    try {
      const res = await fetch('https://api.airtable.com/v0/appQkUKRhf7rKotbT/tblu2DjzxbgZ84PL6', { headers: { 'Authorization': `Bearer ${import.meta.env.VITE_AIRTABLE_TOKEN}` } })
      const data = await res.json()
      setAllClients(data.records || [])
    } catch (err) { console.error('ERRO ADMIN:', err) }
  }

  const handleAddLink = () => {
    const url = prompt('URL do site:');
    if (url && url.startsWith('http')) setKnowledgeLinks([...knowledgeLinks, url]);
  }

  if (!session) return null
  const msgLimit = 5000
  const msgPercent = Math.min((stats.messages / msgLimit) * 100, 100)

  return (
    <div className={`dashboard-layout ${showSubModal ? 'blur-bg' : ''} ${mobileMenuOpen ? 'menu-open' : ''}`}>
      <header className="mobile-header">
        <div className="premium-logo-container mini"><img src="/images/logo.png" alt="ZettaBots" /></div>
        <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><span></span><span></span><span></span></button>
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
          {isAdmin && <button className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}><span className="icon">👑</span> Admin</button>}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => { localStorage.removeItem('zb_session'); navigate('/login'); }}><span className="icon">🚪</span> Sair</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <div className="header-title"><h1>{activeTab.toUpperCase()}</h1><p className="breadcrumb">ZettaBots &gt; {activeTab}</p></div>
          <div className="plan-badge" onClick={() => setShowSubModal(true)} style={{ cursor: 'pointer' }}>⭐ {session.plan === 'pago' ? 'PLANO PRO' : 'PLANO TRIAL'}</div>
        </header>

        {activeTab === 'status' && (
          <div className="tab-panel">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon purple">👤</div><div className="stat-info"><span className="stat-label">Leads</span><span className="stat-value">{stats.contacts}</span></div></div>
              <div className="stat-card"><div className="stat-icon blue">💬</div><div className="stat-info"><span className="stat-label">Conversas</span><span className="stat-value">{stats.chats}</span></div></div>
              <div className="stat-card"><div className="stat-icon green">🕒</div><div className="stat-info"><span className="stat-label">Economia</span><span className="stat-value">{Math.floor((stats.messages * 2) / 60)}h</span></div></div>
              <div className="stat-card"><div className="stat-icon orange">💰</div><div className="stat-info"><span className="stat-label">ROI (Mês)</span><span className="stat-value">R$ {(stats.messages * 1.5).toLocaleString('pt-BR')}</span></div></div>
            </div>
            <div className="glass-card"><h3>🚀 Onboarding</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}><div className="onboarding-step-mini" style={{ borderLeft: qrStatus === 'CONNECTED' ? '4px solid #10b981' : '4px solid #7c3aed' }}><strong>WhatsApp</strong><p>{qrStatus === 'CONNECTED' ? '✅ Conectado' : '❌ Desconectado'}</p></div><div className="onboarding-step-mini" style={{ borderLeft: prompt.length > 100 ? '4px solid #10b981' : '4px solid #7c3aed' }}><strong>Cérebro IA</strong><p>{prompt.length > 100 ? '✅ Treinado' : '❌ Configurar'}</p></div></div></div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="glass-card">
            <h3>Lista de Leads Capturados</h3>
            <div className="table-container" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
              <table className="leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left', color: '#a1a1aa', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{ padding: '1rem' }}>Nome</th><th style={{ padding: '1rem' }}>WhatsApp</th><th style={{ padding: '1rem' }}>Status</th></tr></thead>
                <tbody>{leads.map((lead, i) => (<tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '1rem' }}>{lead.name}</td><td style={{ padding: '1rem' }}>{lead.phone}</td><td style={{ padding: '1rem' }}><span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>{lead.status}</span></td></tr>))}{leads.length === 0 && <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Buscando leads...</td></tr>}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mensagens' && (
          <div className="chat-monitor-container">
            <div className="chat-list-panel">
              <div className="panel-header"><h3>Conversas</h3><button className="refresh-btn" onClick={() => fetchChats(selectedInstance)}>🔄</button></div>
              <div className="conversations-scroll">{chats.map((chat, i) => (<div className={`chat-item ${selectedChat?.remoteJid === chat.remoteJid ? 'active' : ''}`} key={i} onClick={() => handleSelectChat(chat)}><div className="chat-item-header"><span className="chat-name">{chat.user}</span><span className="chat-time">{chat.time}</span></div><p className="chat-status">{chat.lastMsg.substring(0, 35)}...</p></div>))}</div>
            </div>
            <div className="chat-window-panel">{selectedChat ? (<><div className="chat-header"><h4>{selectedChat.user}</h4><span style={{ color: '#10b981' }}>● Agente Ativo</span></div><div className="messages-container">{chatMessages.map((msg, i) => (<div key={i} className={`message ${msg.fromMe ? 'sent' : 'received'}`}>{msg.text}<span className="message-time">{msg.time}</span></div>))}</div></>) : <div className="chat-empty-state"><p>Selecione uma conversa para monitorar.</p></div>}</div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
            <div className="glass-card"><h3>Treinar Inteligência Sarah</h3><textarea className="prompt-editor" rows="18" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ width: '100%', marginTop: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '1.5rem', borderRadius: '12px', lineHeight: '1.6' }} /><div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}><button onClick={handleSavePrompt} disabled={saving} style={{ padding: '1rem 2rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Salvar e Treinar IA'}</button></div></div>
            <div className="glass-card"><h3>Conhecimento</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>{knowledgeLinks.map((link, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem' }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</span></div>))}<button onClick={handleAddLink} style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>+ Adicionar Site</button></div></div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="glass-card">
            <h3>Notificações e Integrações</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                <h4>📧 Notificações por E-mail</h4><p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.5rem 0 1.5rem' }}>Receba alertas de novos leads.</p>
                <input type="email" placeholder="seu@email.com" defaultValue={session.email} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', marginBottom: '1rem' }} />
                <button style={{ width: '100%', padding: '0.8rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600' }} onClick={() => alert('Configurado!')}>Ativar Alertas</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conexao' && (
          <div className="glass-card" style={{ textAlign: 'center' }}><h3>WhatsApp Connection</h3><div style={{ background: 'white', padding: '2rem', borderRadius: '20px', display: 'inline-block', marginTop: '2rem' }}>{qrStatus === 'CONNECTED' ? <div style={{ color: '#10b981', width: '250px' }}>✅ Conectado</div> : (qrCode ? <img src={qrCode} alt="QR" style={{ width: '250px' }} /> : <div className="spinner"></div>)}</div></div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>👑 Admin: Gerenciar Clientes</h3><button onClick={fetchAllClients}>🔄 Atualizar</button></div>
            <div className="table-container" style={{ marginTop: '1.5rem' }}>
              <table className="leads-table" style={{ width: '100%' }}>
                <thead><tr style={{ textAlign: 'left', color: '#a1a1aa' }}><th>Cliente</th><th>Instância</th><th>Plano</th><th>Status</th></tr></thead>
                <tbody>{allClients.map((c, i) => (<tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '1rem' }}>{c.fields.name}<br/><small>{c.fields.email}</small></td><td style={{ padding: '1rem' }}><code>{c.fields.instanceName}</code></td><td style={{ padding: '1rem' }}>{c.fields.plan}</td><td style={{ padding: '1rem' }}>{c.fields.status}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showSubModal && (
        <div className="modal-overlay" onClick={() => setShowSubModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            {modalView === 'manage' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}><h2>Assinatura</h2><button onClick={() => setShowSubModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button></div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '15px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ color: '#a1a1aa' }}>Uso de Mensagens</span><span>{stats.messages} / {msgLimit}</span></div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}><div style={{ width: `${msgPercent}%`, height: '100%', background: '#7c3aed', borderRadius: '10px', boxShadow: '0 0 10px #7c3aed' }}></div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button onClick={handleUpgrade} disabled={saving} style={{ padding: '1rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Pagar com Cartão</button>
                  <button onClick={handleGeneratePix} disabled={saving} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>Pagar com PIX</button>
                </div>
                {pixData && (
                  <div style={{ marginTop: '2rem', textAlign: 'center', background: 'white', padding: '1rem', borderRadius: '15px' }}>
                    <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="PIX" style={{ width: '200px' }} />
                    <p style={{ color: '#333', fontSize: '0.8rem', marginTop: '1rem' }}>Escaneie para pagar agora</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
