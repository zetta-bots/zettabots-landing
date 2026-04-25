import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, isAdmin, handleLogout, isGlobalPaused, handleGlobalEmergency }) => {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="premium-logo-container">
          <img src="/images/logo.png" alt="ZettaBots" />
        </div>
        <div className="brand-info">
          <h2>ZettaBots</h2>
          <p>IA de Vendas</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} 
          onClick={() => setActiveTab('status')}
        >
          <span className="icon">📊</span> Dashboard
        </button>
        <button 
          className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} 
          onClick={() => setActiveTab('leads')}
        >
          <span className="icon">👤</span> Meus Leads
        </button>
        <button 
          className={`nav-item ${activeTab === 'mensagens' ? 'active' : ''}`} 
          onClick={() => setActiveTab('mensagens')}
        >
          <span className="icon">💬</span> Monitor de Chat
        </button>
        <button 
          className={`nav-item ${activeTab === 'bot' ? 'active' : ''}`} 
          onClick={() => setActiveTab('bot')}
        >
          <span className="icon">🧠</span> Cérebro da IA
        </button>
        <button 
          className={`nav-item ${activeTab === 'financeiro' ? 'active' : ''}`} 
          onClick={() => setActiveTab('financeiro')}
        >
          <span className="icon">💰</span> Financeiro
        </button>
        <button 
          className={`nav-item ${activeTab === 'integracoes' ? 'active' : ''}`} 
          onClick={() => setActiveTab('integracoes')}
        >
          <span className="icon">🔌</span> Integrações
        </button>
        <button 
          className={`nav-item ${activeTab === 'conexao' ? 'active' : ''}`} 
          onClick={() => setActiveTab('conexao')}
        >
          <span className="icon">🔗</span> Conexão
        </button>
        
        {isAdmin && (
          <button 
            className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} 
            onClick={() => setActiveTab('admin')} 
            style={{
              marginTop: '1rem', 
              borderTop: '1px solid rgba(255,255,255,0.05)', 
              paddingTop: '1rem', 
              color: '#fbbf24'
            }}
          >
            <span className="icon">👑</span> Painel Admin
          </button>
        )}
        <div style={{ marginTop: '2rem', padding: '0 1rem' }}>
          <button 
            className={`nav-item emergency-btn ${isGlobalPaused ? 'active' : ''}`} 
            onClick={handleGlobalEmergency}
            style={{ 
              width: '100%', 
              background: isGlobalPaused ? '#ef4444' : 'rgba(239, 68, 68, 0.1)', 
              color: isGlobalPaused ? '#fff' : '#ef4444', 
              border: isGlobalPaused ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 700,
              fontSize: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: isGlobalPaused ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
            }}
          >
            <span className="icon">{isGlobalPaused ? '🚨' : '🆘'}</span>
            {isGlobalPaused ? 'MODO PÂNICO ATIVO' : 'BOTÃO DE EMERGÊNCIA'}
          </button>
        </div>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="icon">🚪</span> Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
