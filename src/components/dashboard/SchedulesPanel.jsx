import React, { useState, useEffect } from 'react';

const SchedulesPanel = ({ selectedInstance, showToast }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-schedules', instanceName: selectedInstance })
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(data.schedules || []);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstance) fetchSchedules();
  }, [selectedInstance]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'sent': return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      case 'failed': return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      default: return { background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' };
    }
  };

  const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length > 10 ? `+${cleaned}` : cleaned;
  };

  return (
    <div className="glass-card reveal-item" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            📅 Agendamentos Inteligentes
          </h3>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Acompanhe os lembretes e mensagens programados pela Sarah.
          </p>
        </div>
        <button 
          onClick={fetchSchedules}
          className="refresh-btn"
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '10px 15px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          🔄 Atualizar
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : schedules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h4 style={{ color: '#fff', margin: '0 0 0.5rem' }}>Nenhum agendamento ativo</h4>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
            Quando a Sarah identificar um pedido de lembrete, ele aparecerá aqui automaticamente.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {schedules.map((item) => (
            <div 
              key={item.id}
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                transition: 'transform 0.2s'
              }}
            >
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '12px', 
                background: 'rgba(124, 58, 237, 0.1)', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid rgba(124, 58, 237, 0.2)'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#a78bfa' }}>
                  {new Date(item.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit' })}
                </span>
                <span style={{ fontSize: '0.6rem', fontWeight: '600', color: '#a78bfa', textTransform: 'uppercase' }}>
                  {new Date(item.scheduled_at).toLocaleDateString('pt-BR', { month: 'short' })}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{formatPhone(item.contact_phone)}</span>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    fontSize: '0.65rem', 
                    fontWeight: '800', 
                    textTransform: 'uppercase',
                    ...getStatusStyle(item.status)
                  }}>
                    {item.status === 'pending' ? 'Pendente' : item.status === 'sent' ? 'Enviado' : 'Falhou'}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {item.message}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>
                  {new Date(item.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {new Date(item.scheduled_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '16px', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
        <h4 style={{ margin: '0 0 0.5rem', color: '#a78bfa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💡 Dica de Especialista
        </h4>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.5' }}>
          Peça para Sarah no WhatsApp: <strong style={{ color: '#e2e8f0' }}>"Sarah, me lembre de ligar para esse cliente amanhã às 10h"</strong>. 
          Ela irá confirmar e o agendamento aparecerá aqui em tempo real!
        </p>
      </div>
    </div>
  );
};

export default SchedulesPanel;
