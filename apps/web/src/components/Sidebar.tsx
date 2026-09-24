import React, { useState } from 'react';
import { TERRAMIND_AGENTS } from './AgentSelector';

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  project_id?: string;
  created_at: string;
}

export interface WorkspaceFile {
  name: string;
  size: number;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  // Agents
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  // Projects (Requirement 3: Renamed to Projects, no pre-existing projects)
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description: string, icon: string) => void;
  // Files
  workspaceFiles: WorkspaceFile[];
  onSelectFile?: (filename: string) => void;
  // Settings & Auth
  onOpenSettings: () => void;
  currentUser?: { username: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  toggleTheme: () => void;
}

function groupDate(dateStr: string): string {
  const timestamp = new Date(dateStr).getTime() || Date.now();
  const d = (Date.now() - timestamp) / 864e5;
  if (d < 1) return 'Today';
  if (d < 2) return 'Yesterday';
  if (d < 8) return 'Previous 7 days';
  return 'Older';
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen: _isOpen,
  onToggle,
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  selectedAgentId,
  onSelectAgent,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  workspaceFiles,
  onSelectFile,
  onOpenSettings,
  currentUser,
  onOpenAuth,
  onLogout,
  toggleTheme
}) => {
  const [search, setSearch] = useState('');
  const [groupByProject, setGroupByProject] = useState(false);

  // Collapsible section state
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [filesOpen, setFilesOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(true);

  // New Project form state
  const [showNewProjInput, setShowNewProjInput] = useState(false);
  const [newProjName, setNewProjName] = useState('');

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onCreateProject(newProjName.trim(), 'Project Workspace', '📁');
    setNewProjName('');
    setShowNewProjInput(false);
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = (c.title || 'New Chat').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <aside className="side" aria-label="Sidebar">
      {/* Top action bar with Brand Logo */}
      <div className="top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo/only_logo.png"
            alt="TerraMind"
            style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em', color: 'var(--text)' }}>
            TerraMind
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button className="icon" onClick={onNewChat} aria-label="New chat" title="New chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
          <button className="icon" onClick={onToggle} aria-label="Close sidebar" title="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M9 4v16" />
            </svg>
          </button>
        </div>
      </div>

      {/* New chat row button */}
      <button className="row" onClick={onNewChat} id="new" style={{ fontWeight: 500, margin: '4px 0' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New chat
      </button>

      {/* Search chats */}
      <input
        className="search"
        placeholder="Search chats..."
        aria-label="Search chats"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Scrollable sections */}
      <div className="sidebar-scroll">
        {/* 1. Projects Section (Requirement 3: Renamed to Projects, no pre-existing projects) */}
        <div
          className={`collapsible-header ${projectsOpen ? 'open' : ''}`}
          onClick={() => setProjectsOpen(!projectsOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span>Projects ({projects.length})</span>
          </div>
          <button
            type="button"
            style={{ fontSize: '14px', padding: '0 4px', color: 'var(--muted)', fontWeight: 600 }}
            title="Create New Project"
            onClick={(e) => {
              e.stopPropagation();
              setProjectsOpen(true);
              setShowNewProjInput(!showNewProjInput);
            }}
          >
            +
          </button>
        </div>

        {projectsOpen && (
          <div className="section-items">
            {showNewProjInput && (
              <form onSubmit={handleCreateProjectSubmit} style={{ padding: '4px 4px 6px' }}>
                <input
                  type="text"
                  placeholder="Project name & press Enter..."
                  autoFocus
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12.5px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </form>
            )}

            {projects.length === 0 && !showNewProjInput ? (
              <button
                type="button"
                className="row"
                style={{ fontSize: '12.5px', color: 'var(--muted)', fontStyle: 'italic' }}
                onClick={() => setShowNewProjInput(true)}
              >
                <span>+</span>
                <span>Create first project</span>
              </button>
            ) : (
              projects.map((proj) => (
                <button
                  key={proj.id}
                  className={`row ${selectedProjectId === proj.id ? 'active' : ''}`}
                  onClick={() => onSelectProject(proj.id)}
                  title={proj.description || proj.name}
                  style={{ fontSize: '13px' }}
                >
                  <span>{proj.icon || '📁'}</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {proj.name}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* 2. AI Agents Section with New Agent Icons (Requirement 2) */}
        <div
          className={`collapsible-header ${agentsOpen ? 'open' : ''}`}
          onClick={() => setAgentsOpen(!agentsOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span>Agents ({TERRAMIND_AGENTS.length})</span>
          </div>
        </div>

        {agentsOpen && (
          <div className="section-items">
            {TERRAMIND_AGENTS.map((agent) => (
              <button
                key={agent.id}
                className={`row agent-row ${selectedAgentId === agent.id ? 'active' : ''}`}
                onClick={() => onSelectAgent(agent.id)}
                title={agent.description}
                style={{ fontSize: '13px' }}
              >
                <img
                  src={agent.icon}
                  alt={agent.name}
                  style={{
                    width: '18px',
                    height: '18px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontWeight: selectedAgentId === agent.id ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {agent.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {agent.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 3. Terraform Workspace Files Section */}
        <div
          className={`collapsible-header ${filesOpen ? 'open' : ''}`}
          onClick={() => setFilesOpen(!filesOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span>Workspace Files ({workspaceFiles.length})</span>
          </div>
        </div>

        {filesOpen && (
          <div className="section-items">
            {workspaceFiles.length === 0 ? (
              <div style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--muted)' }}>
                No .tf files yet. Deploy code to create!
              </div>
            ) : (
              workspaceFiles.map((f) => (
                <button
                  key={f.name}
                  className="row"
                  style={{ fontSize: '12.5px', fontFamily: 'monospace' }}
                  onClick={() => onSelectFile && onSelectFile(f.name)}
                  title={`Click to reference ${f.name} in chat`}
                >
                  <span>📄</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* 4. Chat History Section (Requirement 4: Persists all history properly) */}
        <div
          className={`collapsible-header ${chatsOpen ? 'open' : ''}`}
          onClick={() => setChatsOpen(!chatsOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span>Chat History ({filteredConversations.length})</span>
          </div>
          {projects.length > 0 && (
            <button
              type="button"
              style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'none' }}
              onClick={(e) => {
                e.stopPropagation();
                setGroupByProject(!groupByProject);
              }}
              title="Toggle Grouping: Date vs Project"
            >
              {groupByProject ? 'By Project' : 'By Date'}
            </button>
          )}
        </div>

        {chatsOpen && (
          <div className="section-items">
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--muted)' }}>
                {search ? 'No matching chats' : 'No chats yet. Start a conversation!'}
              </div>
            ) : groupByProject && projects.length > 0 ? (
              projects.map((proj) => {
                const projChats = filteredConversations.filter(
                  (c) => (c.project_id || '') === proj.id
                );
                if (projChats.length === 0) return null;
                return (
                  <React.Fragment key={proj.id}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', padding: '6px 8px 2px' }}>
                      {proj.icon || '📁'} {proj.name}
                    </div>
                    {projChats.map((c) => (
                      <div key={c.id} className="chat">
                        <button
                          className={`row ${activeId === c.id ? 'active' : ''}`}
                          onClick={() => onSelect(c.id)}
                          title={c.title}
                        >
                          {c.title || 'New chat'}
                        </button>
                        <button
                          className="del"
                          aria-label="Delete chat"
                          title="Delete chat"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(c.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              (() => {
                const groups: { [key: string]: Conversation[] } = {};
                filteredConversations.forEach((c) => {
                  const grp = groupDate(c.created_at);
                  if (!groups[grp]) groups[grp] = [];
                  groups[grp].push(c);
                });
                const groupOrder = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];
                return groupOrder.map((grpName) => {
                  const items = groups[grpName];
                  if (!items || items.length === 0) return null;
                  return (
                    <React.Fragment key={grpName}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', padding: '6px 8px 2px' }}>
                        {grpName}
                      </div>
                      {items.map((c) => (
                        <div key={c.id} className="chat">
                          <button
                            className={`row ${activeId === c.id ? 'active' : ''}`}
                            onClick={() => onSelect(c.id)}
                            title={c.title}
                          >
                            {c.title || 'New chat'}
                          </button>
                          <button
                            className="del"
                            aria-label="Delete chat"
                            title="Delete chat"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(c.id);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                });
              })()
            )}
          </div>
        )}
      </div>

      {/* Footer (.me) */}
      <div className="me">
        <button className="row" onClick={toggleTheme} id="theme">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
          Toggle theme
        </button>

        <button className="row" onClick={onOpenSettings}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          API Keys & Settings
        </button>

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span className="av user-av">{currentUser.username[0]?.toUpperCase() || 'U'}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.username}
              </span>
            </div>
            <button
              onClick={onLogout}
              style={{ fontSize: '12px', color: 'var(--muted)', padding: '4px 8px', borderRadius: '4px' }}
              title="Sign Out"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button className="row" onClick={onOpenAuth}>
            <span className="av">U</span>
            Sign In / SSO
          </button>
        )}
      </div>
    </aside>
  );
};
