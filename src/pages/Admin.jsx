import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const PLAN_LABEL = {
  start: 'Start',
  pro: 'Pro',
  enterprise: 'Enterprise',
  trial: 'Trial',
  blocked: 'Bloqueado',
  pago: 'Pro',
}

const PLAN_COLOR = {
  start:      '#6366f1',
  pro:        '#8b5cf6',
  enterprise: '#f59e0b',
  trial:      '#3b82f6',
  blocked:    '#ef4444',
  pago:       '#8b5cf6',
}

function Card({ label, value, color = '#8b5cf6', sub }) {
  return (
    <div style={{
      background: '#1a1a2e', border: `1px solid ${color}33`, borderRadius: 12,
      padding: '20px 24px', minWidth: 160, flex: 1,
    }}>
      <div style={{ color: '#a0a0b0', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: 32, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: '#666', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [extending, setExtending] = useState(null)
  const [toast, setToast] = useState(null)

  const adminEmail = localStorage.getItem('userEmail') || ''

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-admin-stats', instanceName: '_admin', email: adminEmail }),
      })
      const d = await r.json()
      if (d.success) setStats(d)
      else navigate('/dashboard')
    } catch {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [adminEmail, navigate])

  useEffect(() => {
    if (adminEmail !== 'richardrovigati@gmail.com') {
      navigate('/dashboard')
      return
    }
    fetchStats()
  }, [adminEmail, fetchStats, navigate])

  const handleExtend = async (client, days) => {
    setExtending(client.email)
    try {
      await fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin-extend', instanceName: '_admin', email: adminEmail, targetEmail: client.email, days }),
      })
      showToast(`Trial de ${client.full_name || client.email} estendido por ${days} dias`)
      fetchStats()
    } catch {
      showToast('Erro ao estender trial', 'error')
    } finally {
      setExtending(null)
    }
  }

  const filtered = (stats?.clients || []).filter(c => {
    const matchSearch = !search ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === 'all' || c.plan_type === planFilter
    return matchSearch && matchPlan
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Carregando...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#13131f', borderBottom: '1px solid #ffffff0f', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(90deg,#8b5cf6,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ZettaBots
          </span>
          <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, background: '#f59e0b22', padding: '2px 8px', borderRadius: 20, border: '1px solid #f59e0b44' }}>
            ADMIN
          </span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: '1px solid #ffffff22', color: '#a0a0b0', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          ← Meu Painel
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Cards MRR */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <Card
            label="MRR"
            value={`R$ ${(stats?.mrr || 0).toLocaleString('pt-BR')}`}
            color="#10b981"
            sub="Receita mensal recorrente"
          />
          <Card label="Total Clientes" value={stats?.totalClients || 0} color="#8b5cf6" />
          <Card label="Ativos (Pagos)" value={stats?.totalActive || 0} color="#6366f1" />
          <Card label="Em Trial" value={stats?.totalTrial || 0} color="#3b82f6" />
          <Card label="Bloqueados" value={stats?.totalBlocked || 0} color="#ef4444" />
        </div>

        {/* Alertas de Expiração */}
        {(stats?.expiringSoon?.length > 0) && (
          <div style={{ background: '#f59e0b11', border: '1px solid #f59e0b44', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
              ⚠️ Expirando nos próximos 7 dias ({stats.expiringSoon.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.expiringSoon.map(c => (
                <div key={c.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ color: '#e0e0f0', fontSize: 14 }}>
                    {c.full_name || c.email}
                    <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                      — expira {new Date(c.plan_expires_at).toLocaleDateString('pt-BR')}
                    </span>
                  </span>
                  <button
                    onClick={() => handleExtend(c, 30)}
                    disabled={extending === c.email}
                    style={{
                      background: '#f59e0b', color: '#000', border: 'none', padding: '4px 12px',
                      borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {extending === c.email ? '...' : '+30 dias'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            style={{
              background: '#1a1a2e', border: '1px solid #ffffff22', borderRadius: 8,
              color: '#fff', padding: '8px 14px', fontSize: 14, width: 280, outline: 'none',
            }}
          />
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            style={{
              background: '#1a1a2e', border: '1px solid #ffffff22', borderRadius: 8,
              color: '#a0a0b0', padding: '8px 14px', fontSize: 14, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="all">Todos os planos</option>
            <option value="trial">Trial</option>
            <option value="start">Start</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
            <option value="blocked">Bloqueados</option>
          </select>
          <span style={{ color: '#666', fontSize: 13, marginLeft: 'auto' }}>{filtered.length} cliente(s)</span>
        </div>

        {/* Tabela */}
        <div style={{ background: '#13131f', border: '1px solid #ffffff0f', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a2e' }}>
                {['Nome', 'Email', 'Plano', 'Status', 'Saúde', 'Expira em', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #ffffff0f' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#555' }}>Nenhum cliente encontrado</td>
                </tr>
              )}
              {filtered.map((c, i) => {
                const planColor = PLAN_COLOR[c.plan_type] || '#888'
                const expiresAt = c.plan_expires_at ? new Date(c.plan_expires_at) : null
                const expired = expiresAt && expiresAt < new Date()
                return (
                  <tr key={c.id || i} style={{ borderBottom: '1px solid #ffffff08' }}>
                    <td style={{ padding: '12px 16px', color: '#e0e0f0', fontSize: 14 }}>
                      {c.full_name || <span style={{ color: '#555' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#a0a0b0', fontSize: 13 }}>{c.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: `${planColor}22`, color: planColor, border: `1px solid ${planColor}55`,
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      }}>
                        {PLAN_LABEL[c.plan_type] || c.plan_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        color: c.is_active ? '#10b981' : '#ef4444',
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {c.is_active ? '● Ativo' : '● Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%', display: 'inline-block',
                        background: c.health_status === 'green' ? '#10b981' : c.health_status === 'yellow' ? '#f59e0b' : '#ef4444',
                        boxShadow: `0 0 8px ${c.health_status === 'green' ? '#10b981' : c.health_status === 'yellow' ? '#f59e0b' : '#ef4444'}66`
                      }} title={c.health_status === 'green' ? 'WhatsApp OK & IA Ativa' : c.health_status === 'yellow' ? 'WhatsApp OK, IA Pausada/Aviso' : 'Desconectado'} />
                    </td>
                    <td style={{ padding: '12px 16px', color: expired ? '#ef4444' : '#a0a0b0', fontSize: 13 }}>
                      {expiresAt ? expiresAt.toLocaleDateString('pt-BR') : <span style={{ color: '#555' }}>—</span>}
                      {expired && <span style={{ marginLeft: 6, fontSize: 11, color: '#ef4444' }}>VENCIDO</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleExtend(c, 30)}
                        disabled={extending === c.email}
                        style={{
                          background: '#ffffff0f', border: '1px solid #ffffff22', color: '#a0a0b0',
                          padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                        }}
                      >
                        {extending === c.email ? '...' : '+30 dias'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
