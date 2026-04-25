import React from 'react';

const IntegrationsPanel = ({ webhookUrl, setWebhookUrl, handleSaveIntegrations }) => {
  return (
    <div className="tab-panel">
      <div className="glass-card">
        <h3>🔌 Integrações Externas</h3>
        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
            URL do seu Webhook (Make/n8n/Zapier)
          </label>
          <input 
            type="text" 
            value={webhookUrl} 
            onChange={(e) => setWebhookUrl(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '0.8rem', 
              background: 'rgba(0,0,0,0.3)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '10px', 
              color: 'white' 
            }} 
          />
          <button 
            onClick={handleSaveIntegrations} 
            className="btn-primary" 
            style={{ marginTop: '1rem' }}
          >
            Salvar Endpoint
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPanel;
