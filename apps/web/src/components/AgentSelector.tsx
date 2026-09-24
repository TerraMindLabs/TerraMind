import React from 'react';

export interface Agent {
  id: string;
  name: string;
  icon: string;
  darkIcon: string;
  emoji: string;
  role: string;
  description: string;
  tools: string[];
}

export const TERRAMIND_AGENTS: Agent[] = [
  {
    id: 'agent_tf-devops-expert',
    name: 'Terraform DevOps',
    icon: '/agents/Terraform.png',
    darkIcon: '/agents/terraform_dark.png',
    emoji: '🏗️',
    role: 'Principal Cloud Architect',
    description: 'Writes modular, secure, and validated Terraform HCL code with automated formatting and security gates.',
    tools: ['terraform-registry', 'local-fs', 'tf-runner']
  },
  {
    id: 'agent_finops-cost-optimizer',
    name: 'FinOps Cost Optimizer',
    icon: '/agents/FinOps.png',
    darkIcon: '/agents/FinOps_dark.png',
    emoji: '💰',
    role: 'Cloud Economist',
    description: 'Analyzes IaC, provides multi-cloud cost comparisons (AWS vs GCP vs Azure), and recommends Spot/Graviton savings.',
    tools: ['local-fs', 'terraform-registry']
  },
  {
    id: 'agent_k8s-gitops-architect',
    name: 'Kubernetes Platform',
    icon: '/agents/K8s.png',
    darkIcon: '/agents/k8s_dark.png',
    emoji: '☸️',
    role: 'K8s & GitOps Architect',
    description: 'Designs production Kubernetes manifests, QoS sizing, health probes, Helm charts, and GitOps rollouts.',
    tools: ['local-fs']
  },
  {
    id: 'agent_cicd-pipeline-engineer',
    name: 'CI/CD Engineer',
    icon: '/agents/CICD.png',
    darkIcon: '/agents/CICD_dark.png',
    emoji: '🔄',
    role: 'CI/CD & DevOps Engineer',
    description: 'Automates end-to-end continuous integration and delivery pipelines, automated testing, releases, and deployments.',
    tools: ['local-fs']
  }
];

export function getAgentIcon(agent: Agent, theme: 'light' | 'dark' = 'light'): string {
  return theme === 'dark' && agent.darkIcon ? agent.darkIcon : agent.icon;
}

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  theme?: 'light' | 'dark';
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgentId,
  onSelectAgent,
  theme = 'light'
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
            <img
              src={getAgentIcon(agent, theme)}
              alt={agent.name}
              style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '4px' }}
            />
            <span>{agent.name}</span>
          </button>
        ))}
      </div>
      <div className="agent-info-bar">
        <span className="agent-badge">{currentAgent.role}</span>
        <span>{currentAgent.description}</span>
      </div>
    </div>
  );
};
