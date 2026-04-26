import React, { useState } from 'react';

const SubModal = ({ 
  setShowSubModal, 
  setCheckoutPix, 
  checkoutPix, 
  handleGeneratePix, 
  checkoutLoading, 
  showToast 
}) => {
  const [step, setStep] = useState(1); // 1: Escolha, 2: Método, 3: Pagamento
  const [selectedPlan, setSelectedPlan] = useState({ id: 'pro', name: 'ZettaBots Pro', price: 247 });

  const plans = [
    { id: 'start', name: 'ZettaBots Start', price: 127, icon: '🚀', features: ['1 Número WhatsApp', 'IA Básica', 'Atendimento 24/7'] },
    { id: 'pro', name: 'ZettaBots Pro', price: 247, icon: '💎', features: ['1 Número WhatsApp', 'Treinamento com PDFs', 'Monitor de Leads'], highlight: true }
  ];

  const onGenerate = (method) => {
    handleGeneratePix(method, selectedPlan.price, selectedPlan.name);
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 9999 }} onClick={() => { setShowSubModal(false); setCheckoutPix(null); }}>
      <div 
        className="glass-card reveal-item" 
        style={{ 
          width: '90%', 
          maxWidth: '550px', 
          padding: '2rem',
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0e0e1a'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={() => { setShowSubModal(false); setCheckoutPix(null); }}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          ✕
        </button>

        {step === 1 && (
          <div style={{ animation: 'revealUp 0.3s ease-out' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem', textAlign: 'center' }}>Escolha seu Plano</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '20px',
                    background: selectedPlan.id === plan.id ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
                    border: `2px solid ${selectedPlan.id === plan.id ? '#7c3aed' : 'rgba(255,255,255,0.05)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    position: 'relative'
                  }}
                >
                  {plan.highlight && <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', color: '#fff', fontSize: '0.6rem', fontWeight: '900', padding: '2px 8px', borderRadius: '10px' }}>POPULAR</span>}
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{plan.icon}</div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{plan.name}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', marginTop: '5px' }}>R$ {plan.price}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: '800', marginBottom: '10px', fontSize: '0.85rem', color: '#a78bfa' }}>O QUE ESTÁ INCLUSO:</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {selectedPlan.features.map((f, i) => <li key={i} style={{ marginBottom: '5px' }}>✅ {f}</li>)}
              </ul>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '1.1rem' }}
              onClick={() => setStep(2)}
            >
              Continuar para R$ {selectedPlan.price}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'revealUp 0.3s ease-out' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '1.5rem', textAlign: 'center' }}>Forma de Pagamento</h3>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div onClick={() => onGenerate('pix')} style={{ padding: '1.2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>⚡</div>
                <div style={{ fontWeight: '700' }}>Pix Instantâneo</div>
              </div>
              <div onClick={() => onGenerate('card')} style={{ padding: '1.2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>💳</div>
                <div style={{ fontWeight: '700' }}>Cartão / Outros</div>
              </div>
            </div>
            <button className="btn-secondary" style={{ width: '100%', padding: '1rem' }} onClick={() => setStep(1)}>Voltar</button>
          </div>
        )}

        {checkoutLoading && <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner"></div><p style={{ marginTop: '1rem' }}>Gerando cobrança...</p></div>}

        {checkoutPix && (
          <div style={{ textAlign: 'center', animation: 'revealUp 0.4s ease-out' }}>
            <h4 style={{ marginBottom: '1rem' }}>Pagamento via Pix</h4>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1rem' }}>
              <img src={`data:image/jpeg;base64,${checkoutPix.qr_code_base64}`} alt="Pix" style={{ width: '180px', height: '180px' }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Aponte a câmera do banco ou copie o código abaixo.</p>
            <button 
              onClick={() => { navigator.clipboard.writeText(checkoutPix.qr_code); showToast('Copiado!', 'success'); }} 
              className="btn-primary" style={{ width: '100%', padding: '1.1rem' }}
            >
              📋 Copiar Código Pix
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubModal;
