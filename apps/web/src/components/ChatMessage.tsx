import React, { useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  agentEmoji?: string;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  agentEmoji = '🏗️',
  isStreaming = false
}) => {
  return (
    <div className={`message-row ${role}`}>
      {role === 'assistant' && (
        <div className="avatar assistant">
          <span>{agentEmoji}</span>
        </div>
      )}

      <div className="message-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {role === 'user' ? 'You' : 'TerraMind'}
          </strong>
        </div>

        <div className="message-bubble">
          {renderFormattedContent(content)}
          {isStreaming && <span className="typing-cursor" />}
        </div>
      </div>

      {role === 'user' && (
        <div className="avatar user">
          <span>YOU</span>
        </div>
      )}
    </div>
  );
};

function renderFormattedContent(text: string) {
  if (!text) return null;

  // Robust code block parser: handles open/unclosed blocks during streaming and closed blocks
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
        // Start code block
        if (currentTextLines.length > 0) {
          tokens.push({ type: 'text', content: currentTextLines.join('\n') });
          currentTextLines = [];
        }
        inCode = true;
        currentLang = line.trim().slice(3).trim() || 'hcl';
        currentBlockLines = [];
      } else {
        // End code block
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

  // Handle unclosed block at end of text (e.g. while streaming)
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
      if (code.includes('required_providers') || code.includes('provider "aws"') || code.includes('provider "google"')) {
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
          setSaveStatus(data.validateOutput.includes('Success') ? '✅ Validated!' : 'Saved with check');
        } else {
          setSaveStatus('Saved to Workspace');
        }
        setTimeout(() => {
          setSaved(false);
          setSaveStatus(null);
        }, 3500);
      }
    } catch (e) {
      console.error('Failed to save to workspace:', e);
    } finally {
      setSaving(false);
    }
  };

  const isSaveable = language.includes('hcl') || language.includes('tf') || language.includes('terraform') || language.includes('yaml') || code.includes('resource ') || code.includes('module ');

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang-tag">{language}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {isSaveable && (
            <button
              className="copy-btn action-deploy"
              onClick={handleSaveToWorkspace}
              disabled={saving}
              title="Save directly into E:\TerraMind\Terraform and auto-validate"
            >
              {saved ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style={{ color: '#10b981' }}>{saveStatus || 'Saved!'}</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  <span>{saving ? 'Auto-checking...' : 'Deploy to Workspace'}</span>
                </>
              )}
            </button>
          )}

          <button className="copy-btn" onClick={handleCopy}>
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style={{ color: '#10b981' }}>Copied!</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
};

function formatInlineMarkdown(line: string): React.ReactNode {
  // Format bold **text**
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
          <code
            key={`${keyPrefix}-${i}`}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              padding: '0.15rem 0.35rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.85em',
              color: '#38bdf8'
            }}
          >
            {p.slice(1, -1)}
          </code>
        );
      }
      return p;
    });
  }
  return text;
}
