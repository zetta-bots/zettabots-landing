import React from 'react';

const PersonalityPanel = ({ prompt, setPrompt, handleSavePrompt, saving }) => {
  return (
    <div className="tab-panel">
      <div className="glass-card">
        <h3>Treinar Personalidade da IA</h3>
        <p style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '1rem' }}>
          Defina como sua IA deve se comportar e quais produtos ela deve vender.
        </p>
        <textarea 
          className="prompt-editor" 
          rows="12" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)} 
          style={{ 
            width: '100%', 
            padding: '1rem', 
            background: 'rgba(0,0,0,0.2)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: 'white', 
            borderRadius: '12px' 
          }} 
        />
        <button 
          onClick={handleSavePrompt} 
          disabled={saving} 
          className="btn-primary" 
          style={{ marginTop: '1rem' }}
        >
          {saving ? 'Salvando...' : 'Salvar Personalidade'}
        </button>
      </div>
    </div>
  );
};

export default PersonalityPanel;
