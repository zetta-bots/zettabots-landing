import React, { useState, useEffect, useRef } from 'react';

const FastTestChat = ({ session, systemPrompt, knowledgeFiles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou seu assistente de testes. Como posso ajudar você hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulação de resposta da IA (Posteriormente conectaremos com a API real)
    setTimeout(() => {
      const activeFiles = knowledgeFiles.filter(f => f.status === 'ready');
      let response = "";

      if (userMessage.toLowerCase().includes('quem é você')) {
        response = "Eu sou o assistente virtual da ZettaBots, treinado com as suas instruções personalizadas.";
      } else if (activeFiles.length > 0 && userMessage.toLowerCase().includes('conhecimento')) {
        response = `Eu já aprendi com ${activeFiles.length} arquivo(s) que você subiu. Estou pronto para responder baseado neles!`;
      } else {
        response = "Recebi sua mensagem! Estou configurado com o seu System Prompt e pronto para atender seus leads.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, fontFamily: 'Inter, sans-serif' }}>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'rotate(90deg)' : 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.1)' : 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'none'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Janela de Chat */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            right: 0,
            width: '380px',
            height: '550px',
            background: 'rgba(15, 15, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Chat de Teste Rápido</h4>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Validando Cérebro da IA</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  boxShadow: msg.role === 'user' ? '0 4px 15px rgba(124, 58, 237, 0.2)' : 'none',
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '18px 18px 18px 2px' }}>
                <div className="typing-dot" style={{ display: 'inline-block', width: '4px', height: '4px', background: '#fff', borderRadius: '50%', marginRight: '3px', animation: 'blink 1s infinite' }} />
                <div className="typing-dot" style={{ display: 'inline-block', width: '4px', height: '4px', background: '#fff', borderRadius: '50%', marginRight: '3px', animation: 'blink 1s infinite 0.2s' }} />
                <div className="typing-dot" style={{ display: 'inline-block', width: '4px', height: '4px', background: '#fff', borderRadius: '50%', animation: 'blink 1s infinite 0.4s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta de teste..."
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '45px',
                  height: '45px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                🚀
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes blink {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default FastTestChat;
