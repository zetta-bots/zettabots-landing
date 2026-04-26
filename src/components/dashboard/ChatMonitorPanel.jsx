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
  <div style={{ padding: '0.5rem' }}>
    {[1, 2, 3].map(i => (
      <div
        key={i}
        style={{
          padding: '1rem',
          marginBottom: '0.5rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          animation: 'pulse 2s infinite',
          height: '70px'
        }}
      />
    ))}
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
    <div className="chat-monitor-container">
      <div className="chat-list-panel">
        <div className="panel-header"><h3>Conversas Ativas</h3></div>
        {chatsLoading ? (
          <SkeletonChatLoader />
        ) : !hasChats ? (
          <div style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            color: '#a1a1aa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>
              Nenhuma conversa ativa
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
              Quando contatos enviarem mensagens, aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="conversations-scroll">
            {chats.map((chat, i) => (
              <div
                className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                key={i}
                onClick={() => {
                  setSelectedChat(chat);
                  fetchChatMessages(chat.remoteJid || chat.id);
                }}
              >
                <div className="chat-item-header">
                  <span className="chat-name">{chat.user}</span>
                  <span className="chat-time">{chat.time}</span>
                </div>
                <p className="chat-status">{chat.lastMsg}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="chat-window-panel">
        {selectedChat ? (
          <>
            <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>{selectedChat.user}</h4>
              <button
                className={`btn-${isAIPaused ? 'danger' : 'secondary'}`}
                onClick={handleToggleAI}
                style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
              >
                {isAIPaused ? '🚫 IA PAUSADA' : '🤖 IA ATIVA'}
              </button>
            </div>
            <div className="messages-container">
              {chatMessagesLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '8px',
                  color: '#a1a1aa'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#7c3aed',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  <span style={{ fontSize: '0.9rem' }}>Carregando histórico...</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="chat-empty-state">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                  <p>Nenhuma mensagem nesta conversa</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`message ${msg.fromMe ? 'sent' : 'received'} ${msg.type || 'text'}`}>
                    {['image', 'audio'].includes(msg.type)
                      ? <MediaMessage msg={msg} instanceName={selectedInstance} />
                      : msg.text
                    }
                    <span className="message-time">{msg.time}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
            <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Selecione uma conversa
            </p>
            <p>Para monitorar as respostas da IA Sarah em tempo real</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMonitorPanel;
