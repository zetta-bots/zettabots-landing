import React, { useState, useMemo } from 'react';

const LeadsPanel = ({ leads, loading = false, contactCount = 0, message = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hasLeads = leads && leads.length > 0;

  // Filtrar e ordenar dados
  const filteredAndSorted = useMemo(() => {
    let filtered = leads || [];

    // Busca
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || '').includes(searchTerm)
      );
    }

    // Filtro por sentiment
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(lead => lead.sentiment === sentimentFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.last_contact_at || new Date()).getTime();
          bVal = new Date(b.last_contact_at || new Date()).getTime();
          break;
        case 'sentiment':
          const sentimentOrder = { hot: 0, neutral: 1, cold: 2 };
          aVal = sentimentOrder[a.sentiment] || 1;
          bVal = sentimentOrder[b.sentiment] || 1;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [leads, searchTerm, sentimentFilter, sortBy, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedLeads = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SkeletonRow = () => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <td style={{ padding: '1.25rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="skeleton-loading" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
          <div className="skeleton-loading" style={{ width: '120px', height: '14px', borderRadius: '4px' }}></div>
        </div>
      </td>
      <td style={{ padding: '1rem' }}><div className="skeleton-loading" style={{ width: '100px', height: '12px', borderRadius: '4px' }}></div></td>
      <td style={{ padding: '1rem' }}><div className="skeleton-loading" style={{ width: '150px', height: '12px', borderRadius: '4px' }}></div></td>
      <td style={{ padding: '1rem' }}><div className="skeleton-loading" style={{ width: '80px', height: '12px', borderRadius: '4px' }}></div></td>
    </tr>
  );

  return (
    <div className="tab-panel reveal-item">
      <div className="glass-card" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Hub de Leads Inteligente</h3>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
              {loading ? 'Sincronizando banco de dados...' : hasLeads ? `${filteredAndSorted.length} lead${filteredAndSorted.length !== 1 ? 's' : ''} encontrado${filteredAndSorted.length !== 1 ? 's' : ''}` : 'Aguardando capturas'}
            </p>
          </div>
          {contactCount > 0 && !hasLeads && !loading && (
            <div className="finance-badge trial" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              ⚡ {contactCount} Contatos em Espera
            </div>
          )}
        </div>

        {/* Busca e Filtros */}
        {hasLeads && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '1rem', marginBottom: '2rem', alignItems: 'end' }}>
            {/* Busca */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Buscar</label>
              <input
                type="text"
                placeholder="Nome ou telefone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Filtro Sentiment */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Qualificação</label>
              <select
                value={sentimentFilter}
                onChange={(e) => { setSentimentFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '150px'
                }}
              >
                <option value="all" style={{ background: '#0f172a' }}>Todos</option>
                <option value="hot" style={{ background: '#0f172a' }}>🔥 Quente</option>
                <option value="neutral" style={{ background: '#0f172a' }}>😐 Neutro</option>
                <option value="cold" style={{ background: '#0f172a' }}>❄️ Frio</option>
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Ordenar</label>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '140px'
                }}
              >
                <option value="date" style={{ background: '#0f172a' }}>Data</option>
                <option value="name" style={{ background: '#0f172a' }}>Nome</option>
                <option value="sentiment" style={{ background: '#0f172a' }}>Qualificação</option>
              </select>
            </div>

            {/* Ordem */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                color: '#a78bfa',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '700',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'}
              title={`${sortOrder === 'asc' ? 'Decrescente' : 'Crescente'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        )}

        {/* Tabela */}
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1.25rem 1.5rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.05em' }}>CLIENTE</th>
                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.05em' }}>WHATSAPP</th>
                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.05em' }}>QUALIFICAÇÃO</th>
                <th style={{ padding: '1.25rem 1.5rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left', letterSpacing: '0.05em' }}>ÚLTIMO CONTATO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : !hasLeads ? (
                <tr>
                  <td colSpan="4">
                    <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 15px rgba(124, 58, 237, 0.3))' }}>🤖</div>
                      <h4 style={{ margin: '0 0 0.75rem', color: '#fff', fontSize: '1.2rem', fontWeight: '700' }}>
                        Base de Leads Vazia
                      </h4>
                      <p style={{ margin: '0 auto', color: '#94a3b8', fontSize: '0.95rem', maxWidth: '450px', lineHeight: '1.6' }}>
                        {message || (contactCount > 0
                          ? `Temos ${contactCount} potenciais leads na sua instância. A Sarah irá listá-los aqui assim que eles começarem a interagir.`
                          : 'Sua IA está pronta e aguardando. Assim que alguém interagir com seu WhatsApp, os dados aparecerão aqui instantaneamente.')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Nenhum lead encontrado com esses filtros.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, i) => (
                  <tr key={i} className="reveal-item" style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    animationDelay: `${i * 0.08}s`,
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.3s'
                  }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '14px',
                          background: lead.sentiment === 'hot' ? 'linear-gradient(135deg, #ef4444, #f59e0b)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: '800',
                          color: '#fff',
                          boxShadow: lead.sentiment === 'hot' ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 4px 15px rgba(124, 58, 237, 0.2)'
                        }}>
                          {(lead.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{lead.name}</span>
                          {lead.ai_notes && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              fontWeight: '500',
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              background: 'rgba(255,255,255,0.03)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }} title={lead.ai_notes}>
                              ✨ {lead.ai_notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
                      {lead.phone}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '6px 14px',
                        background: lead.sentiment === 'hot' ? 'rgba(239, 68, 68, 0.15)' : lead.sentiment === 'cold' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                        color: lead.sentiment === 'hot' ? '#fca5a5' : lead.sentiment === 'cold' ? '#93c5fd' : '#94a3b8',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '900',
                        letterSpacing: '0.05em',
                        border: `1px solid ${lead.sentiment === 'hot' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'}`
                      }}>
                        {lead.sentiment === 'hot' ? '🔥 QUENTE' : lead.sentiment === 'cold' ? '❄️ FRIO' : '😐 NEUTRO'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                      {lead.date || (lead.last_contact_at ? new Date(lead.last_contact_at).toLocaleDateString('pt-BR') : 'Hoje')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {hasLeads && filteredAndSorted.length > itemsPerPage && (
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>
              Página {currentPage} de {totalPages} • {filteredAndSorted.length} leads no total
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: currentPage === 1 ? '#64748b' : '#a78bfa',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '700'
                }}
              >
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: currentPage === totalPages ? '#64748b' : '#a78bfa',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '700'
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

export default LeadsPanel;
