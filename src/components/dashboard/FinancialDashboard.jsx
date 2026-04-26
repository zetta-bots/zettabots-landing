import React from 'react';

const FinancialDashboard = ({ adminStats, session }) => {
  if (!adminStats) {
    return (
      <div className="tab-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Cálculos ultra-seguros
  const mrr = Number(adminStats.mrr) || 0;
  const active = Number(adminStats.totalActive) || 0;
  const total = Number(adminStats.totalClients) || 0;
  const trial = Number(adminStats.totalTrial) || 0;
  const blocked = Number(adminStats.totalBlocked) || 0;
  const ticket = active > 0 ? Math.round(mrr / active) : 0;
  const conv = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

  return (
    <div className="tab-panel reveal-item">
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card gradient-purple">
          <div className="stat-content">
            <span className="stat-label">MRR (Receita)</span>
            <span className="stat-value">R$ {mrr.toLocaleString('pt-BR')}</span>
            <div className="stat-sub">Mensal Recorrente</div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card gradient-blue">
          <div className="stat-content">
            <span className="stat-label">Ticket Médio</span>
            <span className="stat-value">R$ {ticket.toLocaleString('pt-BR')}</span>
            <div className="stat-sub">Por cliente ativo</div>
          </div>
          <div className="stat-icon">📊</div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-content">
            <span className="stat-label">Clientes Ativos</span>
            <span className="stat-value">{active}</span>
            <div className="stat-sub">{conv}% de conversão</div>
          </div>
          <div className="stat-icon">👥</div>
        </div>

        <div className="stat-card gradient-orange">
          <div className="stat-content">
            <span className="stat-label">Em Trial / Demo</span>
            <span className="stat-value">{trial}</span>
            <div className="stat-sub">Potenciais clientes</div>
          </div>
          <div className="stat-icon">📈</div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem' }}>Resumo da Operação</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 5px', fontSize: '0.8rem' }}>Total de Cadastros</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{total}</p>
          </div>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ color: '#ef4444', margin: '0 0 5px', fontSize: '0.8rem' }}>Bloqueados / Inativos</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{blocked}</p>
          </div>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ color: '#7c3aed', margin: '0 0 5px', fontSize: '0.8rem' }}>ARR (Projeção Anual)</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>R$ {(mrr * 12).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
