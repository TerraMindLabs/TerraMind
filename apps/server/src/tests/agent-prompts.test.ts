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

  test('2. Global Workspace prompt enforces Rule #2: Folder & Architecture inquiry before code generation', () => {
    const prompt = buildSystemPrompt('agent_k8s-gitops-architect');

    assert.match(prompt, /Global Workspace/i);
    assert.match(prompt, /PRE-GENERATION INQUIRY/i);
    assert.match(prompt, /Would you like to store this in a dedicated project or folder name/i);
    assert.match(prompt, /Direct Resource-level code/i);
    assert.match(prompt, /Reusable Module-level code/i);
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

    assert.match(prompt, /ONE COMPLETE FILE PER CODE BLOCK/i);
    assert.match(prompt, /NEVER write '\(continued\)' blocks/i);
    assert.match(prompt, /NEVER output duplicate files/i);
    assert.match(prompt, /CONCISE & TARGETED SCOPE/i);
  });

  test('5. Terraform DevOps Expert enforces strict multi-file standards (forbids monolithic main.tf)', () => {
    const tfPrompt = AGENT_PROMPTS['agent_tf-devops-expert'].instructions;

    assert.match(tfPrompt, /STRICT MULTI-FILE ARCHITECTURE/i);
    assert.match(tfPrompt, /FORBID MONOLITHIC main\.tf/i);
    assert.match(tfPrompt, /providers\.tf/);
    assert.match(tfPrompt, /variables\.tf/);
    assert.match(tfPrompt, /main\.tf/);
    assert.match(tfPrompt, /outputs\.tf/);
    assert.match(tfPrompt, /terraform\.tfvars\.example/);
  });

  test('6. Terraform DevOps prompt enforces mandatory inquiry for Folder and Resource vs Module level', () => {
    const tfPrompt = AGENT_PROMPTS['agent_tf-devops-expert'].instructions;

    assert.match(tfPrompt, /Project Folder/i);
    assert.match(tfPrompt, /Direct Resource-level code/i);
    assert.match(tfPrompt, /Reusable Module-level code/i);
  });

  test('7. System prompt injects active Model Context Protocol (MCP) servers and tools', () => {
    const testMcpServers = [
      {
        id: 'terraform-registry',
        name: 'Terraform Registry MCP',
        description: 'Official HashiCorp Terraform Registry connector',
        transport: 'stdio' as const,
        enabled: true,
        status: 'active' as const,
        tools: [
          { name: 'search_modules', description: 'Search Terraform Registry' },
          { name: 'get_provider_schema', description: 'Retrieve HCL schema' }
        ]
      }
    ];

    const prompt = buildSystemPrompt('agent_tf-devops-expert', undefined, testMcpServers);

    assert.match(prompt, /ACTIVE MODEL CONTEXT PROTOCOL \(MCP\) INTEGRATIONS/);
    assert.match(prompt, /Terraform Registry MCP/);
    assert.match(prompt, /search_modules/);
    assert.match(prompt, /get_provider_schema/);
  });
});
