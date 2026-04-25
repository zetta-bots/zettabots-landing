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
  
  // Dados para o gráfico de distribuição de MRR
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
      
      {/* Header com Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>👑 Central de Comando Admin</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Visão geral da saúde do seu ecossistema SaaS.</p>
        </div>
        <button 
          onClick={fetchAdminStats}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: '#fff', 
            padding: '8px 16px', 
            borderRadius: '12px', 
            fontSize: '0.8rem', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔄 Sincronizar Dados
        </button>
      </div>

      {/* BOTÃO DE TESTE NUCLEAR */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => window.confirm('CLIQUE NO TOPO FUNCIONOU!')}
          style={{ width: '100%', background: '#8b5cf6', color: '#fff', padding: '15px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1rem' }}
        >
          🚨 BOTÃO DE TESTE: CLIQUE AQUI PRIMEIRO
        </button>
      </div>
      
      {/* Resumo Financeiro e Distribuição */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {[
            { label: 'MRR Total', value: adminStats ? `R$ ${(adminStats.mrr || 0).toLocaleString('pt-BR')}` : '—', color: '#10b981', icon: '💰' },
            { label: 'Clientes Ativos', value: adminStats?.totalActive ?? '—', color: '#8b5cf6', icon: '👥' },
            { label: 'Taxa Trial', value: adminStats ? `${Math.round((adminStats.totalTrial / (adminStats.totalClients || 1)) * 100)}%` : '—', color: '#3b82f6', icon: '🧪' },
            { label: 'Bloqueados', value: adminStats?.totalBlocked ?? '—', color: '#ef4444', icon: '🚫' },
          ].map(c => (
            <div key={c.label} className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{c.label}</span>
              </div>
              <div style={{ color: c.color, fontSize: '1.4rem', fontWeight: 800 }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Distribuição de Receita</h4>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>MRR por categoria de plano</p>
          </div>
          <div style={{ flex: 1, minHeight: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alertas expiração */}
      {adminStats?.expiringSoon?.length > 0 && (
        <div 
          style={{ 
            background: 'rgba(245,158,11,0.05)', 
            border: '1px solid rgba(245,158,11,0.2)', 
            borderRadius: 16, 
            padding: '1.2rem', 
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ color: '#f59e0b', fontWeight: 800, marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> ALERTA DE EXPIRAÇÃO (PRÓX. 7 DIAS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
            {adminStats.expiringSoon.map(c => (
              <div 
                key={c.email} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  background: 'rgba(255,255,255,0.02)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.full_name || c.email.split('@')[0]}</span>
                  <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>Expira {new Date(c.plan_expires_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <button
                  onClick={() => handleAdminExtend(c.email, 7)}
                  disabled={adminExtending === c.email}
                  className="btn-primary"
                  style={{ 
                    background: '#f59e0b', 
                    padding: '4px 12px', 
                    fontSize: '0.7rem',
                    boxShadow: 'none'
                  }}
                >
                  {adminExtending === c.email ? '...' : '+7 dias'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de clientes */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1.5rem', 
            flexWrap: 'wrap', 
            gap: '1rem' 
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#fff' }}>📋 Gestão de Assinaturas</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Pesquise, filtre e gerencie acessos em tempo real.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                value={adminSearch} 
                onChange={e => setAdminSearch(e.target.value)}
                placeholder="Buscar cliente..."
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  padding: '10px 12px 10px 36px', 
                  fontSize: '0.8rem', 
                  width: 250, 
                  outline: 'none' 
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            </div>
            <select
              value={adminPlanFilter} 
              onChange={e => setAdminPlanFilter(e.target.value)}
              style={{ 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px', 
                color: '#fff', 
                padding: '10px 12px', 
                fontSize: '0.8rem', 
                cursor: 'pointer', 
                outline: 'none' 
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
        
        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr>
                {['Cliente', 'Plano', 'Status', 'Expiração', 'Controles'].map(h => (
                  <th 
                    key={h} 
                    style={{ 
                      padding: '0 1rem 0.5rem', 
                      fontSize: '0.65rem', 
                      color: 'var(--color-text-muted)', 
                      textAlign: 'left', 
                      textTransform: 'uppercase', 
                      letterSpacing: 1 
                    }}
                  >
                    {h}
                  </th>
                ))}
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
                  const PLAN_COLOR = { 
                    start: '#6366f1', 
                    pro: '#8b5cf6', 
                    enterprise: '#f59e0b', 
                    trial: '#3b82f6', 
                    blocked: '#ef4444'
                  };
                  const color = PLAN_COLOR[c.plan_type] || '#888';
                  const exp = c.plan_expires_at ? new Date(c.plan_expires_at) : null;
                  const expired = exp && exp < new Date();
                  
                  return (
                    <tr key={i} style={{ background: 'rgba(255,255,255,0.01)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}>
                      <td style={{ padding: '1rem', borderRadius: '12px 0 0 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.full_name || <span style={{ opacity: 0.3 }}>Sem Nome</span>}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{c.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span 
                          style={{ 
                            background: `${color}15`, 
                            color, 
                            border: `1px solid ${color}33`, 
                            padding: '4px 10px', 
                            borderRadius: '8px', 
                            fontSize: '0.65rem', 
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        >
                          {c.plan_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.is_active ? '#10b981' : '#ef4444' }} />
                          <span style={{ color: c.is_active ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                            {c.is_active ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', color: expired ? '#ef4444' : '#fff' }}>
                            {exp ? exp.toLocaleDateString('pt-BR') : '—'}
                          </span>
                          {expired && <span style={{ fontSize: '0.6rem', color: '#ef4444' }}>Expirado</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', borderRadius: '0 12px 12px 0' }}>
                        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 9999 }}>
                          <button
                            onClick={() => {
                              if (typeof handleAdminToggleStatus === 'function') {
                                handleAdminToggleStatus(c.email, c.is_active);
                              } else {
                                window.alert('ERRO: Função handleAdminToggleStatus não foi recebida pelo componente!');
                              }
                            }}
                            disabled={adminExtending === c.email}
                            title={c.is_active ? "Bloquear Acesso" : "Desbloquear Acesso"}
                            style={{ 
                              background: c.is_active ? '#ef4444' : '#10b981', 
                              border: 'none', 
                              color: '#fff', 
                              padding: '8px 12px', 
                              borderRadius: '10px', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {c.is_active ? 'BLOQUEAR' : 'ATIVAR'}
                          </button>
                          <button
                            onClick={() => {
                              if (typeof handleAdminExtend === 'function') {
                                handleAdminExtend(c.email, 7);
                              } else {
                                window.alert('ERRO: Função handleAdminExtend não foi recebida pelo componente!');
                              }
                            }}
                            disabled={adminExtending === c.email}
                            title="Presentear com 7 dias"
                            style={{ 
                              background: '#f59e0b', 
                              border: 'none', 
                              color: '#fff', 
                              padding: '8px 12px', 
                              borderRadius: '10px', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 'bold'
                            }}
                          >
                            +7 DIAS
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
