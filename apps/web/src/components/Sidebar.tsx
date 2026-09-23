import React from 'react';

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  created_at: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  ollamaOnline?: boolean;
  onOpenSettings: () => void;
  currentUser?: { username: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  ollamaOnline = false,
  onOpenSettings,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-logo">TM</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="brand-title">TerraMind</span>
              <span className="brand-badge">PRO</span>
            </div>
          </div>
        </div>
        <button className="sidebar-toggle-btn" onClick={onToggle} title="Close Sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>New Infrastructure Chat</span>
      </button>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
            No recent conversations.
          </div>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              className={`conversation-item ${activeId === c.id ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="convo-title">{c.title || 'Terraform Chat'}</span>
              </div>
              <button
                className="convo-delete-btn"
                title="Delete Chat"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-action-btn" onClick={onOpenSettings}>
          <span style={{ fontSize: '1rem' }}>⚙️</span>
          <span>Provider API Keys</span>
        </button>

        <div className="user-profile-row">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="user-avatar-sm">{currentUser.username.slice(0, 2).toUpperCase()}</div>
                <span style={{ fontSize: '0.825rem', fontWeight: '600' }}>{currentUser.username}</span>
              </div>
              <button className="logout-btn" onClick={onLogout} title="Sign Out">
                Sign out
              </button>
            </div>
          ) : (
            <button className="sidebar-action-btn login" onClick={onOpenAuth}>
              <span>👤</span>
              <span>Sign In / Account</span>
            </button>
          )}
        </div>

        <div className="status-indicator" style={{ marginTop: '0.5rem' }}>
          <span className={`status-dot ${ollamaOnline ? '' : 'offline'}`}></span>
          <span>Ollama: {ollamaOnline ? 'Online (11434)' : 'Offline'}</span>
        </div>
      </div>
    </aside>
  );
};
