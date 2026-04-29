import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const ZettaCostPanel = ({ session, selectedInstance }) => {
  const [costData, setCostData] = useState({
    totalTokens: 0,
    totalCost: 0,
    avgTokensPerChat: 0,
    dailyData: [],
    loading: true
  });

  useEffect(() => {
    if (selectedInstance) fetchCostData();
  }, [selectedInstance]);

  const fetchCostData = async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('token_logs')
        .select('total_tokens, cost_usd, created_at')
        .eq('instance_name', selectedInstance)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const totalTokens = (data || []).reduce((sum, row) => sum + (row.total_tokens || 0), 0);
      const totalCost = (data || []).reduce((sum, row) => sum + (row.cost_usd || 0), 0);
      const avgTokensPerChat = data.length > 0 ? Math.round(totalTokens / data.length) : 0;

      const dailyMap = {};
      (data || []).forEach(row => {
        const day = new Date(row.created_at).toLocaleDateString('pt-BR');
        dailyMap[day] = (dailyMap[day] || 0) + row.cost_usd;
      });

      const dailyData = Object.entries(dailyMap).slice(-7).map(([day, cost]) => ({
        day,
        cost: parseFloat(cost.toFixed(4))
      }));

      setCostData({
        totalTokens,
        totalCost: parseFloat(totalCost.toFixed(4)),
        avgTokensPerChat,
        dailyData,
        loading: false
      });
    } catch (err) {
      console.error('Erro ao buscar custos:', err);
      setCostData(prev => ({ ...prev, loading: false }));
    }
  };

  if (costData.loading) {
    return <div className="tab-panel reveal-item"><p>Carregando...</p></div>;
  }

  return (
    <div className="tab-panel reveal-item">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        <div className="stat-card gradient-purple">
          <div className="stat-content">
            <span className="stat-label">TOKENS (30d)</span>
            <span className="stat-value">{costData.totalTokens.toLocaleString()}</span>
            <div className="stat-sub">Total de tokens processados</div>
          </div>
          <div className="stat-icon">📊</div>
        </div>

        <div className="stat-card gradient-blue">
          <div className="stat-content">
            <span className="stat-label">CUSTO USD (30d)</span>
            <span className="stat-value">${costData.totalCost.toFixed(3)}</span>
            <div className="stat-sub">Gemini 2.5 Flash</div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-content">
            <span className="stat-label">MÉDIA/CHAT</span>
            <span className="stat-value">{costData.avgTokensPerChat}</span>
            <div className="stat-sub">Tokens por resposta</div>
          </div>
          <div className="stat-icon">🤖</div>
        </div>

        <div className="stat-card gradient-orange">
          <div className="stat-content">
            <span className="stat-label">MODELO ATIVO</span>
            <span className="stat-value" style={{ fontSize: '0.85rem' }}>Gemini 2.5</span>
            <div className="stat-sub">Flash (ultra-barato)</div>
          </div>
          <div className="stat-icon">⚡</div>
        </div>

      </div>

      <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: '700', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>📈</span> Custo Diário (Últimos 7 dias)
        </h3>
        {costData.dailyData.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '1rem', textAlign: 'center' }}>
            {costData.dailyData.map((item, idx) => (
              <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{item.day}</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#a78bfa', marginTop: '4px' }}>${item.cost.toFixed(3)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', margin: 0 }}>Nenhum custo registrado nos últimos 7 dias.</p>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
          💡 <strong>Transparência de Custos:</strong> Cada resposta da IA registra automaticamente o consumo de tokens (entrada + saída). Os preços são baseados no Gemini 2.5 Flash via OpenRouter — <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>$0.15/1M input, $0.60/1M output</code>.
        </p>
      </div>
    </div>
  );
};

export default ZettaCostPanel;
