import React from 'react';

const Header = ({ isAdmin, session, activeTab, allInstances, selectedInstance, setSelectedInstance }) => {
  return (
    <header className="main-header">
      <div className="header-title">
        <h1>{isAdmin ? 'ZettaBots Master' : `Bem-vindo, ${session.name || session.instanceName || ''}`}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p>{activeTab === 'conexao' ? 'CONEXÃO' : activeTab.toUpperCase()}</p>
          {isAdmin && allInstances.length > 0 && (
            <select 
              className="instance-selector-mini"
              value={selectedInstance}
              onChange={(e) => setSelectedInstance(e.target.value)}
            >
              {allInstances.map(i => (
                <option key={i.id} value={i.instance_name}>{i.instance_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="plan-badge-v2">
        ⭐ PLANO {['pago', 'admin'].includes(session.status) ? 'PRO' : 'TRIAL'}
      </div>
    </header>
  );
};

export default Header;
