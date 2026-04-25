import React from 'react';

const SubModal = ({ 
  setShowSubModal, 
  setCheckoutPix, 
  checkoutPix, 
  handleGeneratePix, 
  checkoutLoading, 
  showToast 
}) => {
  return (
    <div className="modal-overlay" onClick={() => { setShowSubModal(false); setCheckoutPix(null); }}>
      <div 
        className="premium-card" 
        style={{ width: '90%', maxWidth: '450px', position: 'relative' }} 
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '1.3rem', textAlign: 'center', marginBottom: '0.5rem' }}>💎 Escolha seu Plano</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Assine o ZettaBots PRO e libere todo o poder da IA.
        </p>
        
        <div 
          style={{ 
            padding: '1rem', 
            background: 'rgba(124, 58, 237, 0.1)', 
            borderRadius: '16px', 
            border: '1px solid rgba(124, 58, 237, 0.2)', 
            textAlign: 'center', 
            marginBottom: '1.5rem' 
          }}
        >
           <p 
            style={{ 
              fontSize: '0.7rem', 
              color: 'var(--color-primary)', 
              fontWeight: '800', 
              textTransform: 'uppercase', 
              marginBottom: '4px' 
            }}
          >
            Oferta Especial
          </p>
           <h4 style={{ fontSize: '2rem', margin: 0 }}>
            R$ 247<span style={{ fontSize: '0.9rem', opacity: 0.6 }}>/mês</span>
          </h4>
        </div>

        <div className="payment-options">
           <button 
            className={`method-btn ${!checkoutPix ? '' : 'selected'}`} 
            onClick={() => handleGeneratePix('pix')}
          >
              <span style={{ fontSize: '1.5rem' }}>⚡</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Pix Instantâneo</span>
           </button>
           <button className="method-btn" onClick={() => handleGeneratePix('card')}>
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Cartão / Outros</span>
           </button>
        </div>

        {checkoutLoading && <div className="spinner" style={{ marginTop: '2rem' }}></div>}

        {checkoutPix && (
          <div className="pix-display-area">
            <img 
              src={`data:image/jpeg;base64,${checkoutPix.qr_code_base64}`} 
              alt="PIX QR Code" 
              style={{ width: '200px', height: '200px' }} 
            />
            <p style={{ color: '#18181b', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>
              Aponte a câmera do seu banco para o QR Code acima
            </p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(checkoutPix.qr_code); 
                showToast('Código Copiado!', 'success');
              }} 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '15px', padding: '0.6rem' }}
            >
              📋 Copiar Código PIX
            </button>
          </div>
        )}
        
        <button 
          className="btn-secondary" 
          style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem' }} 
          onClick={() => { setShowSubModal(false); setCheckoutPix(null); }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default SubModal;
