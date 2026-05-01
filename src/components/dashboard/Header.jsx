import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="main-header reveal-item" style={{ 
      background: 'rgba(15, 23, 42, 0.4)', 
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '1.25rem 2.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="header-title">
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>
          {isAdmin ? 'ZettaBots Master' : (session?.name || (session?.instanceName?.startsWith('zba') ? 'Atlas da Fé' : session?.instanceName) || 'ZettaBots Dashboard')}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>
            {activeTab === 'conexao' ? 'CONEXÃO ATIVA' : activeTab.toUpperCase()}
          </p>
          {allInstances.length > 0 && (
            <select 
              className="instance-selector-mini"
              value={selectedInstance || ''}
              onChange={(e) => setSelectedInstance(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.7rem',
                padding: '2px 8px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {allInstances.map(i => (
                <option key={i.id} value={i.instance_name} style={{ background: '#0f172a' }}>{i.display_name || i.instance_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

        {/* Notificações */}
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              width: '44px', 
              height: '44px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              position: 'relative',
              fontSize: '1.2rem',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                background: '#ef4444', 
                color: '#fff', 
                fontSize: '0.65rem', 
                fontWeight: '900', 
                padding: '3px 7px', 
                borderRadius: '50%',
                border: '2px solid #0f172a',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de Notificações Premium */}
          {showNotifications && (
            <div style={{ 
              position: 'absolute', 
              top: '55px', 
              right: 0, 
              width: '350px', 
              background: 'rgba(15, 23, 42, 0.95)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '24px', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)', 
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'revealUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#fff' }}>Central de Alertas</h4>
                <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: '900', background: 'rgba(124, 58, 237, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                  {unreadCount} NOVOS
                </span>
              </div>
              
              <div className="custom-scroll" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map((n, idx) => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      style={{ 
                        padding: '1.25rem 1.5rem', 
                        borderBottom: '1px solid rgba(255,255,255,0.03)', 
                        background: n.is_read ? 'transparent' : 'rgba(124, 58, 237, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        animation: `revealUp 0.3s ease-out forwards ${idx * 0.05}s`,
                        opacity: 0
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(124, 58, 237, 0.05)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: n.is_read ? '#94a3b8' : '#fff' }}>{n.title}</span>
                        <span style={{ fontSize: '0.65rem', color: '#475569', fontWeight: '700' }}>{new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5', fontWeight: '500' }}>{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', opacity: 0.3 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍃</div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>Ambiente tranquilo por aqui.</p>
                  </div>
                )}
              </div>
              
              <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <button style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px' }}>
                  LIMPAR TODAS
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '8px 16px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span style={{ fontSize: '1rem' }}>⭐</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>
            {session?.status === 'admin' ? 'ADMIN' : `PLANO ${session?.status === 'pago' ? 'PRO' : 'TRIAL'}`}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
