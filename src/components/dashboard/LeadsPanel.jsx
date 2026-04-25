import React from 'react';

const LeadsPanel = ({ leads }) => {
  return (
    <div className="tab-panel">
      <div className="glass-card">
        <h3>Lista de Leads Capturados</h3>
        <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: '#a1a1aa' }}>NOME</th>
                <th style={{ padding: '1rem', color: '#a1a1aa' }}>WHATSAPP</th>
                <th style={{ padding: '1rem', color: '#a1a1aa' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>{lead.name}</td>
                  <td style={{ padding: '1rem', color: '#a1a1aa' }}>{lead.phone}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '0.7rem' }}>
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>
                    Aguardando primeiros leads...
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

export default LeadsPanel;
