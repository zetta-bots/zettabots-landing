import React, { useState, useRef } from 'react';

const FeedIAPart = ({ session, showToast, files, setFiles }) => {
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
      showToast(`Limite de ${limit} arquivos atingido para o plano ${currentPlan.toUpperCase()}.`, 'error');
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
    <div className="glass-card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📂 Base de Conhecimento (Arquivos)</h3>
          <p style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: '4px' }}>
            A Sarah lerá estes arquivos para responder dúvidas específicas dos seus clientes.
          </p>
        </div>
        <span style={{ 
          fontSize: '0.65rem', 
          color: isLimitReached ? '#ef4444' : '#10b981', 
          background: isLimitReached ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
          padding: '2px 10px', 
          borderRadius: '20px',
          fontWeight: 700
        }}>
          {files.length} / {limit === Infinity ? '∞' : limit}
        </span>
      </div>

      <div 
        onClick={() => !uploading && !isLimitReached && fileInputRef.current.click()}
        style={{
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          cursor: uploading || isLimitReached ? 'not-allowed' : 'pointer',
          background: 'rgba(255,255,255,0.01)',
          transition: 'all 0.3s ease',
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          multiple 
          accept=".pdf,.txt,.doc,.docx"
        />
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{uploading ? '⌛' : '📤'}</div>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
          {uploading ? 'Processando...' : 'Clique para subir manuais ou catálogos'}
        </p>
        {uploading && (
          <div style={{ width: '100%', maxWidth: '200px', margin: '1rem auto 0', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', height: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#7c3aed', transition: 'width 0.3s ease' }} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '8px' }}>
        {files.map((file, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '1.2rem' }}>📄</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>{file.name}</p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>{file.size}</p>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AIConfigPanel = ({ 
  prompt, 
  setPrompt, 
  handleSavePrompt, 
  saving, 
  session, 
  showToast, 
  selectedInstance,
  files,
  setFiles
}) => {
  return (
    <div className="tab-panel">
      <div className="glass-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>🤖 Personalidade e Comportamento</h3>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginTop: '5px' }}>
            Defina o tom de voz, nome e as regras principais da sua IA Sarah.
          </p>
        </div>
        
        <textarea 
          className="prompt-editor" 
          rows="10" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)} 
          placeholder="Ex: Você é a Sarah, uma assistente gentil da loja Zetta..."
          style={{ 
            width: '100%', 
            padding: '1.2rem', 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: 'white', 
            borderRadius: '16px',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            fontFamily: 'inherit'
          }} 
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            onClick={handleSavePrompt} 
            disabled={saving} 
            className="btn-primary" 
            style={{ padding: '0.8rem 2rem' }}
          >
            {saving ? 'Salvando...' : 'Atualizar Comportamento'}
          </button>
        </div>
      </div>

      <FeedIAPart 
        session={session} 
        showToast={showToast} 
        files={files} 
        setFiles={setFiles} 
      />
    </div>
  );
};

export default AIConfigPanel;
