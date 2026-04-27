import React, { useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const AdminPanel = ({
  adminStats,
  adminExtending,
  handleAdminExtend,
  handleAdminToggleStatus,
  adminSearch,
  setAdminSearch,
  adminPlanFilter,
  setAdminPlanFilter,
  fetchAdminStats
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const itemsPerPage = 10;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetchAdminStats();
    } finally {
      setIsSyncing(false);
    }
  };

  // Preços por plano
  const PLAN_PRICES = { trial: 0, start: 127, pro: 247, enterprise: 497 };
  const PLAN_COLOR = { start: '#6366f1', pro: '#a78bfa', enterprise: '#fbbf24', trial: '#3b82f6', blocked: '#ef4444' };

  // Calcular distribuição de receita real pelos clientes
  const calculateChartData = () => {
    const distribution = { trial: 0, start: 0, pro: 0, enterprise: 0 };
    (adminStats?.clients || []).forEach(c => {
      const plan = c.plan_type || 'trial';
      distribution[plan] += PLAN_PRICES[plan] || 0;
    });

    return [
      { name: 'Trial', value: distribution.trial, price: PLAN_PRICES.trial, color: '#3b82f6' },
      { name: 'Start', value: distribution.start, price: PLAN_PRICES.start, color: '#6366f1' },
      { name: 'Pro', value: distribution.pro, price: PLAN_PRICES.pro, color: '#a78bfa' },
      { name: 'Enterprise', value: distribution.enterprise, price: PLAN_PRICES.enterprise, color: '#fbbf24' },
    ].filter(d => d.value > 0);
  };

  const chartData = calculateChartData();
  const totalMRRCalculated = chartData.reduce((sum, d) => sum + d.value, 0);

  // Dados para métricas expandidas
  const clients = adminStats?.clients || [];
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.is_active).length;
  const paidClients = clients.filter(c => c.is_active && c.plan_type !== 'trial').length;
  const trialClients = clients.filter(c => c.plan_type === 'trial').length;
  const blockedCount = clients.filter(c => !c.is_active).length;

  // Filtrar clientes visíveis na tabela
  const filteredClients = clients
    .filter(c => {
      const s = adminSearch.toLowerCase();
      const matchS = !s || (c.email || '').toLowerCase().includes(s) || (c.full_name || '').toLowerCase().includes(s);
      const matchP = adminPlanFilter === 'all' || c.plan_type === adminPlanFilter;
      return matchS && matchP;
    });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIdx, startIdx + itemsPerPage);

  // Custom label para gráfico
  const renderCustomLabel = ({ name, percent }) => `${(percent * 100).toFixed(0)}%`;

  // Helper para dias restantes
  const getDaysRemaining = (expDate) => {
    if (!expDate) return null;
    const exp = new Date(expDate);
    const now = new Date();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  };

  // Helper para cor de dias restantes
  const getDaysColor = (days) => {
    if (days === null) return '#64748b';
    if (days <= 7) return '#ef4444';
    if (days <= 14) return '#f59e0b';
    return '#10b981';
  };

  const mrrPerClient = paidClients > 0 ? Math.round((adminStats?.mrr || totalMRRCalculated) / paidClients) : 0;

  // Helper para identificar admin pelo full_name
  const isAdminClient = (client) => {
    return client.full_name === 'richardrovigati' || client.plan_type === 'admin';
  };

  return (
    <div className="tab-panel reveal-item">

      {/* Header Premium */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }}>👑</span> Central de Comando Master
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Visão operacional completa: gestão de clientes, planos e receita.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          style={{
            background: isSyncing ? 'rgba(124, 58, 237, 0.2)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            border: '1px solid rgba(124, 58, 237, 0.5)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '14px',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            fontWeight: '700',
            fontSize: '0.85rem',
            transition: 'all 0.3s',
            whiteSpace: 'nowrap',
            opacity: isSyncing ? 0.7 : 1,
            boxShadow: isSyncing ? 'none' : '0 8px 20px rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => !isSyncing && (e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.4)')}
          onMouseLeave={(e) => !isSyncing && (e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.3)')}
        >
          <span style={{ display: 'inline-block', animation: isSyncing ? 'spin 1s linear infinite' : 'none' }}>
            🔄
          </span>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Rede'}
        </button>
      </div>

      {/* Cards de Métricas Expandidas */}
      <div className="admin-metrics-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="admin-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          {[
            {
              label: 'MRR TOTAL',
              value: `R$ ${(adminStats?.mrr || totalMRRCalculated).toLocaleString('pt-BR')}`,
              subLabel: `ARR: R$ ${((adminStats?.mrr || totalMRRCalculated) * 12).toLocaleString('pt-BR')}`,
              color: '#10b981',
              icon: '💰'
            },
            {
              label: 'CLIENTES ATIVOS',
              value: activeClients,
              subLabel: `Trial: ${trialClients} | Pago: ${paidClients}`,
              color: '#a78bfa',
              icon: '👥'
            },
            {
              label: 'TICKET MÉDIO',
              value: `R$ ${mrrPerClient}`,
              subLabel: `${paidClients} clientes pagantes`,
              color: '#3b82f6',
              icon: '💵'
            },
            {
              label: 'BLOQUEADOS',
              value: blockedCount,
              subLabel: `${totalClients > 0 ? Math.round((blockedCount/totalClients)*100) : 0}% do total`,
              color: '#ef4444',
              icon: '🚫'
            },
          ].map((c, idx) => (
            <div key={c.label} className="glass-card" style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.03)',
              animation: `revealUp 0.4s ease-out forwards ${idx * 0.1}s`,
              opacity: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '1.2rem', width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.05em' }}>{c.label}</span>
              </div>
              <div style={{ color: c.color, fontSize: '1.6rem', fontWeight: '900', marginBottom: '6px' }}>{c.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>{c.subLabel}</div>
            </div>
          ))}
        </div>

        {chartData.length > 0 && (
          <div className="glass-card admin-chart-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>DISTRIBUIÇÃO DE RECEITA</h4>
            <div style={{ flex: 1, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none" label={renderCustomLabel}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Alertas de Expiração */}
      {(adminStats?.expiringSoon?.length || 0) > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.03)',
          border: '1px solid rgba(245, 158, 11, 0.1)',
          borderRadius: '24px',
          padding: '1.5rem',
          marginBottom: '20px',
          animation: 'revealUp 0.5s ease-out'
        }}>
          <div style={{ color: '#f59e0b', fontWeight: '900', marginBottom: '1.25rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span> ALERTA DE RENOVAÇÃO (PRÓXIMOS 7 DIAS)
          </div>
          <div className="admin-expiring-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
            {(adminStats?.expiringSoon || []).map(c => {
              const daysLeft = getDaysRemaining(c.plan_expires_at);
              const urgencyColor = daysLeft !== null && daysLeft <= 3 ? '#ef4444' : '#f59e0b';
              return (
                <div key={c.email} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: `3px solid ${urgencyColor}`
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{c.full_name || c.email.split('@')[0]}</span>
                      <span style={{ background: urgencyColor, color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>
                        {daysLeft}d
                      </span>
                    </div>
                    <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: '600' }}>Expira em {new Date(c.plan_expires_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <button
                    onClick={() => handleAdminExtend(c.email, 7)}
                    style={{
                      background: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    +7 DIAS
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela de Gestão */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#fff' }}>📋 Gestão de Operações</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Controle completo de instâncias e planos ({filteredClients.length} encontrados)</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              <input
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                placeholder="Nome ou e-mail..."
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '10px 12px 10px 35px',
                  fontSize: '0.85rem',
                  width: '240px',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
              />
            </div>
            <select
              value={adminPlanFilter}
              onChange={e => setAdminPlanFilter(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                color: '#fff',
                padding: '10px 16px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.3s'
              }}
            >
              <option value="all">Todos os Planos</option>
              <option value="trial">Trial</option>
              <option value="start">Start</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <thead>
              <tr style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>CLIENTE / IDENTIDADE</th>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>PLANO ATIVO</th>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>STATUS</th>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>EXPIRAÇÃO</th>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>DIAS REST.</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map((c, i) => {
                console.log(`[AdminPanel Table] Client: ${c.full_name}, email: ${c.email}, bot_name: ${c.bot_name}, instance_name: ${c.instance_name}`);
                const color = PLAN_COLOR[c.plan_type] || '#888';
                const exp = c.plan_expires_at ? new Date(c.plan_expires_at) : null;
                const daysLeft = getDaysRemaining(c.plan_expires_at);
                const daysColor = getDaysColor(daysLeft);

                return (
                  <tr key={i} className="reveal-item" style={{
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                  >
                    <td style={{ padding: '1.25rem 1.5rem', borderRadius: '16px 0 0 16px', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>
                        {isAdminClient(c) ? 'ZettaBots' : (c.bot_name || c.instance_name || c.full_name || 'Usuário Zetta')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{
                        color,
                        background: `${color}10`,
                        border: `1px solid ${color}30`,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: '900',
                        letterSpacing: '0.05em'
                      }}>
                        {c.plan_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: c.is_active ? '#10b981' : '#ef4444',
                          boxShadow: `0 0 10px ${c.is_active ? '#10b981' : '#ef4444'}`
                        }} />
                        <span style={{ color: c.is_active ? '#10b981' : '#ef4444', fontWeight: '800' }}>{c.is_active ? 'ATIVO' : 'BLOQUEADO'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#fff', fontSize: '0.85rem', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      {isAdminClient(c) ? '—' : (exp ? exp.toLocaleDateString('pt-BR') : '—')}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', borderRadius: '0 16px 16px 0', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.02)' }}>
                      {isAdminClient(c) ? '—' : (daysLeft !== null ? (
                        <span style={{
                          color: daysColor,
                          fontWeight: '800',
                          background: daysColor === '#ef4444' ? 'rgba(239, 68, 68, 0.1)' : daysColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'inline-block',
                          fontSize: '0.8rem'
                        }}>
                          {daysLeft}d
                        </span>
                      ) : '—')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação e Footer */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
              Exibindo {startIdx + 1}–{Math.min(startIdx + itemsPerPage, filteredClients.length)} de {filteredClients.length} clientes
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: currentPage === 1 ? '#475569' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  transition: 'all 0.3s'
                }}
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: currentPage === page ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${currentPage === page ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: currentPage === page ? '#a78bfa' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s'
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: currentPage === totalPages ? '#475569' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  transition: 'all 0.3s'
                }}
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
