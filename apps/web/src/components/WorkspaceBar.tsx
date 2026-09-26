import React, { useState, useEffect } from 'react';

export interface SecurityFinding {
  id: string;
  rule_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  resource: string;
  filename: string;
  startLine: number;
  endLine: number;
  resolution: string;
  explanation?: string;
}

export interface ValidationFinding {
  severity: 'error' | 'warning';
  summary: string;
  detail: string;
  filename?: string;
  startLine?: number;
}

export interface CostResource {
  name: string;
  resourceType: string;
  monthlyCost: string;
}

export interface InfracostSummary {
  totalMonthlyCost?: string;
  totalHourlyCost?: string;
  currency?: string;
  resources?: CostResource[];
  apiKeyRequired?: boolean;
  message?: string;
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

interface WorkspaceFile {
  name: string;
  size: number;
}

interface WorkspaceBarProps {
  ollamaOnline: boolean;
  onOllamaStatusChange: (online: boolean) => void;
  onFixWithAi: (issuePrompt: string, preferredAgent?: string) => void;
  onOpenSettings?: () => void;
  onOpenAudit?: () => void;
}

export const WorkspaceBar: React.FC<WorkspaceBarProps> = ({
  ollamaOnline,
  onOllamaStatusChange,
  onFixWithAi,
  onOpenSettings,
  onOpenAudit
}) => {
  const [workspacePath, setWorkspacePath] = useState('Terraform');
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const selectedTargetFile = '';
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'verification' | 'findings' | 'validation' | 'cost' | 'terminal'>('terminal');
  const [verificationResult, setVerificationResult] = useState<FileVerificationResult | null>(null);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>([]);
  const [validationFindings, setValidationFindings] = useState<ValidationFinding[]>([]);
  const [costSummary, setCostSummary] = useState<InfracostSummary | null>(null);

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

  const handleRunCommand = async (action: 'init' | 'fmt' | 'validate' | 'plan' | 'tfsec' | 'infracost' | 'verify') => {
    setIsRunning(true);
    setActiveAction(action);
    setConsoleOpen(true);

    const targetLabel = selectedTargetFile ? `[${selectedTargetFile}]` : '[All Files]';
    const actionLabels: Record<string, string> = {
      fmt: `terraform fmt ${targetLabel}`,
      validate: `terraform validate ${targetLabel}`,
      plan: `terraform plan speculative ${targetLabel}`,
      init: 'terraform init -backend=false',
      tfsec: `tfsec static security scanner ${targetLabel}`,
      infracost: 'infracost cloud cost breakdown',
      verify: `Full Pre-Flight Verification Gate ${targetLabel}`
    };

    setTerminalOutput(`$ ${actionLabels[action] || action} ...\nExecuting on workspace: ${workspacePath} ...\n`);

    try {
      const res = await fetch('/api/workspace/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetFile: selectedTargetFile || undefined })
      });
      const data = await res.json();

      setTerminalOutput(
        `$ ${actionLabels[action] || action}\n` +
        `----------------------------------------\n` +
        (data.output || (data.success ? 'Execution finished cleanly.' : 'Execution completed.'))
      );

      if (action === 'verify' && data.verification) {
        setVerificationResult(data.verification);
        setSecurityFindings(data.verification.tfsec.findings || []);
        setValidationFindings(data.verification.validate.diagnostics || []);
        setCostSummary(data.verification.infracost || null);
        setActiveTab('verification');
      } else if (action === 'tfsec') {
        const findings: SecurityFinding[] = data.findings || [];
        setSecurityFindings(findings);
        if (findings.length > 0) {
          setActiveTab('findings');
        } else {
          setActiveTab('terminal');
        }
      } else if (action === 'validate') {
        const valFindings: ValidationFinding[] = data.validationFindings || [];
        setValidationFindings(valFindings);
        if (valFindings.length > 0) {
          setActiveTab('validation');
        } else {
          setActiveTab('terminal');
        }
      } else if (action === 'infracost') {
        if (data.costSummary) {
          setCostSummary(data.costSummary);
          setActiveTab('cost');
        } else {
          setActiveTab('terminal');
        }
      } else {
        setActiveTab('terminal');
      }

      fetchWorkspace();
    } catch (e: any) {
      setTerminalOutput(`Error executing ${action}: ${e.message}`);
      setActiveTab('terminal');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStartOllama = async () => {
    setIsRunning(true);
    setConsoleOpen(true);
    setActiveTab('terminal');
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

  const totalIssuesCount = securityFindings.length + validationFindings.length;

  return (
    <>
      <div className="workspace-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        backgroundColor: 'var(--side)',
        borderBottom: '1px solid var(--border)',
        fontSize: '12.5px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div className="workspace-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>📁</span>
          <span className="workspace-path" title={workspacePath} style={{ fontWeight: 600, color: 'var(--text)' }}>
            {workspacePath.split(/[\/\\]/).filter(Boolean).pop() || 'Terraform'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--hover)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>

          {costSummary?.totalMonthlyCost && (
            <span style={{
              fontSize: '11.5px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--blue)',
              fontWeight: 600
            }}>
              Est: {costSummary.totalMonthlyCost}/mo
            </span>
          )}
        </div>

        <div className="workspace-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick link to One-Click Fix & Validate Sidebar */}
          {onOpenAudit && (
            <button
              className="ws-action-btn"
              onClick={onOpenAudit}
              title="Open One-Click Fix & Validate Quality Gate panel in sidebar"
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                border: '1px solid #10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🛡️</span> One-Click Fix & Validate
            </button>
          )}

          {/* Infracost Button */}
          <button
            className="ws-action-btn"
            onClick={() => handleRunCommand('infracost')}
            disabled={isRunning}
            title="Run Infracost to estimate cloud expenditure"
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: '11.5px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>💰</span> Infracost
          </button>

          {!ollamaOnline && (
            <button
              className="ws-action-btn highlight"
              onClick={handleStartOllama}
              disabled={isRunning}
              title="Launch Ollama background daemon on port 11434"
              style={{
                padding: '4px 9px',
                borderRadius: '5px',
                border: '1px solid #10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '11.5px',
                fontWeight: 600
              }}
            >
              🚀 Start Ollama
            </button>
          )}

          <button
            className="ws-action-btn toggle-console"
            onClick={() => setConsoleOpen(!consoleOpen)}
            title="Toggle Terraform CLI Console & Findings"
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: '1px solid var(--border)',
              background: totalIssuesCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'var(--hover)',
              color: totalIssuesCount > 0 ? '#ef4444' : 'var(--text)',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {consoleOpen ? '▼ Console' : '▲ Console'}
            {totalIssuesCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                borderRadius: '10px',
                padding: '0 5px',
                lineHeight: '16px'
              }}>
                {totalIssuesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Slide-up Console & Findings Drawer */}
      {consoleOpen && (
        <div className="console-drawer" style={{
          backgroundColor: 'var(--side)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          maxHeight: '360px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50
        }}>
          {/* Drawer Navigation Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--bg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {verificationResult && (
                <button
                  onClick={() => setActiveTab('verification')}
                  style={{
                    background: activeTab === 'verification' ? 'var(--hover)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: activeTab === 'verification' ? 600 : 400,
                    color: verificationResult.overallStatus === 'passed' ? '#10b981' : (verificationResult.overallStatus === 'error' ? '#ef4444' : '#f59e0b'),
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🚀 Pre-flight Scorecard ({verificationResult.overallStatus.toUpperCase()})
                </button>
              )}

              <button
                onClick={() => setActiveTab('findings')}
                style={{
                  background: activeTab === 'findings' ? 'var(--hover)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: activeTab === 'findings' ? 600 : 400,
                  color: securityFindings.length > 0 ? '#ef4444' : 'var(--text)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🛡️ Security Findings ({securityFindings.length})
              </button>

              <button
                onClick={() => setActiveTab('validation')}
                style={{
                  background: activeTab === 'validation' ? 'var(--hover)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: activeTab === 'validation' ? 600 : 400,
                  color: validationFindings.length > 0 ? '#f59e0b' : 'var(--text)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🔍 Validation ({validationFindings.length})
              </button>

              <button
                onClick={() => setActiveTab('cost')}
                style={{
                  background: activeTab === 'cost' ? 'var(--hover)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: activeTab === 'cost' ? 600 : 400,
                  color: 'var(--blue)',
                  cursor: 'pointer'
                }}
              >
                💰 Cloud Cost {costSummary?.totalMonthlyCost ? `(${costSummary.totalMonthlyCost})` : ''}
              </button>

              <button
                onClick={() => setActiveTab('terminal')}
                style={{
                  background: activeTab === 'terminal' ? 'var(--hover)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: activeTab === 'terminal' ? 600 : 400,
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                💻 Terminal Output{activeAction ? ` (${activeAction})` : ''}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => {
                  setTerminalOutput(null);
                  setSecurityFindings([]);
                  setValidationFindings([]);
                  setCostSummary(null);
                  setVerificationResult(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
                title="Clear Output"
              >
                Clear
              </button>
              <button
                onClick={() => setConsoleOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
                title="Close Drawer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Drawer Tab Content */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '10px 14px' }}>
            {/* 0. Pre-Flight Verification Gate Scorecard */}
            {activeTab === 'verification' && verificationResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: verificationResult.overallStatus === 'passed'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : verificationResult.overallStatus === 'error'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${
                    verificationResult.overallStatus === 'passed' ? '#10b981' : verificationResult.overallStatus === 'error' ? '#ef4444' : '#f59e0b'
                  }`
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>
                      Pre-Flight Gate: {verificationResult.overallStatus} ({verificationResult.filename})
                    </span>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                      Checked: fmt • validate • tfsec security • Infracost • speculative plan
                    </div>
                  </div>
                  {totalIssuesCount > 0 && (
                    <button
                      onClick={() => {
                        const firstFinding = securityFindings[0];
                        const prompt = firstFinding
                          ? `Fix security vulnerability [${firstFinding.id}] in ${firstFinding.filename}: ${firstFinding.description}. Recommendation: ${firstFinding.resolution}`
                          : `Fix Terraform validation issues in ${verificationResult.filename}: ${validationFindings.map(v => v.summary).join('; ')}`;
                        onFixWithAi(prompt, 'security');
                        setConsoleOpen(false);
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Fix All with AI
                    </button>
                  )}
                </div>

                {/* Scorecard 5-Pillar Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {/* fmt */}
                  <div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>⚡ FORMAT (FMT)</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '3px', color: verificationResult.fmt.success ? '#10b981' : '#ef4444' }}>
                      {verificationResult.fmt.success ? (verificationResult.fmt.formatted ? 'Reformatted' : 'Clean') : 'Syntax Error'}
                    </div>
                  </div>

                  {/* validate */}
                  <div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>🔍 SYNTAX VALIDATION</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '3px', color: verificationResult.validate.success ? '#10b981' : '#ef4444' }}>
                      {verificationResult.validate.success ? 'Valid HCL' : `${verificationResult.validate.errorCount} Error(s)`}
                    </div>
                  </div>

                  {/* tfsec */}
                  <div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>🛡️ TFSEC SECURITY</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '3px', color: verificationResult.tfsec.issueCount === 0 ? '#10b981' : '#f59e0b' }}>
                      {verificationResult.tfsec.issueCount === 0 ? '0 Vulnerabilities' : `${verificationResult.tfsec.issueCount} Finding(s)`}
                    </div>
                  </div>

                  {/* Infracost */}
                  <div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>💰 CLOUD COST</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '3px', color: 'var(--blue)' }}>
                      {verificationResult.infracost.totalMonthlyCost ? `${verificationResult.infracost.totalMonthlyCost}/mo` : 'Est Ready'}
                    </div>
                  </div>

                  {/* Speculative plan */}
                  <div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>📋 SPECULATIVE PLAN</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 500, marginTop: '3px', color: 'var(--text)' }}>
                      {verificationResult.plan.summary}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1. Security Findings Tab with ⚡ Fix with AI */}
            {activeTab === 'findings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {securityFindings.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    🛡️ No security misconfigurations found. Click <strong>tfsec</strong> or <strong>Pre-flight Gate</strong> to scan.
                  </div>
                ) : (
                  securityFindings.map((finding, idx) => {
                    const sevColors: Record<string, { bg: string; text: string }> = {
                      CRITICAL: { bg: '#ef4444', text: '#ffffff' },
                      HIGH: { bg: '#f97316', text: '#ffffff' },
                      MEDIUM: { bg: '#f59e0b', text: '#ffffff' },
                      LOW: { bg: '#3b82f6', text: '#ffffff' }
                    };
                    const sevStyle = sevColors[finding.severity] || { bg: '#64748b', text: '#ffffff' };

                    return (
                      <div
                        key={`${finding.id}-${idx}`}
                        style={{
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              backgroundColor: sevStyle.bg,
                              color: sevStyle.text,
                              fontSize: '10.5px',
                              fontWeight: 700,
                              borderRadius: '4px',
                              padding: '1px 6px',
                              textTransform: 'uppercase'
                            }}>
                              {finding.severity}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                              {finding.id}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              📍 {finding.filename}:{finding.startLine}
                            </span>
                            {finding.resource && (
                              <code style={{
                                fontSize: '11px',
                                backgroundColor: 'var(--hover)',
                                padding: '1px 5px',
                                borderRadius: '3px'
                              }}>
                                {finding.resource}
                              </code>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              const prompt = `Fix security vulnerability [${finding.id}] in file "${finding.filename}" (lines ${finding.startLine}-${finding.endLine}):\n\nIssue: ${finding.description}\nRecommended Resolution: ${finding.resolution}\n\nPlease inspect the workspace and apply the corrected Terraform HCL code.`;
                              onFixWithAi(prompt, 'security');
                              setConsoleOpen(false);
                            }}
                            style={{
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                            title="Click to have AI automatically remediate this issue on this file"
                          >
                            ⚡ Fix with AI
                          </button>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '2px' }}>
                          {finding.description}
                        </div>

                        {finding.resolution && (
                          <div style={{
                            fontSize: '11.5px',
                            color: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            💡 <strong>Remediation:</strong> {finding.resolution}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. Validation Findings Tab with ⚡ Fix with AI */}
            {activeTab === 'validation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {validationFindings.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    🔍 No validation errors found. Click <strong>validate</strong> to check Terraform syntax.
                  </div>
                ) : (
                  validationFindings.map((v, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: v.severity === 'error' ? '#ef4444' : '#f59e0b',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            borderRadius: '4px',
                            padding: '1px 6px',
                            textTransform: 'uppercase'
                          }}>
                            {v.severity}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                            {v.summary}
                          </span>
                          {v.filename && (
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              📍 {v.filename}:{v.startLine || 1}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            const prompt = `Fix Terraform validation ${v.severity} in "${v.filename || 'workspace'}" (line ${v.startLine || 1}):\n\n${v.summary}\n${v.detail}\n\nPlease correct the syntax and configuration in the workspace.`;
                            onFixWithAi(prompt, 'architect');
                            setConsoleOpen(false);
                          }}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Click to have AI fix this validation error"
                        >
                          ⚡ Fix with AI
                        </button>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                        {v.detail}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Infracost Cloud Cost Tab */}
            {activeTab === 'cost' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {costSummary?.apiKeyRequired ? (
                  <div style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text)' }}>🔑 Infracost API Key Required</strong>
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)', lineHeight: '1.5' }}>
                      Infracost calculates monthly cloud bills for AWS, Azure, and Google Cloud in real-time.
                      Get a free API key in 30 seconds at <a href="https://dashboard.infracost.io" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>dashboard.infracost.io</a>.
                    </p>
                    {onOpenSettings && (
                      <button
                        onClick={onOpenSettings}
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: 'var(--blue)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: '4px'
                        }}
                      >
                        ⚙️ Configure Infracost Key
                      </button>
                    )}
                  </div>
                ) : costSummary?.totalMonthlyCost ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Total Projected Monthly Cloud Cost
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--blue)', marginTop: '2px' }}>
                          {costSummary.totalMonthlyCost} <span style={{ fontSize: '13px', fontWeight: 500 }}>{costSummary.currency}</span>
                        </div>
                      </div>

                      {costSummary.totalHourlyCost && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Hourly Rate
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                            {costSummary.totalHourlyCost}/hr
                          </div>
                        </div>
                      )}
                    </div>

                    {costSummary.resources && costSummary.resources.length > 0 && (
                      <div style={{
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '8px 12px',
                          fontWeight: 600,
                          fontSize: '12px',
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: 'var(--hover)',
                          color: 'var(--text)'
                        }}>
                          Resource Cost Breakdown
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {costSummary.resources.map((r, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderBottom: i === costSummary.resources!.length - 1 ? 'none' : '1px solid var(--border)',
                                fontSize: '12px'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '8px' }}>({r.resourceType})</span>
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{r.monthlyCost}/mo</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    💰 Click <strong>Infracost</strong> above to calculate monthly infrastructure cost breakdown.
                  </div>
                )}
              </div>
            )}

            {/* 4. Terminal Output Tab */}
            {activeTab === 'terminal' && (
              <pre style={{
                margin: 0,
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                fontSize: '12px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: 'var(--text)'
              }}>
                <code>{terminalOutput || 'Ready. Click Pre-flight Gate, fmt, validate, plan, tfsec, or Infracost to execute commands.'}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </>
  );
};
