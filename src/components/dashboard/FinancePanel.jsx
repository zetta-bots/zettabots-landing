import React from 'react';

const FinancePanel = ({ financeData, session, setShowSubModal }) => {
  return (
    <div className="tab-panel finance-container">
      <div className="finance-top-row">
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Sua Assinatura</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Gestão de plano e faturamento
              </p>
            </div>
            <span className={`finance-badge ${financeData?.status || 'trial'}`}>
              {financeData?.status === 'trial' ? 'Trial' :
               financeData?.status === 'blocked' ? 'Bloqueado' :
               financeData?.status ? `${financeData.status.charAt(0).toUpperCase() + financeData.status.slice(1)} Ativo` : 'Trial'}
            </span>
          </div>

          {financeData ? (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-info">
                  <span className="stat-label">Plano Atual</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{financeData.plan}</span>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Valor Mensal</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                    {financeData.value}
                  </span>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Próxima Cobrança</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{financeData.nextBilling}</span>
                </div>
                <div className="stat-info">
                  <span className="stat-label">ID do Cliente</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', opacity: 0.5 }}>{session.phone}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1 }} 
                  onClick={() => setShowSubModal(true)}
                >
                  🚀 Renovar / Mudar Plano
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.8rem' }} 
                  onClick={() => window.open('https://wa.me/5521969875522', '_blank')}
                >
                  💬 Suporte
                </button>
              </div>
            </div>
          ) : (
            <div className="spinner"></div>
          )}
        </div>

        <div className="premium-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Faturas Recentes</h3>
          <div className="invoice-list">
            {financeData?.invoices.map((inv, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1.2rem 0', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)' 
                }}
              >
                <div>
                  <p style={{ fontWeight: '700', margin: 0, fontSize: '0.95rem' }}>{inv.id}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{inv.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '800', color: '#10b981', margin: 0 }}>{inv.value}</p>
                  <span 
                    style={{ 
                      fontSize: '0.65rem', 
                      color: '#10b981', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontWeight: '700' 
                    }}
                  >
                    {inv.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            {!financeData?.invoices.length && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem' }}>
                Nenhuma fatura encontrada.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePanel;
