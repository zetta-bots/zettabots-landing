import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import * as pdfjsLib from 'pdfjs-dist'
import './Dashboard.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// Dashboard Components
import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'
import StatsPanel from '../components/dashboard/StatsPanel'
import LeadsPanel from '../components/dashboard/LeadsPanel'
import ChatMonitorPanel from '../components/dashboard/ChatMonitorPanel'
import FinancePanel from '../components/dashboard/FinancePanel'
import FinancialDashboard from '../components/dashboard/FinancialDashboard'
import IntegrationsPanel from '../components/dashboard/IntegrationsPanel'
import ConnectionPanel from '../components/dashboard/ConnectionPanel'
import AdminPanel from '../components/dashboard/AdminPanel'
import AIConfigPanel from '../components/dashboard/AIConfigPanel'
import SubModal from '../components/dashboard/SubModal'
import FastTestChat from '../components/dashboard/FastTestChat'

export default function Dashboard() {
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('status')
  const [renderError, setRenderError] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [qrStatus, setQrStatus] = useState('loading')
  const [qrTimer, setQrTimer] = useState(40)
  const [chats, setChats] = useState([])
  const [chatsLoading, setChatsLoading] = useState(false)
  const [leads, setLeads] = useState([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsContactCount, setLeadsContactCount] = useState(0)
  const [leadsMessage, setLeadsMessage] = useState(null)
  const [stats, setStats] = useState({ chats: 0, contacts: 0, messages: 0, savedTime: '0h', roi: 'R$ 0', activity: [0,0,0,0,0,0,0] })
  const [financeData, setFinanceData] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false)
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
  const [notifications, setNotifications] = useState([])
  const [isGlobalPaused, setIsGlobalPaused] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const zbSession = localStorage.getItem('zb_session')
    if (!zbSession) {
      navigate('/login')
      return
    }
    const parsed = JSON.parse(zbSession)
    setSession(parsed)
    setSelectedInstance(parsed.instanceName)
    setPrompt(parsed.systemPrompt?.replace(/\[SISTEMA - SILÊNCIO TOTAL\][\s\S]*?Fim\.\n\n/, '') || '')
    setWebhookUrl(parsed.webhookUrl || '')
    setNotificationEmail(parsed.notificationEmail || '')
    setIsAdmin(parsed.email === 'richardrovigati@gmail.com')
    
    // Inicia carregamento
    fetchStats(parsed.instanceName)
    fetchFinance(parsed.instanceName)
    fetchKnowledgeBase()
    fetchNotifications()
    
    if (parsed.email === 'richardrovigati@gmail.com') {
      fetchAdminStats(parsed.email)
      fetchAllInstances(parsed.email)
    }

  }, [navigate])

  // Polling para atualizar status de arquivos e notificações
  useEffect(() => {
    const hasProcessingFiles = knowledgeFiles.some(f => f.status === 'processing');
    
    if (hasProcessingFiles) {
      const interval = setInterval(() => {
        fetchKnowledgeBase();
        fetchNotifications();
      }, 5000); // Atualiza a cada 5 segundos se houver algo treinando
      return () => clearInterval(interval);
    }
  }, [knowledgeFiles]);

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  useEffect(() => {
    if (activeTab === 'status' && selectedInstance) fetchStats(selectedInstance)
    if (activeTab === 'conexao' && selectedInstance) fetchQrCode(selectedInstance)
    if (activeTab === 'mensagens' && selectedInstance) fetchChats(selectedInstance)
    if (activeTab === 'financeiro' && selectedInstance && !isAdmin) fetchFinance(selectedInstance)
    if (activeTab === 'financeiro' && isAdmin) fetchAdminStats(session?.email)
    if (activeTab === 'leads' && selectedInstance) fetchLeads(selectedInstance)
  }, [activeTab, selectedInstance])

  const handleGeneratePix = async (method = 'pix', price = 247, planName = 'Pro') => {
    try {
      setCheckoutLoading(true)
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: method === 'pix' ? 'create-payment' : 'create-checkout',
          recordId: session.recordId || session.id, 
          email: session.email, 
          name: session.name,
          payment_method: method,
          instanceName: selectedInstance,
          amount: price,
          planName: planName
        })
      })
      const data = await res.json()
      if (data.success) {
        if (method === 'card') {
          window.open(data.url, '_blank')
          showToast('Checkout aberto em nova aba!', 'success')
        } else {
          setCheckoutPix(data.payment.point_of_interaction.transaction_data)
          showToast('Pix gerado com sucesso!', 'success')
        }
      } else {
        showToast('Erro: ' + (data.error || 'Falha ao gerar cobrança'), 'error')
      }
    } catch (err) {
      showToast('Erro de conexão: ' + err.message, 'error')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const fetchAllInstances = async (emailOverride) => {
    try {
      const email = emailOverride || session?.email;
      if (!email) return;

      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-all-instances', instanceName: selectedInstance, email })
      })
      const data = await res.json()
      if (data.success) setAllInstances(data.instances)
    } catch (err) { console.error('ERRO ADMIN:', err) }
  }

  const fetchAdminStats = async (emailOverride) => {
    try {
      const email = emailOverride || session?.email;
      if (!email) return;

      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-admin-stats', instanceName: selectedInstance, email })
      })
      const data = await res.json()
      if (data.success) setAdminStats(data)
    } catch (err) { console.error('ADMIN STATS:', err) }
  }

  const handleAdminExtend = async (targetEmail, days = 7) => {
    const adminEmail = session?.email || 'richardrovigati@gmail.com';
    setAdminExtending(targetEmail)
    
    // Update local state immediately (Optimistic UI)
    setAdminStats(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        clients: prev.clients.map(c => {
          if (c.email.toLowerCase() === targetEmail.toLowerCase()) {
            const createdAt = c?.created_at ? new Date(c.created_at) : new Date();
            const newDate = new Date(c.plan_expires_at || new Date());
            newDate.setDate(newDate.getDate() + days);
            return { ...c, plan_expires_at: newDate.toISOString() };
          }
          return c;
        })
      };
    });

    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin-extend', instanceName: 'admin', email: adminEmail, targetEmail, days })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Prazo atualizado! 🎁', 'success')
      } else {
        throw new Error(data.error)
      }
    } catch (err) { 
      showToast('Erro: ' + err.message, 'error') 
      fetchAdminStats(adminEmail) // Rollback on error
    } finally { setAdminExtending(null) }
  }

  const handleAdminToggleStatus = async (targetEmail, currentStatus) => {
    const adminEmail = session?.email || 'richardrovigati@gmail.com';
    
    // Update local state immediately (Optimistic UI)
    setAdminStats(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totalActive: !currentStatus ? (prev.totalActive + 1) : (prev.totalActive - 1),
        totalBlocked: currentStatus ? (prev.totalBlocked + 1) : (prev.totalBlocked - 1),
        clients: prev.clients.map(c => c.email.toLowerCase() === targetEmail.toLowerCase() ? { ...c, is_active: !currentStatus } : c)
      };
    });

    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin-toggle-status', instanceName: 'admin', email: adminEmail, targetEmail, isActive: !currentStatus })
      })
      const data = await res.json()
      if (data.success) {
        showToast(currentStatus ? '🚫 Cliente Bloqueado!' : '✅ Cliente Ativado!', 'success')
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      showToast('Erro: ' + err.message, 'error')
      fetchAdminStats(adminEmail) // Rollback on error
    }
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
    if (!session?.email) return;
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-finance', instanceName, email: session.email })
      })
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error?.includes('token not configured')) {
          console.warn('Finance: Mercado Pago não configurado na Vercel');
          return;
        }
      }

      const data = await res.json()
      if (data.success) setFinanceData(data)
    } catch (err) { 
      console.error('ERRO FINANCE:', err);
    }
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
    setChatsLoading(true)
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-chats', instanceName })
      })
      const data = await res.json()
      if (data.success) {
        setChats(data.chats || [])
      }
    } catch (err) {
      console.error('ERRO CHATS:', err)
      setChats([])
    } finally {
      setChatsLoading(false)
    }
  }

  const fetchChatMessages = async (remoteJid) => {
    if (!remoteJid) return
    setChatMessagesLoading(true)
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-messages', instanceName: selectedInstance, remoteJid })
      })
      const data = await res.json()
      if (data.success) {
        setChatMessages(data.messages || [])
      }
    } catch (err) {
      console.error('ERRO MSG:', err)
      setChatMessages([])
    } finally {
      setChatMessagesLoading(false)
    }
  }

  const fetchLeads = async (instanceName) => {
    setLeadsLoading(true)
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-contacts', instanceName })
      })
      const data = await res.json()
      if (data.success) {
        const newLeads = data.contacts || [];
        if (newLeads.length > leads.length && leads.length > 0) {
          showToast(`${newLeads.length - leads.length} novos leads sincronizados! 🚀`, 'success');
        }
        setLeads(newLeads)
        setLeadsContactCount(data.contactCount || data.totalContactsFromApi || 0)
        setLeadsMessage(data.message || null)
      }
    } catch (err) { 
      console.error('LEADS ERROR:', err) 
    } finally {
      setLeadsLoading(false)
    }
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

  const handleGlobalEmergency = async () => {
    const nextState = !isGlobalPaused;
    setIsGlobalPaused(nextState);
    showToast(nextState ? '🚨 ATIVANDO MODO DE EMERGÊNCIA...' : '✅ Desativando modo de emergência...', 'warning');
    
    try {
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'global-kill-switch',
          email: session.email,
          instanceName: selectedInstance,
          enabled: nextState
        })
      });
      const data = await res.json();
      if (!data.success) {
        setIsGlobalPaused(!nextState);
        showToast('Erro ao ativar emergência', 'error');
      }
    } catch (err) {
      setIsGlobalPaused(!nextState);
      showToast('Erro de conexão', 'error');
    }
  }

  const fetchKnowledgeBase = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('instance_name', selectedInstance)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeFiles(data || []);
    } catch (err) {
      console.error('Erro ao buscar base de conhecimento:', err);
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  }

  const markNotificationAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);
    }
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

  const handleRefreshData = () => {
    fetchKnowledgeBase();
    fetchNotifications();
    showToast('Dados atualizados!', 'success');
  }

  const extractTextFromFile = async (file) => {
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return text.trim();
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        return await file.text();
      } else if (file.type === 'application/msword' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        showToast('⚠️ DOC/DOCX requer processamento adicional. Por enquanto, use TXT ou PDF.', 'info');
        return '';
      } else {
        return '';
      }
    } catch (err) {
      console.error('Erro ao extrair texto:', err);
      throw new Error(`Não foi possível extrair texto: ${err.message}`);
    }
  };

  const handleUploadKnowledge = async (file) => {
    if (!session) return;
    setSaving(true);
    try {
      const extractedText = await extractTextFromFile(file);

      if (!extractedText) {
        showToast('⚠️ Nenhum texto encontrado no arquivo. Verifique o formato.', 'warning');
        setSaving(false);
        return;
      }

      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge_base')
        .upload(`${session.id}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('knowledge_base')
        .insert([{
          user_id: session.id || session.user_id,
          instance_name: selectedInstance,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          extracted_text: extractedText,
          status: 'active'
        }]);

      if (dbError) throw dbError;

      showToast('✅ Arquivo processado e ativo! IA já tem acesso.', 'success');
      fetchKnowledgeBase();
    } catch (err) {
      showToast('❌ Erro no upload: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const handleDeleteKnowledge = async (id, filePath) => {
    if (!window.confirm('Excluir este conhecimento?')) return;
    try {
      await supabase.storage.from('knowledge_base').remove([filePath]);
      await supabase.from('knowledge_base').delete().eq('id', id);
      showToast('Conhecimento removido!', 'info');
      fetchKnowledgeBase();
    } catch (err) {
      showToast('Erro ao excluir', 'error');
    }
  }

  if (!session) return null

  return (
    <div className={`dashboard-layout ${mobileMenuOpen ? 'menu-open' : ''}`}>
      {/* Overlay para fechar menu mobile ao clicar fora */}
      {mobileMenuOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1500 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

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
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (window.innerWidth <= 1024) setMobileMenuOpen(false);
        }} 
        isAdmin={isAdmin} 
        handleLogout={handleLogout}
        isGlobalPaused={isGlobalPaused}
        handleGlobalEmergency={handleGlobalEmergency}
      />

      <main className="dashboard-main">
        {renderError && (
          <div className="glass-card" style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 10px' }}>⚠️ Erro Interno</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{renderError}</p>
            <button onClick={() => setRenderError(null)} style={{ marginTop: '10px', background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Tentar Novamente</button>
          </div>
        )}
        <Header 
          isAdmin={isAdmin} 
          session={session} 
          activeTab={activeTab} 
          allInstances={allInstances} 
          selectedInstance={selectedInstance} 
          setSelectedInstance={setSelectedInstance} 
          notifications={notifications}
          markAsRead={markNotificationAsRead}
        />

        {activeTab === 'status' && (
          <StatsPanel leads={leads} stats={stats} />
        )}

        {activeTab === 'leads' && (
          <LeadsPanel
            leads={leads}
            loading={leadsLoading}
            contactCount={leadsContactCount}
            message={leadsMessage}
          />
        )}

        {activeTab === 'mensagens' && (
          <ChatMonitorPanel
            chats={chats}
            chatsLoading={chatsLoading}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            fetchChatMessages={fetchChatMessages}
            isAIPaused={isAIPaused}
            handleToggleAI={handleToggleAI}
            chatMessages={chatMessages}
            chatMessagesLoading={chatMessagesLoading}
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
            handleUpload={handleUploadKnowledge}
            handleDelete={handleDeleteKnowledge}
            handleRefresh={handleRefreshData}
          />
        )}

        {activeTab === 'financeiro' && (
          <div key="finance-tab" style={{ width: '100%', height: '100%' }}>
            {!isAdmin ? (
              <FinancePanel 
                financeData={financeData} 
                session={session} 
                setShowSubModal={setShowSubModal} 
              />
            ) : (
              adminStats ? (
                <FinancialDashboard adminStats={adminStats} session={session} />
              ) : (
                <div style={{ textAlign: 'center', padding: '5rem' }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: '1rem' }}>Carregando dados mestre...</p>
                </div>
              )
            )}
          </div>
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
            handleAdminToggleStatus={handleAdminToggleStatus}
            adminSearch={adminSearch} 
            setAdminSearch={setAdminSearch} 
            adminPlanFilter={adminPlanFilter} 
            setAdminPlanFilter={setAdminPlanFilter} 
            fetchAdminStats={fetchAdminStats}
          />
        )}

        <FastTestChat 
          session={session} 
          systemPrompt={prompt} 
          knowledgeFiles={knowledgeFiles} 
          selectedInstance={selectedInstance}
        />
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
