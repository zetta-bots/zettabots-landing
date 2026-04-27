import React, { useState, useRef, useEffect } from 'react';

const Sidebar = ({ activeTab, setActiveTab, isAdmin, handleLogout, isGlobalPaused, handleGlobalEmergency, session }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      <nav className="sidebar-nav custom-scroll" style={{ flex: 1, padding: '0 1.25rem', overflowY: 'auto' }}>
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
            onMouseEnter={(e) => activeTab !== item.id && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)', e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={(e) => activeTab !== item.id && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#64748b')}
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

        <div style={{ marginTop: '2.5rem', padding: '0 0.5rem', marginBottom: '1rem' }}>
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

      {/* FOOTER USER PROFILE */}
      <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative' }} ref={userMenuRef}>
        
        {/* Dropdown Menu (Abre para CIMA) */}
        {showUserMenu && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: '1.25rem',
            right: '1.25rem',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'revealUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ padding: '0.5rem' }}>
              <button onClick={() => { setShowUserMenu(false); setActiveTab('settings'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.85rem 1rem', borderRadius: '12px', background: 'transparent', color: '#e2e8f0', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left', width: '100%' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: '1rem' }}>⚙️</span>
                Configurações
              </button>
              <a href="https://docs.zettabots.ia.br" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.85rem 1rem', borderRadius: '12px', background: 'transparent', color: '#e2e8f0', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '600' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: '1rem' }}>📚</span>
                Documentação
              </a>
              <a href="https://support.zettabots.ia.br" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.85rem 1rem', borderRadius: '12px', background: 'transparent', color: '#e2e8f0', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '600' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: '1rem' }}>💬</span>
                Suporte
              </a>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

            <div style={{ padding: '0.5rem' }}>
              <button 
                onClick={handleLogout}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '0.85rem 1rem', borderRadius: '12px', background: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '600' }} 
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} 
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '1rem' }}>🚪</span>
                Sair da Conta
              </button>
            </div>
          </div>
        )}

        {/* User Card */}
        <div 
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '16px',
            background: showUserMenu ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: '1px solid transparent',
          }}
          onMouseEnter={e => !showUserMenu && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
          onMouseLeave={e => !showUserMenu && (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
            {session?.name?.[0]?.toUpperCase() || session?.instanceName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session?.name || session?.instanceName || 'Usuário'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session?.email || 'zetta@bots.ia'}
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            ▲
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
