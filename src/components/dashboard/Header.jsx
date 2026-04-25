import React, { useState, useRef, useEffect } from 'react';

const Header = ({ 
  isAdmin, 
  session, 
  activeTab, 
  allInstances, 
  selectedInstance, 
  setSelectedInstance,
  notifications = [],
  markAsRead
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="main-header">
      <div className="header-title">
        <h1>{isAdmin ? 'ZettaBots Master' : `Bem-vindo, ${session?.name || session?.instanceName || ''}`}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p>{activeTab === 'conexao' ? 'CONEXÃO' : activeTab.toUpperCase()}</p>
          {isAdmin && allInstances.length > 0 && (
            <select 
              className="instance-selector-mini"
              value={selectedInstance || ''}
              onChange={(e) => setSelectedInstance(e.target.value)}
            >
              {allInstances.map(i => (
                <option key={i.id} value={i.instance_name}>{i.instance_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notificações */}
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '10px', 
              width: '40px', 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              position: 'relative',
              fontSize: '1.2rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-5px', 
                right: '-5px', 
                background: '#ef4444', 
                color: '#fff', 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                padding: '2px 6px', 
                borderRadius: '10px',
                border: '2px solid var(--color-bg)',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de Notificações */}
          {showNotifications && (
            <div style={{ 
              position: 'absolute', 
              top: '50px', 
              right: 0, 
              width: '320px', 
              background: '#0f172a', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '16px', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Notificações</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>{unreadCount} novas</span>
              </div>
              
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      style={{ 
                        padding: '15px', 
                        borderBottom: '1px solid rgba(255,255,255,0.02)', 
                        background: n.is_read ? 'transparent' : 'rgba(124, 58, 237, 0.05)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(124, 58, 237, 0.05)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: n.is_read ? '#a1a1aa' : '#fff' }}>{n.title}</span>
                        <span style={{ fontSize: '0.6rem', color: '#555' }}>{new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#444' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>Nenhuma notificação por aqui.</p>
                  </div>
                )}
              </div>
              
              <div style={{ padding: '10px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Ver tudo</button>
              </div>
            </div>
          )}
        </div>

        <div className="plan-badge-v2">
          ⭐ PLANO {['pago', 'admin'].includes(session?.status) ? 'PRO' : 'TRIAL'}
        </div>
      </div>
    </header>
  );
};

export default Header;
