import React from 'react';

const ConnectionPanel = ({ qrStatus, qrCode, qrTimer, fetchQrCode, selectedInstance }) => {
  return (
    <div className="tab-panel">
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Conexão WhatsApp</h3>
        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {qrStatus === 'CONNECTED' && 'WhatsApp conectado e funcionando'}
          {qrStatus === 'QRCODE' && 'Abra o WhatsApp do seu negócio → Configurações → Aparelhos Conectados → Escanear QR'}
          {qrStatus === 'DISCONNECTED' && 'Instância desconectada. Gere um novo QR para conectar.'}
          {qrStatus === 'NOT_FOUND' && 'Instância não encontrada. Entre em contato com o suporte.'}
          {qrStatus === 'loading' && 'Verificando status da conexão...'}
        </p>

        <div 
          style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '24px', 
            display: 'inline-block', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)', 
            position: 'relative' 
          }}
        >
          {qrStatus === 'CONNECTED' && (
            <div 
              style={{ 
                width: '240px', 
                height: '240px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#10b981' 
              }}
            >
              <div style={{ fontSize: '5rem' }}>✅</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981', marginTop: '0.5rem' }}>
                Conectado
              </div>
            </div>
          )}
          {qrStatus === 'QRCODE' && qrCode && (
            <div style={{ position: 'relative' }}>
              <img src={qrCode} alt="QR Code WhatsApp" style={{ width: '240px', height: '240px', display: 'block' }} />
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: '8px', 
                  right: '8px', 
                  background: qrTimer <= 10 ? '#ef4444' : '#10b981', 
                  color: 'white', 
                  borderRadius: '999px', 
                  padding: '2px 10px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700 
                }}
              >
                {qrTimer}s
              </div>
            </div>
          )}
          {(qrStatus === 'loading' || (qrStatus === 'QRCODE' && !qrCode)) && (
            <div style={{ width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" style={{ width: '60px', height: '60px' }}></div>
            </div>
          )}
          {(qrStatus === 'DISCONNECTED' || qrStatus === 'NOT_FOUND') && (
            <div 
              style={{ 
                width: '240px', 
                height: '240px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '1rem' 
              }}
            >
              <div style={{ fontSize: '3.5rem' }}>📵</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#a1a1aa' }}>
                {qrStatus === 'NOT_FOUND' ? 'Instância não encontrada' : 'Desconectado'}
              </div>
            </div>
          )}
        </div>

        {qrStatus === 'QRCODE' && (
          <p 
            style={{ 
              marginTop: '1rem', 
              color: qrTimer <= 10 ? '#ef4444' : '#a1a1aa', 
              fontSize: '0.82rem', 
              fontWeight: qrTimer <= 10 ? 700 : 400 
            }}
          >
            {qrTimer <= 10 ? `⚠️ QR expira em ${qrTimer}s — prepare o WhatsApp` : `QR atualiza automaticamente em ${qrTimer}s`}
          </p>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => fetchQrCode(selectedInstance)} 
            className="btn-secondary" 
            disabled={qrStatus === 'loading'}
          >
            {qrStatus === 'loading' ? 'Carregando...' : qrStatus === 'CONNECTED' ? 'Verificar Status' : 'Gerar novo QR'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;
