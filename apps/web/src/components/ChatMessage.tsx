import React, { useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  agentEmoji?: string;
  agentIcon?: string;
  isStreaming?: boolean;
  generationStatus?: string | null;
  onRegenerate?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  agentEmoji = 'AI',
  agentIcon,
  isStreaming = false,
  generationStatus,
  onRegenerate
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (role === 'user') {
    return (
      <div className="msg user">
        <div className="body">{content}</div>
      </div>
    );
  }

  const isEmptyOrWaiting = !content && isStreaming;

  return (
    <div className="msg ai">
      <span
        className="av"
        title="TerraMind Agent"
        style={{
          overflow: 'hidden',
          padding: agentIcon ? '2px' : 0,
          background: agentIcon ? 'var(--user)' : 'var(--green)',
          border: agentIcon ? '1px solid var(--border)' : 'none'
        }}
      >
        {agentIcon ? (
          <img src={agentIcon} alt="Agent" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          agentEmoji
        )}
      </span>
      <div>
        <div className="body">
          {isEmptyOrWaiting ? (
            <div className="status-badge-generating">
              <span className="spinner" />
              <span>{generationStatus || 'Processing prompt & generating response...'}</span>
            </div>
          ) : (
            renderFormattedContent(content)
          )}
          {isStreaming && content && (
            <span className="dots" style={{ marginLeft: '6px' }}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          )}
        </div>
        {!isStreaming && content && (
          <div className="acts">
            <button onClick={handleCopyMessage}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? 'Copied' : 'Copy'}
            </button>
            {onRegenerate && (
              <button onClick={onRegenerate}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function renderFormattedContent(text: string) {
  if (!text) return null;

  const tokens: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  const lines = text.split('\n');
  let inCode = false;
  let currentLang = '';
  let currentBlockLines: string[] = [];
  let currentTextLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        if (currentTextLines.length > 0) {
          tokens.push({ type: 'text', content: currentTextLines.join('\n') });
          currentTextLines = [];
        }
        inCode = true;
        currentLang = line.trim().slice(3).trim() || 'hcl';
        currentBlockLines = [];
      } else {
        inCode = false;
        tokens.push({
          type: 'code',
          content: currentBlockLines.join('\n'),
          language: currentLang
        });
        currentBlockLines = [];
        currentLang = '';
      }
    } else {
      if (inCode) {
        currentBlockLines.push(line);
      } else {
        currentTextLines.push(line);
      }
    }
  }

  if (inCode && currentBlockLines.length > 0) {
    tokens.push({
      type: 'code',
      content: currentBlockLines.join('\n'),
      language: currentLang || 'hcl'
    });
  } else if (currentTextLines.length > 0) {
    tokens.push({ type: 'text', content: currentTextLines.join('\n') });
  }

  return tokens.map((token, index) => {
    if (token.type === 'code') {
      return <CodeSnippet key={index} language={token.language || 'hcl'} code={token.content} />;
    }

    return (
      <span key={index}>
        {token.content.split('\n').map((line, lIdx, arr) => (
          <React.Fragment key={lIdx}>
            {formatInlineMarkdown(line)}
            {lIdx < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    );
  });
}

const CodeSnippet: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToWorkspace = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      let filename = 'main.tf';
      const firstLine = code.trim().split('\n')[0].trim();
      const fileMatch = firstLine.match(/^(?:#|\/\/|\/\*|<!--)\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)/);
      if (fileMatch) {
        filename = fileMatch[1].trim();
      } else if (code.includes('required_providers') || code.includes('provider "aws"') || code.includes('provider "google"')) {
        filename = 'providers.tf';
      } else if (code.includes('variable "')) {
        filename = 'variables.tf';
      } else if (code.includes('output "')) {
        filename = 'outputs.tf';
      } else if (language === 'yaml' || code.includes('apiVersion:')) {
        filename = 'deployment.yaml';
      }

      const res = await fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: code })
      });

      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        if (data.validateOutput) {
          setSaveStatus(data.validateOutput.includes('Success') ? 'Validated' : 'Saved');
        } else {
          setSaveStatus('Saved');
        }
        setTimeout(() => {
          setSaved(false);
          setSaveStatus(null);
        }, 3000);
      }
    } catch (e) {
      console.error('Failed to save to workspace:', e);
    } finally {
      setSaving(false);
    }
  };

  const isSaveable =
    language.includes('hcl') ||
    language.includes('tf') ||
    language.includes('terraform') ||
    language.includes('yaml') ||
    code.includes('resource ') ||
    code.includes('module ');

  return (
    <div className="code-container">
      <div className="code-header-bar">
        <span>{language}</span>
        <div className="code-actions">
          {isSaveable && (
            <button
              className="code-btn save"
              onClick={handleSaveToWorkspace}
              disabled={saving}
              title="Save to Workspace and validate with Terraform"
            >
              {saved ? (
                <>✓ {saveStatus || 'Saved'}</>
              ) : (
                <>{saving ? 'Validating...' : 'Deploy to Workspace'}</>
              )}
            </button>
          )}
          <button className="code-btn" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy code'}
          </button>
        </div>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
};

function formatInlineMarkdown(line: string): React.ReactNode {
  if (line.includes('**')) {
    const segments = line.split(/(\*\*.*?\*\*)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={i}>{seg.slice(2, -2)}</strong>;
      }
      return formatInlineCode(seg, i);
    });
  }
  return formatInlineCode(line, 0);
}

function formatInlineCode(text: string, keyPrefix: number): React.ReactNode {
  if (text.includes('`')) {
    const parts = text.split(/(`.*?`)/g);
    return parts.map((p, i) => {
      if (p.startsWith('`') && p.endsWith('`')) {
        return (
          <code key={`${keyPrefix}-${i}`}>
            {p.slice(1, -1)}
          </code>
        );
      }
      return p;
    });
  }
  return text;
}
