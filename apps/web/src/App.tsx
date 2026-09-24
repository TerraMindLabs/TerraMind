import React, { useState, useEffect, useRef } from 'react';
import { useChatStream } from './hooks/useChatStream';
import { Sidebar, Conversation, Project, WorkspaceFile } from './components/Sidebar';
import { TERRAMIND_AGENTS, getAgentIcon } from './components/AgentSelector';
import { ChatMessage } from './components/ChatMessage';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { ShareProjectModal } from './components/ShareProjectModal';

interface SuggestionCard {
  icon: string;
  tag: string;
  title: string;
  desc: string;
  prompt: string;
}

const AGENT_CARDS: Record<string, SuggestionCard[]> = {
  'agent_tf-devops-expert': [
    {
      icon: '🌐',
      tag: 'AWS VPC',
      title: 'Production VPC Network',
      desc: 'Multi-AZ subnets, NAT gateway, route tables & IGW',
      prompt: 'Build an AWS VPC with public and private subnets, NAT gateway, and route tables in Terraform'
    },
    {
      icon: '🪣',
      tag: 'AWS S3',
      title: 'Secure S3 Bucket',
      desc: 'AES-256 encryption, public block & lifecycle policies',
      prompt: 'Generate an encrypted S3 bucket with versioning, lifecycle rules, and public access blocks'
    },
    {
      icon: '🗄️',
      tag: 'AWS RDS',
      title: 'Multi-AZ PostgreSQL',
      desc: 'High-availability RDS database with KMS encryption',
      prompt: 'Create an AWS RDS PostgreSQL multi-AZ database instance with automated backups and KMS encryption'
    },
    {
      icon: '☸️',
      tag: 'AWS EKS',
      title: 'Managed EKS Cluster',
      desc: 'Production Kubernetes with OIDC and managed node groups',
      prompt: 'Set up an AWS EKS cluster with managed node groups, OIDC provider, and IAM roles'
    }
  ],
  'agent_finops-cost-optimizer': [
    {
      icon: '☁️',
      tag: 'Multi-Cloud',
      title: 'K8s Cost Comparison',
      desc: 'Side-by-side pricing breakdown: AWS vs GCP vs Azure',
      prompt: 'Compare monthly costs for Kubernetes workloads on AWS vs GCP vs Azure'
    },
    {
      icon: '⚡',
      tag: 'Compute',
      title: 'Graviton & Spot Audit',
      desc: 'Identify workloads eligible for 30-70% Spot savings',
      prompt: 'Audit Terraform code for Graviton3 and Spot instance cost savings opportunities'
    },
    {
      icon: '📉',
      tag: 'Rightsizing',
      title: 'Idle Resource Cleanup',
      desc: 'Spot unattached EBS volumes, idle NATs & over-provisioned nodes',
      prompt: 'Recommend compute rightsizing and identify idle resources to safely terminate'
    },
    {
      icon: '💾',
      tag: 'Storage',
      title: 'Storage & Egress Optimization',
      desc: 'Save on S3 Glacier lifecycle transitions & egress routing',
      prompt: 'Analyze data egress transfer and recommend storage tiering policies to reduce monthly bill'
    }
  ],
  'agent_k8s-gitops-architect': [
    {
      icon: '📦',
      tag: 'Workloads',
      title: 'Production Deployment',
      desc: 'Hardened manifests with HPA, PDB & readiness probes',
      prompt: 'Create a production Kubernetes Deployment manifest with HPA, PodDisruptionBudget, and probes'
    },
    {
      icon: '🐙',
      tag: 'GitOps',
      title: 'ArgoCD ApplicationSet',
      desc: 'Multi-cluster progressive delivery and sync policies',
      prompt: 'Design an ArgoCD ApplicationSet for multi-cluster progressive GitOps deployment'
    },
    {
      icon: '🛡️',
      tag: 'Ingress',
      title: 'Secure Ingress & TLS',
      desc: 'NGINX Ingress controller with automated cert-manager TLS',
      prompt: 'Generate a secure Ingress manifest with cert-manager automated TLS and rate limiting'
    },
    {
      icon: '📊',
      tag: 'Helm',
      title: 'Standardized Helm Chart',
      desc: 'Configurable values.yaml, templates & schema validation',
      prompt: 'Generate a production-ready Helm chart for a cloud microservice with values.yaml templates'
    }
  ],
  'agent_cicd-pipeline-engineer': [
    {
      icon: '🚀',
      tag: 'GitHub Actions',
      title: 'Automated CI/CD Pipeline',
      desc: 'Lint, unit test, build artifacts & production deployment',
      prompt: 'Write a full GitHub Actions CI/CD pipeline workflow with linting, unit tests, artifact builds, and production deployment'
    },
    {
      icon: '🦊',
      tag: 'GitLab CI',
      title: 'Multi-Stage Deployment',
      desc: 'Pipeline stages, caching, staging deploy & manual gates',
      prompt: 'Create a .gitlab-ci.yml multi-stage pipeline with test coverage, automated staging deploy, and manual approval gates for production'
    },
    {
      icon: '📦',
      tag: 'Release Automation',
      title: 'Semantic Release & Versioning',
      desc: 'Automated conventional commits, changelogs & release tags',
      prompt: 'Set up an automated release workflow using Semantic Release to generate changelogs, bump semver versions, and publish packages'
    },
    {
      icon: '🔄',
      tag: 'Deploy Strategies',
      title: 'Blue/Green & Rollbacks',
      desc: 'Zero-downtime deployment strategy with health checks',
      prompt: 'Design a continuous delivery rollout pipeline implementing blue/green deployments with automated health checks and instant rollback'
    }
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
  const [cloudModels, setCloudModels] = useState<string[]>([]);
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
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
        setOllamaOnline(Boolean(data.ollamaOnline));
        const locals: string[] = data.localModels || [];
        const clouds: string[] = data.cloudModels || [];
        setLocalModels(locals);
        setCloudModels(clouds);

        // Set default model based on availability
        if (locals.length > 0) {
          if (provider === 'ollama') {
            if (!model || !locals.includes(model)) {
              setModel(locals[0]);
            }
          } else if (clouds.length === 0) {
            setProvider('ollama');
            setModel(locals[0]);
          }
        } else if (clouds.length > 0) {
          setProvider('cloud');
          if (!model || !clouds.includes(model)) {
            setModel(clouds[0]);
          }
        } else {
          // No models available at all (Offline)
          setModel('');
        }
      }
    } catch (e) {
      console.error('Error fetching models:', e);
      setOllamaOnline(false);
      setLocalModels([]);
      setCloudModels([]);
      setModel('');
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
    const scrollH = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 24), 180)}px`;
  };

  // Re-fit textarea on input change
  useEffect(() => {
    fitTextarea();
  }, [input]);

  const handleSend = (textToSend?: string) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    if (!localModels.length && !cloudModels.length) {
      setSettingsOpen(true);
      return;
    }

    const text = textToSend || input;
    if (!text.trim() || isGenerating) return;

    let effectiveProvider = provider;
    let effectiveModel = model;

    // If local ollama is selected but offline, automatically fall back to cloud AI
    if (effectiveProvider === 'ollama' && !ollamaOnline && cloudModels.length > 0) {
      effectiveProvider = 'cloud';
      if (!cloudModels.includes(effectiveModel)) {
        effectiveModel = cloudModels[0];
      }
    }

    sendMessage(
      text,
      effectiveProvider,
      effectiveModel,
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

  const handleDeleteProject = async (projectId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.id) headers['x-user-id'] = currentUser.id;
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (selectedProjectId === projectId) {
          setSelectedProjectId('');
          startNewChat();
        }
      }
    } catch (e) {
      console.error('Failed to delete project:', e);
    }
  };

  const handleSelectModel = (newProvider: 'ollama' | 'cloud', newModel: string) => {
    setProvider(newProvider);
    setModel(newModel);
    setMenuOpen(false);
  };

  const handleToggleProvider = () => {
    if (provider === 'ollama') {
      if (cloudModels.length > 0) {
        setProvider('cloud');
        if (!model || localModels.includes(model)) {
          setModel(cloudModels[0]);
        }
      } else {
        setSettingsOpen(true);
      }
    } else {
      if (localModels.length > 0) {
        setProvider('ollama');
        if (!model || cloudModels.includes(model)) {
          setModel(localModels[0]);
        }
      } else {
        setProvider('ollama');
      }
    }
  };

  const currentAgent = TERRAMIND_AGENTS.find((a) => a.id === selectedAgentId) || TERRAMIND_AGENTS[0];
  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const currentCards = AGENT_CARDS[selectedAgentId] || AGENT_CARDS['agent_tf-devops-expert'];

  const hasAnyModels = localModels.length > 0 || cloudModels.length > 0;

  const modelDisplayName = !hasAnyModels
    ? 'Offline'
    : model
    ? model.replace('gemini-', 'Gemini ').replace('gpt-', 'GPT-').replace('claude-', 'Claude ')
    : provider === 'ollama' && localModels.length > 0
    ? localModels[0]
    : cloudModels.length > 0
    ? cloudModels[0].replace('gemini-', 'Gemini ').replace('gpt-', 'GPT-').replace('claude-', 'Claude ')
    : 'Offline';

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
        onDeleteProject={handleDeleteProject}
        onOpenShareProject={(proj) => {
          setSharingProject(proj);
          setShareModalOpen(true);
        }}
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
        theme={theme}
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

            {!hasAnyModels ? (
              <div
                className="status-pill offline"
                id="mbtn"
                onClick={() => setSettingsOpen(true)}
                title="All AI models are offline. Click to configure API keys."
              >
                <span className="status-dot offline-dot" />
                <span>Offline</span>
                <span className="status-pill-hint">Configure ⚙️</span>
              </div>
            ) : (
              <button
                className="model"
                id="mbtn"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                title="Change model"
              >
                <span className="status-dot online-dot" />
                <span>{modelDisplayName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            )}

            {/* Model selection dropdown menu */}
            <div className={`menu ${menuOpen ? 'open' : ''}`} id="menu" onClick={(e) => e.stopPropagation()}>
              <div className="menu-section-title">Local Models (Ollama)</div>
              {localModels.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--muted)' }}>
                  {ollamaOnline ? 'No local models downloaded (`ollama pull <model>`)' : 'Offline'}
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
              {cloudModels.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--muted)' }}>
                  Offline (No API keys configured)
                </div>
              ) : (
                cloudModels.map((cm) => (
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
                ))
              )}

              <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent, #6366f1)' }}
                >
                  <span>⚙️</span> Manage API Keys
                </button>
              </div>
            </div>
          </div>

          {/* Unified Breadcrumb Nav (Project / Agent) */}
          <div className="breadcrumb-nav">
            {currentProject && (
              <>
                <span
                  className="breadcrumb-item"
                  title={`Active Workspace: ${currentProject.name} (Click to share)`}
                  onClick={() => {
                    setSharingProject(currentProject);
                    setShareModalOpen(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '13px' }}>{currentProject.icon || '📁'}</span>
                  <span className="breadcrumb-text">{currentProject.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '4px' }}>👥</span>
                </span>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
            <span className="breadcrumb-item active" title={`Active Agent: ${currentAgent.name} (${currentAgent.role})`}>
              <img
                src={getAgentIcon(currentAgent, theme)}
                alt={currentAgent.name}
                style={{ width: '15px', height: '15px', objectFit: 'contain', borderRadius: '3px' }}
              />
              <span className="breadcrumb-text">{currentAgent.name}</span>
            </span>
          </div>
        </div>

        {/* Scrollable messages container */}
        <div className="scroll" id="scroll">
          <div className="col" id="msgs">
            {messages.length === 0 ? (
              <div className="empty">
                <div className="hero-content">
                  <div className="hero-avatar-wrapper">
                    <img
                      src={getAgentIcon(currentAgent, theme)}
                      alt={currentAgent.name}
                      className="hero-avatar"
                    />
                  </div>
                  <div className="hero-badge">{currentAgent.role}</div>
                  <h1 className="hero-title">What can {currentAgent.name} help with?</h1>
                  <p className="hero-tagline">{currentAgent.description}</p>

                  <div className="chips-grid">
                    {currentCards.map((card, idx) => (
                      <button
                        key={idx}
                        className="suggestion-card"
                        onClick={() => handleSend(card.prompt)}
                      >
                        <div className="card-top">
                          <span className="card-icon-badge">{card.icon}</span>
                          <span className="card-tag">{card.tag}</span>
                        </div>
                        <div className="card-title">{card.title}</div>
                        <div className="card-desc">{card.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <ChatMessage
                  key={idx}
                  role={m.role}
                  content={m.content}
                  agentEmoji={currentAgent.emoji}
                  agentIcon={getAgentIcon(currentAgent, theme)}
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
                !currentUser
                  ? 'Please log in or sign up to chat...'
                  : !hasAnyModels
                  ? 'Configure an API key in Settings to begin chatting with TerraMind...'
                  : `Ask ${currentAgent.name} to write Terraform, review manifests, or design infrastructure...`
              }
              aria-label="Message"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              onKeyDown={handleKeyDown}
            />

            {/* Bottom action row inside the input section */}
            <div className="box-bottom-bar">
              <div className="composer-left-actions">
                {!hasAnyModels ? (
                  /* Filled primary button while offline */
                  <button
                    type="button"
                    className="primary-action-btn"
                    onClick={() => setSettingsOpen(true)}
                    title="Configure Cloud API Keys to enable AI generation"
                  >
                    <span>⚙️</span>
                    <span>Add API Key</span>
                  </button>
                ) : (
                  <>
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
                      <span className="status-dot online-dot" style={{ width: '6px', height: '6px' }} />
                      <span>{provider === 'ollama' ? 'Local' : 'Cloud'}</span>
                      <span style={{ opacity: 0.4 }}>•</span>
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
                      title={provider === 'ollama' ? 'Switch to Cloud AI' : 'Switch to Local Ollama'}
                    >
                      {provider === 'ollama' ? 'Use Cloud ☁️' : 'Use Ollama 🖥️'}
                    </button>

                    {/* Settings Button */}
                    <button
                      type="button"
                      className="composer-pill-btn"
                      onClick={() => setSettingsOpen(true)}
                      title="Configure Cloud API Keys"
                      style={{ padding: '3px 8px' }}
                    >
                      ⚙️
                    </button>
                  </>
                )}
              </div>

              {/* Circular Send Button */}
              <button
                className="send"
                id="send"
                disabled={!input.trim() || isGenerating || !hasAnyModels}
                onClick={() => handleSend()}
                aria-label="Send message"
                title={!hasAnyModels ? "Configure an API key to send messages" : "Send message"}
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
        theme={theme}
        toggleTheme={toggleTheme}
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

      {/* Share Project Workspace Modal */}
      <ShareProjectModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        project={sharingProject}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}

export default App;
