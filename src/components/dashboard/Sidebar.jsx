import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, isAdmin, handleLogout }) => {
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
          <span className="icon">🤖</span> Personalidade IA
        </button>
        <button 
          className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`} 
          onClick={() => setActiveTab('feed')}
        >
          <span className="icon">📂</span> Alimentar IA
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
