const AIConfigPanel = ({ 
  prompt, 
  setPrompt, 
  handleSavePrompt, 
  saving, 
  session, 
  showToast, 
  files, 
  handleUpload,
  handleDelete,
  handleRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState('behavior');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const planLimits = {
    trial: 3,
    start: 3,
    pro: 20,
    enterprise: Infinity,
    admin: Infinity
  };

  const currentPlan = session?.plan_type || 'trial';
  const limit = planLimits[currentPlan] || 3;
  const isLimitReached = files.length >= limit;

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    
    if (isLimitReached) {
      showToast(`Limite atingido para o plano ${currentPlan.toUpperCase()}.`, 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(20);
    
    try {
      for (const file of selectedFiles) {
        setUploadProgress(40);
        await handleUpload(file);
        setUploadProgress(100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="tab-panel reveal-item">
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '650px', border: '1px solid rgba(255,255,255,0.05)' }}>
        
        {/* Header com Design Premium */}
        <div style={{ 
          padding: '2rem 2.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'linear-gradient(to right, rgba(124, 58, 237, 0.05), transparent)' 
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ filter: 'drop-shadow(0 0 8px var(--color-primary))' }}>🧠</span> Configuração do Cérebro
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Customize o comportamento e ensine novos dados à Sarah.</p>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
             <button 
              onClick={handleRefresh}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', borderRadius: '12px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
              title="Sincronizar Dados"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              🔄
            </button>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => setActiveSubTab('behavior')}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  fontSize: '0.8rem', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  background: activeSubTab === 'behavior' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                  color: activeSubTab === 'behavior' ? '#fff' : '#64748b',
                  transition: 'all 0.3s'
                }}
              >
                Comportamento
              </button>
              <button 
                onClick={() => {
                  if (currentPlan === 'start') {
                    showToast('O plano START não inclui Base de Conhecimento. Faça upgrade para o PRO!', 'error');
                  } else {
                    setActiveSubTab('knowledge');
                  }
                }}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  fontSize: '0.8rem', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  background: activeSubTab === 'knowledge' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                  color: activeSubTab === 'knowledge' ? '#fff' : '#334155',
                  transition: 'all 0.3s',
                  opacity: currentPlan === 'start' ? 0.5 : 1
                }}
              >
                Conhecimento {currentPlan === 'start' && '🔒'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
          
          {activeSubTab === 'behavior' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'revealUp 0.4s ease-out' }}>
              <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '700', color: '#94a3b8' }}>Instruções de Personalidade (Prompt Maestro)</label>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#a78bfa', background: 'rgba(124, 58, 237, 0.1)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                  IA EM MODO AVANÇADO
                </div>
              </div>
              <textarea 
                className="prompt-editor" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="Ex: Você é a Sarah, a vendedora mais persuasiva do mundo..."
                style={{ 
                  flex: 1,
                  minHeight: '380px',
                  padding: '1.8rem', 
                  background: 'rgba(15, 23, 42, 0.5)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  color: '#e2e8f0', 
                  borderRadius: '24px',
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  resize: 'none',
                  outline: 'none',
                  boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s'
                }} 
              />
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Alterações entram em vigor em tempo real para novos chats.</p>
                <button 
                  onClick={handleSavePrompt} 
                  disabled={saving} 
                  style={{ 
                    padding: '1rem 3rem', 
                    borderRadius: '16px', 
                    fontWeight: '800', 
                    fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(124, 58, 237, 0.4)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.5)')}
                  onMouseLeave={(e) => !saving && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.4)')}
                >
                  {saving ? 'Atualizando Cérebro...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'knowledge' && (
            <div style={{ animation: 'revealUp 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>Base de Conhecimento RAG</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Ensine a Sarah usando seus próprios documentos.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: isLimitReached ? '#f87171' : '#a78bfa' }}>{files.length} / {limit === Infinity ? '∞' : limit}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>SLOTS DE MEMÓRIA</div>
                </div>
              </div>

              <div 
                onClick={() => !uploading && !isLimitReached && fileInputRef.current.click()}
                style={{
                  border: '2px dashed rgba(124, 58, 237, 0.2)',
                  borderRadius: '32px',
                  padding: '4.5rem 2rem',
                  textAlign: 'center',
                  cursor: uploading || isLimitReached ? 'not-allowed' : 'pointer',
                  background: 'rgba(124, 58, 237, 0.02)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => !uploading && !isLimitReached && (e.currentTarget.style.borderColor = '#7c3aed', e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)', e.currentTarget.style.transform = 'scale(1.01)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)', e.currentTarget.style.background = 'rgba(124, 58, 237, 0.02)', e.currentTarget.style.transform = 'scale(1)')}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                  multiple 
                  accept=".pdf,.txt,.doc,.docx"
                />
                
                {uploading && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: 'linear-gradient(to right, #7c3aed, #06b6d4)', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                )}

                <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', filter: isLimitReached ? 'grayscale(1)' : 'drop-shadow(0 0 15px rgba(124, 58, 237, 0.3))' }}>
                  {uploading ? '⚙️' : isLimitReached ? '🔒' : '📥'}
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '800' }}>
                  {uploading ? 'Indexando Conhecimento...' : isLimitReached ? 'Capacidade de Memória Atingida' : 'Arraste manuais, scripts ou PDFs'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Formatos aceitos: PDF, TXT e DOC (Máx. 10MB)</p>
              </div>

              <div style={{ marginTop: '3.5rem' }}>
                <h5 style={{ color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '1.5rem' }}>Documentos na Memória Ativa</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                  {files.map((file, i) => (
                    <div key={i} className="reveal-item" style={{ 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      padding: '1.25rem', 
                      borderRadius: '20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px', 
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      animationDelay: `${i * 0.1}s`
                    }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.file_name || file.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{file.file_size} • {file.status === 'processing' ? '⌛ Analisando...' : '✅ Indexado'}</p>
                      </div>
                      <button 
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} 
                        onClick={() => handleDelete(file.id, file.file_path)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#334155', border: '1px solid rgba(255, 255, 255, 0.02)', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.01)' }}>
                      <p style={{ fontWeight: '600' }}>A Sarah ainda não possui conhecimentos extras. Ela usará apenas o prompt base.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
  );
};

export default AIConfigPanel;
