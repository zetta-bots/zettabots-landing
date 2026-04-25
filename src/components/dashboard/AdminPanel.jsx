import React from 'react';

const AdminPanel = ({ 
  adminStats, 
  adminExtending, 
  handleAdminExtend, 
  adminSearch, 
  setAdminSearch, 
  adminPlanFilter, 
  setAdminPlanFilter 
}) => {
  return (
    <div className="tab-panel">
      {/* MRR Cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'MRR', value: adminStats ? `R$ ${(adminStats.mrr || 0).toLocaleString('pt-BR')}` : '—', color: '#10b981' },
          { label: 'Total Clientes', value: adminStats?.totalClients ?? '—', color: '#8b5cf6' },
          { label: 'Ativos (Pagos)', value: adminStats?.totalActive ?? '—', color: '#6366f1' },
          { label: 'Em Trial', value: adminStats?.totalTrial ?? '—', color: '#3b82f6' },
          { label: 'Bloqueados', value: adminStats?.totalBlocked ?? '—', color: '#ef4444' },
        ].map(c => (
          <div 
            key={c.label} 
            style={{ 
              flex: 1, 
              minWidth: 130, 
              background: 'var(--color-surface)', 
              border: `1px solid ${c.color}33`, 
              borderRadius: 12, 
              padding: '1rem 1.2rem' 
            }}
          >
            <div 
              style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '0.7rem', 
                textTransform: 'uppercase', 
                letterSpacing: 1, 
                marginBottom: 4 
              }}
            >
              {c.label}
            </div>
            <div style={{ color: c.color, fontSize: '1.6rem', fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Alertas expiração */}
      {adminStats?.expiringSoon?.length > 0 && (
        <div 
          style={{ 
            background: 'rgba(245,158,11,0.08)', 
            border: '1px solid rgba(245,158,11,0.3)', 
            borderRadius: 12, 
            padding: '1rem 1.2rem', 
            marginBottom: '1.5rem' 
          }}
        >
          <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            ⚠️ Expirando nos próximos 7 dias ({adminStats.expiringSoon.length})
          </div>
          {adminStats.expiringSoon.map(c => (
            <div 
              key={c.email} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: 8, 
                marginBottom: 6 
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>
                {c.full_name || c.email}
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 8, fontSize: '0.75rem' }}>
                  — {new Date(c.plan_expires_at).toLocaleDateString('pt-BR')}
                </span>
              </span>
              <button
                onClick={() => handleAdminExtend(c.email, 30)}
                disabled={adminExtending === c.email}
                style={{ 
                  background: '#f59e0b', 
                  color: '#000', 
                  border: 'none', 
                  padding: '3px 10px', 
                  borderRadius: 6, 
                  cursor: 'pointer', 
                  fontSize: '0.75rem', 
                  fontWeight: 700 
                }}
              >
                {adminExtending === c.email ? '...' : '+30 dias'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de clientes */}
      <div className="premium-card" style={{ padding: '1.5rem' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1rem', 
            flexWrap: 'wrap', 
            gap: '0.75rem' 
          }}
        >
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>👑 Clientes</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              value={adminSearch} 
              onChange={e => setAdminSearch(e.target.value)}
              placeholder="Buscar nome ou email..."
              style={{ 
                background: 'var(--color-bg)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 8, 
                color: '#fff', 
                padding: '6px 12px', 
                fontSize: '0.8rem', 
                width: 220, 
                outline: 'none' 
              }}
            />
            <select
              value={adminPlanFilter} 
              onChange={e => setAdminPlanFilter(e.target.value)}
              style={{ 
                background: 'var(--color-bg)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 8, 
                color: 'var(--color-text-muted)', 
                padding: '6px 12px', 
                fontSize: '0.8rem', 
                cursor: 'pointer', 
                outline: 'none' 
              }}
            >
              <option value="all">Todos</option>
              <option value="trial">Trial</option>
              <option value="start">Start</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Nome', 'Email', 'Plano', 'Status', 'Expira em', 'Ações'].map(h => (
                  <th 
                    key={h} 
                    style={{ 
                      padding: '0.75rem 1rem', 
                      fontSize: '0.7rem', 
                      color: 'var(--color-text-muted)', 
                      textAlign: 'left', 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.5 
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
                    blocked: '#ef4444', 
                    pago: '#8b5cf6' 
                  };
                  const PLAN_LABEL = { 
                    start: 'Start', 
                    pro: 'Pro', 
                    enterprise: 'Enterprise', 
                    trial: 'Trial', 
                    blocked: 'Bloqueado', 
                    pago: 'Pro' 
                  };
                  const color = PLAN_COLOR[c.plan_type] || '#888';
                  const exp = c.plan_expires_at ? new Date(c.plan_expires_at) : null;
                  const expired = exp && exp < new Date();
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                        {c.full_name || <span style={{ color: '#555' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {c.email}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span 
                          style={{ 
                            background: `${color}22`, 
                            color, 
                            border: `1px solid ${color}55`, 
                            padding: '2px 8px', 
                            borderRadius: 20, 
                            fontSize: '0.7rem', 
                            fontWeight: 700 
                          }}
                        >
                          {PLAN_LABEL[c.plan_type] || c.plan_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: c.is_active ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                          {c.is_active ? '● Ativo' : '● Inativo'}
                        </span>
                      </td>
                      <td 
                        style={{ 
                          padding: '0.75rem 1rem', 
                          color: expired ? '#ef4444' : 'var(--color-text-muted)', 
                          fontSize: '0.8rem' 
                        }}
                      >
                        {exp ? exp.toLocaleDateString('pt-BR') : <span style={{ color: '#555' }}>—</span>}
                        {expired && <span style={{ marginLeft: 4, fontSize: '0.65rem', color: '#ef4444' }}>VENCIDO</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          onClick={() => handleAdminExtend(c.email, 30)}
                          disabled={adminExtending === c.email}
                          className="btn-secondary"
                          style={{ padding: '3px 10px', fontSize: '0.7rem' }}
                        >
                          {adminExtending === c.email ? '...' : '+30d'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {adminStats && adminStats.clients?.filter(c => {
                const s = adminSearch.toLowerCase();
                return (!s || (c.email || '').toLowerCase().includes(s) || (c.full_name || '').toLowerCase().includes(s)) &&
                  (adminPlanFilter === 'all' || c.plan_type === adminPlanFilter);
              }).length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>
                    Nenhum cliente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
