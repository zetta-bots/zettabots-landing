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
    <div className="tab-panel reveal-item">
      
      {/* Header Premium */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }}>👑</span> Central de Comando Master
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Gestão estratégica e monitoramento global do ecossistema.</p>
        </div>
        <button 
          onClick={() => fetchAdminStats()}
          style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            color: '#fff', 
            padding: '12px 24px', 
            borderRadius: '14px', 
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.85rem',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
          🔄 Sincronizar Rede
        </button>
      </div>

      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          {[
            { label: 'MRR TOTAL', value: adminStats ? `R$ ${(adminStats.mrr || 0).toLocaleString('pt-BR')}` : '—', color: '#10b981', icon: '💰', shadow: 'rgba(16, 185, 129, 0.2)' },
            { label: 'CLIENTES ATIVOS', value: adminStats?.totalActive ?? '—', color: '#a78bfa', icon: '👥', shadow: 'rgba(167, 139, 250, 0.2)' },
            { label: 'CONVERSÃO TRIAL', value: adminStats ? `${Math.round((adminStats.totalTrial / (adminStats.totalClients || 1)) * 100)}%` : '—', color: '#3b82f6', icon: '🧪', shadow: 'rgba(59, 130, 246, 0.2)' },
            { label: 'BLOQUEADOS', value: adminStats?.totalBlocked ?? '—', color: '#ef4444', icon: '🚫', shadow: 'rgba(239, 68, 68, 0.2)' },
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '1.2rem', width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.05em' }}>{c.label}</span>
              </div>
              <div style={{ color: c.color, fontSize: '1.6rem', fontWeight: '900', filter: `drop-shadow(0 0 10px ${c.shadow})` }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>DISTRIBUIÇÃO DE RECEITA</h4>
          <div style={{ flex: 1, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={8} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '11px', fontWeight: '600', paddingLeft: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alertas de Expiração */}
      {adminStats?.expiringSoon?.length > 0 && (
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
            {(adminStats?.expiringSoon || []).map(c => (
              <div key={c.email} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
                padding: '12px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.03)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{c.full_name || c.email.split('@')[0]}</span>
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
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  +7 DIAS
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Gestão */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#fff' }}>📋 Gestão de Operações</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Monitore e controle o acesso de cada instância.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
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

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <thead>
              <tr style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>CLIENTE / IDENTIDADE</th>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>PLANO ATIVO</th>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>STATUS</th>
                <th style={{ textAlign: 'left', padding: '0 1.5rem' }}>EXPIRAÇÃO</th>
                <th style={{ textAlign: 'center', padding: '0 1.5rem' }}>AÇÕES RÁPIDAS</th>
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
                  const PLAN_COLOR = { start: '#6366f1', pro: '#a78bfa', enterprise: '#fbbf24', trial: '#3b82f6', blocked: '#ef4444' };
                  const color = PLAN_COLOR[c.plan_type] || '#888';
                  const exp = c.plan_expires_at ? new Date(c.plan_expires_at) : null;
                  const expired = exp && exp < new Date();

                  return (
                    <tr key={i} className="reveal-item" style={{ 
                      background: 'rgba(255,255,255,0.01)',
                      transition: 'all 0.2s',
                    }}>
                      <td style={{ padding: '1.25rem 1.5rem', borderRadius: '16px 0 0 16px', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.02)' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>{c.full_name || 'Usuário Zetta'}</div>
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
                      <td style={{ padding: '1.25rem 1.5rem', color: expired ? '#ef4444' : '#fff', fontSize: '0.85rem', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        {exp ? exp.toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', borderRadius: '0 16px 16px 0', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAdminToggleStatus(c.email, c.is_active)}
                            style={{ 
                              background: c.is_active ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', 
                              color: c.is_active ? '#ef4444' : '#10b981', 
                              border: `1px solid ${c.is_active ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, 
                              padding: '8px 16px', 
                              borderRadius: '10px', 
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '900',
                              minWidth: '100px',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = c.is_active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = c.is_active ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)'}
                          >
                            {c.is_active ? 'DESATIVAR' : 'REATIVAR'}
                          </button>
                          <button
                            onClick={() => handleAdminExtend(c.email, 7)}
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.03)', 
                              color: '#94a3b8', 
                              border: '1px solid rgba(255, 255, 255, 0.08)', 
                              padding: '8px 16px', 
                              borderRadius: '10px', 
                              cursor: 'pointer', 
                              fontSize: '0.75rem', 
                              fontWeight: '900',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)', e.currentTarget.style.color = '#f59e0b', e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)', e.currentTarget.style.color = '#94a3b8', e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
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
