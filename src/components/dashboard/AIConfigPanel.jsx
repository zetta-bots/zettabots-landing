import React, { useState, useRef } from 'react';

const AIConfigPanel = ({ 
  prompt, 
  setPrompt, 
  handleSavePrompt, 
  saving, 
  session, 
  showToast, 
  files, 
  setFiles 
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

  const currentPlan = session.plan_type || 'trial';
  const limit = planLimits[currentPlan] || 3;
  const isLimitReached = files.length >= limit;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleUpload(selectedFiles);
  };

  const handleUpload = async (selectedFiles) => {
    if (isLimitReached) {
      showToast(`Limite atingido para o plano ${currentPlan.toUpperCase()}.`, 'error');
      return;
    }
    setUploading(true);
    setUploadProgress(10);
    try {
      for (let i = 20; i <= 100; i += 20) {
        await new Promise(r => setTimeout(r, 300));
        setUploadProgress(i);
      }
      const newFiles = selectedFiles.map(f => ({
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString('pt-BR')
      }));
      setFiles(prev => [...prev, ...newFiles]);
      showToast('Base de conhecimento atualizada!', 'success');
    } catch (err) {
      showToast('Erro ao enviar arquivo', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="tab-panel">
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
        
        {/* Header do Painel Unificado */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>🧠 Configuração do Cérebro</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Customize o comportamento e o conhecimento da Sarah.</p>
          </div>
          <div className="segmented-control" style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
            <button 
              onClick={() => setActiveSubTab('behavior')}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                background: activeSubTab === 'behavior' ? 'var(--color-primary)' : 'transparent',
                color: activeSubTab === 'behavior' ? '#fff' : 'var(--color-text-muted)',
                transition: 'all 0.2s'
              }}
            >
              Comportamento
            </button>
            <button 
              onClick={() => setActiveSubTab('knowledge')}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                background: activeSubTab === 'knowledge' ? 'var(--color-primary)' : 'transparent',
                color: activeSubTab === 'knowledge' ? '#fff' : 'var(--color-text-muted)',
                transition: 'all 0.2s'
              }}
            >
              Conhecimento
            </button>
          </div>
        </div>

        {/* Conteúdo Dinâmico */}
        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          
          {activeSubTab === 'behavior' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa' }}>Instruções de Personalidade (System Prompt)</label>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', background: 'rgba(124, 58, 237, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>Modo Avançado</span>
              </div>
              <textarea 
                className="prompt-editor" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="Ex: Você é a Sarah, uma assistente gentil..."
                style={{ 
                  flex: 1,
                  minHeight: '350px',
                  padding: '1.5rem', 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  color: 'white', 
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  resize: 'none',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                }} 
              />
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>As alterações são aplicadas instantaneamente em novas conversas.</p>
                <button 
                  onClick={handleSavePrompt} 
                  disabled={saving} 
                  className="btn-primary" 
                  style={{ padding: '0.8rem 2.5rem', borderRadius: '12px', fontWeight: 700, boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)' }}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'knowledge' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#fff' }}>Base de Dados da Sarah</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Arquivos usados para RAG (Retrieval Augmented Generation).</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isLimitReached ? '#ef4444' : 'var(--color-primary)' }}>{files.length} / {limit === Infinity ? '∞' : limit}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Arquivos Usados</div>
                </div>
              </div>

              <div 
                onClick={() => !uploading && !isLimitReached && fileInputRef.current.click()}
                style={{
                  border: '2px dashed rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  cursor: uploading || isLimitReached ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => !uploading && !isLimitReached && (e.currentTarget.style.borderColor = 'var(--color-primary)', e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)', e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
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
                  <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: 'var(--color-primary)', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                )}

                <div style={{ fontSize: '3rem', marginBottom: '1.5rem', filter: isLimitReached ? 'grayscale(1)' : 'none' }}>
                  {uploading ? '⚙️' : isLimitReached ? '🔒' : '📁'}
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                  {uploading ? 'Processando Conhecimento...' : isLimitReached ? 'Limite de Armazenamento Atingido' : 'Arraste manuais ou tabelas de preços'}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Suporta PDF, TXT e DOC (Até 10MB)</p>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <h5 style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1, marginBottom: '1rem' }}>Arquivos Indexados</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {files.map((file, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{file.size} • {file.date}</p>
                      </div>
                      <button 
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#444', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                      <p>Nenhum arquivo customizado. A Sarah usará apenas o comportamento padrão.</p>
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

export default AIConfigPanel;
