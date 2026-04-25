import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

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
  
  // Gráfico de MRR
  const mrrDistribution = [
    { name: 'Start', value: (adminStats?.mrrDistribution?.start || 0), color: '#6366f1' },
    { name: 'Pro', value: (adminStats?.mrrDistribution?.pro || 0), color: '#8b5cf6' },
    { name: 'Enterprise', value: (adminStats?.mrrDistribution?.enterprise || 0), color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const chartData = mrrDistribution.length > 0 ? mrrDistribution : [
    { name: 'Start', value: (adminStats?.mrr || 1000) * 0.2, color: '#6366f1' },
    { name: 'Pro', value: (adminStats?.mrr || 1000) * 0.5, color: '#8b5cf6' },
    { name: 'Enterprise', value: (adminStats?.mrr || 1000) * 0.3, color: '#f59e0b' },
  ];

  return (
    <div className="tab-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header Premium */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>👑 Central de Comando Admin</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Controle total sobre o ecossistema ZettaBots.</p>
        </div>
        <button 
          onClick={() => fetchAdminStats()}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: '#fff', 
            padding: '10px 20px', 
            borderRadius: '12px', 
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          🔄 Sincronizar Tudo
        </button>
      </div>

      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {[
            { label: 'MRR Total', value: adminStats ? `R$ ${(adminStats.mrr || 0).toLocaleString('pt-BR')}` : '—', color: '#10b981', icon: '💰' },
            { label: 'Clientes Ativos', value: adminStats?.totalActive ?? '—', color: '#8b5cf6', icon: '👥' },
            { label: 'Taxa Trial', value: adminStats ? `${Math.round((adminStats.totalTrial / (adminStats.totalClients || 1)) * 100)}%` : '—', color: '#3b82f6', icon: '🧪' },
            { label: 'Bloqueados', value: adminStats?.totalBlocked ?? '—', color: '#ef4444', icon: '🚫' },
          ].map(c => (
            <div key={c.label} className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>{c.label}</span>
              </div>
              <div style={{ color: c.color, fontSize: '1.4rem', fontWeight: 800 }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '1.2rem', minHeight: '200px' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Distribuição de Receita</h4>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <RechartsTooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconType="circle" verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alertas de Expiração */}
      {adminStats?.expiringSoon?.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ color: '#f59e0b', fontWeight: 800, marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ ALERTA DE EXPIRAÇÃO (PRÓX. 7 DIAS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {adminStats.expiringSoon.map(c => (
              <div key={c.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.full_name || c.email.split('@')[0]}</span>
                  <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>Expira {new Date(c.plan_expires_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <button onClick={() => handleAdminExtend(c.email, 7)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}>
                  +7 dias
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Gestão */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#fff' }}>📋 Gestão de Clientes</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              value={adminSearch} 
              onChange={e => setAdminSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '8px 12px', fontSize: '0.8rem', width: 220 }}
            />
            <select
              value={adminPlanFilter} 
              onChange={e => setAdminPlanFilter(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
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
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                <th style={{ textAlign: 'left', padding: '0 1rem' }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: '0 1rem' }}>Plano</th>
                <th style={{ textAlign: 'left', padding: '0 1rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0 1rem' }}>Expiração</th>
                <th style={{ textAlign: 'center', padding: '0 1rem' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(adminStats?.clients || [])
                .filter(c => {
                  const s = adminSearch.toLowerCase();
                  const matchS = !s || (c.email || '').toLowerCase().includes(s) || (c.full_name || '').toLowerCase().includes(s);
                  const matchP = adminPlanFilter === 'all' || c.plan_type === adminPlanFilter;
                  return matchS && matchP;
                })
                .map((c, i) => {
                  const PLAN_COLOR = { start: '#6366f1', pro: '#8b5cf6', enterprise: '#f59e0b', trial: '#3b82f6', blocked: '#ef4444' };
                  const color = PLAN_COLOR[c.plan_type] || '#888';
                  const exp = c.plan_expires_at ? new Date(c.plan_expires_at) : null;
                  const expired = exp && exp < new Date();

                  return (
                    <tr key={i} style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '1rem', borderRadius: '12px 0 0 12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.full_name || 'Sem Nome'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{c.email}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ color, background: `${color}15`, border: `1px solid ${color}33`, padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                          {c.plan_type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.is_active ? '#10b981' : '#ef4444' }} />
                          <span style={{ color: c.is_active ? '#10b981' : '#ef4444', fontWeight: 600 }}>{c.is_active ? 'Ativo' : 'Bloqueado'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: expired ? '#ef4444' : '#fff', fontSize: '0.8rem' }}>
                        {exp ? exp.toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ padding: '1rem', borderRadius: '0 12px 12px 0' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAdminToggleStatus(c.email, c.is_active)}
                            style={{ 
                              background: c.is_active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                              color: c.is_active ? '#ef4444' : '#10b981', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: '8px', 
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              minWidth: '85px'
                            }}
                          >
                            {c.is_active ? 'PAUSAR' : 'ATIVAR'}
                          </button>
                          <button
                            onClick={() => handleAdminExtend(c.email, 7)}
                            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}
                          >
                            🎁 +7 DIAS
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
