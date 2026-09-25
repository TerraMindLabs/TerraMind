import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemPrompt, AGENT_PROMPTS } from '../routes/agent-prompts';

describe('Agent Prompts & Execution Rules Tests', () => {
  test('1. All 4 specialized DevOps agents are configured with distinct identities', () => {
    const requiredAgents = [
      'agent_tf-devops-expert',
      'agent_finops-cost-optimizer',
      'agent_k8s-gitops-architect',
      'agent_cicd-pipeline-engineer'
    ];

    for (const agentId of requiredAgents) {
      assert.ok(AGENT_PROMPTS[agentId], `Agent ${agentId} must exist in AGENT_PROMPTS`);
      assert.ok(AGENT_PROMPTS[agentId].instructions.length > 100, `Agent ${agentId} must have detailed instructions`);
    }

    // Verify Terraform agent claims Terraform expertise
    assert.match(AGENT_PROMPTS['agent_tf-devops-expert'].instructions, /expert in Terraform/i);

    // Verify K8s agent claims Kubernetes & container orchestration
    assert.match(AGENT_PROMPTS['agent_k8s-gitops-architect'].instructions, /Kubernetes/i);

    // Verify FinOps agent claims cloud cost optimization
    assert.match(AGENT_PROMPTS['agent_finops-cost-optimizer'].instructions, /FinOps|cost/i);

    // Verify CI/CD agent claims pipelines & delivery
    assert.match(AGENT_PROMPTS['agent_cicd-pipeline-engineer'].instructions, /CI\/CD|pipelines/i);
  });

  test('2. Global Workspace prompt enforces Rule #2: Folder/Project confirmation before code generation', () => {
    const prompt = buildSystemPrompt('agent_k8s-gitops-architect');

    assert.match(prompt, /Global Workspace/i);
    assert.match(prompt, /PROJECT \/ FOLDER CONFIRMATION/i);
    assert.match(prompt, /Would you like to store this in a dedicated project or folder name/i);
  });

  test('3. Project workspace prompt injects active project context and target directory', () => {
    const prompt = buildSystemPrompt('agent_tf-devops-expert', {
      name: 'Production EKS Cluster',
      description: 'Multi-AZ Kubernetes cluster on AWS',
      workspacePath: 'D:\\TerraMind\\workspace',
      files: [
        { name: 'eks/main.tf', size: 1200 },
        { name: 'eks/variables.tf', size: 450 }
      ]
    });

    assert.match(prompt, /Production EKS Cluster/);
    assert.match(prompt, /Multi-AZ Kubernetes cluster on AWS/);
    assert.match(prompt, /eks\/main\.tf/);
  });

  test('4. Anti-looping and anti-fragmentation rules are strictly enforced in system prompt', () => {
    const prompt = buildSystemPrompt('agent_tf-devops-expert');

    assert.match(prompt, /ONE COMPLETE FILE PER CODE BLOCK \(NO LOOPS\)/i);
    assert.match(prompt, /NEVER write '\(continued\)' blocks/i);
    assert.match(prompt, /NEVER output duplicate files/i);
    assert.match(prompt, /CONCISE & TARGETED SCOPE/i);
  });
});
