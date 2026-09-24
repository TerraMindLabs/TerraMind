import React, { useState, useEffect, useRef } from 'react';
import { useChatStream } from './hooks/useChatStream';
import { Sidebar, Conversation, Project, WorkspaceFile } from './components/Sidebar';
import { TERRAMIND_AGENTS } from './components/AgentSelector';
import { ChatMessage } from './components/ChatMessage';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

const AGENT_CHIPS: Record<string, string[]> = {
  'agent_tf-devops-expert': [
    'Build an AWS VPC with subnets and NAT gateway',
    'Generate an encrypted S3 bucket with lifecycle rules',
    'Create an AWS RDS PostgreSQL multi-AZ database',
    'Set up an AWS EKS cluster with managed node groups'
  ],
  'agent_finops-cost-optimizer': [
    'Compare monthly costs for Kubernetes on AWS vs GCP vs Azure',
    'Audit Terraform code for Graviton3 & Spot savings',
    'Recommend compute rightsizing and idle resource cleanup',
    'Analyze egress transfer and storage tiering savings'
  ],
  'agent_k8s-gitops-architect': [
    'Create production Deployment with HPA and probes',
    'Design ArgoCD ApplicationSet for multi-cluster sync',
    'Generate secure Ingress with TLS and rate limiting',
    'Set up NetworkPolicies for microservice isolation'
  ],
  'agent_cicd-pipeline-engineer': [
    'Create GitHub Actions workflow with AWS OIDC & tfsec',
    'Build GitLab CI pipeline with speculative terraform plan',
    'Set up automated semantic release & changelog pipeline',
    'Configure automated drift detection with Slack alerts'
  ]
};

function App() {
  const {
    messages,
    sendMessage,
    isGenerating,
    conversationId,
    loadConversation,
    startNewChat
  } = useChatStream();

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('agent_tf-devops-expert');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);

  const [provider, setProvider] = useState<'ollama' | 'cloud'>('ollama');
  const [model, setModel] = useState('');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [cloudModels, setCloudModels] = useState<string[]>([
    'gemini-2.5-flash',
    'gemini-1.5-pro',
    'gpt-4o',
    'gpt-4o-mini',
    'claude-3-5-sonnet-20241022'
  ]);
  const [ollamaOnline, setOllamaOnline] = useState(false);

  // Requirement 1: Mandatory Authentication to Chat
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(() => {
    try {
      const stored = localStorage.getItem('tm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tm_theme') as 'light' | 'dark') || 'light';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Close model menu on outside click
  useEffect(() => {
    const handleDocClick = () => setMenuOpen(false);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Fetch projects (Requirement 3)
  const refreshProjects = async () => {
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.id) headers['x-user-id'] = currentUser.id;
      const res = await fetch('/api/projects', { headers });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        if (data.projects && data.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching projects:', e);
    }
  };

  // Fetch workspace files
  const refreshWorkspaceFiles = async () => {
    try {
      const res = await fetch('/api/workspace');
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setWorkspaceFiles(data.files);
        }
      }
    } catch (e) {
      console.error('Error fetching workspace files:', e);
    }
  };

  // Fetch conversations (Requirement 4: Persists all history properly)
  const refreshConversations = async () => {
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.id) headers['x-user-id'] = currentUser.id;
      const res = await fetch('/api/conversations', { headers });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error('Error fetching conversations:', e);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setOllamaOnline(data.ollamaOnline);
        setLocalModels(data.localModels || []);
        if (data.cloudModels && data.cloudModels.length > 0) {
          setCloudModels(data.cloudModels);
        }

        // Set default model based on availability
        if (provider === 'ollama') {
          if (data.localModels && data.localModels.length > 0) {
            setModel(data.localModels[0]);
          } else if (data.cloudModels && data.cloudModels.length > 0) {
            setProvider('cloud');
            setModel(data.cloudModels[0]);
          }
        } else if (!model) {
          setModel(data.cloudModels?.[0] || 'gemini-2.5-flash');
        }
      }
    } catch (e) {
      console.error('Error fetching models:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshProjects();
      refreshConversations();
    }
    refreshWorkspaceFiles();
    fetchModels();
  }, [currentUser]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const fitTextarea = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
  };

  const handleSend = (textToSend?: string) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    const text = textToSend || input;
    if (!text.trim() || isGenerating) return;

    sendMessage(
      text,
      provider,
      model,
      selectedAgentId,
      selectedProjectId,
      () => {
        refreshConversations();
        refreshWorkspaceFiles();
      }
    );

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Refresh immediately to capture newly generated conversation in sidebar
    setTimeout(() => {
      refreshConversations();
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.id) headers['x-user-id'] = currentUser.id;
      await fetch(`/api/conversations/${id}`, { method: 'DELETE', headers });
      if (conversationId === id) {
        startNewChat();
      }
      refreshConversations();
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    startNewChat();
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    startNewChat();
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleCreateProject = async (name: string, description: string, icon: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.id) headers['x-user-id'] = currentUser.id;
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description, icon })
      });
      if (res.ok) {
        const newProj = await res.json();
        setProjects((prev) => [...prev, newProj]);
        setSelectedProjectId(newProj.id);
        startNewChat();
      }
    } catch (e) {
      console.error('Failed to create project:', e);
    }
  };

  const handleSelectModel = (newProvider: 'ollama' | 'cloud', newModel: string) => {
    setProvider(newProvider);
    setModel(newModel);
    setMenuOpen(false);
  };

  const handleToggleProvider = () => {
    if (provider === 'ollama') {
      setProvider('cloud');
      if (!model || localModels.includes(model)) {
        setModel(cloudModels[0] || 'gemini-2.5-flash');
      }
    } else {
      setProvider('ollama');
      if (localModels.length > 0) {
        setModel(localModels[0]);
      }
    }
  };

  const currentAgent = TERRAMIND_AGENTS.find((a) => a.id === selectedAgentId) || TERRAMIND_AGENTS[0];
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const currentChips = AGENT_CHIPS[selectedAgentId] || [
    'Explain a concept simply',
    'Write a professional email',
    'Debug my code',
    'Plan a weekend trip'
  ];

  const modelDisplayName = model
    ? model.replace('gemini-', 'Gemini ').replace('gpt-', 'GPT-').replace('claude-', 'Claude ')
    : provider === 'ollama'
    ? 'Local Ollama'
    : 'Select Model';

  return (
    <div className={`app ${sidebarOpen ? '' : 'closed'}`} id="app">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        activeId={conversationId}
        onSelect={(id) => {
          loadConversation(id);
          if (window.innerWidth <= 768) setSidebarOpen(false);
        }}
        onNewChat={() => {
          startNewChat();
          if (window.innerWidth <= 768) setSidebarOpen(false);
          textareaRef.current?.focus();
        }}
        onDelete={handleDeleteConversation}
        // Agents
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
        // Projects (Requirement 3)
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        // Files
        workspaceFiles={workspaceFiles}
        onSelectFile={(filename) => {
          setInput((prev) => (prev ? `${prev}\nReview file: ${filename}` : `Review and explain file: ${filename}`));
          textareaRef.current?.focus();
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={() => {
          localStorage.removeItem('tm_user');
          localStorage.removeItem('tm_token');
          setCurrentUser(null);
          setConversations([]);
          startNewChat();
        }}
        toggleTheme={toggleTheme}
      />

      {/* Scrim for mobile */}
      <div className="scrim" id="scrim" onClick={() => setSidebarOpen(false)}></div>

      {/* Main chat window */}
      <main className="main">
        {/* Top bar */}
        <div className="bar">
          <div className="bar-left">
            {!sidebarOpen && (
              <button
                className="icon"
                id="open"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="M9 4v16" />
                </svg>
              </button>
            )}

            <button
              className="model"
              id="mbtn"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              title="Change model"
            >
              <span>{modelDisplayName}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Model selection dropdown menu */}
            <div className={`menu ${menuOpen ? 'open' : ''}`} id="menu" onClick={(e) => e.stopPropagation()}>
              <div className="menu-section-title">Local Models (Ollama)</div>
              {localModels.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--muted)' }}>
                  {ollamaOnline ? 'No local models downloaded (`ollama pull <model>`)' : 'Ollama daemon is offline'}
                </div>
              ) : (
                localModels.map((lm) => (
                  <button
                    key={lm}
                    className={provider === 'ollama' && model === lm ? 'active-model' : ''}
                    onClick={() => handleSelectModel('ollama', lm)}
                  >
                    {lm}
                    <small>Local model • private & offline</small>
                  </button>
                ))
              )}

              <div className="menu-section-title" style={{ marginTop: '6px' }}>Cloud AI Models</div>
              {cloudModels.map((cm) => (
                <button
                  key={cm}
                  className={provider === 'cloud' && model === cm ? 'active-model' : ''}
                  onClick={() => handleSelectModel('cloud', cm)}
                >
                  {cm.replace('gemini-', 'Gemini ').replace('gpt-', 'GPT-').replace('claude-', 'Claude ')}
                  <small>
                    {cm.includes('flash') || cm.includes('mini') ? 'Fast, everyday responses' : 'Advanced reasoning'}
                  </small>
                </button>
              ))}

              <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)' }}
                >
                  <span>⚙️</span> Manage API Keys
                </button>
              </div>
            </div>
          </div>

          {/* Right badges: Active Project, Active Agent, and Ollama status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentProject && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'var(--user)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text)'
                }}
                title={`Active Project: ${currentProject.name}`}
              >
                <span>{currentProject.icon || '📁'}</span>
                <span style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentProject.name}
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                borderRadius: '12px',
                background: 'var(--user)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text)'
              }}
              title={`Active Agent: ${currentAgent.name}`}
            >
              <img
                src={currentAgent.icon}
                alt={currentAgent.name}
                style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '3px' }}
              />
              <span style={{ display: window.innerWidth > 600 ? 'inline' : 'none' }}>{currentAgent.name}</span>
            </div>
          </div>
        </div>

        {/* Scrollable messages container */}
        <div className="scroll" id="scroll">
          <div className="col" id="msgs">
            {messages.length === 0 ? (
              <div className="empty">
                <img
                  src={currentAgent.icon}
                  alt={currentAgent.name}
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '10px' }}
                />
                <h1 style={{ fontSize: '24px' }}>What can {currentAgent.name} help with?</h1>
                <div className="chips">
                  {currentChips.map((chipText) => (
                    <button key={chipText} onClick={() => handleSend(chipText)}>
                      {chipText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <ChatMessage
                  key={idx}
                  role={m.role}
                  content={m.content}
                  agentEmoji={currentAgent.emoji}
                  agentIcon={currentAgent.icon}
                  isStreaming={isGenerating && idx === messages.length - 1 && m.role === 'assistant'}
                  onRegenerate={() => {
                    const lastUserMsg = [...messages].reverse().find((msg) => msg.role === 'user');
                    if (lastUserMsg) {
                      handleSend(lastUserMsg.content);
                    }
                  }}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer - Featuring Local Model / API Selector inside input section */}
        <div className="comp">
          <div className="box">
            <textarea
              ref={textareaRef}
              id="in"
              rows={1}
              placeholder={
                currentUser
                  ? `Message ${currentAgent.name}${currentProject ? ` in ${currentProject.name}` : ''}...`
                  : 'Please log in or sign up to chat...'
              }
              aria-label="Message"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                fitTextarea();
              }}
              onKeyDown={handleKeyDown}
            />

            {/* Bottom action row inside the input section */}
            <div className="box-bottom-bar">
              <div className="composer-left-actions">
                {/* Model Selector Pill inside the input box */}
                <button
                  type="button"
                  className="composer-pill-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  title="Select AI Model"
                >
                  <span>{provider === 'ollama' ? '🖥️ Local' : '☁️ Cloud'}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>{modelDisplayName}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Quick Toggle between Local and Cloud */}
                <button
                  type="button"
                  className="composer-pill-btn"
                  onClick={handleToggleProvider}
                  title="Switch between Local Ollama and Cloud AI"
                >
                  {provider === 'ollama' ? 'Use Cloud ☁️' : 'Use Ollama 🖥️'}
                </button>

                {/* Status Dot */}
                <div
                  title={ollamaOnline ? 'Ollama: Online (11434)' : 'Ollama: Offline'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: 'var(--muted)',
                    marginLeft: '2px'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: ollamaOnline ? 'var(--green)' : 'var(--muted)'
                    }}
                  />
                </div>

                {/* Keys button */}
                <button
                  type="button"
                  className="composer-pill-btn"
                  onClick={() => setSettingsOpen(true)}
                  title="Configure Cloud API Keys"
                  style={{ padding: '3px 7px' }}
                >
                  ⚙️
                </button>
              </div>

              {/* Circular Send Button */}
              <button
                className="send"
                id="send"
                disabled={!input.trim() || isGenerating}
                onClick={() => handleSend()}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="note">AI can make mistakes. Check important information.</div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => fetchModels()}
      />

      {/* Auth Modal (Requirement 1: Mandatory login before chatting) */}
      <AuthModal
        isOpen={authOpen || !currentUser}
        isMandatory={!currentUser}
        onSuccess={(user) => {
          setCurrentUser(user);
          setAuthOpen(false);
        }}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
}

export default App;
