import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

type TabType = 'keys' | 'ollama' | 'general';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  theme = 'light',
  toggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('keys');

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [hasOpenai, setHasOpenai] = useState(false);
  const [hasGemini, setHasGemini] = useState(false);
  const [hasAnthropic, setHasAnthropic] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);

  // Ollama Models state
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [newModelInput, setNewModelInput] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load Settings & Models on open
  const loadData = () => {
    // 1. Load API keys
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.openaiApiKey) setOpenaiKey(data.openaiApiKey);
        if (data.geminiApiKey) setGeminiKey(data.geminiApiKey);
        if (data.anthropicApiKey) setAnthropicKey(data.anthropicApiKey);
        setHasOpenai(Boolean(data.hasOpenaiKey));
        setHasGemini(Boolean(data.hasGeminiKey));
        setHasAnthropic(Boolean(data.hasAnthropicKey));
      })
      .catch(console.error);

    // 2. Load Ollama models
    setModelsLoading(true);
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        setOllamaOnline(Boolean(data.ollamaOnline));
        setInstalledModels(data.localModels || []);
      })
      .catch(console.error)
      .finally(() => setModelsLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActionError(null);
      setPullStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Save API Keys
  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysLoading(true);
    setKeysSaved(false);
    setActionError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiApiKey: openaiKey,
          geminiApiKey: geminiKey,
          anthropicApiKey: anthropicKey
        })
      });

      if (res.ok) {
        setKeysSaved(true);
        if (onSave) onSave();
        loadData();
        setTimeout(() => setKeysSaved(false), 2000);
      } else {
        setActionError('Failed to save API keys.');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error saving settings');
    } finally {
      setKeysLoading(false);
    }
  };

  // Handle Delete/Clear Single Key
  const handleDeleteKey = async (provider: 'openai' | 'gemini' | 'anthropic') => {
    try {
      await fetch(`/api/settings/keys/${provider}`, { method: 'DELETE' });
      if (provider === 'openai') {
        setOpenaiKey('');
        setHasOpenai(false);
      } else if (provider === 'gemini') {
        setGeminiKey('');
        setHasGemini(false);
      } else if (provider === 'anthropic') {
        setAnthropicKey('');
        setHasAnthropic(false);
      }
      if (onSave) onSave();
      loadData();
    } catch (e: any) {
      console.error('Failed to delete key:', e);
    }
  };

  // Handle Pull Ollama Model
  const handlePullModel = async (modelToPull?: string) => {
    const targetModel = (modelToPull || newModelInput).trim();
    if (!targetModel) return;

    setPulling(true);
    setPullStatus(`Pulling '${targetModel}' from Ollama library... this may take 1-3 minutes.`);
    setActionError(null);

    try {
      const res = await fetch('/api/models/ollama/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: targetModel })
      });

      const data = await res.json();
      if (res.ok) {
        setPullStatus(`✓ Model '${targetModel}' downloaded and ready!`);
        setNewModelInput('');
        loadData();
        if (onSave) onSave();
        setTimeout(() => setPullStatus(null), 4000);
      } else {
        setActionError(data.error || 'Failed to pull model.');
        setPullStatus(null);
      }
    } catch (e: any) {
      setActionError(e.message || 'Failed to connect to Ollama.');
      setPullStatus(null);
    } finally {
      setPulling(false);
    }
  };

  // Handle Delete Ollama Model
  const handleDeleteModel = async (modelName: string) => {
    if (!window.confirm(`Are you sure you want to delete Ollama model '${modelName}'?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/models/ollama/${encodeURIComponent(modelName)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setInstalledModels((prev) => prev.filter((m) => m !== modelName));
        if (onSave) onSave();
        loadData();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to delete model.');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error removing model.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card settings-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px', padding: '20px' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚙️</span>
            <strong style={{ fontSize: '16px', color: 'var(--text)' }}>TerraMind Settings</strong>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px',
            marginBottom: '16px'
          }}
        >
          <button
            type="button"
            className={`tab-btn ${activeTab === 'keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('keys')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'keys' ? 'var(--hover)' : 'transparent',
              color: activeTab === 'keys' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            🔑 Provider API Keys
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'ollama' ? 'active' : ''}`}
            onClick={() => setActiveTab('ollama')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'ollama' ? 'var(--hover)' : 'transparent',
              color: activeTab === 'ollama' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            🦙 Ollama Local Models
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'general' ? 'var(--hover)' : 'transparent',
              color: activeTab === 'general' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            🎨 Appearance
          </button>
        </div>

        {/* Global Action Banner */}
        {actionError && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12.5px',
              marginBottom: '14px'
            }}
          >
            ⚠️ {actionError}
          </div>
        )}

        {/* TAB 1: API KEYS */}
        {activeTab === 'keys' && (
          <div>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Configure cloud AI provider keys. Keys are saved securely in your local database and used to communicate directly with model providers.
            </p>

            <form onSubmit={handleSaveKeys} className="modal-form">
              {keysSaved && <div className="modal-success" style={{ marginBottom: '12px' }}>✓ API Keys saved successfully!</div>}

              {/* Google Gemini */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Google Gemini</label>
                    <span
                      style={{
                        fontSize: '10.5px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: hasGemini ? 'rgba(34, 197, 94, 0.15)' : 'var(--hover)',
                        color: hasGemini ? '#22c55e' : 'var(--muted)',
                        fontWeight: 600
                      }}
                    >
                      {hasGemini ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {hasGemini && (
                      <button
                        type="button"
                        onClick={() => handleDeleteKey('gemini')}
                        style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Delete Gemini Key"
                      >
                        Delete
                      </button>
                    )}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11.5px', color: 'var(--blue)', textDecoration: 'none' }}
                    >
                      Free Key ↗
                    </a>
                  </div>
                </div>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                />
              </div>

              {/* OpenAI */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>OpenAI</label>
                    <span
                      style={{
                        fontSize: '10.5px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: hasOpenai ? 'rgba(34, 197, 94, 0.15)' : 'var(--hover)',
                        color: hasOpenai ? '#22c55e' : 'var(--muted)',
                        fontWeight: 600
                      }}
                    >
                      {hasOpenai ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {hasOpenai && (
                      <button
                        type="button"
                        onClick={() => handleDeleteKey('openai')}
                        style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Delete OpenAI Key"
                      >
                        Delete
                      </button>
                    )}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11.5px', color: 'var(--blue)', textDecoration: 'none' }}
                    >
                      Get Key ↗
                    </a>
                  </div>
                </div>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                />
              </div>

              {/* Anthropic Claude */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Anthropic Claude</label>
                    <span
                      style={{
                        fontSize: '10.5px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: hasAnthropic ? 'rgba(34, 197, 94, 0.15)' : 'var(--hover)',
                        color: hasAnthropic ? '#22c55e' : 'var(--muted)',
                        fontWeight: 600
                      }}
                    >
                      {hasAnthropic ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {hasAnthropic && (
                      <button
                        type="button"
                        onClick={() => handleDeleteKey('anthropic')}
                        style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Delete Anthropic Key"
                      >
                        Delete
                      </button>
                    )}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11.5px', color: 'var(--blue)', textDecoration: 'none' }}
                    >
                      Get Key ↗
                    </a>
                  </div>
                </div>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" style={{ width: 'auto', marginTop: 0 }} disabled={keysLoading}>
                  {keysLoading ? 'Saving...' : 'Save API Keys'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: OLLAMA LOCAL MODELS */}
        {activeTab === 'ollama' && (
          <div>
            {/* Status indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--hover)',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: ollamaOnline ? '#22c55e' : '#94a3b8'
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  Ollama Service {ollamaOnline ? 'Active (Port 11434)' : 'Offline / Not Detected'}
                </span>
              </div>
              <button
                type="button"
                onClick={loadData}
                style={{ fontSize: '11.5px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ↻ Refresh
              </button>
            </div>

            {pullStatus && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6',
                  fontSize: '12.5px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {pulling && <span className="spinner" style={{ width: '12px', height: '12px' }} />}
                <span>{pullStatus}</span>
              </div>
            )}

            {/* Installed Models List */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Installed Models ({installedModels.length})
              </div>

              {modelsLoading ? (
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', padding: '12px 0' }}>Loading models...</div>
              ) : installedModels.length === 0 ? (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px dashed var(--border)',
                    fontSize: '12.5px',
                    color: 'var(--muted)',
                    textAlign: 'center'
                  }}
                >
                  No local models currently downloaded. Pull a model below to run completely offline.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {installedModels.map((m) => (
                    <div
                      key={m}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>📦</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{m}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteModel(m)}
                        style={{
                          fontSize: '12px',
                          color: '#ef4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                        title={`Delete ${m}`}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pull / Add New Model */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Download / Pull New Model
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="e.g. qwen2.5-coder:7b, deepseek-r1:7b..."
                  value={newModelInput}
                  onChange={(e) => setNewModelInput(e.target.value)}
                  disabled={pulling}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePullModel();
                    }
                  }}
                />
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => handlePullModel()}
                  disabled={pulling || !newModelInput.trim()}
                  style={{ width: 'auto', marginTop: 0, padding: '8px 16px', fontSize: '13px' }}
                >
                  {pulling ? 'Downloading...' : 'Pull Model'}
                </button>
              </div>

              {/* Recommended Quick Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)', alignSelf: 'center', marginRight: '4px' }}>Quick Add:</span>
                {[
                  { tag: 'qwen2.5-coder:7b', label: 'qwen2.5-coder:7b (IaC Pick)' },
                  { tag: 'qwen2.5-coder:1.5b', label: 'qwen2.5-coder:1.5b (1GB)' },
                  { tag: 'llama3.2', label: 'llama3.2 (Meta 3B)' },
                  { tag: 'deepseek-r1:7b', label: 'deepseek-r1:7b' }
                ].map((rec) => (
                  <button
                    key={rec.tag}
                    type="button"
                    onClick={() => {
                      setNewModelInput(rec.tag);
                      handlePullModel(rec.tag);
                    }}
                    disabled={pulling}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--hover)',
                      color: 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    + {rec.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GENERAL & APPEARANCE */}
        {activeTab === 'general' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px', color: 'var(--text)' }}>
                Theme & Interface Appearance
              </label>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                Select your preferred interface color mode. TerraMind defaults to a clean, minimal slate palette.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => {
                    if (theme !== 'light' && toggleTheme) toggleTheme();
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: `2px solid ${theme === 'light' ? 'var(--blue, #3b82f6)' : 'var(--border)'}`,
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: theme === 'light' ? '0 0 0 1px var(--blue, #3b82f6)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>☀️</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Light Mode</span>
                  {theme === 'light' && (
                    <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>Active</span>
                  )}
                </button>

                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => {
                    if (theme !== 'dark' && toggleTheme) toggleTheme();
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: `2px solid ${theme === 'dark' ? 'var(--blue, #3b82f6)' : 'var(--border)'}`,
                    background: '#090d16',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: theme === 'dark' ? '0 0 0 1px var(--blue, #3b82f6)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🌙</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Dark Mode</span>
                  {theme === 'dark' && (
                    <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>Active</span>
                  )}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="submit-btn" onClick={onClose} style={{ width: 'auto', marginTop: 0 }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
