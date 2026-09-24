import React, { useState, useEffect } from 'react';

export type SettingsSection =
  | 'profile'
  | 'workspace'
  | 'keys'
  | 'ollama'
  | 'enterprise'
  | 'security'
  | 'notifications';

interface SettingsViewProps {
  activeSection: SettingsSection;
  onSelectSection?: (section: SettingsSection) => void;
  currentUser?: { username: string } | null;
  onClose?: () => void;
  onSaveKeys?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  activeSection,
  currentUser,
  onClose,
  onSaveKeys
}) => {
  // Profile form state
  const [firstName, setFirstName] = useState(() => currentUser?.username || 'DevOps');
  const [lastName, setLastName] = useState('Architect');
  const [email, setEmail] = useState(() => `${currentUser?.username || 'architect'}@terramind.io`);
  const [phone, setPhone] = useState('+1 (555) 019-2834');
  const [profileSaved, setProfileSaved] = useState(false);

  // Cloud API keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [hasOpenai, setHasOpenai] = useState(false);
  const [hasGemini, setHasGemini] = useState(false);
  const [hasAnthropic, setHasAnthropic] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);

  // Enterprise Cloud AI
  const [azureEndpoint, setAzureEndpoint] = useState('');
  const [azureKey, setAzureKey] = useState('');
  const [azureDeployment, setAzureDeployment] = useState('gpt-4o');
  const [hasAzure, setHasAzure] = useState(false);

  const [bedrockRegion, setBedrockRegion] = useState('us-east-1');
  const [bedrockAccessKey, setBedrockAccessKey] = useState('');
  const [bedrockSecretKey, setBedrockSecretKey] = useState('');
  const [bedrockModel, setBedrockModel] = useState('anthropic.claude-3-5-sonnet-20241022-v2:0');
  const [hasBedrock, setHasBedrock] = useState(false);

  // Ollama local state
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [newModelInput, setNewModelInput] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<string | null>(null);

  // Load backend data
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setHasOpenai(data.has_openai || false);
        setHasGemini(data.has_gemini || false);
        setHasAnthropic(data.has_anthropic || false);
        setHasAzure(data.has_azure || false);
        setHasBedrock(data.has_bedrock || false);
        if (data.azure_endpoint) setAzureEndpoint(data.azure_endpoint);
        if (data.azure_deployment) setAzureDeployment(data.azure_deployment);
        if (data.bedrock_region) setBedrockRegion(data.bedrock_region);
        if (data.bedrock_model) setBedrockModel(data.bedrock_model);
      })
      .catch((err) => console.error('Error fetching settings:', err));

    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        setOllamaOnline(data.ollama_online || false);
        setInstalledModels(data.local || []);
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openai_api_key: openaiKey || undefined,
          gemini_api_key: geminiKey || undefined,
          anthropic_api_key: anthropicKey || undefined,
          azure_endpoint: azureEndpoint || undefined,
          azure_api_key: azureKey || undefined,
          azure_deployment: azureDeployment || undefined,
          bedrock_region: bedrockRegion || undefined,
          bedrock_access_key_id: bedrockAccessKey || undefined,
          bedrock_secret_access_key: bedrockSecretKey || undefined,
          bedrock_model_id: bedrockModel || undefined
        })
      });
      if (res.ok) {
        setKeysSaved(true);
        if (onSaveKeys) onSaveKeys();
        setTimeout(() => setKeysSaved(false), 4000);
      }
    } catch (err) {
      console.error('Error saving keys:', err);
    } finally {
      setKeysLoading(false);
    }
  };

  const handlePullModel = async (modelName: string) => {
    if (!modelName.trim()) return;
    setPulling(true);
    setPullStatus(`Pulling ${modelName}...`);
    try {
      const res = await fetch('/api/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      if (res.ok) {
        setPullStatus(`Successfully downloaded ${modelName}!`);
        // Refresh local models
        const mRes = await fetch('/api/models');
        const mData = await mRes.json();
        setInstalledModels(mData.local || []);
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {activeSection === 'profile' && 'Personal Information'}
            {activeSection === 'workspace' && 'Workspace & Environment'}
            {activeSection === 'keys' && 'Cloud Provider API Credentials'}
            {activeSection === 'ollama' && 'Ollama Local Models Engine'}
            {activeSection === 'enterprise' && 'Enterprise Cloud AI (Bedrock & Azure)'}
            {activeSection === 'security' && 'Security & Access Control'}
            {activeSection === 'notifications' && 'Notifications & Alerts'}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>
            {activeSection === 'profile' && 'This information can be displayed publicly so be careful what you share.'}
            {activeSection === 'workspace' && 'Configure active workspace directories, default cloud regions, and state backends.'}
            {activeSection === 'keys' && 'Connect your Google Gemini, OpenAI, or Anthropic accounts for high-speed cloud reasoning.'}
            {activeSection === 'ollama' && 'Manage on-premise local models running 100% private and offline on this machine.'}
            {activeSection === 'enterprise' && 'Deploy against dedicated enterprise VPC endpoints with IAM and private gateways.'}
            {activeSection === 'security' && 'Manage your credentials, encryption keys, and active user sessions.'}
            {activeSection === 'notifications' && 'Configure incident triggers, Slack alerts, and security scan notifications.'}
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

      {/* SECTION 1: PROFILE / PERSONAL INFORMATION (Matching screenshot!) */}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '26px' }}>
              <div>
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

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                  Phone Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span
                    style={{
                      padding: '11px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--hover)',
                      fontSize: '13px',
                      color: 'var(--muted)',
                      fontWeight: 600
                    }}
                  >
                    US ▾
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      flex: 1,
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
            </div>

            {/* Upload Photo Card (Matching screenshot dashed area!) */}
            <div
              style={{
                border: '1.5px dashed var(--border)',
                borderRadius: '10px',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                background: 'var(--hover)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}
                >
                  🖼️
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                    Upload an avatar photo
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    SVG, JPG or PNG. (recommended size of 300 x 300 or 1:1)
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
                Browse
                <input type="file" accept="image/*" style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                This profile was initialized on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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

      {/* SECTION 2: CLOUD API KEYS */}
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
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
                >
                  Get Free Key ↗
                </a>
              </div>
              <input
                type="password"
                placeholder={hasGemini ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'AIzaSy...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  OpenAI API Key {hasOpenai && <span style={{ color: '#10b981' }}>✓ Configured</span>}
                </label>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
                >
                  OpenAI Console ↗
                </a>
              </div>
              <input
                type="password"
                placeholder={hasOpenai ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'sk-proj-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  Anthropic API Key {hasAnthropic && <span style={{ color: '#10b981' }}>✓ Configured</span>}
                </label>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
                >
                  Anthropic Console ↗
                </a>
              </div>
              <input
                type="password"
                placeholder={hasAnthropic ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'sk-ant-...'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Keys are encrypted and stored locally in your private TerraMind instance.
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

      {/* SECTION 3: OLLAMA LOCAL MODELS */}
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
                {ollamaOnline ? 'Ollama Daemon Active & Listening (:11434)' : 'Ollama Offline'}
              </span>
            </div>

            <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              {installedModels.length} models installed
            </span>
          </div>

          {/* Quick Model Download Form */}
          <div style={{ marginBottom: '26px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Download / Pull New Local Model
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="e.g. qwen2.5-coder:1.5b, deepseek-r1:7b, llama3.2..."
                value={newModelInput}
                onChange={(e) => setNewModelInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />
              <button
                type="button"
                disabled={pulling || !newModelInput.trim()}
                onClick={() => handlePullModel(newModelInput)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: pulling ? 'wait' : 'pointer'
                }}
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

          {/* Installed Models List */}
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              Installed Offline Models
            </div>
            {installedModels.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '10px', color: 'var(--muted)', fontSize: '13px' }}>
                No local models downloaded yet. Enter a model tag above or run <code>ollama pull qwen2.5-coder:1.5b</code>.
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

      {/* SECTION 4: ENTERPRISE CLOUD AI (Bedrock & Azure) */}
      {activeSection === 'enterprise' && (
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
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>
              AWS Bedrock Configuration {hasBedrock && <span style={{ color: '#10b981' }}>✓ Configured</span>}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                  AWS Region
                </label>
                <input
                  type="text"
                  value={bedrockRegion}
                  onChange={(e) => setBedrockRegion(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                  Foundation Model ID
                </label>
                <input
                  type="text"
                  value={bedrockModel}
                  onChange={(e) => setBedrockModel(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                  AWS Access Key ID
                </label>
                <input
                  type="password"
                  placeholder="AKIA..."
                  value={bedrockAccessKey}
                  onChange={(e) => setBedrockAccessKey(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={bedrockSecretKey}
                  onChange={(e) => setBedrockSecretKey(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginTop: '24px', marginBottom: '14px' }}>
              Azure AI Foundry Endpoint {hasAzure && <span style={{ color: '#10b981' }}>✓ Configured</span>}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                  Azure Resource Endpoint
                </label>
                <input
                  type="text"
                  placeholder="https://your-resource.openai.azure.com"
                  value={azureEndpoint}
                  onChange={(e) => setAzureEndpoint(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                  Deployment Name
                </label>
                <input
                  type="text"
                  placeholder="gpt-4o"
                  value={azureDeployment}
                  onChange={(e) => setAzureDeployment(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                  Azure API Key
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={azureKey}
                  onChange={(e) => setAzureKey(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Save Enterprise Settings
            </button>
          </form>
        </div>
      )}

      {/* SECTION 5: SECURITY & OTHER SECTIONS */}
      {activeSection === 'security' && (
        <div style={{ maxWidth: '860px', background: 'var(--card-bg, var(--side))', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px 32px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>Authentication & Session Security</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
            TerraMind runs in protected local mode with mandatory project-level RBAC. All cloud credentials remain on-premise in the internal SQLite vault.
          </p>
        </div>
      )}
    </div>
  );
};
