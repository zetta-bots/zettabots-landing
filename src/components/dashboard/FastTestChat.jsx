import React, { useState, useEffect, useRef } from 'react';

const FastTestChat = ({ session, systemPrompt, knowledgeFiles, selectedInstance }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou o assistente de testes da ZettaBots. Como posso ajudar você hoje?' }
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

    try {
      const response = await fetch('/api/chat-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          systemPrompt: systemPrompt,
          instanceName: selectedInstance,
          history: messages.slice(-5) 
        })
      });

      const data = await response.json();
      
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error(data.error || 'Sem resposta da IA');
      }
    } catch (err) {
      console.error('Erro no chat:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Erro: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
      {/* Botão Flutuante Premium */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="reveal-item"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, var(--color-primary), #4f46e5)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'none'
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Janela de Chat Glassmorphism */}
      {isOpen && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            bottom: '85px',
            right: 0,
            width: '400px',
            height: '600px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'revealUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(to bottom, rgba(124, 58, 237, 0.1), transparent)', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px' 
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 15px #10b981' }} />
              <div style={{ position: 'absolute', top: -2, left: -2, width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #10b981', animation: 'pulse 2s infinite' }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 700 }}>Testar IA em Tempo Real</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(167, 139, 250, 0.8)', fontWeight: 600 }}>Cérebro: {selectedInstance || 'Zetta Master'}</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            background: 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.05), transparent)'
          }}>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: msg.role === 'user' ? '0 10px 20px rgba(124, 58, 237, 0.2)' : 'none',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                  animation: 'revealUp 0.3s ease-out'
                }}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.05)', padding: '14px 20px', borderRadius: '20px' }}>
                <span className="skeleton-loading" style={{ display: 'inline-block', width: '30px', height: '10px', borderRadius: '5px' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Premium */}
          <form onSubmit={handleSendMessage} style={{ padding: '25px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '8px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Teste sua IA agora..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={isTyping}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '44px',
                  height: '44px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s',
                  opacity: isTyping ? 0.5 : 1
                }}
                onMouseEnter={(e) => !isTyping && (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => !isTyping && (e.currentTarget.style.transform = 'scale(1)')}
              >
                🚀
              </button>
            </div>
            <p style={{ margin: '12px 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              Sarah está usando a base de conhecimento atualizada ⚡
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default FastTestChat;
