import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

// Dashboard Components
import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'
import StatsPanel from '../components/dashboard/StatsPanel'
import LeadsPanel from '../components/dashboard/LeadsPanel'
import ChatMonitorPanel from '../components/dashboard/ChatMonitorPanel'
import FinancePanel from '../components/dashboard/FinancePanel'
import IntegrationsPanel from '../components/dashboard/IntegrationsPanel'
import ConnectionPanel from '../components/dashboard/ConnectionPanel'
import AdminPanel from '../components/dashboard/AdminPanel'
import AIConfigPanel from '../components/dashboard/AIConfigPanel'
import SubModal from '../components/dashboard/SubModal'

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
  const [adminStats, setAdminStats] = useState(null)
  const [adminSearch, setAdminSearch] = useState('')
  const [adminPlanFilter, setAdminPlanFilter] = useState('all')
  const [adminExtending, setAdminExtending] = useState(null)
  const [knowledgeFiles, setKnowledgeFiles] = useState([])
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
      if (activeTab === 'admin' && isAdmin) { fetchAllInstances(); fetchAdminStats(); }
    }
    setMobileMenuOpen(false)
  }, [activeTab, selectedInstance])

  const fetchAllInstances = async () => {
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-all-instances', instanceName: selectedInstance, email: session?.email })
      })
      const data = await res.json()
      if (data.success) setAllInstances(data.instances)
    } catch (err) { console.error('ERRO ADMIN:', err) }
  }

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-admin-stats', instanceName: selectedInstance, email: session?.email })
      })
      const data = await res.json()
      if (data.success) setAdminStats(data)
    } catch (err) { console.error('ADMIN STATS:', err) }
  }

  const handleAdminExtend = async (targetEmail, days = 30) => {
    setAdminExtending(targetEmail)
    try {
      await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin-extend', instanceName: selectedInstance, email: session?.email, targetEmail, days })
      })
      showToast('Trial estendido com sucesso!', 'success')
      fetchAdminStats()
    } catch { showToast('Erro ao estender', 'error') }
    finally { setAdminExtending(null) }
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
        <div className="premium-logo-container mini">
          <img src="/images/logo.png" alt="ZettaBots" />
        </div>
        <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </header>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={isAdmin} 
        handleLogout={handleLogout} 
      />

      <main className="dashboard-main">
        <Header 
          isAdmin={isAdmin} 
          session={session} 
          activeTab={activeTab} 
          allInstances={allInstances} 
          selectedInstance={selectedInstance} 
          setSelectedInstance={setSelectedInstance} 
        />

        {activeTab === 'status' && (
          <StatsPanel leads={leads} stats={stats} />
        )}

        {activeTab === 'leads' && (
          <LeadsPanel leads={leads} />
        )}

        {activeTab === 'mensagens' && (
          <ChatMonitorPanel 
            chats={chats} 
            selectedChat={selectedChat} 
            setSelectedChat={setSelectedChat} 
            fetchChatMessages={fetchChatMessages} 
            isAIPaused={isAIPaused} 
            handleToggleAI={handleToggleAI} 
            chatMessages={chatMessages} 
            selectedInstance={selectedInstance} 
          />
        )}

        {activeTab === 'bot' && (
          <AIConfigPanel 
            prompt={prompt} 
            setPrompt={setPrompt} 
            handleSavePrompt={handleSavePrompt} 
            saving={saving} 
            session={session} 
            showToast={showToast} 
            selectedInstance={selectedInstance}
            files={knowledgeFiles}
            setFiles={setKnowledgeFiles}
          />
        )}

        {activeTab === 'financeiro' && (
          <FinancePanel 
            financeData={financeData} 
            session={session} 
            setShowSubModal={setShowSubModal} 
          />
        )}

        {activeTab === 'integracoes' && (
          <IntegrationsPanel 
            webhookUrl={webhookUrl} 
            setWebhookUrl={setWebhookUrl} 
            handleSaveIntegrations={handleSaveIntegrations} 
          />
        )}

        {activeTab === 'conexao' && (
          <ConnectionPanel 
            qrStatus={qrStatus} 
            qrCode={qrCode} 
            qrTimer={qrTimer} 
            fetchQrCode={fetchQrCode} 
            selectedInstance={selectedInstance} 
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminPanel 
            adminStats={adminStats} 
            adminExtending={adminExtending} 
            handleAdminExtend={handleAdminExtend} 
            adminSearch={adminSearch} 
            setAdminSearch={setAdminSearch} 
            adminPlanFilter={adminPlanFilter} 
            setAdminPlanFilter={setAdminPlanFilter} 
          />
        )}
      </main>

      {showSubModal && (
        <SubModal 
          setShowSubModal={setShowSubModal} 
          setCheckoutPix={setCheckoutPix} 
          checkoutPix={checkoutPix} 
          handleGeneratePix={handleGeneratePix} 
          checkoutLoading={checkoutLoading} 
          showToast={showToast} 
        />
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
