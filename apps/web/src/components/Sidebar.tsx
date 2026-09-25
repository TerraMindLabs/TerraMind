import React, { useState } from 'react';
import { TERRAMIND_AGENTS, getAgentIcon } from './AgentSelector';
import { RailTab } from './PrimaryRail';
import { SettingsSection } from './SettingsView';

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_shared?: boolean;
  member_role?: string;
  owner_name?: string;
}

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  project_id?: string;
  agent_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface WorkspaceFile {
  name: string;
  size: number;
}

export const SETTINGS_ITEMS: Array<{ id: SettingsSection; title: string; desc: string; icon: string; logoUrl?: string }> = [
  {
    id: 'profile',
    title: 'Profile',
    desc: 'User information, name, email & avatar',
    icon: '👤',
    logoUrl: '/icons/profile.png'
  },
  {
    id: 'workspace',
    title: 'Workspace',
    desc: 'Workspace directory, default region, cloud state',
    icon: '🏢',
    logoUrl: '/icons/workspace.png'
  },
  {
    id: 'keys',
    title: 'Cloud API Keys',
    desc: 'Google Gemini, OpenAI, Anthropic credentials',
    icon: '🔑',
    logoUrl: '/icons/api-keys.png'
  },
  {
    id: 'ollama',
    title: 'Ollama Local Models',
    desc: 'Offline LLMs, pull models & daemon control',
    icon: '🦙'
  },
  {
    id: 'bedrock',
    title: 'AWS Bedrock',
    desc: 'Amazon Bedrock Claude & Titan foundation models',
    icon: '🟧',
    logoUrl: '/icons/aws.png'
  },
  {
    id: 'azure',
    title: 'Azure AI Foundry',
    desc: 'Azure OpenAI & Foundry enterprise endpoints',
    icon: '🔷',
    logoUrl: '/icons/azure.png'
  },
  {
    id: 'oci',
    title: 'OCI GenAI',
    desc: 'Oracle Cloud Infrastructure Generative AI',
    icon: '🔴',
    logoUrl: '/icons/oci.png'
  },
  {
    id: 'mcp',
    title: 'Model Context Protocol (MCP)',
    desc: 'Configure external tool servers, status & agent abilities',
    icon: '🔌'
  }
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  // Rail navigation integration
  railTab?: RailTab;
  onSelectRailTab?: (tab: RailTab) => void;
  settingsSection?: SettingsSection;
  onSelectSettingsSection?: (section: SettingsSection) => void;
  // Agents
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  // Projects (Requirement 3: Renamed to Projects, no pre-existing projects)
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description: string, icon: string) => void;
  onDeleteProject?: (id: string) => void;
  onOpenShareProject?: (project: Project) => void;
  // Files
  workspaceFiles: WorkspaceFile[];
  onSelectFile?: (filename: string) => void;
  // Settings & Auth
  onOpenSettings: () => void;
  currentUser?: { username: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  toggleTheme?: () => void;
  theme?: 'light' | 'dark';
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
  railTab = 'chats',
  onSelectRailTab,
  settingsSection = 'profile',
  onSelectSettingsSection,
  selectedAgentId,
  onSelectAgent,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onOpenShareProject,
  workspaceFiles,
  onSelectFile,
  onOpenSettings,
  currentUser,
  onOpenAuth,
  onLogout,
  toggleTheme,
  theme = 'light'
}) => {
  const [search, setSearch] = useState('');
  const [groupByProject, setGroupByProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleProjectExpand = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjects((prev) => ({ ...prev, [projId]: !prev[projId] }));
  };

  // Collapsible section state
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [filesOpen, setFilesOpen] = useState(workspaceFiles.length > 0);
  const [chatsOpen, setChatsOpen] = useState(conversations.length > 0);

  // Project deletion confirmation state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

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
      {railTab === 'settings' ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="nested-sidebar-header">
            <button
              type="button"
              className="nested-back-btn"
              onClick={() => onSelectRailTab?.('chats')}
              title="Back to Conversations"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Settings</span>
            </button>
            <button className="icon" onClick={onToggle} aria-label="Close sidebar" title="Toggle sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path d="M9 4v16" />
              </svg>
            </button>
          </div>

          <div className="sidebar-scroll" style={{ padding: '4px 8px' }}>
            {SETTINGS_ITEMS.map((item) => {
              const isActive = settingsSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nested-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectSettingsSection?.(item.id)}
                >
                  <span className="nested-nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.title}
                        style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      item.icon
                    )}
                  </span>
                  <div className="nested-nav-content">
                    <span className="nested-nav-title">{item.title}</span>
                    <span className="nested-nav-desc">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : railTab === 'projects' ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="nested-sidebar-header">
            <button
              type="button"
              className="nested-back-btn"
              onClick={() => onSelectRailTab?.('chats')}
              title="Back to Conversations"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Workspaces</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="icon"
                onClick={() => setShowNewProjInput(!showNewProjInput)}
                title="Create New Project Workspace"
                style={{ fontSize: '16px', fontWeight: 600, color: 'var(--muted)' }}
              >
                +
              </button>
              <button className="icon" onClick={onToggle} aria-label="Close sidebar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="M9 4v16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="sidebar-scroll" style={{ padding: '4px 8px' }}>
            {showNewProjInput && (
              <form onSubmit={handleCreateProjectSubmit} style={{ padding: '4px 6px 10px' }}>
                <input
                  type="text"
                  placeholder="Workspace name & Enter..."
                  autoFocus
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '12.5px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </form>
            )}

            {/* Global Workspace */}
            <button
              type="button"
              className={`nested-nav-item ${selectedProjectId === '' ? 'active' : ''}`}
              onClick={() => {
                onSelectProject('');
                onSelectRailTab?.('chats');
              }}
            >
              <span className="nested-nav-icon">🌐</span>
              <div className="nested-nav-content">
                <span className="nested-nav-title">Global Workspace</span>
                <span className="nested-nav-desc">Quick chats • No project segregation</span>
              </div>
            </button>

            {/* User Workspaces */}
            {projects.map((proj) => (
              <div key={proj.id} style={{ position: 'relative', width: '100%' }}>
                <button
                  type="button"
                  className={`nested-nav-item ${selectedProjectId === proj.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelectProject(proj.id);
                    onSelectRailTab?.('chats');
                  }}
                >
                  <span className="nested-nav-icon">{proj.icon || '📁'}</span>
                  <div className="nested-nav-content">
                    <span className="nested-nav-title">{proj.name}</span>
                    <span className="nested-nav-desc">{proj.description || 'Active infrastructure workspace'}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : railTab === 'agents' ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="nested-sidebar-header">
            <button
              type="button"
              className="nested-back-btn"
              onClick={() => onSelectRailTab?.('chats')}
              title="Back to Conversations"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>AI Architects</span>
            </button>
            <button className="icon" onClick={onToggle} aria-label="Close sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path d="M9 4v16" />
              </svg>
            </button>
          </div>

          <div className="sidebar-scroll" style={{ padding: '4px 8px' }}>
            {TERRAMIND_AGENTS.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  className={`nested-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectAgent(agent.id);
                    onSelectRailTab?.('chats');
                  }}
                >
                  <span className="nested-nav-icon">
                    <img
                      src={getAgentIcon(agent, theme)}
                      alt={agent.name}
                      style={{ width: '18px', height: '18px', objectFit: 'contain', verticalAlign: 'middle' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </span>
                  <div className="nested-nav-content">
                    <span className="nested-nav-title">{agent.name}</span>
                    <span className="nested-nav-desc">{agent.role}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
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
                Conversations
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
              <form onSubmit={handleCreateProjectSubmit} style={{ padding: '4px 14px 6px' }}>
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

            {/* Global Workspace Option (Quick Chat • No Project Segregation) */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', marginBottom: '2px' }}>
              <button
                className={`row project-row ${selectedProjectId === '' ? 'active' : ''}`}
                onClick={() => onSelectProject('')}
                title="Global workspace for quick chats without project segregation"
                style={{ fontSize: '13px' }}
              >
                <span style={{ fontSize: '14px' }}>🌐</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Global Workspace
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: selectedProjectId === '' ? 'rgba(59, 130, 246, 0.2)' : 'var(--hover)',
                    color: selectedProjectId === '' ? '#3b82f6' : 'var(--muted)',
                    fontWeight: 600
                  }}
                >
                  Quick Chat
                </span>
              </button>
            </div>

            {projects.length === 0 && !showNewProjInput ? (
              <button
                type="button"
                className="row"
                style={{ fontSize: '12.5px', color: 'var(--muted)', fontStyle: 'italic', paddingLeft: '24px' }}
                onClick={() => setShowNewProjInput(true)}
              >
                <span>+</span>
                <span>Create first project</span>
              </button>
            ) : (
              projects.map((proj) => {
                const projChats = conversations.filter((c) => (c.project_id || '') === proj.id);
                const isExpanded = Boolean(expandedProjects[proj.id]);
                const isSelected = selectedProjectId === proj.id;

                return (
                  <div key={proj.id} style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '2px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                      {/* Expand / Collapse toggle */}
                      <button
                        type="button"
                        onClick={(e) => toggleProjectExpand(proj.id, e)}
                        style={{
                          position: 'absolute',
                          left: '4px',
                          zIndex: 2,
                          padding: '4px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          display: 'grid',
                          placeItems: 'center'
                        }}
                        title={isExpanded ? 'Collapse project chats' : 'Expand project chats'}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>

                      <button
                        className={`row project-row ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          onSelectProject(proj.id);
                          setExpandedProjects((prev) => ({ ...prev, [proj.id]: true }));
                        }}
                        title={proj.description || proj.name}
                        style={{ fontSize: '13px', paddingLeft: '22px', paddingRight: '56px' }}
                      >
                        <span style={{ fontSize: '14px' }}>{proj.icon || '📁'}</span>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proj.name}
                        </span>
                        {projChats.length > 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'var(--hover)',
                              color: 'var(--muted)',
                              marginRight: '2px'
                            }}
                          >
                            {projChats.length}
                          </span>
                        )}
                        {proj.is_shared && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#3b82f6',
                              fontWeight: 600,
                              marginLeft: '2px'
                            }}
                            title={`Shared workspace (owned by ${proj.owner_name || 'team'})`}
                          >
                            Shared
                          </span>
                        )}
                      </button>

                      <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {onOpenShareProject && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenShareProject(proj);
                            }}
                            title="Share workspace with collaborators"
                            style={{
                              padding: '4px',
                              borderRadius: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--muted)',
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                              opacity: 0.6,
                              transition: 'opacity 0.15s ease'
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(proj);
                          }}
                          title="Delete project workspace"
                          style={{
                            padding: '4px',
                            borderRadius: '4px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            opacity: 0.6,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '1';
                            (e.currentTarget as HTMLElement).style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '0.6';
                            (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Nested project chats list */}
                    {isExpanded && (
                      <div
                        style={{
                          paddingLeft: '16px',
                          borderLeft: '1px dashed var(--border)',
                          marginLeft: '14px',
                          marginTop: '2px',
                          marginBottom: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px'
                        }}
                      >
                        {projChats.length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--muted)', padding: '4px 8px', fontStyle: 'italic' }}>
                            No chats in this project yet
                          </div>
                        ) : (
                          projChats.map((c) => {
                            const convoAgent = TERRAMIND_AGENTS.find((a) => a.id === c.agent_id) || TERRAMIND_AGENTS[0];
                            return (
                              <div key={c.id} className="chat" style={{ margin: '1px 0' }}>
                                <button
                                  className={`row ${activeId === c.id ? 'active' : ''}`}
                                  onClick={() => onSelect(c.id)}
                                  title={`${c.title || 'New chat'} (${convoAgent.name})`}
                                  style={{ fontSize: '12px', padding: '4px 8px', gap: '6px' }}
                                >
                                  <img
                                    src={getAgentIcon(convoAgent, theme)}
                                    alt={convoAgent.name}
                                    style={{ width: '13px', height: '13px', objectFit: 'contain', borderRadius: '3px', flexShrink: 0 }}
                                  />
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.title || 'New chat'}
                                  </span>
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
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
              <div className="sidebar-empty-state">
                No workspace files yet
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
              <div className="sidebar-empty-state">
                {search ? 'No matching chats' : 'No chat history yet'}
              </div>
            ) : groupByProject && projects.length > 0 ? (
              projects.map((proj) => {
                const projChats = filteredConversations.filter(
                  (c) => (c.project_id || '') === proj.id
                );
                if (projChats.length === 0) return null;
                return (
                  <React.Fragment key={proj.id}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', padding: '6px 14px 2px' }}>
                      {proj.icon || '📁'} {proj.name}
                    </div>
                    {projChats.map((c) => {
                      const convoAgent = TERRAMIND_AGENTS.find((a) => a.id === c.agent_id) || TERRAMIND_AGENTS[0];
                      return (
                        <div key={c.id} className="chat">
                          <button
                            className={`row ${activeId === c.id ? 'active' : ''}`}
                            onClick={() => onSelect(c.id)}
                            title={`${c.title || 'New chat'} (${convoAgent.name})`}
                            style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
                          >
                            <img
                              src={getAgentIcon(convoAgent, theme)}
                              alt={convoAgent.name}
                              style={{ width: '15px', height: '15px', objectFit: 'contain', borderRadius: '3px', flexShrink: 0, opacity: 0.9 }}
                            />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.title || 'New chat'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: 'var(--hover)',
                                color: 'var(--muted)',
                                flexShrink: 0,
                                fontWeight: 500
                              }}
                            >
                              {convoAgent.name.split(' ')[0]}
                            </span>
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
                      );
                    })}
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
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', padding: '6px 14px 2px' }}>
                        {grpName}
                      </div>
                      {items.map((c) => {
                        const convoAgent = TERRAMIND_AGENTS.find((a) => a.id === c.agent_id) || TERRAMIND_AGENTS[0];
                        return (
                          <div key={c.id} className="chat">
                            <button
                              className={`row ${activeId === c.id ? 'active' : ''}`}
                              onClick={() => onSelect(c.id)}
                              title={`${c.title || 'New chat'} (${convoAgent.name})`}
                              style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
                            >
                              <img
                                src={getAgentIcon(convoAgent, theme)}
                                alt={convoAgent.name}
                                style={{ width: '15px', height: '15px', objectFit: 'contain', borderRadius: '3px', flexShrink: 0, opacity: 0.9 }}
                              />
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.title || 'New chat'}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: 'var(--hover)',
                                  color: 'var(--muted)',
                                  flexShrink: 0,
                                  fontWeight: 500
                                }}
                              >
                                {convoAgent.name.split(' ')[0]}
                              </span>
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
                        );
                      })}
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
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '6px' }}>
          <button className="row" onClick={onOpenSettings} id="settings-btn" style={{ flex: 1, margin: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle theme"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--hover)',
                cursor: 'pointer',
                fontSize: '15px',
                flexShrink: 0
              }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          )}
        </div>

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px 14px' }}>
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
      </>
      )}

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="modal-backdrop" onClick={() => setProjectToDelete(null)} style={{ zIndex: 120 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '22px' }}>
            <div className="modal-header" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <strong style={{ fontSize: '15px', color: 'var(--text)' }}>Delete Project</strong>
              </div>
              <button className="close-btn" onClick={() => setProjectToDelete(null)} aria-label="Close">
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text)', marginBottom: '12px', lineHeight: 1.5 }}>
              Are you sure you want to delete this project?
            </p>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--hover)',
                border: '1px solid var(--border)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>{projectToDelete.icon || '📁'}</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--text)' }}>{projectToDelete.name}</strong>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '18px', lineHeight: 1.4 }}>
              This will permanently delete the project workspace and remove all associated configurations. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setProjectToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease'
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                onClick={() => {
                  if (onDeleteProject) onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
