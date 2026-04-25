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

const ChatMonitorPanel = ({ 
  chats, 
  selectedChat, 
  setSelectedChat, 
  fetchChatMessages, 
  isAIPaused, 
  handleToggleAI, 
  chatMessages, 
  selectedInstance 
}) => {
  return (
    <div className="chat-monitor-container">
      <div className="chat-list-panel">
        <div className="panel-header"><h3>Conversas Ativas</h3></div>
        <div className="conversations-scroll">
          {chats.map((chat, i) => (
            <div 
              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`} 
              key={i} 
              onClick={() => {
                setSelectedChat(chat); 
                fetchChatMessages(chat.id);
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
              {chatMessages.map((msg, i) => (
                <div key={i} className={`message ${msg.fromMe ? 'sent' : 'received'} ${msg.type || 'text'}`}>
                  {['image', 'audio'].includes(msg.type) 
                    ? <MediaMessage msg={msg} instanceName={selectedInstance} /> 
                    : msg.text
                  }
                  <span className="message-time">{msg.time}</span>
                </div>
              ))}
              {chatMessages.length === 0 && <div className="chat-empty-state">Carregando histórico...</div>}
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            <p>Selecione uma conversa para monitorar a IA.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMonitorPanel;
