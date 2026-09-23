import React, { useState, useEffect } from 'react';

interface WorkspaceFile {
  name: string;
  size: number;
}

interface WorkspaceBarProps {
  ollamaOnline: boolean;
  onOllamaStatusChange: (online: boolean) => void;
}

export const WorkspaceBar: React.FC<WorkspaceBarProps> = ({
  ollamaOnline,
  onOllamaStatusChange
}) => {
  const [workspacePath, setWorkspacePath] = useState('E:\\TerraMind\\Terraform');
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    try {
      const res = await fetch('/api/workspace');
      if (res.ok) {
        const data = await res.json();
        if (data.path) setWorkspacePath(data.path);
        if (data.files) setFiles(data.files);
        if (typeof data.ollamaActive === 'boolean') onOllamaStatusChange(data.ollamaActive);
      }
    } catch (e) {
      console.error('Failed to load workspace:', e);
    }
  };

  useEffect(() => {
    fetchWorkspace();
    const interval = setInterval(fetchWorkspace, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRunCommand = async (action: 'init' | 'fmt' | 'validate' | 'plan') => {
    setIsRunning(true);
    setActiveAction(action);
    setConsoleOpen(true);
    setTerminalOutput(`$ terraform ${action === 'init' ? 'init -backend=false' : action} ...\nExecuting on ${workspacePath} ...\n`);

    try {
      const res = await fetch('/api/workspace/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      setTerminalOutput(
        `$ terraform ${action}\n` +
        `----------------------------------------\n` +
        (data.output || (data.success ? 'Execution completed with 0 errors.' : 'Command finished.'))
      );
      fetchWorkspace();
    } catch (e: any) {
      setTerminalOutput(`Error executing terraform ${action}: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStartOllama = async () => {
    setIsRunning(true);
    setConsoleOpen(true);
    setTerminalOutput('$ ollama serve ...\nAttempting to launch local Ollama background server on port 11434...\n');

    try {
      const res = await fetch('/api/ollama/start', { method: 'POST' });
      const data = await res.json();
      if (data.online) {
        onOllamaStatusChange(true);
        setTerminalOutput(`[OK] Ollama server is active and listening on http://127.0.0.1:11434/`);
      } else {
        setTerminalOutput(`[Notice] Attempted background launch. Check terminal or ensure 'ollama' is installed.`);
      }
    } catch (e: any) {
      setTerminalOutput(`Error starting Ollama: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <div className="workspace-bar">
        <div className="workspace-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className="workspace-path" title={workspacePath}>
            {workspacePath.split('\\').pop() || 'Terraform'} ({files.length} .tf files)
          </span>
        </div>

        <div className="workspace-actions">
          <button
            className="ws-action-btn"
            onClick={() => handleRunCommand('fmt')}
            disabled={isRunning}
            title="Run 'terraform fmt' to format files"
          >
            ⚡ fmt
          </button>

          <button
            className="ws-action-btn"
            onClick={() => handleRunCommand('validate')}
            disabled={isRunning}
            title="Run 'terraform validate'"
          >
            🔍 validate
          </button>

          <button
            className="ws-action-btn"
            onClick={() => handleRunCommand('plan')}
            disabled={isRunning}
            title="Run speculative 'terraform plan'"
          >
            📋 plan
          </button>

          {!ollamaOnline && (
            <button
              className="ws-action-btn highlight"
              onClick={handleStartOllama}
              disabled={isRunning}
              title="Launch Ollama background daemon on port 11434"
            >
              🚀 Start Ollama
            </button>
          )}

          <button
            className="ws-action-btn toggle-console"
            onClick={() => setConsoleOpen(!consoleOpen)}
            title="Toggle Terraform CLI Console"
          >
            {consoleOpen ? '▼ Console' : '▲ Console'}
          </button>
        </div>
      </div>

      {/* Slide-up Terminal Console Drawer */}
      {consoleOpen && (
        <div className="console-drawer">
          <div className="console-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isRunning ? 'var(--primary)' : 'var(--success)' }}></span>
              <strong style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
                Terraform CLI Terminal {activeAction ? `(${activeAction})` : ''}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                className="console-tool-btn"
                onClick={() => setTerminalOutput(null)}
                title="Clear Output"
              >
                Clear
              </button>
              <button
                className="console-tool-btn"
                onClick={() => setConsoleOpen(false)}
                title="Close Terminal"
              >
                ✕
              </button>
            </div>
          </div>
          <pre className="console-body">
            <code>{terminalOutput || 'Ready. Click fmt, validate, or plan to execute Terraform commands.'}</code>
          </pre>
        </div>
      )}
    </>
  );
};
