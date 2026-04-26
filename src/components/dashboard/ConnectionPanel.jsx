const ConnectionPanel = ({ qrStatus, qrCode, qrTimer, fetchQrCode, selectedInstance }) => {
  const qrSize = 180;

  return (
    <div className="tab-panel reveal-item">
      <div className="glass-card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>

        {/* Background Decoration */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header com status badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Conexão WhatsApp</h2>
            </div>
            <div
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: qrStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                color: qrStatus === 'CONNECTED' ? '#10b981' : '#94a3b8',
                border: `1px solid ${qrStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'}`
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: qrStatus === 'CONNECTED' ? '#10b981' : '#94a3b8', animation: qrStatus === 'CONNECTED' ? 'pulse 2s infinite' : 'none' }}></span>
              {qrStatus === 'CONNECTED' ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>

          {/* Grid responsivo: 2 colunas desktop, 1 coluna mobile */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '3rem',
              '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr',
                gap: '2rem'
              }
            }}
            className="connection-grid"
          >
            {/* Coluna esquerda: QR Code / Status */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '1.5rem',
                  borderRadius: '20px',
                  boxShadow: '0 15px 40px -12px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative'
                }}
              >
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '16px', position: 'relative' }}>
                  {qrStatus === 'CONNECTED' && (
                    <div
                      style={{
                        width: qrSize,
                        height: qrSize,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10b981',
                        animation: 'revealUp 0.6s ease'
                      }}
                    >
                      <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))' }}>✅</div>
                    </div>
                  )}
                  {qrStatus === 'QRCODE' && qrCode && (
                    <div style={{ position: 'relative', animation: 'revealUp 0.6s ease' }}>
                      <img src={qrCode} alt="QR Code WhatsApp" style={{ width: qrSize, height: qrSize, display: 'block', borderRadius: '8px' }} />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-10px',
                          right: '-10px',
                          background: qrTimer <= 10 ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '4px 12px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        {qrTimer}s
                      </div>
                    </div>
                  )}
                  {(qrStatus === 'loading' || (qrStatus === 'QRCODE' && !qrCode)) && (
                    <div style={{ width: qrSize, height: qrSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid rgba(124, 58, 237, 0.1)', borderTopColor: '#7c3aed' }}></div>
                    </div>
                  )}
                  {(qrStatus === 'DISCONNECTED' || qrStatus === 'NOT_FOUND') && (
                    <div
                      style={{
                        width: qrSize,
                        height: qrSize,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        animation: 'revealUp 0.6s ease'
                      }}
                    >
                      <div style={{ fontSize: '3.5rem', filter: 'grayscale(1)' }}>📵</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna direita: Informações e ações */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100%' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: '500', marginBottom: '2rem', lineHeight: '1.6' }}>
                  {qrStatus === 'CONNECTED' && 'Seu ecossistema está online e a Sarah está pronta para vender. Monitore a atividade em tempo real.'}
                  {qrStatus === 'QRCODE' && 'Escaneie o código QR com o WhatsApp do seu negócio para ativar a IA e começar a atender automaticamente.'}
                  {qrStatus === 'DISCONNECTED' && 'Sua instância perdeu a conexão. Gere um novo código QR para reativar o sistema imediatamente.'}
                  {qrStatus === 'NOT_FOUND' && 'Instância em manutenção ou não encontrada. Entre em contato com o suporte para resolver.'}
                  {qrStatus === 'loading' && 'Sincronizando com os servidores do WhatsApp. Aguarde alguns momentos...'}
                </p>

                {/* Tech info badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#94a3b8' }}>
                    <span style={{ color: '#10b981', fontWeight: '800' }}>✓</span> Evolution API v2
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#94a3b8' }}>
                    <span style={{ color: '#7c3aed', fontWeight: '800' }}>✓</span> Criptografia de Ponta-a-Ponta
                  </div>
                </div>
              </div>

              {/* Botão de ação */}
              <div>
                <button
                  onClick={() => fetchQrCode(selectedInstance)}
                  disabled={qrStatus === 'loading'}
                  style={{
                    width: '100%',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    background: qrStatus === 'CONNECTED' ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: qrStatus === 'loading' ? 'not-allowed' : 'pointer',
                    boxShadow: qrStatus === 'CONNECTED' ? 'none' : '0 8px 20px rgba(124, 58, 237, 0.25)',
                    transition: 'all 0.3s',
                    opacity: qrStatus === 'loading' ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => qrStatus !== 'loading' && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 12px 28px rgba(124, 58, 237, 0.4)')}
                  onMouseLeave={(e) => qrStatus !== 'loading' && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = qrStatus === 'CONNECTED' ? 'none' : '0 8px 20px rgba(124, 58, 237, 0.25)')}
                >
                  {qrStatus === 'loading' ? '⏳ Processando...' : qrStatus === 'CONNECTED' ? '🔄 Verificar Sincronização' : '📱 Gerar Código QR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;
