import React from 'react';

const LeadsPanel = ({ leads, loading = false, contactCount = 0, message = null }) => {
  const hasLeads = leads && leads.length > 0;

  const SkeletonRow = () => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <td style={{ padding: '1.25rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="skeleton-loading" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
          <div className="skeleton-loading" style={{ width: '120px', height: '14px', borderRadius: '4px' }}></div>
        </div>
      </td>
      <td style={{ padding: '1rem' }}><div className="skeleton-loading" style={{ width: '100px', height: '12px', borderRadius: '4px' }}></div></td>
      <td style={{ padding: '1rem' }}><div className="skeleton-loading" style={{ width: '150px', height: '12px', borderRadius: '4px' }}></div></td>
      <td style={{ padding: '1rem' }}><div className="skeleton-loading" style={{ width: '80px', height: '12px', borderRadius: '4px' }}></div></td>
    </tr>
  );

  return (
    <div className="tab-panel reveal-item">
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Hub de Leads Inteligente</h3>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
              {loading ? 'Sincronizando banco de dados...' : hasLeads ? `Analisando ${leads.length} lead${leads.length !== 1 ? 's' : ''} em tempo real` : 'Aguardando capturas'}
            </p>
          </div>
          {contactCount > 0 && !hasLeads && !loading && (
            <div className="finance-badge trial" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              ⚡ {contactCount} Contatos em Espera
            </div>
          )}
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1.25rem 1.5rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.05em' }}>CLIENTE</th>
                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.05em' }}>WHATSAPP</th>
                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.05em' }}>QUALIFICAÇÃO DA IA</th>
                <th style={{ padding: '1.25rem 1.5rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.05em' }}>ÚLTIMO CONTATO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : !hasLeads ? (
                <tr>
                  <td colSpan="4">
                    <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 15px rgba(124, 58, 237, 0.3))' }}>🤖</div>
                      <h4 style={{ margin: '0 0 0.75rem', color: '#fff', fontSize: '1.2rem', fontWeight: '700' }}>
                        Base de Leads Vazia
                      </h4>
                      <p style={{ margin: '0 auto', color: '#94a3b8', fontSize: '0.95rem', maxWidth: '450px', lineHeight: '1.6' }}>
                        {message || (contactCount > 0
                          ? `Temos ${contactCount} potenciais leads na sua instância. A Sarah irá listá-los aqui assim que eles começarem a interagir.`
                          : 'Sua IA está pronta e aguardando. Assim que alguém interagir com seu WhatsApp, os dados aparecerão aqui instantaneamente.')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, i) => (
                  <tr key={i} className="reveal-item" style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)', 
                    animationDelay: `${i * 0.08}s`,
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.3s'
                  }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '14px',
                          background: lead.sentiment === 'hot' ? 'linear-gradient(135deg, #ef4444, #f59e0b)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: '800',
                          color: '#fff',
                          boxShadow: lead.sentiment === 'hot' ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 4px 15px rgba(124, 58, 237, 0.2)'
                        }}>
                          {(lead.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{lead.name}</span>
                          {lead.ai_notes && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: '#64748b', 
                              fontWeight: '500',
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              background: 'rgba(255,255,255,0.03)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }} title={lead.ai_notes}>
                              ✨ {lead.ai_notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
                      {lead.phone}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '6px 14px',
                          background: lead.sentiment === 'hot' ? 'rgba(239, 68, 68, 0.15)' : lead.sentiment === 'cold' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                          color: lead.sentiment === 'hot' ? '#fca5a5' : lead.sentiment === 'cold' ? '#93c5fd' : '#94a3b8',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: '900',
                          letterSpacing: '0.05em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: `1px solid ${lead.sentiment === 'hot' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'}`
                        }}>
                          {lead.sentiment === 'hot' ? '🔥 QUENTE' : lead.sentiment === 'cold' ? '❄️ FRIO' : '😐 NEUTRO'}
                        </span>
                        <div style={{
                          padding: '6px 14px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#34d399',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          border: '1px solid rgba(16, 185, 129, 0.1)'
                        }}>
                          {lead.stage || 'lead'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                      {lead.date || (lead.last_contact_at ? new Date(lead.last_contact_at).toLocaleDateString('pt-BR') : 'Hoje')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsPanel;
