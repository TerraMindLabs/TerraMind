import React, { useState, useEffect } from 'react';

export type SettingsSection =
  | 'profile'
  | 'workspace'
  | 'keys'
  | 'ollama'
  | 'bedrock'
  | 'azure'
  | 'oci';

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
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [newModelInput, setNewModelInput] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<string | null>(null);

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
      })
      .catch((err) => console.error('Error fetching settings:', err));

    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        setOllamaOnline(Boolean(data.ollamaOnline ?? data.ollama_online));
        setInstalledModels(data.localModels || data.local || []);
      })
      .catch(() => {});
  }, []);

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
            {activeSection === 'profile' && 'Personal Information'}
            {activeSection === 'workspace' && 'Workspace & Environment'}
            {activeSection === 'keys' && 'Cloud Provider API Credentials'}
            {activeSection === 'ollama' && 'Ollama Local Models Engine'}
            {activeSection === 'bedrock' && (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="6" fill="#FF9900" />
                  <path d="M6 14.5C8 16 11.5 17 14.5 15.5M16 15L17.5 14L16.5 16" stroke="#232F3E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 9.5L9.5 7L12 9.5M13.5 9L15 7.5L16.5 9" stroke="#232F3E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Amazon Web Services (AWS Bedrock)</span>
              </>
            )}
            {activeSection === 'azure' && (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="6" fill="#0078D4" />
                  <path d="M12.5 5L6.5 14.5H11L9.5 19L17.5 10H13L14.5 5H12.5Z" fill="#FFFFFF" />
                </svg>
                <span>Microsoft Azure (Azure AI Foundry)</span>
              </>
            )}
            {activeSection === 'oci' && (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="6" fill="#C74634" />
                  <circle cx="12" cy="12" r="5" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
                </svg>
                <span>Oracle Cloud Infrastructure (OCI GenAI)</span>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
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
                {ollamaOnline ? 'Ollama Daemon Active & Listening (port 11434)' : 'Ollama Offline'}
              </span>
            </div>

            <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              {installedModels.length} models installed
            </span>
          </div>

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
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#FF9900" />
                <path d="M6 14.5C8 16 11.5 17 14.5 15.5M16 15L17.5 14L16.5 16" stroke="#232F3E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 9.5L9.5 7L12 9.5M13.5 9L15 7.5L16.5 9" stroke="#232F3E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#0078D4" />
                <path d="M12.5 5L6.5 14.5H11L9.5 19L17.5 10H13L14.5 5H12.5Z" fill="#FFFFFF" />
              </svg>
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
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#C74634" />
                <circle cx="12" cy="12" r="5" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
              </svg>
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
    </div>
  );
};
