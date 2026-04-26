import React from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const FinancialDashboard = ({ adminStats, session }) => {
  if (!adminStats) {
    return (
      <div className="tab-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const mrrData = adminStats.mrrDistribution ? [
    { name: 'Start', value: adminStats.mrrDistribution.start || 0, fill: '#06b6d4' },
    { name: 'Pro', value: adminStats.mrrDistribution.pro || 0, fill: '#7c3aed' },
    { name: 'Enterprise', value: adminStats.mrrDistribution.enterprise || 0, fill: '#10b981' },
  ].filter(d => d.value > 0) : [];

  const arr = (adminStats.mrr || 0) * 12;
  const churnRate = adminStats.totalActive > 0
    ? ((adminStats.totalBlocked / (adminStats.totalActive + adminStats.totalBlocked)) * 100).toFixed(1)
    : 0;
  const conversionRate = adminStats.totalClients > 0
    ? ((adminStats.totalActive / adminStats.totalClients) * 100).toFixed(1)
    : 0;

  const clientDistribution = [
    { name: 'Ativos', value: adminStats.totalActive || 0, fill: '#10b981' },
    { name: 'Trial', value: adminStats.totalTrial || 0, fill: '#f59e0b' },
    { name: 'Bloqueados', value: adminStats.totalBlocked || 0, fill: '#ef4444' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(124, 58, 237, 0.5)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <p style={{ color: '#fff', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
            {payload[0].name}
          </p>
          <p style={{ color: '#a78bfa', margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 700 }}>
            {typeof payload[0].value === 'number' ? (
              payload[0].name.includes('R$') ? `R$ ${payload[0].value.toLocaleString('pt-BR')}` : payload[0].value
            ) : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tab-panel">
      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card gradient-purple">
          <div className="stat-content">
            <span className="stat-label">MRR (Receita)</span>
            <span className="stat-value">R$ {adminStats.mrr?.toLocaleString('pt-BR') || '0'}</span>
            <div className="stat-sub">Monthly Recurring Revenue</div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card gradient-blue">
          <div className="stat-content">
            <span className="stat-label">ARR (Anual)</span>
            <span className="stat-value">R$ {arr.toLocaleString('pt-BR')}</span>
            <div className="stat-sub">Annual Recurring Revenue</div>
          </div>
          <div className="stat-icon">📊</div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-content">
            <span className="stat-label">Clientes Ativos</span>
            <span className="stat-value">{adminStats.totalActive || 0}</span>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${Math.min((adminStats.totalActive / (adminStats.totalClients || 1)) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #10b981, #6ee7b7)'
                }}
              ></div>
            </div>
          </div>
          <div className="stat-icon">👥</div>
        </div>

        <div className="stat-card gradient-orange">
          <div className="stat-content">
            <span className="stat-label">Taxa de Conversão</span>
            <span className="stat-value">{conversionRate}%</span>
            <div className="stat-sub">Trial → Pago</div>
          </div>
          <div className="stat-icon">📈</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '2rem'
      }}>
        {/* MRR Distribution */}
        {mrrData.length > 0 && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 600 }}>
              Distribuição de MRR por Plano
            </h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mrrData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toLocaleString('pt-BR')}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {mrrData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Client Distribution */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 600 }}>
            Distribuição de Clientes
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} animationDuration={1500}>
                  {clientDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '2rem'
      }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 8px' }}>Total de Clientes</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            {adminStats.totalClients || 0}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 8px' }}>Em Trial</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#f59e0b' }}>
            {adminStats.totalTrial || 0}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 8px' }}>Churn Rate</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#ef4444' }}>
            {churnRate}%
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 8px' }}>Ticket Médio</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#10b981' }}>
            R$ {adminStats.totalActive > 0 ? Math.round(adminStats.mrr / adminStats.totalActive) : 0}
          </p>
        </div>
      </div>

      {/* Expiring Soon */}
      {adminStats.expiringSoon && adminStats.expiringSoon.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#f59e0b' }}>
            ⏰ Vencendo em 7 dias ({adminStats.expiringSoon.length})
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {adminStats.expiringSoon.slice(0, 5).map((client, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{client.email}</p>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.75rem' }}>
                    {client.plan_type?.toUpperCase() || 'TRIAL'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#f59e0b', fontWeight: 600 }}>
                    {client.plan_expires_at ? new Date(client.plan_expires_at).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;
