const IntegrationsPanel = ({ webhookUrl, setWebhookUrl, handleSaveIntegrations }) => {
  return (
    <div className="tab-panel reveal-item">
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ filter: 'drop-shadow(0 0 8px #06b6d4)' }}>🔌</span> Conectar Ecossistema
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Integre a Sarah com suas ferramentas favoritas de automação.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Webhook Customizado */}
          <div style={{ 
            padding: '2rem', 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '24px', 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔗</div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Webhook Customizado</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5' }}>
              Envie dados de leads em tempo real para qualquer endpoint (n8n, Make, Zapier).
            </p>
            <div style={{ marginTop: '5px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em' }}>
                URL DO ENDPOINT
              </label>
              <input 
                type="text" 
                value={webhookUrl} 
                onChange={(e) => setWebhookUrl(e.target.value)} 
                placeholder="https://seu-webhook.com/..."
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', 
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s'
                }} 
              />
            </div>
            <button 
              onClick={handleSaveIntegrations} 
              style={{ 
                marginTop: '10px',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Salvar Configuração
            </button>
          </div>

          {/* Placeholders Coming Soon */}
          {[
            { name: 'Google Sheets', icon: '📊', desc: 'Sincronize leads diretamente em planilhas.' },
            { name: 'Make.com', icon: '⚡', desc: 'Módulos nativos para automação avançada.' },
            { name: 'Zapier', icon: '🧡', desc: 'Conecte com mais de 5000 aplicativos.' }
          ].map((app, i) => (
            <div key={i} style={{ 
              padding: '2rem', 
              background: 'rgba(255,255,255,0.01)', 
              borderRadius: '24px', 
              border: '1px solid rgba(255,255,255,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              opacity: 0.6,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '0.6rem', fontWeight: '800', color: '#a78bfa', background: 'rgba(124, 58, 237, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>EM BREVE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{app.icon}</div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{app.name}</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5' }}>
                {app.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPanel;
