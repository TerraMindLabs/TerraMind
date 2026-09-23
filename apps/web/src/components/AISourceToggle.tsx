import React from 'react';

interface AISourceToggleProps {
  provider: 'ollama' | 'cloud';
  model: string;
  onProviderChange: (provider: 'ollama' | 'cloud') => void;
  onModelChange: (model: string) => void;
  localModels: string[];
  cloudModels: string[];
  ollamaOnline?: boolean;
  onOpenSettings: () => void;
}

export const AISourceToggle: React.FC<AISourceToggleProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  localModels,
  cloudModels,
  ollamaOnline = false,
  onOpenSettings
}) => {
  const currentModelList = provider === 'ollama' ? localModels : cloudModels;

  const handleProviderSelect = (newProvider: 'ollama' | 'cloud') => {
    onProviderChange(newProvider);
    if (newProvider === 'ollama') {
      onModelChange(localModels[0] || '');
    } else {
      onModelChange(cloudModels[0] || 'gpt-4o');
    }
  };

  return (
    <div className="ai-source-toggle-bar">
      <div className="source-toggle-pills">
        <button
          type="button"
          className={`source-pill ${provider === 'ollama' ? 'active' : ''}`}
          onClick={() => handleProviderSelect('ollama')}
          title={ollamaOnline ? 'Local Ollama: Connected' : 'Local Ollama: Offline'}
        >
          <span>🖥️</span>
          <span>Local (Ollama)</span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: ollamaOnline ? 'var(--accent-emerald)' : 'var(--text-muted)',
              display: 'inline-block'
            }}
          />
        </button>

        <button
          type="button"
          className={`source-pill ${provider === 'cloud' ? 'active' : ''}`}
          onClick={() => handleProviderSelect('cloud')}
          title="Cloud AI (Gemini / OpenAI / Claude)"
        >
          <span>☁️</span>
          <span>Cloud AI</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {provider === 'ollama' && localModels.length === 0 ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
            No models downloaded (`ollama pull &lt;model&gt;`)
          </span>
        ) : (
          <select
            className="model-select-dropdown"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            title="Select Active AI Model"
          >
            {currentModelList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}

        {provider === 'cloud' && (
          <button
            type="button"
            className="keys-config-btn"
            onClick={onOpenSettings}
            title="Configure Cloud API Keys"
          >
            🔑 Keys
          </button>
        )}
      </div>
    </div>
  );
};
