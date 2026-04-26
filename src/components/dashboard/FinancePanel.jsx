import React from 'react';

const FinancePanel = ({ financeData, session, setShowSubModal }) => {
  if (!session) return <div className="tab-panel">Sessão não encontrada...</div>;

  return (
    <div className="tab-panel reveal-item" style={{ animationDelay: '0.1s' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        
        {/* Card de Assinatura Principal */}
        <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(124, 58, 237, 0.1)', position: 'relative', overflow: 'hidden' }}>
          {!financeData ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: '#64748b' }}>Carregando sua assinatura...</p>
            </div>
          ) : (
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Sua Assinatura</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px', fontWeight: '500' }}>Gestão de plano e faturamento corporativo</p>
                </div>
                <div style={{ 
                  padding: '8px 20px', 
                  borderRadius: '100px', 
                  background: financeData?.status === 'trial' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: financeData?.status === 'trial' ? '#fbbf24' : '#10b981',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  letterSpacing: '0.05em',
                  border: '1px solid currentColor'
                }}>
                  {financeData?.status?.toUpperCase() || 'TRIAL'} ATIVO
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                <div className="stat-info">
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>PLANO ATUAL</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginTop: '4px', display: 'block' }}>{financeData?.plan || 'ZettaBots Trial'}</span>
                </div>
                <div className="stat-info">
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>VALOR MENSAL</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#7c3aed', marginTop: '4px', display: 'block' }}>{financeData?.value || 'Grátis'}</span>
                </div>
                <div className="stat-info">
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>PRÓXIMO VENCIMENTO</span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: '#f1f5f9', marginTop: '4px', display: 'block' }}>{financeData?.nextBilling || 'Sem Vencimento'}</span>
                </div>
                <div className="stat-info">
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>ID DE FATURAMENTO</span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: '#64748b', marginTop: '4px', display: 'block', opacity: 0.8 }}>
                    #{String(session?.phone || session?.id || '00000000').slice(-8)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, padding: '1.2rem', borderRadius: '18px', fontSize: '1rem' }} 
                  onClick={() => setShowSubModal(true)}
                >
                  🚀 Renovar ou Mudar de Plano
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0 1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }} 
                  onClick={() => window.open('https://wa.me/5521969875522', '_blank')}
                >
                  💬 Ajuda
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card de Faturas */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ opacity: 0.5 }}>📑</span> Histórico de Faturas
          </h3>
          
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }} className="custom-scroll">
            {financeData?.invoices?.length > 0 ? (
              financeData.invoices.map((inv, i) => (
                <div key={i} style={{ 
                  padding: '1.25rem', 
                  borderRadius: '16px', 
                  background: 'rgba(255,255,255,0.02)', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>{inv.id}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{inv.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#10b981' }}>{inv.value}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{inv.status}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.3 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>Nenhuma fatura emitida ainda.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancePanel;
