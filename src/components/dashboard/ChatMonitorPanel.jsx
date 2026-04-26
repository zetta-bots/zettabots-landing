import React, { useState, useEffect } from 'react';

const MediaMessage = ({ msg, instanceName }) => {
  const [media, setMedia] = useState(null);
  
  useEffect(() => {
    if (msg.id && (msg.type === 'image' || msg.type === 'audio')) {
      fetch('/api/dashboard-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-media', instanceName, messageId: msg.id })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) setMedia(`data:${data.mimetype};base64,${data.base64}`);
      })
      .catch(e => console.error(e));
    }
  }, [msg.id, msg.type, instanceName]);

  if (!media) return <span>{msg.text} <small style={{ opacity: 0.6 }}>(Carregando mídia...)</small></span>;
  
  if (msg.type === 'image') return <img src={media} alt="Mídia" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '5px' }} />;
  if (msg.type === 'audio') return <audio controls src={media} style={{ maxWidth: '240px', height: '40px', marginTop: '5px' }} />;
  return <span>{msg.text}</span>;
};

const SkeletonChatLoader = () => (
  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{ 
        padding: '1.25rem', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div className="skeleton skeleton-title" style={{ width: '40%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
      </div>
    ))}
  </div>
);

const SkeletonMessageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
    <div style={{ alignSelf: 'flex-start', width: '60%' }}>
      <div className="skeleton" style={{ height: '60px', borderRadius: '18px 18px 18px 4px', width: '100%' }}></div>
    </div>
    <div style={{ alignSelf: 'flex-end', width: '50%' }}>
      <div className="skeleton" style={{ height: '40px', borderRadius: '18px 18px 4px 18px', width: '100%', background: 'rgba(124, 58, 237, 0.1)' }}></div>
    </div>
    <div style={{ alignSelf: 'flex-start', width: '40%' }}>
      <div className="skeleton" style={{ height: '45px', borderRadius: '18px 18px 18px 4px', width: '100%' }}></div>
    </div>
  </div>
);

const ChatMonitorPanel = ({
  chats,
  chatsLoading,
  selectedChat,
  setSelectedChat,
  fetchChatMessages,
  isAIPaused,
  handleToggleAI,
  chatMessages,
  chatMessagesLoading,
  selectedInstance
}) => {
  const hasChats = chats && chats.length > 0;

  return (
    <div className="chat-monitor-container reveal-item" style={{ 
      display: 'grid', 
      gridTemplateColumns: '350px 1fr', 
      gap: '20px', 
      height: '700px',
      marginTop: '10px'
    }}>
      {/* Lista de Conversas */}
      <div className="glass-card" style={{ 
        padding: 0, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(255,255,255,0.02)', 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>Conversas Ativas</h3>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>{hasChats ? chats.length : 0} ONLINE</span>
        </div>

        <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {chatsLoading ? (
            <SkeletonChatLoader />
          ) : !hasChats ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Nenhuma conversa ativa</p>
            </div>
          ) : (
            chats.map((chat, i) => (
              <div
                key={i}
                className={`reveal-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedChat(chat);
                  fetchChatMessages(chat.remoteJid || chat.id);
                }}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  transition: 'all 0.3s ease',
                  background: selectedChat?.id === chat.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  border: selectedChat?.id === chat.id ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid transparent',
                  animationDelay: `${i * 0.05}s`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: selectedChat?.id === chat.id ? '#a78bfa' : '#fff' }}>
                    {chat.user}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{chat.time}</span>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.8rem', 
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: '500'
                }}>
                  {chat.lastMsg}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Janela de Chat */}
      <div className="glass-card" style={{ 
        padding: 0, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {selectedChat ? (
          <>
            <div style={{ 
              padding: '1.25rem 2rem', 
              background: 'rgba(255,255,255,0.02)', 
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{selectedChat.user}</h4>
              </div>
              <button
                onClick={handleToggleAI}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: isAIPaused ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: isAIPaused ? '#f87171' : '#34d399',
                  border: `1px solid ${isAIPaused ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {isAIPaused ? '🚫 IA PAUSADA' : '🤖 IA ATIVA'}
              </button>
            </div>

            <div
              className="custom-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.03), transparent)'
              }}>
              {chatMessagesLoading ? (
                <SkeletonMessageLoader />
              ) : chatMessages.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <p style={{ fontWeight: '600' }}>Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className="reveal-item"
                    style={{ 
                      alignSelf: msg.fromMe ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      padding: '12px 18px',
                      borderRadius: msg.fromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.fromMe ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      boxShadow: msg.fromMe ? '0 4px 15px rgba(124, 58, 237, 0.2)' : 'none',
                      border: msg.fromMe ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                      position: 'relative'
                    }}
                  >
                    {['image', 'audio'].includes(msg.type)
                      ? <MediaMessage msg={msg} instanceName={selectedInstance} />
                      : msg.text
                    }
                    <div style={{ 
                      fontSize: '0.65rem', 
                      opacity: 0.5, 
                      marginTop: '6px', 
                      textAlign: 'right',
                      fontWeight: '700'
                    }}>
                      {msg.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.4))' }}>🛰️</div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: '800' }}>Central de Monitoramento</h3>
            <p style={{ margin: 0, color: '#94a3b8', maxWidth: '400px', lineHeight: '1.6', fontSize: '1rem' }}>
              Selecione uma conversa ao lado para visualizar a interação da Sarah com seus clientes em tempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMonitorPanel;
