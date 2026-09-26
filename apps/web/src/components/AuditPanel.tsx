import React, { useState } from 'react';
import { WorkspaceFile } from './Sidebar';

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

interface AuditPanelProps {
  workspaceFiles: WorkspaceFile[];
  onClose: () => void;
  onBack: () => void;
  onFixWithAi?: (prompt: string, preferredAgent?: string) => void;
  onOpenSettings?: () => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({
  workspaceFiles,
  onClose,
  onBack,
  onFixWithAi,
  onOpenSettings
}) => {
  const [selectedTargetFile, setSelectedTargetFile] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const [verification, setVerification] = useState<FileVerificationResult | null>(null);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>([]);
  const [validationFindings, setValidationFindings] = useState<ValidationFinding[]>([]);
  const [costSummary, setCostSummary] = useState<InfracostSummary | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);

  const handleRun = async (action: 'verify' | 'fmt' | 'validate' | 'plan' | 'tfsec' | 'infracost') => {
    setIsRunning(true);
    setActiveTool(action);

    try {
      const res = await fetch('/api/workspace/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetFile: selectedTargetFile || undefined })
      });
      const data = await res.json();

      if (action === 'verify' && data.verification) {
        setVerification(data.verification);
        setSecurityFindings(data.verification.tfsec.findings || []);
        setValidationFindings(data.verification.validate.diagnostics || []);
        setCostSummary(data.verification.infracost || null);
      } else if (action === 'tfsec') {
        const findings: SecurityFinding[] = data.findings || [];
        setSecurityFindings(findings);
      } else if (action === 'validate') {
        const valFindings: ValidationFinding[] = data.validationFindings || [];
        setValidationFindings(valFindings);
      } else if (action === 'infracost') {
        if (data.costSummary) setCostSummary(data.costSummary);
      }

      setTerminalOutput(data.output || (data.success ? 'Execution finished.' : 'Completed.'));
    } catch (e: any) {
      setTerminalOutput(`Execution error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const totalIssuesCount = securityFindings.length + validationFindings.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="nested-sidebar-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)'
      }}>
        <button
          type="button"
          className="nested-back-btn"
          onClick={onBack}
          title="Back to Conversations"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>Fix & Validate</span>
        </button>

        <button
          className="icon"
          onClick={onClose}
          aria-label="Close sidebar"
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M9 4v16" />
          </svg>
        </button>
      </div>

      {/* Body Content */}
      <div className="sidebar-scroll" style={{ padding: '12px 14px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Target Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Target File / Scope
          </label>
          <select
            value={selectedTargetFile}
            onChange={(e) => setSelectedTargetFile(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '12.5px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">📁 Entire Workspace ({workspaceFiles.length} files)</option>
            {workspaceFiles.map((f) => (
              <option key={f.name} value={f.name}>
                📄 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Primary CTA: 1-Click Fix & Validate Gate */}
        <button
          type="button"
          onClick={() => handleRun('verify')}
          disabled={isRunning}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '6px',
            border: 'none',
            background: isRunning ? 'var(--hover)' : '#10b981',
            color: isRunning ? 'var(--muted)' : '#ffffff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          <span>{isRunning && activeTool === 'verify' ? '⏳ Scanning & Validating...' : '🚀 One-Click Audit & Validate'}</span>
        </button>

        {/* Individual Tool Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Run Individual Tools
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleRun('fmt')}
              disabled={isRunning}
              style={{
                padding: '6px 8px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 500,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                textAlign: 'left'
              }}
            >
              ⚡ fmt
            </button>

            <button
              type="button"
              onClick={() => handleRun('validate')}
              disabled={isRunning}
              style={{
                padding: '6px 8px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 500,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                textAlign: 'left'
              }}
            >
              🔍 validate
            </button>

            <button
              type="button"
              onClick={() => handleRun('tfsec')}
              disabled={isRunning}
              style={{
                padding: '6px 8px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 500,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                textAlign: 'left'
              }}
            >
              🛡️ tfsec
            </button>

            <button
              type="button"
              onClick={() => handleRun('infracost')}
              disabled={isRunning}
              style={{
                padding: '6px 8px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 500,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                textAlign: 'left'
              }}
            >
              💰 Infracost
            </button>

            <button
              type="button"
              onClick={() => handleRun('plan')}
              disabled={isRunning}
              style={{
                gridColumn: 'span 2',
                padding: '6px 8px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 500,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                textAlign: 'left'
              }}
            >
              📋 Speculative Plan
            </button>
          </div>
        </div>

        {/* Verification Scorecard Display */}
        {verification && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: 'var(--hover)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '10px 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Gate Status ({verification.filename})
              </span>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: verification.overallStatus === 'passed'
                  ? '#10b981'
                  : verification.overallStatus === 'error'
                  ? '#ef4444'
                  : '#f59e0b',
                color: '#fff',
                textTransform: 'uppercase'
              }}>
                {verification.overallStatus}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>⚡ Formatting:</span>
                <span style={{ fontWeight: 600, color: verification.fmt.success ? '#10b981' : '#ef4444' }}>
                  {verification.fmt.formatted ? 'Reformatted' : 'Clean'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>🔍 Validation:</span>
                <span style={{ fontWeight: 600, color: verification.validate.success ? '#10b981' : '#ef4444' }}>
                  {verification.validate.success ? 'Valid' : `${verification.validate.errorCount} Error(s)`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>🛡️ Security (tfsec):</span>
                <span style={{ fontWeight: 600, color: verification.tfsec.issueCount === 0 ? '#10b981' : '#f59e0b' }}>
                  {verification.tfsec.issueCount === 0 ? '0 Issues' : `${verification.tfsec.issueCount} Finding(s)`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>💰 Cloud Cost:</span>
                <span style={{ fontWeight: 600, color: 'var(--blue)' }}>
                  {verification.infracost.totalMonthlyCost ? `${verification.infracost.totalMonthlyCost}/mo` : 'Est Ready'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>📋 Plan:</span>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                  {verification.plan.summary}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Findings with ⚡ Fix with AI */}
        {totalIssuesCount > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase' }}>
                Issues Detected ({totalIssuesCount})
              </label>
              {onFixWithAi && (
                <button
                  type="button"
                  onClick={() => {
                    const firstSec = securityFindings[0];
                    const prompt = firstSec
                      ? `Fix security vulnerability [${firstSec.id}] in ${firstSec.filename}: ${firstSec.description}. Recommendation: ${firstSec.resolution}. Please provide corrected Terraform code.`
                      : `Fix Terraform syntax validation error: ${validationFindings[0]?.summary} - ${validationFindings[0]?.detail}`;
                    onFixWithAi(prompt, 'security');
                  }}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Fix All
                </button>
              )}
            </div>

            {/* Security Findings */}
            {securityFindings.map((f, i) => (
              <div
                key={`sec-${i}`}
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      backgroundColor: f.severity === 'CRITICAL' ? '#ef4444' : f.severity === 'HIGH' ? '#f97316' : '#f59e0b',
                      color: '#fff',
                      padding: '1px 4px',
                      borderRadius: '3px'
                    }}>
                      {f.severity}
                    </span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {f.id}
                    </strong>
                  </div>

                  {onFixWithAi && (
                    <button
                      type="button"
                      onClick={() => {
                        const prompt = `Fix security vulnerability [${f.id}] in file "${f.filename}" (lines ${f.startLine}-${f.endLine}): ${f.description}. Recommendation: ${f.resolution}. Please update the HCL code in the workspace.`;
                        onFixWithAi(prompt, 'security');
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ⚡ Fix
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  📍 {f.filename}:{f.startLine}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text)' }}>
                  {f.description}
                </div>
              </div>
            ))}

            {/* Validation Findings */}
            {validationFindings.map((v, i) => (
              <div
                key={`val-${i}`}
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      backgroundColor: v.severity === 'error' ? '#ef4444' : '#f59e0b',
                      color: '#fff',
                      padding: '1px 4px',
                      borderRadius: '3px'
                    }}>
                      {v.severity.toUpperCase()}
                    </span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--text)' }}>
                      {v.summary}
                    </strong>
                  </div>

                  {onFixWithAi && (
                    <button
                      type="button"
                      onClick={() => {
                        const prompt = `Fix Terraform validation error: ${v.summary} - ${v.detail}. Please correct the HCL code in the workspace.`;
                        onFixWithAi(prompt, 'architect');
                      }}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ⚡ Fix
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                  {v.detail}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infracost Info */}
        {costSummary && (
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '6px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Projected Monthly Cost
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--blue)' }}>
              {costSummary.totalMonthlyCost || '$0.00'} <span style={{ fontSize: '11px', fontWeight: 500 }}>{costSummary.currency || 'USD'}</span>
            </div>
            {costSummary.apiKeyRequired && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                ⚙️ Add Infracost Key
              </button>
            )}
          </div>
        )}

        {/* Output log */}
        {terminalOutput && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Log Output
            </label>
            <pre style={{
              margin: 0,
              padding: '8px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              fontSize: '11px',
              lineHeight: '1.4',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              <code>{terminalOutput}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
