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

const StatsPanel = ({ leads = [], stats = {} }) => {
  // Garantir que temos arrays e objetos válidos para evitar crashes
  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeStats = stats || {};

  // Estados para configuração de ROI
  const [ticketMedio, setTicketMedio] = React.useState(500);
  const [taxaConversao, setTaxaConversao] = React.useState(10);
  const [showConfig, setShowConfig] = React.useState(false);

  React.useEffect(() => {
    const savedConfig = localStorage.getItem('zb_roi_config');
    if (savedConfig) {
      try {
        const { ticket, taxa } = JSON.parse(savedConfig);
        if (ticket) setTicketMedio(ticket);
        if (taxa) setTaxaConversao(taxa);
      } catch (e) {}
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem('zb_roi_config', JSON.stringify({ ticket: ticketMedio, taxa: taxaConversao }));
    setShowConfig(false);
  };

  const realLeadsCount = safeLeads.length || safeStats.contacts || 0;
  const estimatedROI = realLeadsCount * (taxaConversao / 100) * ticketMedio;
  const formattedROI = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedROI);

  // Processamento de dados reais para os gráficos
  const today = new Date();
  const getDayName = (date) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
  
  // Arrays para os últimos 7 dias
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    last7Days.push({ name: getDayName(d), dateStr: d.toISOString().split('T')[0], count: 0 });
  }

  // Contabilizar leads por dia
  safeLeads.forEach(lead => {
    if (!lead.created_at) return;
    const leadDate = new Date(lead.created_at).toISOString().split('T')[0];
    const dayObj = last7Days.find(d => d.dateStr === leadDate);
    if (dayObj) dayObj.count++;
  });

  // Dados para o gráfico de leads (Crescimento Acumulado)
  let cumulative = 0;
  const leadsData = last7Days.map(d => {
    cumulative += d.count;
    return { name: d.name, value: cumulative };
  });

  // Dados para atividade da IA (Estimativa Proporcional ao tráfego real)
  const activityData = last7Days.map((d, index) => {
    const baseMessages = d.count * 8; 
    const basal = (index % 3) + 1; // volume basal mínimo
    return { name: d.name, value: baseMessages + basal };
  });

  // Extrair as últimas 5 atividades reais baseadas nos leads
  const recentActivities = [...safeLeads]
    .sort((a, b) => {
      const dateA = new Date(b.last_contact_at || b.created_at || 0);
      const dateB = new Date(a.last_contact_at || a.created_at || 0);
      return dateA - dateB;
    })
    .slice(0, 5)
    .map(lead => ({
      id: lead?.id || Math.random(),
      title: lead?.sentiment === 'hot' ? '🔥 Lead Quente capturado!' : '👤 Novo lead identificado',
      desc: `${lead?.name || 'Cliente'} (${lead?.phone || 'Sem número'})`,
      time: lead?.last_contact_at ? new Date(lead.last_contact_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Recente',
      type: lead?.sentiment === 'hot' ? 'danger' : 'success'
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
          <p style={{ color: '#fff', margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>{payload[0]?.payload?.name}</p>
          <p style={{ color: '#a78bfa', margin: '4px 0 0', fontSize: '1rem', fontWeight: 800 }}>
            {payload[0]?.value || 0} {payload[0]?.name === 'value' ? 'msgs' : 'leads'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tab-panel reveal-item">
      <div className="stats-grid">
        <div className="stat-card gradient-purple">
          <div className="stat-content">
            <span className="stat-label">Leads Capturados</span>
            <span className="stat-value">{realLeadsCount}</span>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${Math.min(realLeadsCount * 10, 100)}%` }}></div>
            </div>
          </div>
          <div className="stat-icon">👤</div>
        </div>
        
        <div className="stat-card gradient-blue">
          <div className="stat-content">
            <span className="stat-label">Conversas Ativas</span>
            <span className="stat-value">{safeStats.chats || 0}</span>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${Math.min((safeStats.chats || 0) * 10, 100)}%` }}></div>
            </div>
          </div>
          <div className="stat-icon">💬</div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-content">
            <span className="stat-label">Tempo Economizado</span>
            <span className="stat-value">
              {Math.floor((safeStats.messages || 0) * 2 / 60)}h {((safeStats.messages || 0) * 2) % 60}m
            </span>
            <div className="stat-sub">({safeStats.messages || 0} msgs automáticas)</div>
          </div>
          <div className="stat-icon">⏱️</div>
        </div>

        <div className="stat-card gradient-orange" style={{ position: 'relative' }}>
          <div className="stat-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">Valor em Pipeline</span>
              <button 
                onClick={() => setShowConfig(!showConfig)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0', fontSize: '1.2rem', opacity: 0.7 }}
                title="Configurar ROI"
              >
                ⚙️
              </button>
            </div>
            <span className="stat-value">{formattedROI}</span>
            <div className="stat-sub">estimativa de vendas</div>
          </div>
          <div className="stat-icon">💰</div>
          
          {showConfig && (
            <div style={{
              position: 'absolute', top: '100%', right: '0', marginTop: '10px',
              background: '#0f172a', border: '1px solid #7c3aed', borderRadius: '12px',
              padding: '15px', zIndex: 100, width: '250px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#fff' }}>Configurar Estimativa</h4>
              
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                Ticket Médio (R$)
                <input 
                  type="number" 
                  value={ticketMedio} 
                  onChange={e => setTicketMedio(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', marginTop: '4px' }}
                />
              </label>
              
              <label style={{ display: 'block', marginBottom: '15px', fontSize: '0.8rem', color: '#94a3b8' }}>
                Taxa de Conversão (%)
                <input 
                  type="number" 
                  value={taxaConversao} 
                  onChange={e => setTaxaConversao(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', marginTop: '4px' }}
                />
              </label>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowConfig(false)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #475569', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={saveConfig} style={{ flex: 1, padding: '8px', background: '#7c3aed', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-metrics-row" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 350px', 
        gap: '20px', 
        marginTop: '20px' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Atividade da IA (Mensagens)</h3>
              <span className="finance-badge trial">Últimos 7 dias</span>
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
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar 
                    dataKey="value" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Captura de Leads</h3>
              <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                Crescimento Real
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
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
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

        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem' }}>Atividade Recente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {recentActivities.length > 0 ? recentActivities.map((act, i) => (
              <div key={act.id} className="reveal-item" style={{ 
                display: 'flex', 
                gap: '12px', 
                padding: '12px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
                animationDelay: `${i * 0.1}s`
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: act.type === 'danger' ? '#ef4444' : '#10b981',
                  marginTop: '6px',
                  boxShadow: `0 0 10px ${act.type === 'danger' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{act?.title}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{act?.desc}</span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>{act?.time}</span>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
                <p style={{ fontSize: '0.85rem' }}>Aguardando atividades...</p>
              </div>
            )}
          </div>

          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: 'rgba(124, 58, 237, 0.1)', 
            borderRadius: '12px',
            border: '1px dashed rgba(124, 58, 237, 0.3)'
          }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#a78bfa', textAlign: 'center', fontWeight: '600' }}>
              Sincronização em tempo real ativa ⚡
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
