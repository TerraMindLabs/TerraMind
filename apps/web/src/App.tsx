import { useState, useEffect, useRef } from 'react';
import { useChatStream } from './hooks/useChatStream';
import { Sidebar, Conversation } from './components/Sidebar';
import { AgentSelector, TERRAMIND_AGENTS } from './components/AgentSelector';
import { AISourceToggle } from './components/AISourceToggle';
import { ChatMessage } from './components/ChatMessage';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState('agent_tf-devops-expert');
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

  // Modals & Auth state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(() => {
    try {
      const stored = localStorage.getItem('tm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversations and models on mount
  const refreshConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
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
          } else {
            setModel('');
          }
        } else if (!model) {
          setModel(data.cloudModels?.[0] || 'gpt-4o');
        }
      }
    } catch (e) {
      console.error('Error fetching models:', e);
    }
  };

  useEffect(() => {
    refreshConversations();
    fetchModels();

    // Check if auth is required on setup
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => {
        if (data.requiresSetup && !currentUser) {
          setAuthOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    sendMessage(input, provider, model, selectedAgentId, () => {
      refreshConversations();
    });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (conversationId === id) {
        startNewChat();
      }
      refreshConversations();
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const currentAgent = TERRAMIND_AGENTS.find((a) => a.id === selectedAgentId) || TERRAMIND_AGENTS[0];

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        activeId={conversationId}
        onSelect={(id) => loadConversation(id)}
        onNewChat={startNewChat}
        onDelete={handleDeleteConversation}
        ollamaOnline={ollamaOnline}
        onOpenSettings={() => setSettingsOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={() => {
          localStorage.removeItem('tm_user');
          setCurrentUser(null);
        }}
      />

      {/* Main Chat Area */}
      <div className="main-chat-container">
        {/* Top Header & Agent Selector */}
        <header className="chat-header">
          <div className="header-left">
            {!sidebarOpen && (
              <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(true)}
                title="Open Sidebar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}
            <AgentSelector
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              className="top-settings-btn"
              onClick={() => setSettingsOpen(true)}
              title="Cloud Provider API Keys"
            >
              ⚙️ Keys
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">{currentAgent.emoji}</div>
              <h2 className="welcome-title">{currentAgent.name}</h2>
              <p className="welcome-desc">{currentAgent.description}</p>

              <div className="prompt-suggestions">
                {selectedAgentId === 'agent_tf-devops-expert' && (
                  <>
                    <div
                      className="suggestion-card"
                      onClick={() => handleSuggestionClick('Build an AWS VPC with 3 public and private subnets, NAT gateway, and tags')}
                    >
                      <h4>AWS VPC Architecture</h4>
                      <p>Generate multi-AZ VPC with subnets and internet gateways.</p>
                    </div>
                    <div
                      className="suggestion-card"
                      onClick={() => handleSuggestionClick('Generate an S3 bucket with AES256 encryption, versioning, and lifecycle policy')}
                    >
                      <h4>Secure S3 Storage</h4>
                      <p>Create encrypted bucket with automated expiration rules.</p>
                    </div>
                  </>
                )}

                {selectedAgentId === 'agent_finops-cost-optimizer' && (
                  <>
                    <div
                      className="suggestion-card"
                      onClick={() => handleSuggestionClick('Compare monthly costs for running 4-node Kubernetes cluster on AWS vs GCP vs Azure')}
                    >
                      <h4>Multi-Cloud Cost Comparison</h4>
                      <p>Analyze EKS vs GKE vs AKS pricing and recommend spot instances.</p>
                    </div>
                    <div
                      className="suggestion-card"
                      onClick={() => handleSuggestionClick('Audit my Terraform code for unused resources and Graviton3 savings')}
                    >
                      <h4>FinOps IaC Audit</h4>
                      <p>Pinpoint overprovisioned compute and recommend reserved instances.</p>
                    </div>
                  </>
                )}

                {selectedAgentId === 'agent_k8s-gitops-architect' && (
                  <>
                    <div
                      className="suggestion-card"
                      onClick={() => handleSuggestionClick('Create a production Deployment with HPA, securityContext non-root, and liveness probes')}
                    >
                      <h4>Hardened K8s Manifest</h4>
                      <p>Generate production-grade microservice manifest with probes.</p>
                    </div>
                    <div
                      className="suggestion-card"
                      onClick={() => handleSuggestionClick('Design an ArgoCD ApplicationSet layout for multi-environment Kubernetes cluster')}
                    >
                      <h4>GitOps ApplicationSet</h4>
                      <p>Multi-cluster ArgoCD configuration with automatic sync.</p>
                    </div>
                  </>
                )}

                {selectedAgentId === 'agent_cicd-pipeline-engineer' && (
                  <>
                    <div
                      className="suggestion-card"
                      onClick={() => handleSuggestionClick('Create a GitHub Actions workflow with AWS OIDC, terraform fmt, and tfsec scans')}
                    >
                      <h4>Keyless GitHub Actions</h4>
                      <p>Zero static credentials pipeline with automated PR comments.</p>
                    </div>
                    <div
                      className="suggestion-card"
                      onClick={() => handleSuggestionClick('Generate a GitLab CI pipeline for automated Terraform plan and approval gate')}
                    >
                      <h4>GitLab CI Approval Pipeline</h4>
                      <p>Speculative plan artifact with manual production promotion.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <ChatMessage
                key={idx}
                role={m.role}
                content={m.content}
                agentEmoji={currentAgent.emoji}
                isStreaming={isGenerating && idx === messages.length - 1 && m.role === 'assistant'}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Local vs Cloud Model Toggle */}
        <div className="chat-input-wrapper">
          <div className="input-box-container">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder={`Ask ${currentAgent.name} (e.g., 'Generate an AWS VPC with subnets')...`}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div className="input-action-row">
              <AISourceToggle
                provider={provider}
                model={model}
                onProviderChange={setProvider}
                onModelChange={setModel}
                localModels={localModels}
                cloudModels={cloudModels}
                ollamaOnline={ollamaOnline}
                onOpenSettings={() => setSettingsOpen(true)}
              />

              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                title="Send Message (Enter)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => fetchModels()}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
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
