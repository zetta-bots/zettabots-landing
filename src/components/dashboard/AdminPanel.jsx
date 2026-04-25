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
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>👑 Central de Comando Admin</h2>
        </div>
        <button onClick={fetchAdminStats} style={{ background: '#333', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          🔄 Atualizar
        </button>
      </div>

      {/* TESTE NUCLEAR */}
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={() => window.confirm('BOTÃO ROXO OK!')}
          style={{ width: '100%', background: 'purple', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
        >
          🚨 BOTÃO DE TESTE (ROXO)
        </button>
      </div>
      
      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'MRR', value: adminStats ? `R$ ${adminStats.mrr}` : '—', color: '#10b981' },
          { label: 'Ativos', value: adminStats?.totalActive ?? '—', color: '#8b5cf6' },
          { label: 'Trial', value: adminStats?.totalTrial ?? '—', color: '#3b82f6' },
          { label: 'Bloqueados', value: adminStats?.totalBlocked ?? '—', color: '#ef4444' },
        ].map(c => (
          <div key={c.label} className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ color: 'gray', fontSize: '0.7rem' }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: '1.2rem', fontWeight: 'bold' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabela Simplificada ao Máximo */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <input 
            value={adminSearch} 
            onChange={e => setAdminSearch(e.target.value)} 
            placeholder="Buscar..." 
            style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '8px', borderRadius: '8px' }} 
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>
              <th style={{ padding: '10px' }}>Cliente</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(adminStats?.clients || [])
              .filter(c => {
                const s = adminSearch.toLowerCase();
                return !s || c.email.toLowerCase().includes(s) || (c.full_name || '').toLowerCase().includes(s);
              })
              .map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px' }}>
                    <div>{c.full_name || 'Sem Nome'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'gray' }}>{c.email}</div>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {c.is_active ? '✅ Ativo' : '🚫 Bloqueado'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          console.log('Clique Bloquear');
                          handleAdminToggleStatus(c.email, c.is_active);
                        }}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {c.is_active ? 'BLOQUEAR' : 'ATIVAR'}
                      </button>
                      
                      <button 
                        onClick={() => {
                          console.log('Clique Presente');
                          handleAdminExtend(c.email, 7);
                        }}
                        style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        +7 DIAS
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
