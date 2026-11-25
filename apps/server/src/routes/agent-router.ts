export interface AgentRouteResult {
  agentId: string;
  agentName: string;
  reason: 'mention' | 'auto' | 'selected';
  mentionToken: string | null;
}

const AGENT_NAMES: Record<string, string> = {
  'agent_tf-devops-expert': 'Terraform DevOps',
  'agent_finops-cost-optimizer': 'FinOps Cost Optimizer',
  'agent_k8s-gitops-architect': 'Kubernetes Platform',
  'agent_cicd-pipeline-engineer': 'CI/CD Engineer'
};

const MENTION_ALIASES: Array<{ regex: RegExp; agentId: string }> = [
  { regex: /(?:^|\s)(@(?:terraform|tf|iac))\b/i, agentId: 'agent_tf-devops-expert' },
  { regex: /(?:^|\s)(@(?:finops|cost|pricing))\b/i, agentId: 'agent_finops-cost-optimizer' },
  { regex: /(?:^|\s)(@(?:k8s|kubernetes|helm|gitops))\b/i, agentId: 'agent_k8s-gitops-architect' },
  { regex: /(?:^|\s)(@(?:cicd|pipeline|github|gitlab|actions))\b/i, agentId: 'agent_cicd-pipeline-engineer' }
];

export function parseAgentMention(text: string): { agentId: string | null; mentionToken: string | null } {
  for (const entry of MENTION_ALIASES) {
    const match = text.match(entry.regex);
    if (match) {
      return { agentId: entry.agentId, mentionToken: match[1] };
    }
  }
  return { agentId: null, mentionToken: null };
}

/**
 * Routes a user prompt to the best-suited TerraMind specialist agent.
 * Explicit @mentions always take priority; when requestedAgentId is 'auto' (or omitted),
 * keyword scoring selects the matching specialist so all code-generation rules apply.
 */
export function routePromptToAgent(prompt: string, requestedAgentId?: string): AgentRouteResult {
  const mention = parseAgentMention(prompt);
  if (mention.agentId) {
    return {
      agentId: mention.agentId,
      agentName: AGENT_NAMES[mention.agentId] || 'Terraform DevOps',
      reason: 'mention',
      mentionToken: mention.mentionToken
    };
  }

  if (requestedAgentId && requestedAgentId !== 'auto' && AGENT_NAMES[requestedAgentId]) {
    return {
      agentId: requestedAgentId,
      agentName: AGENT_NAMES[requestedAgentId],
      reason: 'selected',
      mentionToken: null
    };
  }

  const lower = prompt.toLowerCase();

  const scores: Record<string, number> = {
    'agent_tf-devops-expert': 0,
    'agent_finops-cost-optimizer': 0,
    'agent_k8s-gitops-architect': 0,
    'agent_cicd-pipeline-engineer': 0
  };

  const finopsPatterns = [
    /\bcost\b/, /\bpric(e|ing)\b/, /\bbudget\b/, /\bbill\b/, /\bsave\b/, /\bsavings\b/,
    /\brightsiz/, /\bgraviton\b/, /\bspot\b/, /\binfracost\b/, /\btco\b/, /\bfinops\b/,
    /\bcompare\b.*\b(aws|gcp|azure)\b/, /\baws vs gcp\b/, /\breserved instance\b/
  ];
  for (const p of finopsPatterns) {
    if (p.test(lower)) scores['agent_finops-cost-optimizer'] += 2;
  }

  const k8sPatterns = [
    /\bkubernetes\b/, /\bk8s\b/, /\bhelm\b/, /\bpod\b/, /\bdeployment\b/, /\bstatefulset\b/,
    /\bhpa\b/, /\bpdb\b/, /\bnetworkpolicy\b/, /\bingress\b/, /\bargocd\b/, /\bflux\b/,
    /\bkubeconform\b/, /\bkubectl\b/, /\bmanifest/, /\bchart\b/, /\bnamespace\b/
  ];
  for (const p of k8sPatterns) {
    if (p.test(lower)) scores['agent_k8s-gitops-architect'] += 2;
  }

  const cicdPatterns = [
    /\bci\/cd\b/, /\bcicd\b/, /\bgithub actions?\b/, /\bgitlab ci\b/, /\bworkflow\b/,
    /\bpipeline\b/, /\boidc\b/, /\bactionlint\b/, /\bblue\/green\b/, /\bcanary\b/,
    /\bsemantic release\b/, /\.github\/workflows/, /\.gitlab-ci/
  ];
  for (const p of cicdPatterns) {
    if (p.test(lower)) scores['agent_cicd-pipeline-engineer'] += 2;
  }

  const tfPatterns = [
    /\bterraform\b/, /\bopentofu\b/, /\btofu\b/, /\bhcl\b/, /\bvpc\b/, /\bs3\b/, /\brds\b/,
    /\beks\b/, /\biam\b/, /\bsubnet\b/, /\bprovider\b/, /\bmodule\b/, /\bstate\b/,
    /\btrivy\b/, /\btflint\b/, /\bcheckov\b/, /\b\.tf\b/, /\bec2\b/, /\bsecurity group\b/
  ];
  for (const p of tfPatterns) {
    if (p.test(lower)) scores['agent_tf-devops-expert'] += 2;
  }

  let bestAgent = 'agent_tf-devops-expert';
  let bestScore = scores['agent_tf-devops-expert'];
  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestAgent = id;
    }
  }

  return {
    agentId: bestAgent,
    agentName: AGENT_NAMES[bestAgent],
    reason: 'auto',
    mentionToken: null
  };
}
