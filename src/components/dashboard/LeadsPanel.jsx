import React from 'react';

const LeadsPanel = ({ leads, loading = false, contactCount = 0, message = null }) => {
  const hasLeads = leads && leads.length > 0;

  const SkeletonRow = () => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <td style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="skeleton skeleton-avatar" style={{ width: '32px', height: '32px' }}></div>
          <div className="skeleton skeleton-title" style={{ width: '100px', margin: 0 }}></div>
        </div>
      </td>
      <td style={{ padding: '1rem' }}><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
      <td style={{ padding: '1rem' }}><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
      <td style={{ padding: '1rem' }}><div className="skeleton skeleton-text" style={{ width: '60px' }}></div></td>
    </tr>
  );

  return (
    <div className="tab-panel">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Lista de Leads Capturados</h3>
            <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
              {loading ? 'Sincronizando contatos...' : hasLeads ? `${leads.length} lead${leads.length !== 1 ? 's' : ''} ativo${leads.length !== 1 ? 's' : ''}` : 'Nenhum lead ainda'}
            </p>
          </div>
          {contactCount > 0 && !hasLeads && !loading && (
            <span style={{
              background: 'rgba(124, 58, 237, 0.1)',
              color: '#a78bfa',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {contactCount} contato{contactCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: '#a1a1aa', fontWeight: '600', fontSize: '0.75rem' }}>NOME</th>
                  <th style={{ padding: '1rem', color: '#a1a1aa', fontWeight: '600', fontSize: '0.75rem' }}>WHATSAPP</th>
                  <th style={{ padding: '1rem', color: '#a1a1aa', fontWeight: '600', fontSize: '0.75rem' }}>STATUS</th>
                  <th style={{ padding: '1rem', color: '#a1a1aa', fontWeight: '600', fontSize: '0.75rem' }}>DATA</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </tbody>
            </table>
          </div>
        ) : !hasLeads ? (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '12px',
            background: 'rgba(124, 58, 237, 0.05)',
            border: '1px solid rgba(124, 58, 237, 0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📲</div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1rem' }}>
              {contactCount > 0 ? 'Contatos Aguardando' : 'Nenhum Lead Ainda'}
            </h4>
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {message || (contactCount > 0
                ? `Você tem ${contactCount} contato${contactCount !== 1 ? 's' : ''} aguardando sincronização. Eles aparecerão aqui quando enviarem a primeira mensagem para sua IA.`
                : 'Os contatos que enviam mensagens para sua IA aparecerão aqui. Comece compartilhando seu número WhatsApp!')}
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: '#a1a1aa'
              }}>
                ✓ Nome e número
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: '#a1a1aa'
              }}>
                ✓ Data de contato
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: '#a1a1aa'
              }}>
                ✓ Status
              </span>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: '#a1a1aa', fontWeight: '600', fontSize: '0.75rem' }}>NOME</th>
                  <th style={{ padding: '1rem', color: '#a1a1aa', fontWeight: '600', fontSize: '0.75rem' }}>WHATSAPP</th>
                  <th style={{ padding: '1rem', color: '#a1a1aa', fontWeight: '600', fontSize: '0.75rem' }}>STATUS</th>
                  <th style={{ padding: '1rem', color: '#a1a1aa', fontWeight: '600', fontSize: '0.75rem' }}>DATA</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr key={i} className="reveal-item" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', animationDelay: `${i * 0.05}s` }}>
                    <td style={{ padding: '1.25rem 1rem', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          flexShrink: 0
                        }}>
                          {(lead.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#fff' }}>{lead.name}</span>
                          {lead.ai_notes && (
                            <span style={{ 
                              fontSize: '0.7rem', 
                              color: '#a1a1aa', 
                              fontWeight: '400',
                              maxWidth: '200px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={lead.ai_notes}>
                              ✨ {lead.ai_notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.9rem' }}>
                      {lead.phone}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 10px',
                          background: lead.sentiment === 'hot' ? 'rgba(239, 68, 68, 0.1)' : lead.sentiment === 'cold' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: lead.sentiment === 'hot' ? '#f87171' : lead.sentiment === 'cold' ? '#60a5fa' : '#a1a1aa',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {lead.sentiment === 'hot' ? '🔥 QUENTE' : lead.sentiment === 'cold' ? '❄️ FRIO' : '😐 NEUTRO'}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          textTransform: 'capitalize'
                        }}>
                          {lead.stage || 'lead'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.85rem' }}>
                      {lead.date || new Date(lead.last_contact_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsPanel;
