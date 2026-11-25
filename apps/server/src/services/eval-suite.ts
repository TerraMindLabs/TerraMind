import { buildSystemPrompt } from '../routes/agent-prompts';
import { getAllSettings } from '../db';
import { getOllamaBaseUrl } from './ollama';
import { writeWorkspaceFile } from './terraform';
import { runStructuredVerificationForFiles } from './devops-tools';

export interface EvalCase {
  id: string;
  title: string;
  agentId: string;
  category: 'terraform' | 'kubernetes' | 'cicd' | 'finops';
  prompt: string;
  checks: string[];
}

export const EVAL_BENCHMARKS: EvalCase[] = [
  {
    id: 'tf-vpc-3tier',
    title: '3-Tier Production AWS VPC',
    agentId: 'agent_tf-devops-expert',
    category: 'terraform',
    prompt: 'Create a modular AWS 3-tier VPC in folder eval-vpc with public, private, and isolated DB subnets across 2 AZs.',
    checks: ['terraform validate', 'tflint', 'trivy']
  },
  {
    id: 'tf-s3-encrypted',
    title: 'Hardened S3 Bucket with KMS & Public Block',
    agentId: 'agent_tf-devops-expert',
    category: 'terraform',
    prompt: 'Create an AWS S3 bucket in folder eval-s3 with KMS encryption, versioning, and full public access block.',
    checks: ['terraform validate', 'tflint', 'trivy']
  },
  {
    id: 'tf-rds-postgres',
    title: 'Multi-AZ RDS PostgreSQL',
    agentId: 'agent_tf-devops-expert',
    category: 'terraform',
    prompt: 'Create an AWS RDS PostgreSQL instance in folder eval-rds with storage encryption, backup retention, and no hardcoded passwords.',
    checks: ['terraform validate', 'tflint', 'trivy']
  },
  {
    id: 'tf-eks-oidc',
    title: 'Managed EKS Cluster with OIDC',
    agentId: 'agent_tf-devops-expert',
    category: 'terraform',
    prompt: 'Create an AWS EKS cluster in folder eval-eks with managed node groups and IAM OIDC provider.',
    checks: ['terraform validate', 'tflint', 'trivy']
  },
  {
    id: 'tf-state-backend',
    title: 'Remote State S3 + DynamoDB Lock',
    agentId: 'agent_tf-devops-expert',
    category: 'terraform',
    prompt: 'Create a Terraform remote state bootstrap in folder eval-state with encrypted S3 bucket and DynamoDB lock table.',
    checks: ['terraform validate', 'trivy']
  },
  {
    id: 'k8s-hardened-deploy',
    title: 'Hardened K8s Deployment + HPA + PDB',
    agentId: 'agent_k8s-gitops-architect',
    category: 'kubernetes',
    prompt: 'Generate a hardened Kubernetes Deployment, HPA, and PodDisruptionBudget in folder eval-k8s with non-root securityContext and probes.',
    checks: ['kubeconform', 'trivy']
  },
  {
    id: 'k8s-network-policy',
    title: 'Zero-Trust Default-Deny NetworkPolicy',
    agentId: 'agent_k8s-gitops-architect',
    category: 'kubernetes',
    prompt: 'Generate a default-deny Kubernetes NetworkPolicy and ingress allow rule in folder eval-netpol.',
    checks: ['kubeconform', 'trivy']
  },
  {
    id: 'k8s-helm-chart',
    title: 'Production Helm Chart',
    agentId: 'agent_k8s-gitops-architect',
    category: 'kubernetes',
    prompt: 'Generate a production Helm chart (Chart.yaml, values.yaml, templates/deployment.yaml) in folder eval-helm.',
    checks: ['helm lint', 'trivy']
  },
  {
    id: 'k8s-statefulset',
    title: 'StatefulSet with PVC & Probes',
    agentId: 'agent_k8s-gitops-architect',
    category: 'kubernetes',
    prompt: 'Generate a Kubernetes StatefulSet and headless Service in folder eval-sts with resource requests/limits and probes.',
    checks: ['kubeconform', 'trivy']
  },
  {
    id: 'cicd-gha-oidc',
    title: 'GitHub Actions Terraform OIDC Pipeline',
    agentId: 'agent_cicd-pipeline-engineer',
    category: 'cicd',
    prompt: 'Generate a .github/workflows/terraform.yml pipeline with AWS OIDC auth, concurrency lock, fmt check, Trivy scan, and PR plan comment.',
    checks: ['actionlint', 'trivy']
  },
  {
    id: 'cicd-k8s-deploy',
    title: 'GitHub Actions Helm & Trivy Pipeline',
    agentId: 'agent_cicd-pipeline-engineer',
    category: 'cicd',
    prompt: 'Generate a .github/workflows/k8s-deploy.yml pipeline with helm lint, Trivy image scan, and manual production approval.',
    checks: ['actionlint', 'trivy']
  },
  {
    id: 'finops-multicloud',
    title: 'Multi-Cloud EKS vs GKE vs AKS Cost Matrix',
    agentId: 'agent_finops-cost-optimizer',
    category: 'finops',
    prompt: 'Compare monthly costs for a 6-node Kubernetes workload on AWS EKS (Graviton) vs GCP GKE vs Azure AKS with storage and NAT egress.',
    checks: ['structured-table']
  }
];

export interface EvalCaseResult {
  id: string;
  title: string;
  category: string;
  firstPassPassed: boolean;
  postCorrectionPassed: boolean;
  filesGenerated: number;
  errorCount: number;
  durationMs: number;
  details: string;
}

async function generateOnce(provider: 'ollama' | 'cloud', model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const settings = getAllSettings();
  if (provider === 'ollama') {
    const baseUrl = getOllamaBaseUrl();
    const resp = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'qwen2.5-coder:3b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        options: { temperature: 0.1, num_ctx: 16384 },
        stream: false
      })
    });
    if (!resp.ok) throw new Error(`Ollama error ${resp.status}`);
    const data = (await resp.json()) as any;
    return data?.message?.content || '';
  }

  const geminiKey = settings['gemini_api_key'] || process.env.GEMINI_API_KEY;
  if (geminiKey && (!model || model.startsWith('gemini-'))) {
    const targetM = model || 'gemini-2.5-flash';
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetM}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
        })
      }
    );
    if (!resp.ok) throw new Error(`Gemini error ${resp.status}`);
    const data = (await resp.json()) as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  throw new Error('No configured model/API key available for evaluation.');
}

function extractFilesForEval(markdown: string): Array<{ filename: string; content: string }> {
  const files: Array<{ filename: string; content: string }> = [];
  const regex = /```(?:hcl|terraform|tf|yaml|yml|json)?\s*\n([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(markdown)) !== null) {
    const code = m[1];
    const firstLine = code.trim().split('\n')[0].trim();
    const match = firstLine.match(/^(?:#|\/\/)\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)/);
    if (match) {
      files.push({ filename: match[1].trim(), content: code });
    }
  }
  return files;
}

export async function runEvalBenchmarkSuite(options: {
  provider?: 'ollama' | 'cloud';
  model?: string;
  caseIds?: string[];
}): Promise<{
  provider: string;
  model: string;
  totalCases: number;
  firstPassRate: number;
  postCorrectionPassRate: number;
  results: EvalCaseResult[];
}> {
  const provider = options.provider || 'ollama';
  const model = options.model || (provider === 'ollama' ? 'qwen2.5-coder:3b' : 'gemini-2.5-flash');
  const selectedCases = options.caseIds?.length
    ? EVAL_BENCHMARKS.filter((c) => options.caseIds!.includes(c.id))
    : EVAL_BENCHMARKS.slice(0, 4); // Default quick suite of 4 representative cases across domains

  const results: EvalCaseResult[] = [];

  for (const c of selectedCases) {
    const start = Date.now();
    try {
      const sysPrompt = buildSystemPrompt(c.agentId);
      const output = await generateOnce(provider, model, sysPrompt, c.prompt);

      if (c.category === 'finops') {
        const hasTable = output.includes('|') && /aws|gcp|azure/i.test(output);
        results.push({
          id: c.id,
          title: c.title,
          category: c.category,
          firstPassPassed: hasTable,
          postCorrectionPassed: hasTable,
          filesGenerated: 0,
          errorCount: hasTable ? 0 : 1,
          durationMs: Date.now() - start,
          details: hasTable ? 'Multi-cloud comparison table generated' : 'Missing comparison table'
        });
        continue;
      }

      const files = extractFilesForEval(output);
      const relPaths: string[] = [];
      for (const f of files) {
        const w = await writeWorkspaceFile(`evals/${c.id}/${f.filename}`, f.content);
        relPaths.push(w.relPath);
      }

      if (relPaths.length === 0) {
        results.push({
          id: c.id,
          title: c.title,
          category: c.category,
          firstPassPassed: false,
          postCorrectionPassed: false,
          filesGenerated: 0,
          errorCount: 1,
          durationMs: Date.now() - start,
          details: 'No named code blocks extracted'
        });
        continue;
      }

      const v1 = await runStructuredVerificationForFiles(relPaths);
      let firstPassPassed = !v1.hasErrors;
      let postCorrectionPassed = firstPassPassed;
      let finalErrors = v1.structuredErrors.length;

      if (v1.hasErrors) {
        const fixOut = await generateOnce(
          provider,
          model,
          sysPrompt,
          `Fix these structured JSON errors and output corrected complete file blocks:\n\`\`\`json\n${v1.summaryText}\n\`\`\``
        );
        const fixedFiles = extractFilesForEval(fixOut);
        const fixedPaths: string[] = [];
        for (const ff of fixedFiles) {
          const w = await writeWorkspaceFile(`evals/${c.id}/${ff.filename}`, ff.content);
          fixedPaths.push(w.relPath);
        }
        if (fixedPaths.length > 0) {
          const v2 = await runStructuredVerificationForFiles(fixedPaths);
          postCorrectionPassed = !v2.hasErrors;
          finalErrors = v2.structuredErrors.length;
        }
      }

      results.push({
        id: c.id,
        title: c.title,
        category: c.category,
        firstPassPassed,
        postCorrectionPassed,
        filesGenerated: relPaths.length,
        errorCount: finalErrors,
        durationMs: Date.now() - start,
        details: postCorrectionPassed ? 'Passed deterministic CLI checks' : `${finalErrors} check group(s) failed`
      });
    } catch (err: any) {
      results.push({
        id: c.id,
        title: c.title,
        category: c.category,
        firstPassPassed: false,
        postCorrectionPassed: false,
        filesGenerated: 0,
        errorCount: 1,
        durationMs: Date.now() - start,
        details: err.message || 'Eval failed'
      });
    }
  }

  const total = results.length || 1;
  const firstPassRate = Math.round((results.filter((r) => r.firstPassPassed).length / total) * 100);
  const postCorrectionPassRate = Math.round((results.filter((r) => r.postCorrectionPassed).length / total) * 100);

  return {
    provider,
    model,
    totalCases: results.length,
    firstPassRate,
    postCorrectionPassRate,
    results
  };
}
