import React, { useState } from 'react';

export interface SecurityFinding {
  id: string;
  rule_id: string;
  severity: string;
  description: string;
  resource: string;
  filename: string;
  startLine: number;
  endLine: number;
  resolution: string;
}

export interface ValidationFinding {
  severity: string;
  summary: string;
  detail: string;
  filename?: string;
  startLine?: number;
}

export interface InfracostSummary {
  totalMonthlyCost?: string;
  totalHourlyCost?: string;
  currency?: string;
  apiKeyRequired?: boolean;
}

export interface FileVerificationResult {
  filename: string;
  fmt: { success: boolean; formatted: boolean; output: string };
  validate: { success: boolean; errorCount: number; warningCount: number; diagnostics: ValidationFinding[] };
  tfsec: { success: boolean; issueCount: number; findings: SecurityFinding[] };
  infracost: InfracostSummary;
  plan: { success: boolean; summary: string };
  overallStatus: 'passed' | 'warning' | 'error';
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  agentEmoji?: string;
  agentIcon?: string;
  isStreaming?: boolean;
  generationStatus?: string | null;
  onRegenerate?: () => void;
  onFixWithAi?: (prompt: string, preferredAgent?: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  agentEmoji = 'AI',
  agentIcon,
  isStreaming = false,
  generationStatus,
  onRegenerate,
  onFixWithAi
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
            renderFormattedContent(content, onFixWithAi)
          )}
          {isStreaming && content && (
            <span className="dots" style={{ marginLeft: '6px' }}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          )}
        </div>

        {/* Message Action Footer */}
        {!isStreaming && content && (
          <div className="msg-actions">
            <button
              className="msg-action-btn"
              onClick={handleCopyMessage}
              title="Copy message to clipboard"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            {onRegenerate && (
              <button
                className="msg-action-btn"
                onClick={onRegenerate}
                title="Regenerate this response"
              >
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function renderFormattedContent(content: string, onFixWithAi?: (prompt: string, preferredAgent?: string) => void) {
  const lines = content.split('\n');
  const tokens: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];

  let inCode = false;
  let currentLang = '';
  let currentBlockLines: string[] = [];
  let currentTextLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (!inCode) {
        if (currentTextLines.length > 0) {
          tokens.push({ type: 'text', content: currentTextLines.join('\n') });
          currentTextLines = [];
        }
        inCode = true;
        currentLang = line.replace('```', '').trim();
        currentBlockLines = [];
      } else {
        tokens.push({
          type: 'code',
          content: currentBlockLines.join('\n'),
          language: currentLang || 'hcl'
        });
        inCode = false;
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
      return <CodeSnippet key={index} language={token.language || 'hcl'} code={token.content} onFixWithAi={onFixWithAi} />;
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

const CodeSnippet: React.FC<{
  language: string;
  code: string;
  onFixWithAi?: (prompt: string, preferredAgent?: string) => void;
}> = ({ language, code, onFixWithAi }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [verification, setVerification] = useState<FileVerificationResult | null>(null);
  const [showFindings, setShowFindings] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTargetFilename = () => {
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
    return filename;
  };

  const handleSaveToWorkspace = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const filename = getTargetFilename();

      const res = await fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: code })
      });

      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        if (data.verification) {
          setVerification(data.verification);
          if (data.verification.tfsec.issueCount > 0 || data.verification.validate.errorCount > 0) {
            setShowFindings(true);
          }
        }
        setSaveStatus(data.verification?.overallStatus === 'passed' ? 'Verified & Deployed' : 'Deployed');
        setTimeout(() => {
          setSaved(false);
          setSaveStatus(null);
        }, 4000);
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
    <div className="code-container" style={{ borderRadius: '6px', overflow: 'hidden', margin: '8px 0' }}>
      <div className="code-header-bar">
        <span>{language} {isSaveable ? `(${getTargetFilename()})` : ''}</span>
        <div className="code-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isSaveable && (
            <button
              className="code-btn save"
              onClick={handleSaveToWorkspace}
              disabled={saving}
              title="Save to Workspace and run full verification gate: fmt + validate + tfsec + Infracost + plan"
              style={{
                backgroundColor: verification?.overallStatus === 'passed' ? '#10b981' : undefined
              }}
            >
              {saved ? (
                <>✓ {saveStatus || 'Verified'}</>
              ) : (
                <>{saving ? 'Auditing...' : '🚀 Deploy & Verify Gate'}</>
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

      {/* Part 1: Automated Inline Verification Gate Summary Strip */}
      {verification && (
        <div className="code-verification-strip" style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--hover)',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: verification.fmt.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: verification.fmt.success ? '#10b981' : '#ef4444'
              }}>
                ⚡ fmt: {verification.fmt.formatted ? 'Reformatted' : 'Clean'}
              </span>

              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: verification.validate.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: verification.validate.success ? '#10b981' : '#ef4444'
              }}>
                🔍 validate: {verification.validate.success ? 'Valid' : `${verification.validate.errorCount} Error(s)`}
              </span>

              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: verification.tfsec.issueCount === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: verification.tfsec.issueCount === 0 ? '#10b981' : '#f59e0b'
              }}>
                🛡️ tfsec: {verification.tfsec.issueCount === 0 ? '0 Issues' : `${verification.tfsec.issueCount} Finding(s)`}
              </span>

              {verification.infracost.totalMonthlyCost && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--blue)'
                }}>
                  💰 Infracost: {verification.infracost.totalMonthlyCost}/mo
                </span>
              )}

              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg)',
                color: 'var(--muted)'
              }}>
                📋 {verification.plan.summary}
              </span>
            </div>

            {(verification.tfsec.findings.length > 0 || verification.validate.diagnostics.length > 0) && (
              <button
                onClick={() => setShowFindings(!showFindings)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {showFindings ? 'Hide Findings ▲' : `View ${verification.tfsec.findings.length + verification.validate.diagnostics.length} Issues ▼`}
              </button>
            )}
          </div>

          {/* Expandable Findings Drawer with ⚡ Fix with AI */}
          {showFindings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {verification.tfsec.findings.map((f, i) => (
                <div key={`sec-${i}`} style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {f.severity}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                        {f.id}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                        (lines {f.startLine}-{f.endLine})
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text)', marginTop: '2px' }}>
                      {f.description}
                    </div>
                  </div>

                  {onFixWithAi && (
                    <button
                      onClick={() => {
                        const prompt = `Fix security vulnerability [${f.id}] in ${f.filename || 'generated Terraform'} (lines ${f.startLine}-${f.endLine}): ${f.description}. Recommendation: ${f.resolution}. Please provide corrected Terraform HCL.`;
                        onFixWithAi(prompt, 'security');
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ⚡ Fix with AI
                    </button>
                  )}
                </div>
              ))}

              {verification.validate.diagnostics.map((d, i) => (
                <div key={`diag-${i}`} style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        backgroundColor: d.severity === 'error' ? '#ef4444' : '#f59e0b',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {d.severity.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                        {d.summary}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text)', marginTop: '2px' }}>
                      {d.detail}
                    </div>
                  </div>

                  {onFixWithAi && (
                    <button
                      onClick={() => {
                        const prompt = `Fix Terraform validation error: ${d.summary} - ${d.detail}. Please provide corrected HCL.`;
                        onFixWithAi(prompt, 'architect');
                      }}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ⚡ Fix with AI
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
