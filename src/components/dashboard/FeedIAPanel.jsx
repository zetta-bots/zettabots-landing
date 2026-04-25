import React, { useState, useRef } from 'react';

const FeedIAPanel = ({ session, showToast, selectedInstance }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Limites baseados no plano
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
      showToast(`Limite de ${limit} arquivos atingido para o plano ${currentPlan.toUpperCase()}. Faça upgrade!`, 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    // Simulando progresso e upload para o n8n
    // No futuro, aqui chamaremos o webhook de ingestão
    try {
      for (let i = 20; i <= 100; i += 20) {
        await new Promise(r => setTimeout(r, 400));
        setUploadProgress(i);
      }

      const newFiles = selectedFiles.map(f => ({
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString('pt-BR')
      }));

      setFiles(prev => [...prev, ...newFiles]);
      showToast('Arquivo enviado e processado pela Sarah! 🧠', 'success');
    } catch (err) {
      showToast('Erro ao enviar arquivo', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="tab-panel">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>🧠 Alimentar Inteligência</h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginTop: '5px' }}>
              Suba PDFs, TXT ou DOC para que a Sarah aprenda sobre seu negócio.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ 
              fontSize: '0.7rem', 
              color: isLimitReached ? '#ef4444' : '#10b981', 
              background: isLimitReached ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              padding: '4px 12px', 
              borderRadius: '20px',
              fontWeight: 700
            }}>
              {files.length} / {limit === Infinity ? '∞' : limit} Arquivos
            </span>
          </div>
        </div>

        <div 
          onClick={() => !uploading && !isLimitReached && fileInputRef.current.click()}
          style={{
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: uploading || isLimitReached ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,0.02)',
            transition: 'all 0.3s ease',
            opacity: isLimitReached ? 0.5 : 1
          }}
          onMouseEnter={(e) => !uploading && !isLimitReached && (e.currentTarget.style.borderColor = '#7c3aed')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            multiple 
            accept=".pdf,.txt,.doc,.docx"
          />
          
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {uploading ? '⏳' : isLimitReached ? '🔒' : '📤'}
          </div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>
            {uploading ? 'Enviando e Treinando...' : isLimitReached ? 'Limite do Plano Atingido' : 'Clique ou arraste arquivos aqui'}
          </h4>
          <p style={{ color: '#a1a1aa', fontSize: '0.8rem', margin: 0 }}>
            PDF, TXT ou DOC (Máx. 10MB por arquivo)
          </p>

          {uploading && (
            <div style={{ width: '100%', maxWidth: '300px', margin: '1.5rem auto 0', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${uploadProgress}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', 
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>
          )}
        </div>

        {isLimitReached && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.3)', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🚀</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>Evolua seu plano para subir mais arquivos</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#a1a1aa' }}>O plano PRO permite até 20 arquivos de conhecimento.</p>
            </div>
            <button className="btn-primary" style={{ padding: '6px 15px', fontSize: '0.75rem' }}>Fazer Upgrade</button>
          </div>
        )}

        <div style={{ marginTop: '2.5rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📚 Base de Conhecimento Ativa
          </h4>
          
          <div style={{ display: 'grid', gap: '10px' }}>
            {files.map((file, i) => (
              <div 
                key={i} 
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>📄</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{file.name}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#a1a1aa' }}>{file.size} • Enviado em {file.date}</p>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                  onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                >
                  🗑️
                </button>
              </div>
            ))}

            {files.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#555' }}>
                <p style={{ margin: 0 }}>Nenhum arquivo na base de conhecimento.</p>
                <p style={{ fontSize: '0.8rem' }}>A Sarah usará apenas as instruções da Personalidade IA.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedIAPanel;
