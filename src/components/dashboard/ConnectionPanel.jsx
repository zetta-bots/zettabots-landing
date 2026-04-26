const ConnectionPanel = ({ qrStatus, qrCode, qrTimer, fetchQrCode, selectedInstance }) => {
  return (
    <div className="tab-panel reveal-item">
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* Background Decoration */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Conexão WhatsApp</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
            {qrStatus === 'CONNECTED' && 'Seu ecossistema está online e a Sarah está pronta para vender.'}
            {qrStatus === 'QRCODE' && 'Escaneie o código abaixo com o WhatsApp do seu negócio para ativar a IA.'}
            {qrStatus === 'DISCONNECTED' && 'Sua instância perdeu a conexão. Gere um novo código para reativar.'}
            {qrStatus === 'NOT_FOUND' && 'Instância em manutenção ou não encontrada. Consulte o suporte.'}
            {qrStatus === 'loading' && 'Sincronizando com os servidores do WhatsApp...'}
          </p>

          <div 
            style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '2.5rem', 
              borderRadius: '32px', 
              display: 'inline-block', 
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5)', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              position: 'relative' 
            }}
          >
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', position: 'relative' }}>
              {qrStatus === 'CONNECTED' && (
                <div 
                  style={{ 
                    width: '260px', 
                    height: '260px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#10b981',
                    animation: 'revealUp 0.6s ease'
                  }}
                >
                  <div style={{ fontSize: '6rem', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))' }}>✅</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#10b981', marginTop: '1rem', letterSpacing: '1px' }}>
                    SISTEMA ONLINE
                  </div>
                </div>
              )}
              {qrStatus === 'QRCODE' && qrCode && (
                <div style={{ position: 'relative', animation: 'revealUp 0.6s ease' }}>
                  <img src={qrCode} alt="QR Code WhatsApp" style={{ width: '260px', height: '260px', display: 'block', borderRadius: '12px' }} />
                  <div 
                    style={{ 
                      position: 'absolute', 
                      bottom: '-12px', 
                      right: '-12px', 
                      background: qrTimer <= 10 ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                      color: 'white', 
                      borderRadius: '14px', 
                      padding: '6px 14px', 
                      fontSize: '0.85rem', 
                      fontWeight: '800',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {qrTimer}s
                  </div>
                </div>
              )}
              {(qrStatus === 'loading' || (qrStatus === 'QRCODE' && !qrCode)) && (
                <div style={{ width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '64px', height: '64px', border: '4px solid rgba(124, 58, 237, 0.1)', borderTopColor: '#7c3aed' }}></div>
                </div>
              )}
              {(qrStatus === 'DISCONNECTED' || qrStatus === 'NOT_FOUND') && (
                <div 
                  style={{ 
                    width: '260px', 
                    height: '260px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '1.5rem',
                    animation: 'revealUp 0.6s ease'
                  }}
                >
                  <div style={{ fontSize: '5rem', filter: 'grayscale(1)' }}>📵</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {qrStatus === 'NOT_FOUND' ? 'Instância Off' : 'Desconectado'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => fetchQrCode(selectedInstance)} 
                disabled={qrStatus === 'loading'}
                style={{
                  padding: '1rem 2.5rem',
                  borderRadius: '16px',
                  background: qrStatus === 'CONNECTED' ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: qrStatus === 'CONNECTED' ? 'none' : '0 10px 25px rgba(124, 58, 237, 0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => !qrStatus === 'loading' && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => !qrStatus === 'loading' && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {qrStatus === 'loading' ? 'Processando...' : qrStatus === 'CONNECTED' ? 'Verificar Sincronização' : 'Gerar Código QR'}
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '25px', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                <span style={{ color: '#10b981' }}>●</span> Evolution API v2
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                <span style={{ color: '#7c3aed' }}>●</span> Criptografia de Ponta-a-Ponta
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;
