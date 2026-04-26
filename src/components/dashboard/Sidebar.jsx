import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, isAdmin, handleLogout, isGlobalPaused, handleGlobalEmergency }) => {
  return (
    <aside className="dashboard-sidebar reveal-item">
      <div className="sidebar-header">
        <div className="premium-logo-container">
          <img src="/images/logo.png" alt="ZettaBots" />
        </div>
        <div className="brand-info">
          <h2>ZettaBots</h2>
          <p>IA DE VENDAS</p>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ flex: 1, padding: '0 1.25rem' }}>
        {[
          { id: 'status', label: 'Dashboard', icon: '📊' },
          { id: 'leads', label: 'Meus Leads', icon: '👤' },
          { id: 'mensagens', label: 'Monitor de Chat', icon: '💬' },
          { id: 'bot', label: 'Cérebro da IA', icon: '🧠' },
          { id: 'financeiro', label: 'Financeiro', icon: '💰' },
          { id: 'integracoes', label: 'Integrações', icon: '🔌' },
          { id: 'conexao', label: 'Conexão', icon: '🔗' }
        ].map((item, i) => (
          <button 
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(item.id)}
            style={{
              width: '100%',
              padding: '12px 16px',
              margin: '4px 0',
              borderRadius: '14px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === item.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: activeTab === item.id ? '#a78bfa' : '#64748b',
              fontWeight: '700',
              fontSize: '0.9rem',
              animation: `revealUp 0.4s ease-out forwards ${i * 0.05}s`,
              opacity: 0
            }}
            onMouseEnter={(e) => !activeTab === item.id && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)', e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={(e) => !activeTab === item.id && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#64748b')}
          >
            <span style={{ fontSize: '1.2rem', filter: activeTab === item.id ? 'drop-shadow(0 0 5px rgba(124, 58, 237, 0.5))' : 'grayscale(1)' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        
        {isAdmin && (
          <button 
            className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} 
            onClick={() => setActiveTab('admin')} 
            style={{
              width: '100%',
              padding: '12px 16px',
              marginTop: '1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              background: 'transparent',
              color: '#fbbf24',
              fontWeight: '800',
              fontSize: '0.85rem',
              border: 'none'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>👑</span> Painel Admin
          </button>
        )}

        <div style={{ marginTop: '2.5rem', padding: '0 0.5rem' }}>
          <button 
            onClick={handleGlobalEmergency}
            style={{ 
              width: '100%', 
              background: isGlobalPaused ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'rgba(239, 68, 68, 0.1)', 
              color: isGlobalPaused ? '#fff' : '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isGlobalPaused ? '0 10px 25px rgba(239, 68, 68, 0.4)' : 'none'
            }}
            onMouseEnter={(e) => !isGlobalPaused && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)', e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !isGlobalPaused && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)', e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>{isGlobalPaused ? '🚨' : '🆘'}</span>
            {isGlobalPaused ? 'PÂNICO ATIVADO' : 'BOTÃO DE PÂNICO'}
          </button>
        </div>
      </nav>

      <div style={{ padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '700',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)', e.currentTarget.style.color = '#ef4444', e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#64748b', e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)')}
        >
          <span>🚪</span> Sair da Conta
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
