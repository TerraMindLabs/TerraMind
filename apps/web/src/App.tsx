import React, { useState, useEffect, useRef } from 'react';
import { useChatStream } from './hooks/useChatStream';
import { Sidebar, Conversation, Project, WorkspaceFile } from './components/Sidebar';
import { TERRAMIND_AGENTS, getAgentIcon } from './components/AgentSelector';
import { ChatMessage } from './components/ChatMessage';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { ShareProjectModal } from './components/ShareProjectModal';
import { PrimaryRail, RailTab } from './components/PrimaryRail';
import { SettingsView, SettingsSection } from './components/SettingsView';

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

function formatModelName(modelId: string): string {
  if (!modelId) return '';
  if (modelId.startsWith('azure/')) {
    return `Azure / ${modelId.slice(6)}`;
  }
  if (modelId.startsWith('bedrock/')) {
    const raw = modelId.slice(8);
    return `Bedrock / ${raw.replace('anthropic.', '').replace('amazon.', '').replace('meta.', '')}`;
  }
  if (modelId.startsWith('oci/')) {
    return `OCI / ${modelId.slice(4)}`;
  }

  return modelId
    .replace('gemini-3.6-flash', 'Gemini 3.6 Flash')
    .replace('gemini-3-flash-preview', 'Gemini 3 Flash (Preview)')
    .replace('gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite')
    .replace('gemini-3.5-flash', 'Gemini 3.5 Flash')
    .replace('gemini-3.1-pro-preview', 'Gemini 3.1 Pro (Preview)')
    .replace('gemini-3.1-flash-lite-preview', 'Gemini 3.1 Flash Lite (Preview)')
    .replace('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite')
    .replace('gemini-2.5-flash', 'Gemini 2.5 Flash')
    .replace('gemini-2.5-pro', 'Gemini 2.5 Pro')
    .replace('gemini-flash-latest', 'Gemini Flash (Latest)')
    .replace('gemini-flash-lite-latest', 'Gemini Flash Lite (Latest)')
    .replace('gemini-pro-latest', 'Gemini Pro (Latest)')
    .replace('gemini-2.0-flash', 'Gemini 2.0 Flash')
    .replace('gemini-1.5-flash', 'Gemini 1.5 Flash')
    .replace('gemini-1.5-pro', 'Gemini 1.5 Pro')
    .replace('gpt-4o-mini', 'GPT-4o Mini')
    .replace('gpt-4o', 'GPT-4o')
    .replace('claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet')
    .replace('claude-3-5-haiku-20241022', 'Claude 3.5 Haiku')
    .replace('claude-3-opus-20240229', 'Claude 3 Opus')
    .replace(/^gemini-/, 'Gemini ')
    .replace(/^gpt-/, 'GPT-')
    .replace(/^claude-/, 'Claude ');
}

function isSupportedCloudModel(modelId: string): boolean {
  if (!modelId) return false;
  const lower = modelId.toLowerCase();
  const unsupported = ['tts', 'image', 'imagen', 'audio', 'realtime', 'embedding', 'embed', 'aqa', 'whisper', 'dall-e', 'transcribe'];
  if (unsupported.some((u) => lower.includes(u))) return false;
  return (
    lower.startsWith('gemini-') ||
    lower.startsWith('gpt-') ||
    lower.startsWith('o1') ||
    lower.startsWith('o3') ||
    lower.startsWith('claude-') ||
    lower.startsWith('azure/') ||
    lower.startsWith('bedrock/') ||
    lower.startsWith('oci/')
  );
}

function App() {
  const {
    messages,
    sendMessage,
    isGenerating,
    generationStatus,
    conversationId,
    loadConversation,
    startNewChat,
    stopGenerating
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
  const [menuTab, setMenuTab] = useState<'ollama' | 'cloud' | 'enterprise'>('ollama');

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
  const [settingsTab] = useState<'keys' | 'enterprise' | 'ollama'>('keys');
  const [railTab, setRailTab] = useState<RailTab>('chats');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile');
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
        const clouds: string[] = (data.cloudModels || []).filter(isSupportedCloudModel);
        setLocalModels(locals);
        setCloudModels(clouds);

        // Intelligently set default model based on availability and active provider
        if (provider === 'ollama') {
          if (locals.length > 0) {
            if (!model || !locals.includes(model)) {
              setModel(locals[0]);
            }
          } else if (clouds.length > 0 && !data.ollamaOnline) {
            setProvider('cloud');
            setModel(clouds[0]);
          }
        } else {
          if (clouds.length > 0) {
            if (!model || !clouds.includes(model)) {
              setModel(clouds[0]);
            }
          } else if (locals.length > 0) {
            setProvider('ollama');
            setModel(locals[0]);
          } else {
            setModel('');
          }
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
      setSettingsSection('keys');
      setRailTab('settings');
      setSidebarOpen(true);
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
    // Automatically load the most recent conversation with this agent, or start fresh if none exists
    const lastChat = conversations.find(
      (c) => (c.agent_id || 'agent_tf-devops-expert') === agentId
    );
    if (lastChat) {
      loadConversation(lastChat.id);
    } else {
      startNewChat();
    }
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    // Find the latest chat belonging to this project (or global if projId is ''), or start fresh
    const matchingChat = conversations.find(
      (c) => (c.project_id || '') === projId
    );
    if (matchingChat) {
      loadConversation(matchingChat.id);
      if (matchingChat.agent_id) {
        setSelectedAgentId(matchingChat.agent_id);
      }
    } else {
      startNewChat();
    }
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

  const activeConversation = conversations.find((c) => c.id === conversationId);
  const activeChatTitle =
    activeConversation?.title ||
    (messages.length > 0
      ? (messages[0].content || '').trim().split('\n')[0].replace(/[`#*]/g, '').slice(0, 26)
      : 'New Chat');

  const hasAnyModels = localModels.length > 0 || cloudModels.length > 0;
  const enterpriseModels = cloudModels.filter(
    (m) => m.startsWith('azure/') || m.startsWith('bedrock/') || m.startsWith('oci/')
  );
  const publicCloudModels = cloudModels.filter(
    (m) => !m.startsWith('azure/') && !m.startsWith('bedrock/') && !m.startsWith('oci/')
  );

  const modelDisplayName = !hasAnyModels
    ? 'Offline'
    : model
    ? formatModelName(model)
    : provider === 'ollama' && localModels.length > 0
    ? localModels[0]
    : cloudModels.length > 0
    ? formatModelName(cloudModels[0])
    : 'Offline';

  return (
    <div className={`app ${sidebarOpen ? '' : 'closed'}`} id="app">
      {/* Primary Left Navigation Rail with Theme Capsule Switch */}
      <PrimaryRail
        activeTab={railTab}
        onSelectTab={(tab) => {
          setRailTab(tab);
          setSidebarOpen(true);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={() => {
          localStorage.removeItem('tm_user');
          localStorage.removeItem('tm_token');
          setCurrentUser(null);
          setConversations([]);
          startNewChat();
        }}
        onNewChat={() => {
          setRailTab('chats');
          startNewChat();
          textareaRef.current?.focus();
        }}
      />

      {/* Secondary Nested Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        railTab={railTab}
        onSelectRailTab={(tab) => setRailTab(tab)}
        settingsSection={settingsSection}
        onSelectSettingsSection={(sec) => setSettingsSection(sec)}
        conversations={conversations}
        activeId={conversationId}
        onSelect={(id) => {
          loadConversation(id);
          const found = conversations.find((c) => c.id === id);
          if (found) {
            if (found.agent_id) {
              setSelectedAgentId(found.agent_id);
            }
            setSelectedProjectId(found.project_id || '');
          }
          if (window.innerWidth <= 768) setSidebarOpen(false);
        }}
        onNewChat={() => {
          setRailTab('chats');
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
        onOpenSettings={() => {
          setRailTab('settings');
          setSettingsSection('keys');
        }}
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

      {/* Main chat window or Full-Canvas Settings View */}
      <main className="main" style={railTab === 'settings' ? { background: 'var(--bg)', overflow: 'hidden' } : undefined}>
        {railTab === 'settings' ? (
          <SettingsView
            activeSection={settingsSection}
            onSelectSection={(sec) => setSettingsSection(sec)}
            currentUser={currentUser}
            onClose={() => setRailTab('chats')}
            onSaveKeys={() => {
              fetchModels();
              refreshConversations();
            }}
          />
        ) : (
          <>
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
                onClick={() => {
                  setSettingsSection(provider === 'ollama' ? 'ollama' : 'keys');
                  setRailTab('settings');
                  setSidebarOpen(true);
                }}
                title="All AI models are offline. Click to configure in Settings."
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
                  if (!menuOpen) {
                    if (model.startsWith('bedrock/') || model.startsWith('azure/') || model.startsWith('oci/')) {
                      setMenuTab('enterprise');
                    } else if (provider === 'cloud') {
                      setMenuTab('cloud');
                    } else {
                      setMenuTab('ollama');
                    }
                  }
                  setMenuOpen(!menuOpen);
                }}
                title="Change model"
              >
                <span className={`status-dot ${(provider === 'ollama' ? ollamaOnline : cloudModels.length > 0) ? 'online-dot' : 'offline-dot'}`} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {provider === 'ollama' ? (
                    '🖥️ '
                  ) : model.startsWith('bedrock/') ? (
                    <img src="/icons/aws.png" alt="AWS" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                  ) : model.startsWith('azure/') ? (
                    <img src="/icons/azure.png" alt="Azure" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                  ) : model.startsWith('oci/') ? (
                    <img src="/icons/oci.png" alt="OCI" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                  ) : (
                    '☁️ '
                  )}
                  {modelDisplayName}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            )}

            {/* Model selection dropdown menu with separate tabs for Ollama, Public Cloud, and Enterprise */}
            <div className={`menu ${menuOpen ? 'open' : ''}`} id="menu" onClick={(e) => e.stopPropagation()}>
              {/* 3-Tab Header */}
              <div className="menu-tabs-header">
                <button
                  type="button"
                  className={`menu-tab-btn ${menuTab === 'ollama' ? 'active' : ''}`}
                  onClick={() => {
                    setMenuTab('ollama');
                  }}
                  title="Switch to local Ollama models"
                >
                  <span className={`status-dot ${ollamaOnline ? 'online-dot' : 'offline-dot'}`} style={{ width: '6px', height: '6px' }} />
                  <span>🖥️ Local</span>
                  {localModels.length > 0 && <span className="tab-count-badge">{localModels.length}</span>}
                </button>

                <button
                  type="button"
                  className={`menu-tab-btn ${menuTab === 'cloud' ? 'active' : ''}`}
                  onClick={() => {
                    setMenuTab('cloud');
                  }}
                  title="Switch to Public Cloud AI models (Gemini, OpenAI, Claude)"
                >
                  <span className={`status-dot ${publicCloudModels.length > 0 ? 'online-dot' : 'offline-dot'}`} style={{ width: '6px', height: '6px' }} />
                  <span>☁️ Public Cloud</span>
                  {publicCloudModels.length > 0 && <span className="tab-count-badge">{publicCloudModels.length}</span>}
                </button>

                <button
                  type="button"
                  className={`menu-tab-btn ${menuTab === 'enterprise' ? 'active' : ''}`}
                  onClick={() => {
                    setMenuTab('enterprise');
                  }}
                  title="Switch to Enterprise Cloud AI (AWS Bedrock, Azure Foundry, OCI GenAI)"
                >
                  <span className={`status-dot ${enterpriseModels.length > 0 ? 'online-dot' : 'offline-dot'}`} style={{ width: '6px', height: '6px' }} />
                  <span>🏢 Enterprise</span>
                  {enterpriseModels.length > 0 && <span className="tab-count-badge">{enterpriseModels.length}</span>}
                </button>
              </div>

              {/* TAB 1: OLLAMA LOCAL MODELS */}
              {menuTab === 'ollama' && (
                <>
                  <div className="menu-section-title">
                    <span>Local Models (Ollama)</span>
                    <span style={{ fontSize: '10px', color: ollamaOnline ? '#10b981' : '#ef4444', textTransform: 'none' }}>
                      {ollamaOnline ? '🟢 Connected' : '⚪ Offline'}
                    </span>
                  </div>

                  <div className="menu-models-scroll">
                    {localModels.length === 0 ? (
                      <div className="menu-empty-state">
                        <div className="menu-empty-title">
                          {ollamaOnline ? 'No Local Models Installed' : 'Ollama Daemon Offline'}
                        </div>
                        <p className="menu-empty-desc">
                          {ollamaOnline
                            ? 'Run `ollama pull qwen2.5-coder:7b` in your terminal or manage models in Settings.'
                            : 'Ollama is not running on port 11434. Start Ollama to run models 100% locally.'}
                        </p>
                        <button
                          type="button"
                          className="menu-empty-btn"
                          onClick={() => {
                            setMenuOpen(false);
                            setSettingsSection('ollama');
                            setRailTab('settings');
                          }}
                        >
                          ⚙️ Manage Local Models
                        </button>
                      </div>
                    ) : (
                      localModels.map((lm) => (
                        <button
                          key={lm}
                          type="button"
                          className={`menu-item-btn ${provider === 'ollama' && model === lm ? 'active-model' : ''}`}
                          onClick={() => handleSelectModel('ollama', lm)}
                        >
                          <div className="menu-item-header">
                            <span className="menu-item-name">
                              {provider === 'ollama' && model === lm && (
                                <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>
                              )}
                              {lm}
                            </span>
                            <span className="menu-badge local">Local</span>
                          </div>
                          <span className="menu-item-desc">Private & runs 100% on your machine</span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="menu-footer">
                    <button
                      type="button"
                      className="menu-footer-btn"
                      onClick={() => {
                        setMenuOpen(false);
                        setSettingsSection('ollama');
                        setRailTab('settings');
                      }}
                    >
                      <span>🦙</span> Manage Ollama & Pull Models
                    </button>
                  </div>
                </>
              )}

              {/* TAB 2: PUBLIC CLOUD AI MODELS */}
              {menuTab === 'cloud' && (
                <>
                  <div className="menu-section-title">
                    <span>Public Cloud Models</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'none' }}>
                      {publicCloudModels.length} available
                    </span>
                  </div>

                  <div className="menu-models-scroll">
                    {publicCloudModels.length === 0 ? (
                      <div className="menu-empty-state">
                        <div className="menu-empty-title">No Public Cloud API Keys Configured</div>
                        <p className="menu-empty-desc">
                          Add your Google Gemini, OpenAI, or Anthropic API key to enable high-speed cloud reasoning models.
                        </p>
                        <button
                          type="button"
                          className="menu-empty-btn"
                          onClick={() => {
                            setMenuOpen(false);
                            setSettingsSection('keys');
                            setRailTab('settings');
                          }}
                        >
                          🔑 Add API Key
                        </button>
                      </div>
                    ) : (
                      publicCloudModels.map((cm) => {
                        const isFlash = cm.includes('flash') || cm.includes('mini') || cm.includes('haiku');
                        const isPro = cm.includes('pro') || cm.includes('o1') || cm.includes('o3') || cm.includes('opus') || cm.includes('sonnet');
                        return (
                          <button
                            key={cm}
                            type="button"
                            className={`menu-item-btn ${provider === 'cloud' && model === cm ? 'active-model' : ''}`}
                            onClick={() => handleSelectModel('cloud', cm)}
                          >
                            <div className="menu-item-header">
                              <span className="menu-item-name">
                                {provider === 'cloud' && model === cm && (
                                  <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>
                                )}
                                {formatModelName(cm)}
                              </span>
                              <div className="menu-item-badges">
                                {isFlash && <span className="menu-badge fast">Fast</span>}
                                {isPro && <span className="menu-badge pro">Reasoning</span>}
                                <span className="menu-badge verified">Verified</span>
                              </div>
                            </div>
                            <span className="menu-item-desc">
                              {isFlash
                                ? 'Ultra-fast, cost-effective everyday responses'
                                : isPro
                                ? 'High-capacity logic, deep reasoning & code analysis'
                                : 'Verified cloud intelligence model'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="menu-footer">
                    <button
                      type="button"
                      className="menu-footer-btn"
                      onClick={() => {
                        setMenuOpen(false);
                        setSettingsSection('keys');
                        setRailTab('settings');
                      }}
                      style={{ width: '100%' }}
                    >
                      <span>🔑</span> Manage Cloud API Keys
                    </button>
                  </div>
                </>
              )}

              {/* TAB 3: ENTERPRISE CLOUD AI (AWS / Azure / OCI) */}
              {menuTab === 'enterprise' && (
                <>
                  <div className="menu-section-title">
                    <span>Enterprise Cloud AI</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'none' }}>
                      AWS • Azure • OCI
                    </span>
                  </div>

                  <div className="menu-models-scroll">
                    {/* 1. AWS Bedrock Card */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src="/icons/aws.png" alt="AWS" style={{ width: '14px', height: '14px', objectFit: 'contain' }} /> AWS Bedrock
                      </div>
                      {enterpriseModels.filter((m) => m.startsWith('bedrock/')).length > 0 ? (
                        enterpriseModels.filter((m) => m.startsWith('bedrock/')).map((bm) => (
                          <button
                            key={bm}
                            type="button"
                            className={`menu-item-btn ${provider === 'cloud' && model === bm ? 'active-model' : ''}`}
                            onClick={() => handleSelectModel('cloud', bm)}
                          >
                            <div className="menu-item-header">
                              <span className="menu-item-name">
                                {provider === 'cloud' && model === bm && (
                                  <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>
                                )}
                                {formatModelName(bm)}
                              </span>
                              <span className="menu-badge pro" style={{ background: 'rgba(255, 153, 0, 0.15)', color: '#FF9900' }}>AWS</span>
                            </div>
                            <span className="menu-item-desc">AWS Bedrock IAM / SigV4 foundation model</span>
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px dashed var(--border)', background: 'var(--hover)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Not configured</span>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              setSettingsSection('bedrock');
                              setRailTab('settings');
                            }}
                            style={{ fontSize: '11.5px', color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Connect AWS Bedrock ➔
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. Azure AI Foundry Card */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src="/icons/azure.png" alt="Azure" style={{ width: '14px', height: '14px', objectFit: 'contain' }} /> Azure AI Foundry
                      </div>
                      {enterpriseModels.filter((m) => m.startsWith('azure/')).length > 0 ? (
                        enterpriseModels.filter((m) => m.startsWith('azure/')).map((am) => (
                          <button
                            key={am}
                            type="button"
                            className={`menu-item-btn ${provider === 'cloud' && model === am ? 'active-model' : ''}`}
                            onClick={() => handleSelectModel('cloud', am)}
                          >
                            <div className="menu-item-header">
                              <span className="menu-item-name">
                                {provider === 'cloud' && model === am && (
                                  <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>
                                )}
                                {formatModelName(am)}
                              </span>
                              <span className="menu-badge pro" style={{ background: 'rgba(0, 120, 212, 0.15)', color: '#0078D4' }}>Azure</span>
                            </div>
                            <span className="menu-item-desc">Azure AI Foundry enterprise OpenAI deployment</span>
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px dashed var(--border)', background: 'var(--hover)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Not configured</span>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              setSettingsSection('azure');
                              setRailTab('settings');
                            }}
                            style={{ fontSize: '11.5px', color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Connect Azure Foundry ➔
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. OCI GenAI Card */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src="/icons/oci.png" alt="OCI" style={{ width: '14px', height: '14px', objectFit: 'contain' }} /> OCI Generative AI
                      </div>
                      {enterpriseModels.filter((m) => m.startsWith('oci/')).length > 0 ? (
                        enterpriseModels.filter((m) => m.startsWith('oci/')).map((om) => (
                          <button
                            key={om}
                            type="button"
                            className={`menu-item-btn ${provider === 'cloud' && model === om ? 'active-model' : ''}`}
                            onClick={() => handleSelectModel('cloud', om)}
                          >
                            <div className="menu-item-header">
                              <span className="menu-item-name">
                                {provider === 'cloud' && model === om && (
                                  <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>
                                )}
                                {formatModelName(om)}
                              </span>
                              <span className="menu-badge pro" style={{ background: 'rgba(199, 70, 52, 0.15)', color: '#C74634' }}>OCI</span>
                            </div>
                            <span className="menu-item-desc">Oracle Cloud Infrastructure Generative AI</span>
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px dashed var(--border)', background: 'var(--hover)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Not configured</span>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              setSettingsSection('oci');
                              setRailTab('settings');
                            }}
                            style={{ fontSize: '11.5px', color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Connect OCI GenAI ➔
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="menu-footer" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="menu-footer-btn"
                      onClick={() => {
                        setMenuOpen(false);
                        setSettingsSection('bedrock');
                        setRailTab('settings');
                      }}
                      style={{ flex: 1 }}
                    >
                      <span>🟧</span> AWS
                    </button>
                    <button
                      type="button"
                      className="menu-footer-btn"
                      onClick={() => {
                        setMenuOpen(false);
                        setSettingsSection('azure');
                        setRailTab('settings');
                      }}
                      style={{ flex: 1 }}
                    >
                      <span>🔷</span> Azure
                    </button>
                    <button
                      type="button"
                      className="menu-footer-btn"
                      onClick={() => {
                        setMenuOpen(false);
                        setSettingsSection('oci');
                        setRailTab('settings');
                      }}
                      style={{ flex: 1 }}
                    >
                      <span>🔴</span> OCI
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Unified Breadcrumb Nav (Project Scope / Agent / Chat Title) */}
          <div className="breadcrumb-nav">
            {currentProject ? (
              <>
                <button
                  type="button"
                  className="breadcrumb-item clickable"
                  onClick={() => handleSelectProject('')}
                  title="Switch to Global workspace (no project segregation)"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '12px' }}>🌐</span>
                  <span className="breadcrumb-text">Global</span>
                </button>
                <span className="breadcrumb-separator">/</span>
                <span
                  className="breadcrumb-item clickable"
                  title={`Project: ${currentProject.name} (Click to share workspace)`}
                  onClick={() => {
                    setSharingProject(currentProject);
                    setShareModalOpen(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '13px' }}>{currentProject.icon || '📁'}</span>
                  <span className="breadcrumb-text" style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {currentProject.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '2px' }}>👥</span>
                </span>
                <span className="breadcrumb-separator">/</span>
              </>
            ) : (
              <>
                <span className="breadcrumb-item" title="Global Workspace: Quick chats without project segregation">
                  <span style={{ fontSize: '12px' }}>🌐</span>
                  <span className="breadcrumb-text" style={{ fontWeight: 600, color: 'var(--text)' }}>
                    Global Workspace
                  </span>
                </span>
                <span className="breadcrumb-separator">/</span>
              </>
            )}

            {/* Agent in Breadcrumbs */}
            <span
              className="breadcrumb-item"
              title={`Agent: ${currentAgent.name} (${currentAgent.role})`}
            >
              <img
                src={getAgentIcon(currentAgent, theme)}
                alt={currentAgent.name}
                style={{ width: '14px', height: '14px', objectFit: 'contain', borderRadius: '3px' }}
              />
              <span className="breadcrumb-text">{currentAgent.name}</span>
            </span>

            {/* Chat Title in Breadcrumbs */}
            <span className="breadcrumb-separator">/</span>
            <span
              className="breadcrumb-item active"
              title={activeChatTitle}
              style={{ color: 'var(--text)' }}
            >
              <span style={{ fontSize: '11px' }}>💬</span>
              <span className="breadcrumb-text" style={{ fontWeight: 600 }}>
                {activeChatTitle}
              </span>
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
                  generationStatus={isGenerating && idx === messages.length - 1 && m.role === 'assistant' ? generationStatus : undefined}
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
          {isGenerating && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto 8px auto',
                width: 'fit-content'
              }}
            >
              {generationStatus && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    background: 'var(--hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px'
                  }}
                >
                  <span className="spinner" style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{generationStatus}</span>
                </div>
              )}
              <button
                type="button"
                className="stop-pill-btn"
                onClick={stopGenerating}
                title="Stop AI generation"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <rect width="24" height="24" rx="3" />
                </svg>
                <span>Stop Generating</span>
              </button>
            </div>
          )}
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
                    onClick={() => {
                      setSettingsSection('keys');
                      setRailTab('settings');
                      setSidebarOpen(true);
                    }}
                    title="Configure Cloud API Keys in Settings"
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
                        if (!menuOpen) {
                          if (model.startsWith('bedrock/') || model.startsWith('azure/') || model.startsWith('oci/')) {
                            setMenuTab('enterprise');
                          } else if (provider === 'cloud') {
                            setMenuTab('cloud');
                          } else {
                            setMenuTab('ollama');
                          }
                        }
                        setMenuOpen(!menuOpen);
                      }}
                      title="Select AI Model"
                    >
                      <span className={`status-dot ${(provider === 'ollama' ? ollamaOnline : cloudModels.length > 0) ? 'online-dot' : 'offline-dot'}`} style={{ width: '6px', height: '6px' }} />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {provider === 'ollama' ? (
                          '🖥️ Local'
                        ) : model.startsWith('bedrock/') ? (
                          <>
                            <img src="/icons/aws.png" alt="AWS" style={{ width: '13px', height: '13px', objectFit: 'contain' }} />
                            <span>AWS Bedrock</span>
                          </>
                        ) : model.startsWith('azure/') ? (
                          <>
                            <img src="/icons/azure.png" alt="Azure" style={{ width: '13px', height: '13px', objectFit: 'contain' }} />
                            <span>Azure AI</span>
                          </>
                        ) : model.startsWith('oci/') ? (
                          <>
                            <img src="/icons/oci.png" alt="OCI" style={{ width: '13px', height: '13px', objectFit: 'contain' }} />
                            <span>OCI GenAI</span>
                          </>
                        ) : (
                          '☁️ Cloud'
                        )}
                      </span>
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
                      {provider === 'ollama' ? 'Switch to Cloud ☁️' : 'Switch to Ollama 🖥️'}
                    </button>

                    {/* Settings Button */}
                    <button
                      type="button"
                      className="composer-pill-btn"
                      onClick={() => {
                        const targetSection: SettingsSection = provider === 'ollama'
                          ? 'ollama'
                          : model.startsWith('bedrock/')
                          ? 'bedrock'
                          : model.startsWith('azure/')
                          ? 'azure'
                          : model.startsWith('oci/')
                          ? 'oci'
                          : 'keys';
                        setSettingsSection(targetSection);
                        setRailTab('settings');
                        setSidebarOpen(true);
                      }}
                      title="Open Settings in Left Sidebar"
                      style={{ padding: '3px 8px' }}
                    >
                      ⚙️
                    </button>
                  </>
                )}
              </div>

              {/* Send or Stop Button */}
              {isGenerating ? (
                <button
                  type="button"
                  className="send stop-btn"
                  id="stop-generating-btn"
                  onClick={stopGenerating}
                  aria-label="Stop generation"
                  title="Stop generation"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <rect width="24" height="24" rx="3" />
                  </svg>
                </button>
              ) : (
                <button
                  className="send"
                  id="send"
                  disabled={!input.trim() || !hasAnyModels}
                  onClick={() => handleSend()}
                  aria-label="Send message"
                  title={!hasAnyModels ? "Configure an API key to send messages" : "Send message"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="note">AI can make mistakes. Check important information.</div>
        </div>
        </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => fetchModels()}
        theme={theme}
        toggleTheme={toggleTheme}
        initialTab={settingsTab}
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
