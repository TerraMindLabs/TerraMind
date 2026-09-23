import React from 'react';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  tools: string[];
}

export const TERRAMIND_AGENTS: Agent[] = [
  {
    id: 'agent_tf-devops-expert',
    name: 'Terraform DevOps',
    emoji: '🏗️',
    role: 'Principal Cloud Architect',
    description: 'Writes modular, secure, and validated Terraform HCL code with automated formatting and security gates.',
    tools: ['terraform-registry', 'local-fs', 'tf-runner']
  },
  {
    id: 'agent_finops-cost-optimizer',
    name: 'FinOps Cost Optimizer',
    emoji: '💰',
    role: 'Cloud Economist',
    description: 'Analyzes IaC, provides multi-cloud cost comparisons (AWS vs GCP vs Azure), and recommends Spot/Graviton savings.',
    tools: ['local-fs', 'terraform-registry']
  },
  {
    id: 'agent_k8s-gitops-architect',
    name: 'Kubernetes Platform',
    emoji: '☸️',
    role: 'K8s & GitOps Architect',
    description: 'Designs production Kubernetes manifests, QoS sizing, health probes, Helm charts, and GitOps rollouts.',
    tools: ['local-fs']
  },
  {
    id: 'agent_cicd-pipeline-engineer',
    name: 'CI/CD Engineer',
    emoji: '🔄',
    role: 'DevSecOps Engineer',
    description: 'Designs multi-stage CI/CD pipelines (GitHub Actions) with OIDC keyless auth and tfsec security gates.',
    tools: ['local-fs']
  }
];

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgentId,
  onSelectAgent
}) => {
  const currentAgent = TERRAMIND_AGENTS.find((a) => a.id === selectedAgentId) || TERRAMIND_AGENTS[0];

  return (
    <div>
      <div className="agents-tabs">
        {TERRAMIND_AGENTS.map((agent) => (
          <button
            key={agent.id}
            className={`agent-tab ${selectedAgentId === agent.id ? 'active' : ''}`}
            onClick={() => onSelectAgent(agent.id)}
            title={agent.description}
          >
            <span>{agent.emoji}</span>
            <span>{agent.name}</span>
          </button>
        ))}
      </div>
      <div className="agent-info-bar">
        <span className="agent-badge">{currentAgent.role}</span>
        <span>{currentAgent.description}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
          {currentAgent.tools.map((t) => (
            <span
              key={t}
              style={{
                fontSize: '0.65rem',
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '0.1rem 0.35rem',
                borderRadius: '3px',
                fontFamily: 'monospace'
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
