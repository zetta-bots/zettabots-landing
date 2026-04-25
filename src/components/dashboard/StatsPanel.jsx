import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const StatsPanel = ({ leads, stats }) => {
  // Dados simulados para o gráfico de leads (baseados no total de leads atual)
  const leadsData = [
    { name: 'Seg', value: Math.floor(leads.length * 0.1) },
    { name: 'Ter', value: Math.floor(leads.length * 0.2) },
    { name: 'Qua', value: Math.floor(leads.length * 0.4) },
    { name: 'Qui', value: Math.floor(leads.length * 0.6) },
    { name: 'Sex', value: Math.floor(leads.length * 0.8) },
    { name: 'Sáb', value: Math.floor(leads.length * 0.9) },
    { name: 'Dom', value: leads.length },
  ];

  const activityData = (stats.activity || [10, 20, 30, 40, 50, 60, 70]).map((val, i) => ({
    name: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i],
    value: val
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.9)', 
          border: '1px solid rgba(124, 58, 237, 0.5)', 
          padding: '10px', 
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <p style={{ color: '#fff', margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>{payload[0].payload.name}</p>
          <p style={{ color: '#a78bfa', margin: '4px 0 0', fontSize: '1rem', fontWeight: 800 }}>
            {payload[0].value} {payload[0].name === 'value' ? 'msgs' : 'leads'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tab-panel">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">👤</div>
          <div className="stat-info">
            <span className="stat-label">Leads Capturados</span>
            <span className="stat-value">{leads.length || stats.contacts}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">💬</div>
          <div className="stat-info">
            <span className="stat-label">Conversas Ativas</span>
            <span className="stat-value">{stats.chats}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🕒</div>
          <div className="stat-info">
            <span className="stat-label">Tempo Economizado</span>
            <span className="stat-value">{stats.savedTime}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">💰</div>
          <div className="stat-info">
            <span className="stat-label">ROI Estimado</span>
            <span className="stat-value">{stats.roi}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="glass-card activity-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Atividade da IA (Mensagens)</h3>
            <span style={{ fontSize: '0.7rem', color: '#a1a1aa', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
              Últimos 7 dias
            </span>
          </div>
          
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar 
                  dataKey="value" 
                  fill="url(#barGradient)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={24}
                  animationDuration={1500}
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} style={{ filter: 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.3))' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card activity-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Captura de Leads</h3>
            <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
              +24% esta semana
            </span>
          </div>
          
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#areaGradient)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
