import React, { useState, useEffect } from 'react';

export type SettingsSection =
  | 'profile'
  | 'workspace'
  | 'keys'
  | 'ollama'
  | 'bedrock'
  | 'azure'
  | 'oci'
  | 'mcp';

interface SettingsViewProps {
  activeSection: SettingsSection;
  onSelectSection?: (section: SettingsSection) => void;
  currentUser?: { username: string; fullName?: string; role?: string } | null;
  onClose?: () => void;
  onSaveKeys?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  activeSection,
  currentUser,
  onClose,
  onSaveKeys
}) => {
  // 1. Profile state (Phone Number removed per request)
  const initialNameParts = (currentUser?.fullName || currentUser?.username || 'DevOps Architect').split(' ');
  const [firstName, setFirstName] = useState(() => initialNameParts[0] || 'DevOps');
  const [lastName, setLastName] = useState(() => initialNameParts.slice(1).join(' ') || 'Architect');
  const [email, setEmail] = useState(() => `${currentUser?.username || 'architect'}@terramind.io`);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // 2. Workspace state
  const [workspaceName, setWorkspaceName] = useState('Production Infrastructure');
  const [defaultRegion, setDefaultRegion] = useState('us-east-1');
  const [tfBackendType, setTfBackendType] = useState('s3');
  const [workspaceSaved, setWorkspaceSaved] = useState(false);

  // 3. Cloud API keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [hasOpenai, setHasOpenai] = useState(false);
  const [hasGemini, setHasGemini] = useState(false);
  const [hasAnthropic, setHasAnthropic] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);

  // 4. Ollama local state
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [ollamaAutoStart, setOllamaAutoStart] = useState(true);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [newModelInput, setNewModelInput] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<string | null>(null);
  const [startingOllama, setStartingOllama] = useState(false);
  const [ollamaStatusMsg, setOllamaStatusMsg] = useState<string | null>(null);
  const [ollamaConfigSaved, setOllamaConfigSaved] = useState(false);
  const [ollamaSaving, setOllamaSaving] = useState(false);

  // 5. AWS Bedrock state
  const [bedrockRegion, setBedrockRegion] = useState('us-east-1');
  const [bedrockAccessKey, setBedrockAccessKey] = useState('');
  const [bedrockSecretKey, setBedrockSecretKey] = useState('');
  const [bedrockSessionToken, setBedrockSessionToken] = useState('');
  const [bedrockModel, setBedrockModel] = useState('anthropic.claude-3-5-sonnet-20241022-v2:0');
  const [hasBedrock, setHasBedrock] = useState(false);
  const [bedrockLoading, setBedrockLoading] = useState(false);
  const [bedrockSaved, setBedrockSaved] = useState(false);

  // 6. Azure AI Foundry state
  const [azureEndpoint, setAzureEndpoint] = useState('');
  const [azureKey, setAzureKey] = useState('');
  const [azureDeployment, setAzureDeployment] = useState('gpt-4o');
  const [azureApiVersion, setAzureApiVersion] = useState('2024-06-01');
  const [hasAzure, setHasAzure] = useState(false);
  const [azureLoading, setAzureLoading] = useState(false);
  const [azureSaved, setAzureSaved] = useState(false);

  // 7. OCI GenAI state
  const [ociRegion, setOciRegion] = useState('us-chicago-1');
  const [ociCompartmentId, setOciCompartmentId] = useState('');
  const [ociKey, setOciKey] = useState('');
  const [ociModel, setOciModel] = useState('cohere.command-r-plus');
  const [hasOci, setHasOci] = useState(false);
  const [ociLoading, setOciLoading] = useState(false);
  const [ociSaved, setOciSaved] = useState(false);

  // 8. Model Context Protocol (MCP) state
  const [mcpServers, setMcpServers] = useState<Array<{
    id: string;
    name: string;
    description: string;
    transport: 'stdio' | 'sse';
    command?: string;
    args?: string[];
    url?: string;
    enabled: boolean;
    status: 'active' | 'offline' | 'error';
    tools: Array<{ name: string; description: string }>;
    last_checked?: string;
  }>>([]);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingingAll, setPingingAll] = useState(false);
  const [mcpNotice, setMcpNotice] = useState<string | null>(null);
  const [showAddMcpModal, setShowAddMcpModal] = useState(false);
  const [expandedToolsId, setExpandedToolsId] = useState<string | null>(null);

  // New MCP form state
  const [newMcpId, setNewMcpId] = useState('');
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpDesc, setNewMcpDesc] = useState('');
  const [newMcpTransport, setNewMcpTransport] = useState<'stdio' | 'sse'>('stdio');
  const [newMcpCmd, setNewMcpCmd] = useState('npx');
  const [newMcpArgs, setNewMcpArgs] = useState('');
  const [newMcpUrl, setNewMcpUrl] = useState('');

  // Load backend configuration
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        // Standard Cloud Keys
        setHasOpenai(Boolean(data.hasOpenaiKey || data.has_openai));
        setHasGemini(Boolean(data.hasGeminiKey || data.has_gemini));
        setHasAnthropic(Boolean(data.hasAnthropicKey || data.has_anthropic));
        if (data.openaiApiKey) setOpenaiKey(data.openaiApiKey);
        if (data.geminiApiKey) setGeminiKey(data.geminiApiKey);
        if (data.anthropicApiKey) setAnthropicKey(data.anthropicApiKey);

        // AWS Bedrock
        setHasBedrock(Boolean(data.hasAwsBedrock || data.has_bedrock));
        if (data.awsBedrockRegion) setBedrockRegion(data.awsBedrockRegion);
        if (data.awsBedrockAccessKey) setBedrockAccessKey(data.awsBedrockAccessKey);
        if (data.awsBedrockSecretKey) setBedrockSecretKey(data.awsBedrockSecretKey);
        if (data.awsBedrockSessionToken) setBedrockSessionToken(data.awsBedrockSessionToken);
        if (data.awsBedrockModel) setBedrockModel(data.awsBedrockModel);

        // Azure AI Foundry
        setHasAzure(Boolean(data.hasAzureOpenai || data.has_azure));
        if (data.azureOpenaiEndpoint) setAzureEndpoint(data.azureOpenaiEndpoint);
        if (data.azureOpenaiApiKey) setAzureKey(data.azureOpenaiApiKey);
        if (data.azureOpenaiDeployment) setAzureDeployment(data.azureOpenaiDeployment);
        if (data.azureOpenaiApiVersion) setAzureApiVersion(data.azureOpenaiApiVersion);

        // OCI GenAI
        setHasOci(Boolean(data.hasOciGenai || data.has_oci));
        if (data.ociGenaiRegion) setOciRegion(data.ociGenaiRegion);
        if (data.ociGenaiCompartmentId) setOciCompartmentId(data.ociGenaiCompartmentId);
        if (data.ociGenaiApiKey) setOciKey(data.ociGenaiApiKey);
        if (data.ociGenaiModel) setOciModel(data.ociGenaiModel);

        // Ollama Host & Auto-Start
        if (data.ollamaHost) setOllamaHost(data.ollamaHost);
        if (data.ollamaAutoStart !== undefined) setOllamaAutoStart(Boolean(data.ollamaAutoStart));
      })
      .catch((err) => console.error('Error fetching settings:', err));

    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        setOllamaOnline(Boolean(data.ollamaOnline ?? data.ollama_online));
        setInstalledModels(data.localModels || data.local || []);
      })
      .catch(() => {});

    fetch('/api/ollama/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.running) setOllamaOnline(true);
        if (data.host) setOllamaHost(data.host);
        if (data.autoStart !== undefined) setOllamaAutoStart(Boolean(data.autoStart));
      })
      .catch(() => {});

    fetchMcpServers();
  }, []);

  const fetchMcpServers = async () => {
    setMcpLoading(true);
    try {
      const res = await fetch('/api/mcp/servers');
      if (res.ok) {
        const data = await res.json();
        setMcpServers(data.servers || []);
      }
    } catch (e) {
      console.error('Failed to load MCP servers', e);
    } finally {
      setMcpLoading(false);
    }
  };

  const handleToggleMcp = async (id: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/mcp/servers/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled })
      });
      if (res.ok) {
        setMcpServers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, enabled: !currentEnabled } : s))
        );
      }
    } catch (e) {
      console.error('Failed to toggle MCP server', e);
    }
  };

  const handlePingMcp = async (id: string) => {
    setPingingId(id);
    try {
      const res = await fetch(`/api/mcp/servers/${id}/ping`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.server) {
          setMcpServers((prev) =>
            prev.map((s) => (s.id === id ? data.server : s))
          );
        }
        setMcpNotice(`Connection test for "${id}" succeeded (${data.latencyMs || 15}ms). Status: Active.`);
        setTimeout(() => setMcpNotice(null), 4000);
      } else {
        const err = await res.json();
        setMcpNotice(`Connection test for "${id}" failed: ${err.error || 'Server error'}`);
        setTimeout(() => setMcpNotice(null), 5000);
      }
    } catch (e: any) {
      setMcpNotice(`Error pinging "${id}": ${e.message}`);
      setTimeout(() => setMcpNotice(null), 5000);
    } finally {
      setPingingId(null);
    }
  };

  const handlePingAll = async () => {
    setPingingAll(true);
    try {
      const res = await fetch('/api/mcp/ping-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.servers) {
          setMcpServers(data.servers);
        }
        setMcpNotice(`All active MCP servers verified successfully (${data.activeCount} connected).`);
        setTimeout(() => setMcpNotice(null), 4000);
      }
    } catch (e: any) {
      setMcpNotice(`Error verifying all servers: ${e.message}`);
      setTimeout(() => setMcpNotice(null), 4000);
    } finally {
      setPingingAll(false);
    }
  };

  const handleAddMcpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpId.trim() || !newMcpName.trim()) return;

    try {
      const parsedArgs = newMcpArgs.trim()
        ? newMcpArgs.trim().split(/\s+/).filter(Boolean)
        : undefined;

      const res = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newMcpId.trim(),
          name: newMcpName.trim(),
          description: newMcpDesc.trim(),
          transport: newMcpTransport,
          command: newMcpTransport === 'stdio' ? newMcpCmd.trim() : undefined,
          args: newMcpTransport === 'stdio' ? parsedArgs : undefined,
          url: newMcpTransport === 'sse' ? newMcpUrl.trim() : undefined,
          enabled: true,
          status: 'active'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.server) {
          setMcpServers((prev) => [...prev.filter((s) => s.id !== data.server.id), data.server]);
        }
        setShowAddMcpModal(false);
        setNewMcpId('');
        setNewMcpName('');
        setNewMcpDesc('');
        setNewMcpCmd('npx');
        setNewMcpArgs('');
        setNewMcpUrl('');
        setMcpNotice(`MCP server "${data.server?.name}" registered and activated!`);
        setTimeout(() => setMcpNotice(null), 4000);
      }
    } catch (e: any) {
      alert(`Failed to add MCP server: ${e.message}`);
    }
  };

  const handleDeleteMcp = async (id: string) => {
    if (!confirm(`Are you sure you want to delete MCP server "${id}"?`)) return;
    try {
      const res = await fetch(`/api/mcp/servers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMcpServers((prev) => prev.filter((s) => s.id !== id));
        setMcpNotice(`MCP server "${id}" removed.`);
        setTimeout(() => setMcpNotice(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkspaceSaved(true);
    setTimeout(() => setWorkspaceSaved(false), 3000);
  };

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiApiKey: openaiKey || undefined,
          geminiApiKey: geminiKey || undefined,
          anthropicApiKey: anthropicKey || undefined
        })
      });
      if (res.ok) {
        setKeysSaved(true);
        if (onSaveKeys) onSaveKeys();
        setTimeout(() => setKeysSaved(false), 4000);
      }
    } catch (err) {
      console.error('Error saving API keys:', err);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleSaveBedrock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBedrockLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awsBedrockRegion: bedrockRegion,
          awsBedrockAccessKey: bedrockAccessKey || undefined,
          awsBedrockSecretKey: bedrockSecretKey || undefined,
          awsBedrockSessionToken: bedrockSessionToken || undefined,
          awsBedrockModel: bedrockModel
        })
      });
      if (res.ok) {
        setBedrockSaved(true);
        setHasBedrock(true);
        if (onSaveKeys) onSaveKeys();
        setTimeout(() => setBedrockSaved(false), 4000);
      }
    } catch (err) {
      console.error('Error saving Bedrock settings:', err);
    } finally {
      setBedrockLoading(false);
    }
  };

  const handleSaveAzure = async (e: React.FormEvent) => {
    e.preventDefault();
    setAzureLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azureOpenaiEndpoint: azureEndpoint,
          azureOpenaiApiKey: azureKey || undefined,
          azureOpenaiDeployment: azureDeployment,
          azureOpenaiApiVersion: azureApiVersion
        })
      });
      if (res.ok) {
        setAzureSaved(true);
        setHasAzure(true);
        if (onSaveKeys) onSaveKeys();
        setTimeout(() => setAzureSaved(false), 4000);
      }
    } catch (err) {
      console.error('Error saving Azure settings:', err);
    } finally {
      setAzureLoading(false);
    }
  };

  const handleSaveOci = async (e: React.FormEvent) => {
    e.preventDefault();
    setOciLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ociGenaiRegion: ociRegion,
          ociGenaiCompartmentId: ociCompartmentId || undefined,
          ociGenaiApiKey: ociKey || undefined,
          ociGenaiModel: ociModel
        })
      });
      if (res.ok) {
        setOciSaved(true);
        setHasOci(true);
        if (onSaveKeys) onSaveKeys();
        setTimeout(() => setOciSaved(false), 4000);
      }
    } catch (err) {
      console.error('Error saving OCI settings:', err);
    } finally {
      setOciLoading(false);
    }
  };

  const handleStartOllamaServer = async () => {
    setStartingOllama(true);
    setOllamaStatusMsg('Launching local Ollama daemon on 0.0.0.0:11434...');
    try {
      const res = await fetch('/api/ollama/start', { method: 'POST' });
      const data = await res.json();
      if (data.online || data.running || data.success) {
        setOllamaOnline(true);
        setOllamaStatusMsg('✓ Ollama daemon is active and listening on port 11434!');
        const mRes = await fetch('/api/models');
        const mData = await mRes.json();
        setInstalledModels(mData.localModels || []);
        setTimeout(() => setOllamaStatusMsg(null), 4000);
      } else {
        setOllamaStatusMsg(`⚠️ ${data.error || 'Failed to start Ollama. Make sure Ollama is installed on this system.'}`);
      }
    } catch (err: any) {
      setOllamaStatusMsg(`⚠️ Network error: ${err.message}`);
    } finally {
      setStartingOllama(false);
    }
  };

  const handleSaveOllamaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setOllamaSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ollamaHost: ollamaHost.trim(),
          ollamaAutoStart
        })
      });
      if (res.ok) {
        setOllamaConfigSaved(true);
        setTimeout(() => setOllamaConfigSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving Ollama config:', err);
    } finally {
      setOllamaSaving(false);
    }
  };

  const handlePullModel = async (modelName: string) => {
    if (!modelName.trim()) return;
    setPulling(true);
    setPullStatus(`Pulling ${modelName}...`);
    try {
      const res = await fetch('/api/models/ollama/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });
      if (res.ok) {
        setPullStatus(`Successfully downloaded ${modelName}!`);
        const mRes = await fetch('/api/models');
        const mData = await mRes.json();
        setInstalledModels(mData.localModels || []);
        setNewModelInput('');
      } else {
        setPullStatus(`Failed to download ${modelName}.`);
      }
    } catch {
      setPullStatus('Network error downloading model.');
    } finally {
      setPulling(false);
      setTimeout(() => setPullStatus(null), 5000);
    }
  };

  return (
    <div className="settings-canvas" style={{ flex: 1, overflowY: 'auto', padding: '36px 48px', background: 'var(--bg)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeSection === 'profile' && (
              <>
                <img src="/icons/profile.png" width="28" height="28" alt="Profile" style={{ objectFit: 'contain' }} />
                <span>Personal Information</span>
              </>
            )}
            {activeSection === 'workspace' && (
              <>
                <img src="/icons/workspace.png" width="28" height="28" alt="Workspace" style={{ objectFit: 'contain' }} />
                <span>Workspace & Environment</span>
              </>
            )}
            {activeSection === 'keys' && (
              <>
                <img src="/icons/api-keys.png" width="28" height="28" alt="Cloud API Keys" style={{ objectFit: 'contain' }} />
                <span>Cloud Provider API Credentials</span>
              </>
            )}
            {activeSection === 'ollama' && (
              <>
                <span style={{ fontSize: '24px' }}>🦙</span>
                <span>Ollama Local Models Engine</span>
              </>
            )}
            {activeSection === 'bedrock' && (
              <>
                <img src="/icons/aws.png" width="28" height="28" alt="AWS Bedrock" style={{ objectFit: 'contain' }} />
                <span>Amazon Web Services (AWS Bedrock)</span>
              </>
            )}
            {activeSection === 'azure' && (
              <>
                <img src="/icons/azure.png" width="28" height="28" alt="Azure AI Foundry" style={{ objectFit: 'contain' }} />
                <span>Microsoft Azure (Azure AI Foundry)</span>
              </>
            )}
            {activeSection === 'oci' && (
              <>
                <img src="/icons/oci.png" width="28" height="28" alt="OCI GenAI" style={{ objectFit: 'contain' }} />
                <span>Oracle Cloud Infrastructure (OCI GenAI)</span>
              </>
            )}
            {activeSection === 'mcp' && (
              <>
                <span style={{ fontSize: '26px' }}>🔌</span>
                <span>Model Context Protocol (MCP) Integrations</span>
              </>
            )}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>
            {activeSection === 'profile' && 'Update your identity, full name, email, and display avatar.'}
            {activeSection === 'workspace' && 'Configure workspace directories, default cloud regions, and state backends.'}
            {activeSection === 'keys' && 'Connect Google Gemini, OpenAI, or Anthropic accounts for cloud reasoning.'}
            {activeSection === 'ollama' && 'Manage on-premise local models running 100% private and offline on this machine.'}
            {activeSection === 'bedrock' && 'Configure IAM credentials, AWS region, and foundation models for AWS Bedrock.'}
            {activeSection === 'azure' && 'Configure private endpoints, API keys, and deployment names for Azure AI Foundry.'}
            {activeSection === 'oci' && 'Configure tenancy OCIDs, compartment credentials, and OCI Generative AI models.'}
            {activeSection === 'mcp' && 'Control and check external MCP servers, verify live tool connections, and empower TerraMind DevOps agents.'}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--hover)',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>✕</span> Exit Settings
          </button>
        )}
      </div>

      {/* SECTION 1: PROFILE (No Phone Number!) */}
      {activeSection === 'profile' && (
        <div
          style={{
            maxWidth: '860px',
            background: 'var(--card-bg, var(--side))',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px 32px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}
        >
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                  First Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13.5px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                  Last Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13.5px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13.5px'
                }}
              />
            </div>

            {/* Avatar Photo Upload Card */}
            <div
              style={{
                border: '1.5px dashed var(--border)',
                borderRadius: '10px',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                background: 'var(--hover)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    overflow: 'hidden'
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '🖼️'
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                    Profile Avatar Photo
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    SVG, JPG or PNG. Recommended size: 300 x 300 (1:1 aspect ratio)
                  </div>
                </div>
              </div>

              <label
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                Browse Photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Account: {currentUser?.username || 'Local Architect'} • Role: {currentUser?.role || 'DevOps Platform Architect'}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {profileSaved && (
                  <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600 }}>
                    ✓ Profile updated successfully
                  </span>
                )}
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  Save Profile
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 2: WORKSPACE & ENVIRONMENT */}
      {activeSection === 'workspace' && (
        <div
          style={{
            maxWidth: '860px',
            background: 'var(--card-bg, var(--side))',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px 32px'
          }}
        >
          <form onSubmit={handleSaveWorkspace}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                Active Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13.5px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                  Default Cloud Region
                </label>
                <select
                  value={defaultRegion}
                  onChange={(e) => setDefaultRegion(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13.5px' }}
                >
                  <option value="us-east-1">US East (N. Virginia) • us-east-1</option>
                  <option value="us-west-2">US West (Oregon) • us-west-2</option>
                  <option value="eu-west-1">Europe (Ireland) • eu-west-1</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore) • ap-southeast-1</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                  Default Terraform Remote State Backend
                </label>
                <select
                  value={tfBackendType}
                  onChange={(e) => setTfBackendType(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13.5px' }}
                >
                  <option value="s3">AWS S3 + DynamoDB Locking</option>
                  <option value="gcs">Google Cloud Storage (GCS)</option>
                  <option value="azurerm">Azure Blob Storage</option>
                  <option value="local">Local Workspace Disk (Development)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Workspace configurations apply to newly scaffolded Terraform and Kubernetes modules.
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {workspaceSaved && (
                  <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600 }}>
                    ✓ Workspace preferences saved
                  </span>
                )}
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save Workspace
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: CLOUD API KEYS */}
      {activeSection === 'keys' && (
        <div
          style={{
            maxWidth: '860px',
            background: 'var(--card-bg, var(--side))',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px 32px'
          }}
        >
          <form onSubmit={handleSaveApiKeys}>
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  Google Gemini API Key {hasGemini && <span style={{ color: '#10b981' }}>✓ Configured</span>}
                </label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
                  Get Free Key ↗
                </a>
              </div>
              <input
                type="password"
                placeholder={hasGemini ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'AIzaSy...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  OpenAI API Key {hasOpenai && <span style={{ color: '#10b981' }}>✓ Configured</span>}
                </label>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
                  OpenAI Console ↗
                </a>
              </div>
              <input
                type="password"
                placeholder={hasOpenai ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'sk-proj-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ marginBottom: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  Anthropic API Key {hasAnthropic && <span style={{ color: '#10b981' }}>✓ Configured</span>}
                </label>
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
                  Anthropic Console ↗
                </a>
              </div>
              <input
                type="password"
                placeholder={hasAnthropic ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'sk-ant-...'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Keys are stored locally in your private SQLite database.
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {keysSaved && (
                  <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600 }}>
                    ✓ API keys saved successfully
                  </span>
                )}
                <button
                  type="submit"
                  disabled={keysLoading}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: keysLoading ? 'wait' : 'pointer'
                  }}
                >
                  {keysLoading ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 4: OLLAMA LOCAL MODELS */}
      {activeSection === 'ollama' && (
        <div
          style={{
            maxWidth: '860px',
            background: 'var(--card-bg, var(--side))',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px 32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: ollamaOnline ? '#10b981' : '#ef4444'
                }}
              />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                {ollamaOnline ? 'Ollama Daemon Active & Listening (0.0.0.0:11434)' : 'Ollama Offline'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  fontWeight: 600,
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
                title="Ollama is configured to bind to 0.0.0.0:11434 with OLLAMA_ORIGINS=* for port forwarding support"
              >
                🌐 Port Forwarding Ready
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!ollamaOnline && (
                <button
                  type="button"
                  onClick={handleStartOllamaServer}
                  disabled={startingOllama}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: startingOllama ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {startingOllama ? 'Starting...' : '▶ Start Ollama Server'}
                </button>
              )}
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                {installedModels.length} models installed
              </span>
            </div>
          </div>

          {ollamaStatusMsg && (
            <div
              style={{
                marginBottom: '20px',
                padding: '14px 18px',
                borderRadius: '10px',
                background: ollamaStatusMsg.startsWith('✓') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${ollamaStatusMsg.startsWith('✓') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`,
                color: ollamaStatusMsg.startsWith('✓') ? '#10b981' : 'var(--text)',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: ollamaStatusMsg.startsWith('✓') ? '#10b981' : '#ef4444' }}>
                {ollamaStatusMsg}
              </div>

              {(ollamaStatusMsg.includes('fcntl64') ||
                ollamaStatusMsg.includes('symbol not found') ||
                ollamaStatusMsg.includes('Error relocating') ||
                ollamaStatusMsg.includes('musl') ||
                ollamaStatusMsg.includes('Alpine')) && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#ef4444' }}>
                    💡 Alpine Linux / musl libc Incompatibility Detected
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.45 }}>
                    The native Linux Ollama executable was compiled for GNU <code>glibc</code> and cannot execute directly on Alpine Linux musl libc (missing <code>fcntl64</code>). Here is how to run Ollama seamlessly:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '4px' }}>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text)', marginBottom: '4px' }}>
                        🐳 Option 1: Run Ollama via Official Docker Container (Recommended)
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '8px' }}>
                        The official container packages glibc internally and runs on any Linux distribution:
                      </div>
                      <code style={{ display: 'block', padding: '8px 12px', borderRadius: '6px', background: '#090d16', color: '#38bdf8', fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
                      </code>
                    </div>

                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text)', marginBottom: '4px' }}>
                        🖥️ Option 2: Connect to Host Machine's Ollama
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '8px' }}>
                        If you have Ollama running on your host machine (Windows or macOS):
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOllamaHost('http://host.docker.internal:11434');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--card-bg, var(--side))',
                          color: 'var(--text)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Set Host URL to: http://host.docker.internal:11434
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connection & Port Forwarding Configuration Form */}
          <form onSubmit={handleSaveOllamaConfig} style={{ marginBottom: '28px', padding: '16px 20px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚙️</span> Host & Auto-Start Configuration
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 14px 0' }}>
              Configure how TerraMind connects to and manages your local or remote Ollama server.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                Ollama Host URL (Default: <code>http://localhost:11434</code>)
              </label>
              <input
                type="text"
                placeholder="http://localhost:11434"
                value={ollamaHost}
                onChange={(e) => setOllamaHost(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--card-bg, var(--side))', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
              />
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '6px', lineHeight: 1.4 }}>
                ℹ️ For Docker, WSL2, or remote servers, TerraMind launches Ollama bound to <code>0.0.0.0:11434</code> with <code>OLLAMA_ORIGINS="*"</code> so any forwarded port connects seamlessly without loopback blockages.
              </div>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                id="ollama-auto-start-toggle"
                checked={ollamaAutoStart}
                onChange={(e) => setOllamaAutoStart(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <label htmlFor="ollama-auto-start-toggle" style={{ fontSize: '12.5px', color: 'var(--text)', cursor: 'pointer', lineHeight: 1.4 }}>
                <strong>Auto-start Ollama server if offline</strong>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                  When querying local models or booting TerraMind, automatically start the background Ollama daemon if it is not currently running.
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              {ollamaConfigSaved && (
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                  ✓ Ollama configuration saved
                </span>
              )}
              <button
                type="submit"
                disabled={ollamaSaving}
                style={{
                  padding: '7px 18px',
                  borderRadius: '7px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: ollamaSaving ? 'wait' : 'pointer'
                }}
              >
                {ollamaSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>

          <div style={{ marginBottom: '26px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Download / Pull New Local Model
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="e.g. qwen2.5-coder:1.5b, llama3.2, deepseek-r1:7b..."
                value={newModelInput}
                onChange={(e) => setNewModelInput(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
              />
              <button
                type="button"
                disabled={pulling || !newModelInput.trim()}
                onClick={() => handlePullModel(newModelInput)}
                style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 600, cursor: pulling ? 'wait' : 'pointer' }}
              >
                {pulling ? 'Pulling...' : 'Pull Model'}
              </button>
            </div>
            {pullStatus && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
                {pullStatus}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              Installed Offline Models
            </div>
            {installedModels.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '10px', color: 'var(--muted)', fontSize: '13px' }}>
                No local models downloaded yet. Enter a model tag above or run <code>ollama pull qwen2.5-coder:7b</code>.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {installedModels.map((m) => (
                  <div
                    key={m}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)' }}>
                        {m}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        100% On-Device • Zero Data Egress
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 600 }}>
                      Ready
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: AWS BEDROCK (Separated with AWS Logo) */}
      {activeSection === 'bedrock' && (
        <div
          style={{
            maxWidth: '860px',
            background: 'var(--card-bg, var(--side))',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px 32px'
          }}
        >
          <form onSubmit={handleSaveBedrock}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <img src="/icons/aws.png" width="36" height="36" alt="AWS Bedrock" style={{ objectFit: 'contain' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text)' }}>
                  AWS Bedrock Foundation Models
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                  Access Anthropic Claude 3.5 Sonnet, Amazon Titan, and Meta Llama through your enterprise AWS account.
                </span>
              </div>
              {hasBedrock && (
                <span style={{ marginLeft: 'auto', fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 600 }}>
                  ✓ Configured
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  AWS Region <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. us-east-1, us-west-2"
                  value={bedrockRegion}
                  onChange={(e) => setBedrockRegion(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Bedrock Model ID
                </label>
                <input
                  type="text"
                  placeholder="anthropic.claude-3-5-sonnet-20241022-v2:0"
                  value={bedrockModel}
                  onChange={(e) => setBedrockModel(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  AWS Access Key ID
                </label>
                <input
                  type="password"
                  placeholder={hasBedrock ? 'AKIA•••••••••••• (Leave blank to keep)' : 'AKIAIOSFODNN7EXAMPLE'}
                  value={bedrockAccessKey}
                  onChange={(e) => setBedrockAccessKey(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  placeholder={hasBedrock ? '•••••••••••••••• (Leave blank to keep)' : 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'}
                  value={bedrockSecretKey}
                  onChange={(e) => setBedrockSecretKey(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                AWS Session Token <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>(Optional for temporary STS credentials)</span>
              </label>
              <input
                type="password"
                placeholder="Optional STS Session Token..."
                value={bedrockSessionToken}
                onChange={(e) => setBedrockSessionToken(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                IAM permissions required: <code>bedrock:InvokeModel</code>, <code>bedrock:InvokeModelWithResponseStream</code>.
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {bedrockSaved && (
                  <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600 }}>
                    ✓ AWS Bedrock configured
                  </span>
                )}
                <button
                  type="submit"
                  disabled={bedrockLoading}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#FF9900',
                    color: '#232F3E',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: bedrockLoading ? 'wait' : 'pointer'
                  }}
                >
                  {bedrockLoading ? 'Saving...' : 'Save Bedrock Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 6: AZURE AI FOUNDRY (Separated with Azure Logo) */}
      {activeSection === 'azure' && (
        <div
          style={{
            maxWidth: '860px',
            background: 'var(--card-bg, var(--side))',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px 32px'
          }}
        >
          <form onSubmit={handleSaveAzure}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <img src="/icons/azure.png" width="36" height="36" alt="Azure AI Foundry" style={{ objectFit: 'contain' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text)' }}>
                  Microsoft Azure AI Foundry & Azure OpenAI
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                  Deploy enterprise GPT-4o, GPT-4o-mini, and reasoning models within your private Microsoft Azure tenant.
                </span>
              </div>
              {hasAzure && (
                <span style={{ marginLeft: 'auto', fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 600 }}>
                  ✓ Configured
                </span>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                Azure Resource Endpoint URL <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://your-resource-name.openai.azure.com"
                value={azureEndpoint}
                onChange={(e) => setAzureEndpoint(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Deployment Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="gpt-4o"
                  value={azureDeployment}
                  onChange={(e) => setAzureDeployment(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  API Version
                </label>
                <input
                  type="text"
                  placeholder="2024-06-01"
                  value={azureApiVersion}
                  onChange={(e) => setAzureApiVersion(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                Azure API Key
              </label>
              <input
                type="password"
                placeholder={hasAzure ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'Azure cognitive services API key...'}
                value={azureKey}
                onChange={(e) => setAzureKey(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                VNet private endpoints and managed identity connections are supported.
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {azureSaved && (
                  <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600 }}>
                    ✓ Azure AI Foundry configured
                  </span>
                )}
                <button
                  type="submit"
                  disabled={azureLoading}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0078D4',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: azureLoading ? 'wait' : 'pointer'
                  }}
                >
                  {azureLoading ? 'Saving...' : 'Save Azure Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 7: OCI GENAI (Separated with Oracle Logo) */}
      {activeSection === 'oci' && (
        <div
          style={{
            maxWidth: '860px',
            background: 'var(--card-bg, var(--side))',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px 32px'
          }}
        >
          <form onSubmit={handleSaveOci}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <img src="/icons/oci.png" width="36" height="36" alt="OCI Generative AI" style={{ objectFit: 'contain' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text)' }}>
                  Oracle Cloud Infrastructure (OCI Generative AI)
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                  Run Cohere Command R+, Meta Llama 3, and dedicated AI clusters in your OCI compartments.
                </span>
              </div>
              {hasOci && (
                <span style={{ marginLeft: 'auto', fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 600 }}>
                  ✓ Configured
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  OCI Region <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. us-chicago-1, us-ashburn-1, eu-frankfurt-1"
                  value={ociRegion}
                  onChange={(e) => setOciRegion(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  OCI Model Name
                </label>
                <input
                  type="text"
                  placeholder="cohere.command-r-plus"
                  value={ociModel}
                  onChange={(e) => setOciModel(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Compartment OCID
                </label>
                <input
                  type="password"
                  placeholder={hasOci ? 'ocid1.compartment.oc1... (Leave blank to keep)' : 'ocid1.compartment.oc1..aaaa...'}
                  value={ociCompartmentId}
                  onChange={(e) => setOciCompartmentId(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  OCI API Key / Tenancy OCID
                </label>
                <input
                  type="password"
                  placeholder={hasOci ? '•••••••••••••••• (Leave blank to keep)' : 'API signing key or user OCID...'}
                  value={ociKey}
                  onChange={(e) => setOciKey(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                OCI IAM policy required: <code>allow group DevOps to manage generative-ai-family in compartment</code>.
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {ociSaved && (
                  <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600 }}>
                    ✓ OCI GenAI configured
                  </span>
                )}
                <button
                  type="submit"
                  disabled={ociLoading}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#C74634',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: ociLoading ? 'wait' : 'pointer'
                  }}
                >
                  {ociLoading ? 'Saving...' : 'Save OCI Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 8. MODEL CONTEXT PROTOCOL (MCP) SECTION */}
      {activeSection === 'mcp' && (
        <div style={{ maxWidth: '960px' }}>
          {/* Notification Banner */}
          {mcpNotice && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 18px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#3b82f6',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{mcpNotice}</span>
              <button
                type="button"
                onClick={() => setMcpNotice(null)}
                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Metrics & Actions Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '18px 24px',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Configured MCPs
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
                  {mcpServers.length}
                </div>
              </div>
              <div style={{ width: '1px', height: '36px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Active & Online
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  {mcpServers.filter((s) => s.enabled && s.status === 'active').length}
                </div>
              </div>
              <div style={{ width: '1px', height: '36px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Agent Tools Available
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#6366f1', marginTop: '2px' }}>
                  {mcpServers.reduce((acc, s) => acc + (s.tools ? s.tools.length : 0), 0)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handlePingAll}
                disabled={pingingAll || mcpLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--hover)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: pingingAll ? 'wait' : 'pointer'
                }}
              >
                <span>🔄</span>
                <span>{pingingAll ? 'Checking All...' : 'Test All Connections'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddMcpModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>+</span>
                <span>Add MCP Server</span>
              </button>
            </div>
          </div>

          {/* Informational Guidance Banner */}
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🧠</span>
            <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
              <strong>How TerraMind Agents Utilize Model Context Protocol (MCP):</strong>
              <div style={{ color: 'var(--muted)', marginTop: '4px' }}>
                Active MCP servers expose standardized tool schemas to the DevOps agents. When generating infrastructure or validating configuration, agents cross-reference official provider schemas, verify Terraform registry module arguments, check IAM policies, and inspect Kubernetes resources.
              </div>
            </div>
          </div>

          {/* MCP Servers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mcpServers.map((server) => {
              const isPinging = pingingId === server.id;
              const isExpanded = expandedToolsId === server.id;
              const isDefault = [
                'terraform-registry',
                'filesystem-workspace',
                'aws-cloud-control',
                'k8s-cluster-inspector'
              ].includes(server.id);

              return (
                <div
                  key={server.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          background: !server.enabled
                            ? 'rgba(234, 179, 8, 0.15)'
                            : server.status === 'active'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          color: !server.enabled
                            ? '#eab308'
                            : server.status === 'active'
                            ? '#10b981'
                            : '#ef4444',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: !server.enabled
                              ? '#eab308'
                              : server.status === 'active'
                              ? '#10b981'
                              : '#ef4444'
                          }}
                        />
                        {!server.enabled ? 'Disabled' : server.status === 'active' ? 'Active / Connected' : 'Offline'}
                      </span>

                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                        {server.name}
                      </span>

                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'var(--hover)',
                          color: 'var(--muted)',
                          border: '1px solid var(--border)',
                          fontFamily: 'monospace'
                        }}
                      >
                        {server.transport.toUpperCase()}
                      </span>
                    </div>

                    {/* Enable / Disable Toggle Switch */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {server.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <input
                        type="checkbox"
                        checked={server.enabled}
                        onChange={() => handleToggleMcp(server.id, server.enabled)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </label>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    {server.description}
                  </p>

                  {/* Command / URL preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Connection:</span>
                    <code
                      style={{
                        fontSize: '11.5px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'var(--hover)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)'
                      }}
                    >
                      {server.transport === 'stdio'
                        ? `${server.command || 'npx'} ${(server.args || []).join(' ')}`
                        : server.url || 'SSE endpoint'}
                    </code>
                    {server.last_checked && (
                      <span style={{ fontSize: '11.5px', color: 'var(--muted)', marginLeft: 'auto' }}>
                        Last checked: {new Date(server.last_checked).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Card Actions & Tools Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handlePingMcp(server.id)}
                        disabled={isPinging || !server.enabled}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--hover)',
                          color: 'var(--text)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isPinging || !server.enabled ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>⚡</span>
                        <span>{isPinging ? 'Pinging...' : 'Check Connection'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedToolsId(isExpanded ? null : server.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'none',
                          color: isExpanded ? '#3b82f6' : 'var(--muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🛠️ Available Tools ({server.tools ? server.tools.length : 0}) {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>

                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMcp(server.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'none',
                          color: '#ef4444',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>

                  {/* Tools Accordion */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: 'var(--hover)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Tools Exposed to AI Agents:
                      </div>
                      {(!server.tools || server.tools.length === 0) ? (
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          No individual tools registered. Generic execution enabled.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {server.tools.map((t) => (
                            <div
                              key={t.name}
                              style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '10px',
                                fontSize: '12.5px'
                              }}
                            >
                              <code
                                style={{
                                  fontSize: '11.5px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  color: '#3b82f6',
                                  fontWeight: 600
                                }}
                              >
                                {t.name}
                              </code>
                              <span style={{ color: 'var(--muted)' }}>{t.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Custom MCP Modal */}
          {showAddMcpModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}
              onClick={() => setShowAddMcpModal(false)}
            >
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '28px',
                  width: '100%',
                  maxWidth: '520px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                    🔌 Register External MCP Server
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddMcpModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--muted)', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddMcpSubmit}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                      Server Identifier (Slug) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. gitlab-pipelines or datadog-mcp"
                      value={newMcpId}
                      onChange={(e) => setNewMcpId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                      Server Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GitLab CI / CD Server"
                      value={newMcpName}
                      onChange={(e) => setNewMcpName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Accesses GitLab pipelines and MR statuses"
                      value={newMcpDesc}
                      onChange={(e) => setNewMcpDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                      Transport Mode
                    </label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)' }}>
                        <input
                          type="radio"
                          name="transport"
                          value="stdio"
                          checked={newMcpTransport === 'stdio'}
                          onChange={() => setNewMcpTransport('stdio')}
                        />
                        <span>Standard I/O (npx / python / local binary)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)' }}>
                        <input
                          type="radio"
                          name="transport"
                          value="sse"
                          checked={newMcpTransport === 'sse'}
                          onChange={() => setNewMcpTransport('sse')}
                        />
                        <span>Server-Sent Events (SSE HTTP URL)</span>
                      </label>
                    </div>
                  </div>

                  {newMcpTransport === 'stdio' ? (
                    <>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                          Executable Command
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. npx or python or uvx"
                          value={newMcpCmd}
                          onChange={(e) => setNewMcpCmd(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                          Arguments (Space-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. -y @modelcontextprotocol/server-gitlab"
                          value={newMcpArgs}
                          onChange={(e) => setNewMcpArgs(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                        SSE Endpoint URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://mcp-server.internal:8000/sse"
                        value={newMcpUrl}
                        onChange={(e) => setNewMcpUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text)',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddMcpModal(false)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'none',
                        color: 'var(--text)',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '9px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#3b82f6',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Register & Connect
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
