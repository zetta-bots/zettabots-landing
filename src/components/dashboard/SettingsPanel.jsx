import React, { useState } from 'react';

const SettingsPanel = ({ session, showToast }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: session?.name || '',
    email: session?.email || 'zetta@bots.ia',
    phone: session?.phone || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simular salvar
      await new Promise(r => setTimeout(r, 1000));
      showToast('Configurações salvas com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tab-panel reveal-item">
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', minHeight: '650px', border: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Sidebar de Abas */}
        <div style={{
          width: '280px',
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '2rem 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
              border: 'none',
              borderRight: activeTab === 'profile' ? '3px solid #7c3aed' : 'none',
              padding: '1rem 1.5rem',
              textAlign: 'left',
              color: activeTab === 'profile' ? '#a78bfa' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = activeTab === 'profile' ? 'rgba(124, 58, 237, 0.1)' : 'transparent'}
          >
            👤 Perfil
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              background: activeTab === 'notifications' ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
              border: 'none',
              borderRight: activeTab === 'notifications' ? '3px solid #7c3aed' : 'none',
              padding: '1rem 1.5rem',
              textAlign: 'left',
              color: activeTab === 'notifications' ? '#a78bfa' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = activeTab === 'notifications' ? 'rgba(124, 58, 237, 0.1)' : 'transparent'}
          >
            🔔 Notificações
          </button>

          <button
            onClick={() => setActiveTab('security')}
            style={{
              background: activeTab === 'security' ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
              border: 'none',
              borderRight: activeTab === 'security' ? '3px solid #7c3aed' : 'none',
              padding: '1rem 1.5rem',
              textAlign: 'left',
              color: activeTab === 'security' ? '#a78bfa' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = activeTab === 'security' ? 'rgba(124, 58, 237, 0.1)' : 'transparent'}
          >
            🔐 Segurança
          </button>

          <button
            onClick={() => setActiveTab('api')}
            style={{
              background: activeTab === 'api' ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
              border: 'none',
              borderRight: activeTab === 'api' ? '3px solid #7c3aed' : 'none',
              padding: '1rem 1.5rem',
              textAlign: 'left',
              color: activeTab === 'api' ? '#a78bfa' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = activeTab === 'api' ? 'rgba(124, 58, 237, 0.1)' : 'transparent'}
          >
            🔑 API Keys
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div style={{ animation: 'revealUp 0.4s ease-out' }}>
              <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Perfil</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '600px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', color: '#64748b', fontSize: '0.95rem', cursor: 'not-allowed' }}
                  />
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Email não pode ser alterado</p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{ marginTop: '2rem', padding: '1rem 3rem', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer', opacity: saving ? 0.5 : 1, transition: 'all 0.3s' }}
                onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => !saving && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {saving ? '💾 Salvando...' : '💾 Salvar Alterações'}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div style={{ animation: 'revealUp 0.4s ease-out' }}>
              <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Preferências de Notificações</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                {[
                  { id: 'email_leads', label: 'Novos Leads por Email', desc: 'Receba notificação quando um novo lead for identificado' },
                  { id: 'email_messages', label: 'Mensagens Não Respondidas', desc: 'Alerte quando há mensagens aguardando resposta' },
                  { id: 'email_errors', label: 'Erros do Sistema', desc: 'Notificações sobre problemas e erros críticos' },
                  { id: 'sms_urgent', label: 'Alertas Urgentes via SMS', desc: 'Receba SMS apenas para alertas críticos' }
                ].map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#f1f5f9' }}>{item.label}</h4>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>{item.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div style={{ animation: 'revealUp 0.4s ease-out' }}>
              <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Segurança</h2>

              <div style={{ maxWidth: '600px' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: '700' }}>Alterar Senha</h4>
                  <input type="password" placeholder="Senha atual" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', marginBottom: '1rem', outline: 'none' }} />
                  <input type="password" placeholder="Nova senha" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', marginBottom: '1rem', outline: 'none' }} />
                  <input type="password" placeholder="Confirmar nova senha" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', marginBottom: '1rem', outline: 'none' }} />
                  <button style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Atualizar Senha</button>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.05)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: '700', color: '#f87171' }}>⚠️ Zona de Perigo</h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#94a3b8' }}>Deletar sua conta é uma ação irreversível. Todos os seus dados serão perdidos.</p>
                  <button style={{ padding: '1rem 2rem', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontWeight: '800', cursor: 'pointer' }}>🗑️ Deletar Conta</button>
                </div>
              </div>
            </div>
          )}

          {/* API TAB */}
          {activeTab === 'api' && (
            <div style={{ animation: 'revealUp 0.4s ease-out' }}>
              <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>API Keys</h2>

              <div style={{ maxWidth: '600px' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Chave de API Principal</h4>
                    <button style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>🔄 Regenerar</button>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b', wordBreak: 'break-all' }}>
                    sk_live_••••••••••••••••••••••••••••••••••••••••••••••
                  </div>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Criada em 26/04/2026</p>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '2rem' }}>📚 <a href="https://docs.zettabots.ia.br/api" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: '700' }}>Consulte a documentação da API</a></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
