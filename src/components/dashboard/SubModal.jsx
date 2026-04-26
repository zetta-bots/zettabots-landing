import React, { useState } from 'react';

const SubModal = ({ 
  setShowSubModal, 
  setCheckoutPix, 
  checkoutPix, 
  handleGeneratePix, 
  checkoutLoading, 
  showToast 
}) => {
  const [step, setStep] = useState(1); // 1: Plano, 2: Método, 3: Pagamento

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999 }} onClick={() => { setShowSubModal(false); setCheckoutPix(null); }}>
      <div 
        className="glass-card reveal-item" 
        style={{ 
          width: '90%', 
          maxWidth: '500px', 
          padding: '2.5rem',
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={() => { setShowSubModal(false); setCheckoutPix(null); }}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          ✕
        </button>

        {step === 1 && (
          <div style={{ textAlign: 'center', animation: 'revealUp 0.3s ease-out' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem', color: '#fff' }}>Upgrade para o PRO</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', fontWeight: '500' }}>LibereSarah sem limites, RAG avançado e suporte prioritário.</p>
            
            <div style={{ background: 'rgba(124, 58, 237, 0.05)', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(124, 58, 237, 0.1)', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#7c3aed', letterSpacing: '2px', marginBottom: '8px' }}>PLANO CORPORATIVO</div>
              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#fff' }}>R$ 247<span style={{ fontSize: '1rem', color: '#64748b' }}>/mês</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0 0 0', textAlign: 'left', display: 'grid', gap: '10px' }}>
                <li style={{ color: '#e2e8f0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>✅ Sarah 100% treinada com seus dados</li>
                <li style={{ color: '#e2e8f0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>✅ Envio de Áudios e Imagens IA</li>
                <li style={{ color: '#e2e8f0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>✅ Monitor de Leads em Tempo Real</li>
              </ul>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '1.2rem', borderRadius: '18px', fontSize: '1rem' }}
              onClick={() => setStep(2)}
            >
              Escolher Forma de Pagamento
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'revealUp 0.3s ease-out' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem', textAlign: 'center', color: '#fff' }}>Forma de Pagamento</h3>
            
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              <div 
                onClick={() => handleGeneratePix('pix')}
                style={{ 
                  padding: '1.5rem', 
                  borderRadius: '20px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)', e.currentTarget.style.borderColor = '#7c3aed')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)', e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#00bfa5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚡</div>
                <div>
                  <div style={{ fontWeight: '800', color: '#fff' }}>Pix Instantâneo</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Liberação imediata da conta</div>
                </div>
              </div>

              <div 
                onClick={() => handleGeneratePix('card')}
                style={{ 
                  padding: '1.5rem', 
                  borderRadius: '20px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)', e.currentTarget.style.borderColor = '#7c3aed')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)', e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>💳</div>
                <div>
                  <div style={{ fontWeight: '800', color: '#fff' }}>Cartão de Crédito</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Parcele em até 12x</div>
                </div>
              </div>
            </div>

            <button 
              className="btn-secondary" 
              style={{ width: '100%', padding: '1rem', borderRadius: '16px' }}
              onClick={() => setStep(1)}
            >
              Voltar aos detalhes
            </button>
          </div>
        )}

        {checkoutLoading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1.5rem', fontWeight: '700', color: '#a78bfa' }}>Gerando cobrança segura...</p>
          </div>
        )}

        {checkoutPix && (
          <div style={{ textAlign: 'center', animation: 'revealUp 0.4s ease-out' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem', color: '#fff' }}>Pagamento via Pix</h3>
            <div style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '24px', 
              display: 'inline-block',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              marginBottom: '1.5rem'
            }}>
              <img 
                src={`data:image/jpeg;base64,${checkoutPix.qr_code_base64}`} 
                alt="PIX QR Code" 
                style={{ width: '220px', height: '220px', display: 'block' }} 
              />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500' }}>
              Aponte a câmera do seu banco para o QR Code.<br/>A liberação é automática após o pagamento.
            </p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(checkoutPix.qr_code); 
                showToast('Código Copiado!', 'success');
              }} 
              className="btn-primary" 
              style={{ width: '100%', padding: '1.2rem', borderRadius: '18px', marginBottom: '1rem' }}
            >
              📋 Copiar Código Pix (Copia e Cola)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubModal;
