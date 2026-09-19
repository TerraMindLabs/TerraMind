try { require('dotenv').config(); } catch (e) {}
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TerraMind";
const client = new MongoClient(uri);

function formatMcpTools(serverNames) {
  const tools = [];
  for (const name of serverNames) {
    tools.push(`sys__server__sys_mcp_${name}`);
    tools.push(`sys__all__sys_mcp_${name}`);
  }
  return tools;
}

const SKILLS = [
  {
    name: "tf-remote-state-backend",
    displayTitle: "Terraform Remote State & Distributed Locking",
    description: "Use when bootstrapping, configuring, or migrating Terraform state to remote cloud backends (AWS S3 + DynamoDB, GCP GCS, or Azure Blob Storage) with encryption, versioning, and distributed locking.",
    body: `# Terraform Remote State & Distributed Locking Playbook

## Purpose
Establishes a hardened remote backend with distributed state locking to eliminate local state drift, prevent team concurrency collisions, and protect infrastructure state with server-side encryption.

## 1. AWS S3 + DynamoDB Backend Architecture
Create an isolated bootstrap configuration to establish the state bucket and locking table:

\`\`\`hcl
# backend-bootstrap.tf
resource "aws_kms_key" "tf_state_key" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "tf_state" {
  bucket        = "terramind-tf-state-\${var.account_id}-\${var.region}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "tf_state_ver" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state_crypto" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.tf_state_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state_private" {
  bucket                  = aws_s3_bucket.tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tf_locks" {
  name         = "terramind-tf-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
\`\`\`

## 2. Consuming the Remote Backend
Declare inside \`providers.tf\` or \`backend.tf\`:
\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "terramind-tf-state-<account-id>-<region>"
    key            = "environments/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terramind-tf-state-locks"
    encrypt        = true
  }
}
\`\`\`

## 3. Safe State Migration Runbook
When migrating existing local state (\`terraform.tfstate\`) to S3:
1. Ensure no teammates are executing operations.
2. Add the \`backend "s3"\` block.
3. Run \`terraform init -migrate-state\`.
4. Confirm \`yes\` when prompted to copy existing state to the new backend.
5. Inspect remote state: \`terraform state list\`.
6. Remove or gitignore local \`.tfstate\` and \`.tfstate.backup\` files.

## 4. Emergency Lock Clearance
If a pipeline crashes leaving a lock lingering in DynamoDB:
\`\`\`bash
terraform force-unlock <LOCK-ID>
\`\`\``
  },
  {
    name: "aws-production-vpc-3tier",
    displayTitle: "AWS 3-Tier Production VPC Architecture",
    description: "Use when designing, calculating CIDR subnets, and provisioning a highly available, secure 3-tier AWS VPC (public, private app, isolated database) across multiple Availability Zones.",
    body: `# AWS 3-Tier Production VPC Blueprint

## Purpose
Provides a production-grade VPC topology dividing network resources across 3 availability zones into Public (ALB/NAT), Private App (Compute/EKS/ECS), and Isolated Database tiers with zero direct internet routing.

## 1. CIDR Allocation Plan (/16 VPC Example)
* Base VPC CIDR: \`10.0.0.0/16\` (65,536 IPs)
* Public Tier (\`/20\` per AZ):
  - AZ-a: \`10.0.0.0/20\` (4,096 IPs)
  - AZ-b: \`10.0.16.0/20\`
  - AZ-c: \`10.0.32.0/20\`
* Private App Tier (\`/19\` per AZ):
  - AZ-a: \`10.0.64.0/19\` (8,192 IPs)
  - AZ-b: \`10.0.96.0/19\`
  - AZ-c: \`10.0.128.0/19\`
* Isolated Database Tier (\`/22\` per AZ):
  - AZ-a: \`10.0.160.0/22\` (1,024 IPs)
  - AZ-b: \`10.0.164.0/22\`
  - AZ-c: \`10.0.168.0/22\`

## 2. Route Table Isolation
* **Public Route Table**: \`0.0.0.0/0\` -> Internet Gateway (\`aws_internet_gateway\`).
* **Private App Route Table**: \`0.0.0.0/0\` -> NAT Gateway (\`aws_nat_gateway\`).
  * High-Availability: 1 NAT Gateway per AZ (3 total).
  * Cost-Optimized Dev: 1 shared NAT Gateway in AZ-a.
* **Database Route Table**: No default route (\`0.0.0.0/0\`). Local VPC peering and transit routes only.

## 3. Required VPC Endpoints (Cost & Security Optimization)
Route AWS internal service traffic privately without traversing NAT Gateway:
* \`com.amazonaws.<region>.s3\` (Gateway Endpoint - Free)
* \`com.amazonaws.<region>.dynamodb\` (Gateway Endpoint - Free)
* \`com.amazonaws.<region>.ecr.api\` & \`ecr.dkr\` (Interface Endpoint)

## 4. Kubernetes EKS Tagging Standards
Apply to subnets to ensure AWS Load Balancer Controller functions automatically:
* Public Subnets: \`kubernetes.io/role/elb = 1\`
* Private Subnets: \`kubernetes.io/role/internal-elb = 1\`
* All Subnets: \`kubernetes.io/cluster/<cluster-name> = shared\``
  },
  {
    name: "tf-module-scaffolding",
    displayTitle: "Terraform Reusable Module Blueprint",
    description: "Use when scaffolding, packaging, and standardizing reusable Terraform child and root modules with input validation, output encapsulation, and documentation standards.",
    body: `# Terraform Reusable Module Blueprint

## Purpose
Establishes standardized layout, variable validation rules, output contracts, and documentation patterns for reusable Terraform modules across teams.

## 1. Directory Structure
\`\`\`
modules/<module-name>/
├── README.md             # Generated via terraform-docs
├── main.tf               # Core resources only
├── variables.tf          # Inputs with type, description, validation
├── outputs.tf            # All exposed attributes and objects
├── versions.tf           # Pinned core & provider constraints
└── examples/
    └── complete/         # Working end-to-end usage example
\`\`\`

## 2. Variable Validation Best Practices
Always constrain inputs with strict types and semantic validation blocks:
\`\`\`hcl
variable "environment" {
  type        = string
  description = "Target deployment environment tier."
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "database_port" {
  type        = number
  default     = 5432
  description = "TCP port for database traffic."
  validation {
    condition     = var.database_port > 1024 && var.database_port <= 65535
    error_message = "Port must be an unprivileged port between 1025 and 65535."
  }
}
\`\`\`

## 3. Encapsulated Outputs Pattern
Expose both direct values and the full resource object for future-proofing:
\`\`\`hcl
output "id" {
  description = "Primary resource identifier."
  value       = aws_vpc.main.id
}

output "arn" {
  description = "Primary resource ARN."
  value       = aws_vpc.main.arn
}

output "resource" {
  description = "Complete underlying resource object."
  value       = aws_vpc.main
}
\`\`\`

## 4. Anti-Patterns to Avoid
* Never declare \`provider "aws" {}\` blocks inside child modules (only in root).
* Never hardcode AWS Account IDs, KMS ARNs, or region names.
* Never leave \`description\` empty in variables or outputs.`
  },
  {
    name: "k8s-workload-hardening",
    displayTitle: "Kubernetes Workload Production Hardening",
    description: "Use when hardening Kubernetes Deployments, Pods, and StatefulSets for high availability, non-root security contexts, resource QoS sizing, and zero-downtime rolling updates.",
    body: `# Kubernetes Workload Production Hardening

## Purpose
Transforms bare Kubernetes manifests into hardened, battle-tested production workloads resilient against node evictions, CPU throttling, and security privilege escalations.

## 1. Hardened Security Context
\`\`\`yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
\`\`\`

## 2. Resource QoS & Preventing OOMKilled
\`\`\`yaml
resources:
  requests:
    cpu: "250m"
    memory: "512Mi"
  limits:
    cpu: "1000m"     # 4x request for bursting, avoids CPU throttling
    memory: "512Mi"   # Same as request: avoids node overcommit evictions
\`\`\`

## 3. Zero-Downtime Rolling Update & Lifecycle Hook
\`\`\`yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: app
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
\`\`\`

## 4. Three-Tier Probe Sizing
\`\`\`yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 5
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  timeoutSeconds: 2
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 15
  timeoutSeconds: 3
\`\`\`

## 5. PodDisruptionBudget (PDB)
\`\`\`yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-service
\`\`\``
  },
  {
    name: "k8s-zero-trust-network-policy",
    displayTitle: "Kubernetes Zero-Trust NetworkPolicies",
    description: "Use when enforcing zero-trust pod isolation, default-deny traffic rules, and least-privilege ingress/egress policies between microservice tiers.",
    body: `# Kubernetes Zero-Trust NetworkPolicies

## Purpose
Prevents lateral movement inside a Kubernetes cluster by locking down pod-to-pod networking using declarative NetworkPolicies.

## 1. Baseline: Default-Deny All Namespace Traffic
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
\`\`\`

## 2. Allow Core DNS Egress
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-kube-dns
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
\`\`\`

## 3. Tiered Microservice Ingress Rule
Allow backend pods to only accept incoming traffic from the API gateway or frontend tier:
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: backend-service
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: frontend-service
      ports:
        - protocol: TCP
          port: 8080
\`\`\``
  },
  {
    name: "helm-production-chart-scaffolding",
    displayTitle: "Production Helm Chart Architecture & Templating",
    description: "Use when building, packaging, or refactoring production-ready Helm v3 charts with multi-environment values overrides, template helpers, and schema validation.",
    body: `# Production Helm Chart Architecture & Templating

## Purpose
Delivers a standardized Helm v3 chart blueprint optimized for GitOps deployments, multi-stage value overrides, and strict JSON Schema validation.

## 1. Chart Layout
\`\`\`
my-chart/
├── Chart.yaml
├── values.yaml               # Default base configurations
├── values-dev.yaml           # Dev overrides (small replica, debug)
├── values-prod.yaml          # Prod overrides (HPA, HA, PDB)
├── values.schema.json        # Strict input validation
└── templates/
    ├── _helpers.tpl          # Canonical label and naming macros
    ├── deployment.yaml
    ├── service.yaml
    ├── serviceaccount.yaml
    ├── hpa.yaml
    └── ingress.yaml
\`\`\`

## 2. Standardized _helpers.tpl
\`\`\`tpl
{{/* Expand chart name */}}
{{- define "my-chart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels */}}
{{- define "my-chart.labels" -}}
helm.sh/chart: {{ include "my-chart.chart" . }}
{{ include "my-chart.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* Selector labels */}}
{{- define "my-chart.selectorLabels" -}}
app.kubernetes.io/name: {{ include "my-chart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
\`\`\`

## 3. Schema Validation (values.schema.json)
\`\`\`json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "properties": {
    "replicaCount": { "type": "integer", "minimum": 1 },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": { "type": "string" },
        "tag": { "type": "string" }
      }
    }
  },
  "required": ["replicaCount", "image"]
}
\`\`\``
  },
  {
    name: "cicd-github-actions-terraform",
    displayTitle: "GitHub Actions Secure Terraform & OIDC Pipeline",
    description: "Use when configuring enterprise GitHub Actions CI/CD workflows for Terraform with passwordless Cloud OIDC authentication, automated PR plan comments, and concurrency state locking.",
    body: `# GitHub Actions Secure Terraform & OIDC Pipeline

## Purpose
Provides an enterprise GitHub Actions workflow implementing keyless AWS/GCP OIDC authentication, speculative PR plan feedback, and concurrency-locked deployment.

## 1. OIDC Identity Federation (No Static Keys)
\`\`\`yaml
name: "Terraform Pipeline"
on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

permissions:
  id-token: write   # Required for requesting JWT from GitHub OIDC
  contents: read
  pull-requests: write

concurrency:
  group: terraform-\${{ github.ref }}
  cancel-in-progress: false # Never interrupt a live apply!
\`\`\`

## 2. PR Validation & Plan Stage
\`\`\`yaml
jobs:
  validate_and_plan:
    name: "Validate & Speculative Plan"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsTerraformRole
          aws-region: us-east-1

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Format Check
        run: terraform fmt -check

      - name: Terraform Init
        run: terraform init

      - name: Security Scan (tfsec)
        uses: aquasecurity/tfsec-action@v1.0.0

      - name: Terraform Plan
        id: plan
        if: github.event_name == 'pull_request'
        run: |
          terraform plan -no-color -out=tfplan > plan.txt
        continue-on-error: false

      - name: Comment Plan on PR
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('plan.txt', 'utf8');
            const output = \`#### Terraform Plan Summary 📖\\n\` +
              \`\\\`\\\`\\\`hcl\\n\` + plan.slice(0, 60000) + \`\\n\\\`\\\`\\\`\`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });
\`\`\``
  },
  {
    name: "finops-multicloud-cost-optimization",
    displayTitle: "Multi-Cloud FinOps Sizing & Cost Analysis",
    description: "Use when auditing cloud infrastructure costs, rightsizing compute/storage across AWS, GCP, and Azure, and migrating workloads to Spot and ARM/Graviton instances.",
    body: `# Multi-Cloud FinOps Sizing & Cost Analysis

## Purpose
Actionable FinOps runbook to immediately reduce cloud infrastructure spend by 30-60% across compute, storage, databases, and network egress.

## 1. Cross-Cloud Architecture Equivalence Matrix
| Tier | AWS Architecture | GCP Equivalent | Azure Equivalent | Expected Savings / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Compute (ARM)** | \`c7g.xlarge\` (Graviton3) | \`c3a-standard-4\` (Tau T2A) | \`D4ps v5\` (Ampere) | **20-40%** better price/perf over x86 |
| **Database** | Aurora PostgreSQL Serverless v2 | Cloud SQL / AlloyDB | Azure Database Flexible Server | Scale down to 0.5 ACU during off-hours |
| **Block Storage** | EBS \`gp3\` (3000 IOPS base) | Persistent Disk \`Balanced\` | Managed Disk \`Standard SSD\` | **20%** cheaper than legacy \`gp2\` |
| **Object Storage** | S3 Intelligent-Tiering | Cloud Storage Autoclass | Blob Storage Lifecycle | Automatically eliminates idle tier costs |

## 2. Immediate Cost-Saving Quick Wins
1. **EBS gp2 to gp3 Migration**:
   - Change \`type = "gp2"\` to \`type = "gp3"\` in Terraform.
   - Result: Instant 20% cost reduction with zero downtime and higher baseline burst throughput.
2. **NAT Gateway Consolidation**:
   - Single NAT Gateway for non-prod environments saves ~$32/month per eliminated gateway + idle data processing fees.
3. **S3 Lifecycle Rules**:
   - Transition non-current versions to Glacier Instant Retrieval after 30 days; delete after 90 days.
4. **Spot Instances for Stateless Services**:
   - Configure EKS Managed Node Groups with Spot instances for non-critical pods (70-90% discount).`
  },
  {
    name: "finops-multicloud-cost-charts",
    displayTitle: "Multi-Cloud Cost Comparison Charts & FinOps TCO Matrix",
    description: "Use when generating side-by-side cost comparison tables, multi-cloud spend visual charts (AWS vs GCP vs Azure), 3-year TCO projections, and ROI break-even analysis.",
    body: `# Multi-Cloud Cost Comparison Charts & FinOps TCO Matrix

## Purpose
Provides standardized templates for generating side-by-side cost comparison tables, multi-cloud spend visual breakdown charts, 3-year Total Cost of Ownership (TCO) projections, and ROI break-even analysis across AWS, GCP, and Microsoft Azure.

## 1. Multi-Cloud Monthly Cost Comparison Matrix (Template)
Present cross-cloud costs in a clean, itemized comparative table with delta percentages:

| Infrastructure Layer | AWS (us-east-1) | GCP (us-central1) | Azure (East US) | Lowest Cost Leader | Architecture Trade-offs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Compute (4 vCPU / 16GB)** | $98.40/mo (\`c7g.xlarge\` Graviton) | $104.20/mo (\`c3a-standard-4\`) | $108.50/mo (\`D4ps v5\`) | **AWS** (Graviton3 price/perf) | ARM requires multi-arch Docker images |
| **Managed DB (HA 2-Node)** | $245.00/mo (Aurora Serverless v2) | $210.00/mo (Cloud SQL HA) | $225.00/mo (Azure Flex Server) | **GCP** (Lower baseline HA overhead) | Aurora scales down to 0.5 ACU off-peak |
| **Block Storage (500GB SSD)** | $40.00/mo (\`gp3\` 3000 IOPS) | $50.00/mo (\`pd-balanced\`) | $48.00/mo (\`Standard SSD\`) | **AWS** (gp3 baseline IOPS included) | GCP pd-balanced scales IOPS with size |
| **NAT Gateway & Egress** | $68.40/mo (1 NAT + 500GB egress) | $45.00/mo (Cloud NAT + egress) | $52.00/mo (NAT Gateway + egress) | **GCP** (Cloud NAT per-network pricing) | AWS charges per-AZ gateway hour |
| **Total Estimated Spend** | **$451.80/mo** | **$409.20/mo** | **$433.50/mo** | **GCP (-9.4%)** | *Prices reflect On-Demand benchmarks* |

## 2. Visual Spend Distribution Chart (ASCII / Markdown)
Visualize the monthly budget allocation to pinpoint high-spend drivers:

\`\`\`
SPEND BY COMPONENT (Monthly Allocation Breakdown):
Compute     [████████████████████░░░░░░░░░░] 48%  ($216.00)
Database    [████████████░░░░░░░░░░░░░░░░░░] 30%  ($135.00)
Networking  [██████░░░░░░░░░░░░░░░░░░░░░░░░] 14%  ($63.00)
Storage     [███░░░░░░░░░░░░░░░░░░░░░░░░░░░]  8%  ($36.00)
------------------------------------------------------------
Total: $450.00/mo | Target Post-Optimization: $292.00/mo (-35%)
\`\`\`

## 3. Commitment Discount & 3-Year TCO Comparison Chart
Model the long-term ROI across payment tiers:

| Strategy | Monthly Cost | 1-Year Total | 3-Year Total | Net Savings | Commitment Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **On-Demand** | $1,000/mo | $12,000 | $36,000 | Baseline (0%) | Zero commitment, maximum flexibility |
| **1-Yr Compute Savings Plan** | $720/mo | $8,640 | $25,920 | **28% ($10,080 saved)** | Low risk, covers steady-state baseline |
| **3-Yr Savings Plan (All Upfront)** | $460/mo | $5,520 | $16,560 | **54% ($19,440 saved)** | High commitment, best for core databases |
| **Spot Workload Mixed (70/30)** | $510/mo | $6,120 | $18,360 | **49% ($17,640 saved)** | Stateless batch/API with graceful drain |

## 4. Multi-Cloud Decision Flowchart
\`\`\`
Workload Scale Assessment
 ├── Low / Burstable (< 100 req/s) ──> Aurora Serverless / Cloud Run (Scale to zero)
 ├── Steady Enterprise Workload   ──> 1-Yr Savings Plan + ARM Instances (Graviton3 / Tau)
 └── High-Throughput Batch/Worker ──> Spot Instance Pool with 2-minute termination drain
\`\`\`
`
  },
  {
    name: "vault-secrets-cloud-integration",
    displayTitle: "Zero-Secret Architecture with Vault & Secrets Managers",
    description: "Use when eliminating static secrets and hardcoded credentials in Terraform and Kubernetes using HashiCorp Vault, AWS Secrets Manager, and External Secrets Operator (ESO).",
    body: `# Zero-Secret Architecture with Vault & External Secrets

## Purpose
Eliminates static passwords, API keys, and database tokens from Terraform code, state files, and Git repositories using automated dynamic secret injection.

## 1. Terraform AWS Secrets Manager Pattern
Never hardcode passwords in variables or tfvars:
\`\`\`hcl
resource "random_password" "db_password" {
  length  = 24
  special = false
}

resource "aws_secretsmanager_secret" "db_secret" {
  name                    = "production/app/database"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_secret_val" {
  secret_id     = aws_secretsmanager_secret.db_secret.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
  })
}
\`\`\`

## 2. Kubernetes External Secrets Operator (ESO)
Sync cloud secrets directly into native Kubernetes Secrets without exposing plaintext in Git:
\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-db-secret
  namespace: production
spec:
  refreshInterval: "1h"
  secretStoreRef:
    name: aws-secretsmanager-store
    kind: ClusterSecretStore
  target:
    name: app-db-k8s-secret
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: production/app/database
        property: password
\`\`\``
  },
  {
    name: "cloud-disaster-recovery-runbook",
    displayTitle: "Multi-Region Cloud Disaster Recovery Runbook",
    description: "Use when designing multi-region failover, automated backup policies, and disaster recovery architectures (RPO/RTO) for Terraform and Kubernetes workloads.",
    body: `# Multi-Region Cloud Disaster Recovery Runbook

## Purpose
Provides standardized disaster recovery (DR) architectures and recovery procedures balancing Recovery Point Objective (RPO) and Recovery Time Objective (RTO).

## 1. Disaster Recovery Tiers & SLA Benchmarks
| DR Strategy | Target RTO | Target RPO | Relative Cost | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Active-Active** | < 1 minute | Near 0 | 2.5x | Mission-critical financial/auth services |
| **Warm Standby** | < 15 minutes | < 5 minutes | 1.4x | Enterprise SaaS APIs |
| **Pilot Light** | < 30 minutes | < 15 minutes | 1.1x | Standard production workloads |
| **Backup & Restore** | < 4 hours | < 1 hour | 1.0x | Internal tools & dev environments |

## 2. Multi-Region Terraform State Synchronization
Configure cross-region S3 bucket replication:
\`\`\`hcl
resource "aws_s3_bucket_replication_configuration" "state_dr" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.primary_state.id

  rule {
    id     = "tf-state-cross-region-replication"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.secondary_state.arn
      storage_class = "STANDARD"
    }
  }
}
\`\`\`

## 3. Kubernetes Velero Backup Automation
Scheduled cluster state and volume snapshots:
\`\`\`yaml
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-cluster-backup
  namespace: velero
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  template:
    includedNamespaces:
      - production
    snapshotVolumes: true
    ttl: 720h # Retain for 30 days
\`\`\``
  }
];

async function run() {
  try {
    await client.connect();
    console.log("[MongoDB] Connected to TerraMind database.");
    const database = client.db("TerraMind");
    const agentsCollection = database.collection("agents");
    const usersCollection = database.collection("users");
    const targetCollections = ['aclentries', 'acl_entries'];

    // Fetch existing users
    const users = await usersCollection.find({}).toArray();
    const primaryUser = users.length > 0 ? users[0]._id : new ObjectId("000000000000000000000000");

    // Resolve target provider and model
    let targetProvider = process.env.AGENT_PROVIDER || "google";
    if (targetProvider.toLowerCase() === "custom" || targetProvider.toLowerCase() === "ollama") {
      targetProvider = "ollama";
    }
    let targetModel = process.env.AGENT_MODEL;
    if (!targetModel) {
      if (targetProvider === "ollama") {
        targetModel = "qwen2.5-coder:7b";
      } else if (targetProvider === "openAI") {
        targetModel = "gpt-4o-mini";
      } else if (targetProvider === "anthropic") {
        targetModel = "claude-3-5-sonnet-20241022";
      } else {
        targetModel = "gemini-3.5-flash-lite";
      }
    }
    console.log(`[MongoDB] Configuring agents with provider: '${targetProvider}', model: '${targetModel}'`);

    // Automatically heal any legacy 'custom' or 'Ollama' provider records in database
    await agentsCollection.updateMany(
      { provider: { $in: ["custom", "Ollama"] } },
      { $set: { provider: "ollama" } }
    );
    const convosCollection = database.collection("conversations");
    await convosCollection.updateMany(
      { endpoint: { $in: ["custom", "Ollama"] } },
      { $set: { endpoint: "agents" } }
    );

    // ─── 1. Seed Top 10 DevOps Skills & Build Lookup Map ─────────────────────
    const skillsCol = database.collection("skills");
    const skillIdMap = {};

    for (const s of SKILLS) {
      const existing = await skillsCol.findOne({ name: s.name });
      let skillId;
      if (existing) {
        skillId = existing._id;
        await skillsCol.updateOne(
          { _id: skillId },
          {
            $set: {
              name: s.name,
              displayTitle: s.displayTitle,
              description: s.description,
              body: s.body,
              is_promoted: true,
              source: "deployment",
              deployment: true,
              projectIds: ["default", "global"],
              updatedAt: new Date()
            }
          }
        );
      } else {
        const ins = await skillsCol.insertOne({
          name: s.name,
          displayTitle: s.displayTitle,
          description: s.description,
          body: s.body,
          is_promoted: true,
          source: "deployment",
          deployment: true,
          projectIds: ["default", "global"],
          author: primaryUser,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        skillId = ins.insertedId;
      }

      skillIdMap[s.name] = skillId.toString();

      for (const colName of targetCollections) {
        const col = database.collection(colName);
        await col.deleteMany({
          $or: [
            { resourceId: skillId },
            { resourceId: skillId.toString() }
          ]
        });

        const aclEntries = [
          {
            principalType: 'public',
            principalId: null,
            resourceType: 'skill',
            resourceId: skillId,
            permBits: 1, // VIEW
            grantedBy: primaryUser,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          ...users.flatMap(u => [
            {
              principalType: 'user',
              principalId: u._id,
              principalModel: 'User',
              resourceType: 'skill',
              resourceId: skillId,
              permBits: 15, // ALL
              grantedBy: u._id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ])
        ];

        await col.insertMany(aclEntries);
      }
    }
    await skillsCol.updateMany(
      {},
      { $set: { source: "deployment", deployment: true, is_promoted: true } }
    );
    console.log(`[MongoDB] Successfully seeded and synchronized ${SKILLS.length} DevOps skills with ACL entries.`);

    // ─── 2. Terraform DevOps Expert ──────────────────────────────────────────
    const FIXED_AGENT_ID = "agent_tf-devops-expert";
    const terraformSkills = [
      skillIdMap["tf-remote-state-backend"],
      skillIdMap["aws-production-vpc-3tier"],
      skillIdMap["tf-module-scaffolding"],
      skillIdMap["vault-secrets-cloud-integration"],
      skillIdMap["cloud-disaster-recovery-runbook"]
    ].filter(Boolean);

    const terraformAgent = {
      id: FIXED_AGENT_ID,
      name: "Terraform DevOps Expert",
      description: "Principal Cloud Architect that writes modular, secure, and validated Terraform code — with automated project organization, self-correction, and human approval gates.",
      instructions: "You are a Principal DevOps & Cloud Platform Architect specializing in Terraform and Infrastructure as Code (IaC). You have access to three custom tools:\n1. `terraform-registry`: Look up provider documentation, resource syntax, and official module specifications.\n2. `local-fs`: Read, write, and organize .tf files and directories in the user's workspace.\n3. `tf-runner`: Execute terraform init, fmt, validate, plan, apply, and security scanners (tfsec) on the local machine.\n\nCORE BEHAVIOR & INTERACTION STYLE:\n- Behave like a senior, decisive architect: proactive, structured, and confident.\n- Do NOT interrogate the user with questionnaires or ask endless questions. Keep questions to a maximum of ONE brief prompt when critical context is missing or when confirming architecture.\n- In that initial prompt, confirm:\n  1. Project name & cloud/region.\n  2. Structure preference: Ask or propose whether they would like it structured **module-wise** (reusable child modules under `modules/<component>/` called by root) or as a flat layout.\n  Always provide a sensible default so the user can just say \"yes\" (e.g., \"I'll organize this under project folder `vpc-production` (AWS `us-east-1`) using a modular structure (`modules/vpc`). Let me know if you prefer a flat layout or a different project name, otherwise I'll proceed.\").\n- When confirmed or when context is clear, immediately execute the architecture using production defaults.\n\nARCHITECTURE & CODE STANDARDS:\n1. Project & Directory Organization:\n   - Always isolate infrastructure into a dedicated project directory (e.g., `<project-name>/` or `environments/<env>/`) to avoid clutter and monolithic state files.\n   - Utilize focused, reusable modules with single responsibility (e.g., networking/vpc, database/rds, compute/eks) rather than bundling an entire architecture into one giant file.\n   - Separate state files across logical layers to reduce the blast radius of changes.\n\n2. Community-Standard File Layout:\n   Inside every project directory, strictly structure files into:\n   - `providers.tf`: Pinned Terraform core version (`required_version = \">= 1.5.0\"`), pinned provider versions using pessimistic operator (e.g., `version = \"~> 5.0\"`), and remote state backend configuration with state locking (e.g., S3 + DynamoDB or GCS).\n   - `main.tf`: Core resources and module invocations. Keep code clean, readable, and declarative — avoid convoluted loops (count/for_each) that obscure resources.\n   - `variables.tf`: Explicit type definitions, clear descriptions, and sensible defaults. Mark sensitive variables with `sensitive = true`. Never hardcode secrets.\n   - `outputs.tf`: Meaningful exported attributes (IDs, ARNs, endpoints, connection strings) for downstream modules or operators.\n   - `terraform.tfvars.example`: Example input values template (never contain actual secrets).\n\n3. Security & State Best Practices:\n   - NEVER hardcode secrets, passwords, or API tokens in .tf files. Always use sensitive variables or secret store references (AWS Secrets Manager, HashiCorp Vault).\n   - Remote state storage: Configure remote backend storage with distributed locking enabled to prevent concurrent state corruption.\n\nWORKFLOW FOR EVERY REQUEST:\n1. Check Existing Files: Always inspect existing workspace files via `local-fs` before writing code to avoid conflicts.\n2. Structure & Write: Author clean, modular files in the designated project folder.\n3. Automated Quality & Security Gate:\n   - Run `terraform fmt` and `terraform validate` via `tf-runner`.\n   - If a security scanner (like `tfsec`) is available, run it to detect misconfigurations (e.g., open security groups 0.0.0.0/0, unencrypted disks). Automatically self-correct any flagged issues and explain the fix.\n4. Human Approval Gate:\n   - NEVER run `terraform apply` or `terraform destroy` unprompted.\n   - Always run `terraform plan` first, show the full plan output to the user, and require their explicit confirmation before any real infrastructure is created, modified, or destroyed.\n5. Post-Apply Summary: Summarize deployed resources, outputs, cost implications, and security posture.",
      provider: targetProvider,
      model: targetModel,
      model_parameters: {},
      mcpServerNames: ["terraform-registry", "local-fs", "tf-runner"],
      tools: formatMcpTools(["terraform-registry", "local-fs", "tf-runner"]),
      skills_enabled: true,
      skills_scope: "selected",
      skills: terraformSkills,
      is_promoted: true,
      avatar: { filepath: "/assets/only_logo.png" },
      support_contact: { name: "TerraMind" },
      projectIds: ["default", "global"],
      author: primaryUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingTf = await agentsCollection.findOne({ name: "Terraform DevOps Expert" });
    let finalObjectId;
    let finalId = FIXED_AGENT_ID;

    if (existingTf) {
      console.log("[MongoDB] Agent 'Terraform DevOps Expert' already exists. Synchronizing properties.");
      finalObjectId = existingTf._id;
      await agentsCollection.updateOne(
        { _id: finalObjectId },
        {
          $set: {
            id: FIXED_AGENT_ID,
            description: terraformAgent.description,
            instructions: terraformAgent.instructions,
            provider: terraformAgent.provider,
            model: terraformAgent.model,
            avatar: terraformAgent.avatar,
            support_contact: terraformAgent.support_contact,
            mcpServerNames: terraformAgent.mcpServerNames,
            tools: terraformAgent.tools,
            skills_enabled: true,
            skills_scope: "selected",
            skills: terraformSkills,
            projectIds: ["default", "global"],
            is_promoted: true,
            updatedAt: new Date()
          }
        }
      );
    } else {
      const result = await agentsCollection.insertOne(terraformAgent);
      console.log(`[MongoDB] Successfully seeded 'Terraform DevOps Expert' agent with _id: ${result.insertedId}`);
      finalObjectId = result.insertedId;
    }

    // Update conversations
    await convosCollection.updateMany(
      { $or: [{ agent_id: { $regex: /^tf-expert-/ } }, { agent_id: { $regex: /^agent_tf-/ } }, { agent_id: FIXED_AGENT_ID }] },
      { $set: { agent_id: FIXED_AGENT_ID, model: terraformAgent.model, endpoint: 'agents' } }
    );

    for (const colName of targetCollections) {
      const col = database.collection(colName);
      await col.deleteMany({
        $or: [
          { resourceId: finalObjectId },
          { resourceId: finalId },
          { resourceId: finalObjectId.toString() }
        ]
      });

      const aclEntries = [
        {
          principalType: 'public',
          principalId: null,
          resourceType: 'agent',
          resourceId: finalObjectId,
          permBits: 1,
          grantedBy: primaryUser,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        ...users.flatMap(u => [
          {
            principalType: 'user',
            principalId: u._id,
            principalModel: 'User',
            resourceType: 'agent',
            resourceId: finalObjectId,
            permBits: 15,
            grantedBy: u._id,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            principalType: 'user',
            principalId: u._id,
            principalModel: 'User',
            resourceType: 'remoteAgent',
            resourceId: finalObjectId,
            permBits: 15,
            grantedBy: u._id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      ];

      await col.insertMany(aclEntries);
    }
    console.log(`[MongoDB] Synchronized ACL entries for Terraform DevOps Expert.`);

    // ─── 3. FinOps & Cloud Cost Optimizer ───────────────────────────────────
    const FINOPS_ID = "agent_finops-cost-optimizer";
    const finopsSkills = [
      skillIdMap["finops-multicloud-cost-optimization"],
      skillIdMap["finops-multicloud-cost-charts"]
    ].filter(Boolean);

    const finopsAgent = {
      id: FINOPS_ID,
      name: "FinOps & Cloud Cost Optimizer",
      description: "Principal Cloud Economist that analyzes IaC, delivers multi-cloud cost comparisons (AWS vs GCP vs Azure), and recommends aggressive rightsizing and Spot/Graviton savings.",
      instructions: "You are a Principal Cloud Economist & FinOps Architect specializing in multi-cloud infrastructure cost analysis, capacity planning, and architectural optimization. You have access to two custom tools:\n1. `local-fs`: Inspect local .tf files, Kubernetes manifests, and cloud configurations in the user's workspace.\n2. `terraform-registry`: Look up provider documentation, resource specifications, and sizing specifications.\n\nCORE BEHAVIOR & INTERACTION STYLE:\n- Behave like a senior financial and infrastructure architect: analytical, decisive, and actionable.\n- Do NOT ask excessive questions. When analyzing a workload, immediately inspect existing files via `local-fs`. If no code exists yet, ask at most ONE brief question to clarify expected scale (e.g., \"traffic/scale: small dev, mid-tier, or high-throughput production?\") while providing standard production assumptions.\n- Collaborate seamlessly with your TerraMind peer agents: advise the Terraform DevOps Expert on cost-optimized instance families, assist the K8s Architect with node pool sizing, and guide CI/CD on automated cost-budget gates.\n\nFINOPS PILLARS & MULTI-CLOUD COST BENCHMARKING:\n1. Multi-Cloud Cost Comparison & Equivalence:\n   - When evaluating or planning infrastructure, provide a clear comparative cost breakdown across major cloud providers (AWS vs GCP vs Azure) for equivalent services:\n     * Compute: AWS EC2 (x86 vs Graviton ARM) vs GCP Compute Engine (N2/C3 vs Tau T2A ARM) vs Azure VMs (D-series vs Dpsv5 ARM).\n     * Managed Databases: AWS RDS / Aurora vs GCP Cloud SQL / AlloyDB vs Azure Database for PostgreSQL/MySQL.\n     * Object Storage & Tiering: S3 Standard/Glacier vs GCS Standard/Coldline vs Azure Blob Hot/Cool/Archive.\n     * Network Egress & NAT Gateways: Highlight hidden network egress and NAT Gateway data processing costs which often drive 20-30% of cloud bills.\n   - Present a clean markdown comparison table with estimated monthly costs, trade-offs, and best-fit cloud recommendation.\n\n2. Rightsizing & Architectural Savings Strategies:\n   - Modern Architecture: Recommend Graviton / ARM processors (typically 20% cheaper and up to 40% better price-performance).\n   - Spot & Preemptible Workloads: Identify stateless services and batch workers suitable for Spot instances (up to 70-90% savings) with fallback on-demand nodes.\n   - Storage Optimization: Migrate legacy gp2 to gp3 EBS (20% immediate savings + decoupled IOPS), enforce automated S3 lifecycle rules to Glacier Instant Retrieval.\n   - Commitment Models: Detail ROI between 1-yr / 3-yr Reserved Instances (RI) and Savings Plans / Committed Use Discounts (CUD).\n\n3. Transparency & Disclaimers:\n   - Present all cost estimates in structured monthly tables itemized by Compute, Storage, Networking, and Managed Services.\n   - Explicitly note that figures are estimates based on public list pricing benchmarks and exclude custom enterprise discounts, exact regional tax variations, and live dynamic egress. Advise verifying against the cloud provider's official pricing calculator before committing to architectural changes.",
      provider: targetProvider,
      model: targetModel,
      model_parameters: {},
      mcpServerNames: ["local-fs", "terraform-registry"],
      tools: formatMcpTools(["local-fs", "terraform-registry"]),
      skills_enabled: true,
      skills_scope: "selected",
      skills: finopsSkills,
      is_promoted: true,
      avatar: { filepath: "/assets/only_logo.png" },
      support_contact: { name: "TerraMind" },
      projectIds: ["default", "global"],
      author: primaryUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingFinops = await agentsCollection.findOne({ name: "FinOps & Cloud Cost Optimizer" });
    let finopsObjectId;
    if (existingFinops) {
      console.log("[MongoDB] Agent 'FinOps & Cloud Cost Optimizer' already exists. Synchronizing properties.");
      finopsObjectId = existingFinops._id;
      await agentsCollection.updateOne(
        { _id: finopsObjectId },
        {
          $set: {
            id: FINOPS_ID,
            description: finopsAgent.description,
            instructions: finopsAgent.instructions,
            provider: finopsAgent.provider,
            model: finopsAgent.model,
            avatar: finopsAgent.avatar,
            support_contact: finopsAgent.support_contact,
            mcpServerNames: finopsAgent.mcpServerNames,
            tools: finopsAgent.tools,
            skills_enabled: true,
            skills_scope: "selected",
            skills: finopsSkills,
            projectIds: ["default", "global"],
            is_promoted: true,
            updatedAt: new Date()
          }
        }
      );
    } else {
      const r = await agentsCollection.insertOne(finopsAgent);
      finopsObjectId = r.insertedId;
      console.log(`[MongoDB] Successfully seeded 'FinOps & Cloud Cost Optimizer' agent with _id: ${finopsObjectId}`);
    }

    for (const colName of targetCollections) {
      const col = database.collection(colName);
      await col.deleteMany({ $or: [{ resourceId: finopsObjectId }, { resourceId: FINOPS_ID }, { resourceId: finopsObjectId.toString() }] });
      const aclEntries = [
        { principalType: 'public', principalId: null, resourceType: 'agent', resourceId: finopsObjectId, permBits: 1, grantedBy: primaryUser, createdAt: new Date(), updatedAt: new Date() },
        ...users.flatMap(u => [
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'agent', resourceId: finopsObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'remoteAgent', resourceId: finopsObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
        ])
      ];
      await col.insertMany(aclEntries);
    }
    console.log(`[MongoDB] Synchronized ACL entries for FinOps agent.`);

    // ─── 4. Kubernetes & GitOps Platform Engineer ────────────────────────────
    const K8S_ID = "agent_k8s-gitops-architect";
    const k8sSkills = [
      skillIdMap["k8s-workload-hardening"],
      skillIdMap["k8s-zero-trust-network-policy"],
      skillIdMap["helm-production-chart-scaffolding"],
      skillIdMap["vault-secrets-cloud-integration"],
      skillIdMap["cloud-disaster-recovery-runbook"]
    ].filter(Boolean);

    const k8sAgent = {
      id: K8S_ID,
      name: "Kubernetes & GitOps Platform Engineer",
      description: "Principal Kubernetes Platform Architect that designs workload-tailored manifests, production resource sizing, resilient health probes, Helm charts, and GitOps rollouts.",
      instructions: "You are a Principal Cloud Native & Kubernetes Platform Architect specializing in enterprise container orchestration, GitOps, and workload reliability engineering. You have access to one custom tool:\n1. `local-fs`: Read, write, and structure Kubernetes YAML manifests, Helm charts, and GitOps configurations in the user's workspace.\n\nCORE BEHAVIOR & INTERACTION STYLE:\n- Behave like a senior platform architect: authoritative, production-focused, and precise.\n- Do NOT interrogate the user with questionnaires. When asked to deploy an application, inspect existing workspace files via `local-fs`. If the application type isn't specified, ask at most ONE brief question regarding the workload profile (e.g., \"Is this a stateless HTTP API, a background worker, or a stateful database?\") while assuming standard resilient defaults.\n- Collaborate seamlessly with your TerraMind peer agents: consume cluster and VPC outputs from the Terraform DevOps Expert, apply node rightsizing from the FinOps Cost Optimizer, and produce manifests ready for the CI/CD Pipeline Engineer.\n\nWORKLOAD-SPECIFIC ARCHITECTURE & EXACT CONFIGURATIONS:\n1. Workload Tailoring as per Planned Application:\n   - Stateless Web/API: Multi-replica Deployment, HorizontalPodAutoscaler (HPA targeting 70% CPU / memory), PodDisruptionBudget (minAvailable: 1), readiness/liveness probes with initial delays, and graceful termination (`preStop` sleep hook + `terminationGracePeriodSeconds: 60`).\n   - Background Workers / Consumers: Deployment or Queue-driven HPA (KEDA), single-pod grace periods for job completion.\n   - Stateful Workloads (Databases/Caches): StatefulSet, headless Service, VolumeClaimTemplates with dynamic StorageClass provisioning (gp3/CSI), persistent PVC retain policies.\n   - Batch / Cron Tasks: CronJob with `concurrencyPolicy: Forbid`, `failedJobsHistoryLimit: 3`, and active deadline timeouts.\n\n2. Exact Resource Sizing & QoS:\n   - Compute: Strictly define both `requests` and `limits` for CPU and Memory to establish guaranteed/burstable QoS classes and prevent unconstrained node evictions or CPU throttling.\n   - Health Probes: Custom `startupProbe` (for slow-starting apps), `livenessProbe` (detect deadlocks), and `readinessProbe` (prevent traffic routing before initialization).\n\n3. Production Security & Hardening:\n   - Pod Security Standards: Enforce non-root security context (`runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, `capabilities: { drop: [\"ALL\"] }`).\n   - Zero-Trust Networking: Default-deny NetworkPolicies allowing only explicitly required ingress (e.g. from Ingress Controller) and egress (DNS + external DB).\n   - Secret Decoupling: Use Kubernetes Secrets, SealedSecrets, or External Secrets Operator (integrating AWS Secrets Manager / Vault) rather than hardcoded environment variables.\n\n4. GitOps & Helm Packaging:\n   - Standardize layouts: Deliver either clean modular Helm charts (`Chart.yaml`, `values.yaml`, `templates/`) or declarative ArgoCD `Application` / Flux `Kustomization` CRDs.\n   - Keep `values.yaml` comprehensive, clean, and self-documenting for multi-environment promotion (dev, staging, prod).",
      provider: targetProvider,
      model: targetModel,
      model_parameters: {},
      mcpServerNames: ["local-fs"],
      tools: formatMcpTools(["local-fs"]),
      skills_enabled: true,
      skills_scope: "selected",
      skills: k8sSkills,
      is_promoted: true,
      avatar: { filepath: "/assets/only_logo.png" },
      support_contact: { name: "TerraMind" },
      projectIds: ["default", "global"],
      author: primaryUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingK8s = await agentsCollection.findOne({ name: "Kubernetes & GitOps Platform Engineer" });
    let k8sObjectId;
    if (existingK8s) {
      console.log("[MongoDB] Agent 'Kubernetes & GitOps Platform Engineer' already exists. Synchronizing properties.");
      k8sObjectId = existingK8s._id;
      await agentsCollection.updateOne(
        { _id: k8sObjectId },
        {
          $set: {
            id: K8S_ID,
            description: k8sAgent.description,
            instructions: k8sAgent.instructions,
            provider: k8sAgent.provider,
            model: k8sAgent.model,
            avatar: k8sAgent.avatar,
            support_contact: k8sAgent.support_contact,
            mcpServerNames: k8sAgent.mcpServerNames,
            tools: k8sAgent.tools,
            skills_enabled: true,
            skills_scope: "selected",
            skills: k8sSkills,
            projectIds: ["default", "global"],
            is_promoted: true,
            updatedAt: new Date()
          }
        }
      );
    } else {
      const r = await agentsCollection.insertOne(k8sAgent);
      k8sObjectId = r.insertedId;
      console.log(`[MongoDB] Successfully seeded 'Kubernetes & GitOps Platform Engineer' agent with _id: ${k8sObjectId}`);
    }

    for (const colName of targetCollections) {
      const col = database.collection(colName);
      await col.deleteMany({ $or: [{ resourceId: k8sObjectId }, { resourceId: K8S_ID }, { resourceId: k8sObjectId.toString() }] });
      const aclEntries = [
        { principalType: 'public', principalId: null, resourceType: 'agent', resourceId: k8sObjectId, permBits: 1, grantedBy: primaryUser, createdAt: new Date(), updatedAt: new Date() },
        ...users.flatMap(u => [
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'agent', resourceId: k8sObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'remoteAgent', resourceId: k8sObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
        ])
      ];
      await col.insertMany(aclEntries);
    }
    console.log(`[MongoDB] Synchronized ACL entries for K8s agent.`);

    // ─── 5. CI/CD Pipeline Engineer ───────────────────────────────────────────
    const CICD_ID = "agent_cicd-pipeline-engineer";
    const cicdSkills = [
      skillIdMap["cicd-github-actions-terraform"],
      skillIdMap["helm-production-chart-scaffolding"],
      skillIdMap["tf-remote-state-backend"]
    ].filter(Boolean);

    const cicdAgent = {
      id: CICD_ID,
      name: "CI/CD Pipeline Engineer",
      description: "Principal DevSecOps Engineer that designs multi-stage CI/CD pipelines (GitHub Actions, GitLab CI) with OIDC keyless authentication, security gates, PR plan comments, and state locking.",
      instructions: "You are a Principal CI/CD & DevSecOps Platform Engineer specializing in enterprise automation, secure supply chain pipelines, and GitOps continuous delivery. You have access to one custom tool:\n1. `local-fs`: Read, write, and manage CI/CD pipeline workflows (.github/workflows/, .gitlab-ci.yml, etc.) in the user's workspace.\n\nCORE BEHAVIOR & INTERACTION STYLE:\n- Behave like a senior DevSecOps architect: pragmatic, security-first, and decisive.\n- Do NOT interrogate the user. Always inspect existing repository files via `local-fs` to detect existing platforms (GitHub Actions, GitLab CI, etc.). If no platform is detected, ask at most ONE brief question to confirm CI platform preference with GitHub Actions proposed as the default.\n- Present clear architectural options and best-practice trade-offs (e.g., OIDC vs API keys, trunk-based vs GitFlow promotion, automated PR plan comments).\n- Collaborate seamlessly with your TerraMind peer agents: trigger `terraform fmt/validate/plan` from the Terraform DevOps Expert, enforce FinOps budget checks, and deploy Helm/K8s manifests designed by the Kubernetes Architect.\n\nPIPELINE ARCHITECTURE & BEST PRACTICES:\n1. Multi-Stage Enterprise Pipeline Architecture:\n   - Stage 1 (Static Analysis & Linting): Run syntax verification (`terraform fmt -check`, Helm lint, Dockerfile hadolint, Yamllint).\n   - Stage 2 (Security & SAST Gates): Enforce automated security scanning (`tfsec` / Checkov for IaC, Trivy for container image vulnerabilities, GitGuardian/Trufflehog for secret detection). Non-negotiable security gates that fail builds on critical/high CVEs.\n   - Stage 3 (Speculative Execution & PR Feedback): On Pull Requests, execute `terraform plan` or dry-run deployments and post an automated formatted markdown comment back to the PR with the exact diff summary.\n   - Stage 4 (Human Approval & Gated Release): Environment protection rules for production deployments requiring authorized peer approvals.\n   - Stage 5 (State-Safe Apply): Run apply on main branch merge with state locking and single-runner concurrency.\n\n2. State Locking & Concurrency Control:\n   - Strictly implement concurrency grouping (e.g. `concurrency: group: terraform-${{ github.ref }}, cancel-in-progress: false`) to prevent race conditions and concurrent state file writes during parallel PR merges.\n\n3. Keyless Cloud Authentication (OIDC):\n   - Never generate or store static, long-lived cloud credentials (like AWS_ACCESS_KEY_ID or GCP Service Account JSON keys) in repository secrets.\n   - Implement OpenID Connect (OIDC) identity federation (AWS IAM OIDC Role, GCP Workload Identity, Azure Federated Credentials) with least-privilege scoping.\n\n4. Multi-Platform Support:\n   - Provide complete, battle-tested configurations for GitHub Actions (`.github/workflows/`), GitLab CI (`.gitlab-ci.yml`), and reusable composite actions.",
      provider: targetProvider,
      model: targetModel,
      model_parameters: {},
      mcpServerNames: ["local-fs"],
      tools: formatMcpTools(["local-fs"]),
      skills_enabled: true,
      skills_scope: "selected",
      skills: cicdSkills,
      is_promoted: true,
      avatar: { filepath: "/assets/only_logo.png" },
      support_contact: { name: "TerraMind" },
      projectIds: ["default", "global"],
      author: primaryUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingCicd = await agentsCollection.findOne({ name: "CI/CD Pipeline Engineer" });
    let cicdObjectId;
    if (existingCicd) {
      console.log("[MongoDB] Agent 'CI/CD Pipeline Engineer' already exists. Synchronizing properties.");
      cicdObjectId = existingCicd._id;
      await agentsCollection.updateOne(
        { _id: cicdObjectId },
        {
          $set: {
            id: CICD_ID,
            description: cicdAgent.description,
            instructions: cicdAgent.instructions,
            provider: cicdAgent.provider,
            model: cicdAgent.model,
            avatar: cicdAgent.avatar,
            support_contact: cicdAgent.support_contact,
            mcpServerNames: cicdAgent.mcpServerNames,
            tools: cicdAgent.tools,
            skills_enabled: true,
            skills_scope: "selected",
            skills: cicdSkills,
            projectIds: ["default", "global"],
            is_promoted: true,
            updatedAt: new Date()
          }
        }
      );
    } else {
      const r = await agentsCollection.insertOne(cicdAgent);
      cicdObjectId = r.insertedId;
      console.log(`[MongoDB] Successfully seeded 'CI/CD Pipeline Engineer' agent with _id: ${cicdObjectId}`);
    }

    for (const colName of targetCollections) {
      const col = database.collection(colName);
      await col.deleteMany({ $or: [{ resourceId: cicdObjectId }, { resourceId: CICD_ID }, { resourceId: cicdObjectId.toString() }] });
      const aclEntries = [
        { principalType: 'public', principalId: null, resourceType: 'agent', resourceId: cicdObjectId, permBits: 1, grantedBy: primaryUser, createdAt: new Date(), updatedAt: new Date() },
        ...users.flatMap(u => [
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'agent', resourceId: cicdObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'remoteAgent', resourceId: cicdObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
        ])
      ];
      await col.insertMany(aclEntries);
    }
    console.log(`[MongoDB] Synchronized ACL entries for CI/CD agent.`);

    // Synchronize all seeded agent conversations to current model & endpoint
    await convosCollection.updateMany(
      {
        $or: [
          { agent_id: { $in: [FIXED_AGENT_ID, FINOPS_ID, K8S_ID, CICD_ID] } },
          { agent_id: { $regex: /^(agent_)?(tf-|finops-|k8s-|cicd-)/ } }
        ]
      },
      { $set: { model: targetModel, endpoint: 'agents' } }
    );

    // ─── 6. Permissions for Roles ─────────────────────────────────────────────
    const rolesCollection = database.collection("roles");
    for (const roleName of ["ADMIN", "USER"]) {
      await rolesCollection.updateOne(
        { name: roleName },
        {
          $set: {
            "permissions.marketplace.USE": true,
            "permissions.marketplace.use": true,
            "permissions.agents.USE": true,
            "permissions.agents.use": true,
            "permissions.skills.USE": true,
            "permissions.skills.use": true,
            "permissions.skills.CREATE": true,
            "permissions.skills.create": true,
            "permissions.SKILLS.USE": true,
            "permissions.SKILLS.use": true,
            "permissions.SKILLS.CREATE": true,
            "permissions.SKILLS.create": true,
          },
          $setOnInsert: {
            name: roleName,
            description: "",
          }
        },
        { upsert: true }
      );
    }
    await rolesCollection.updateMany(
      {},
      {
        $set: {
          "permissions.marketplace.USE": true,
          "permissions.marketplace.use": true,
          "permissions.agents.USE": true,
          "permissions.agents.use": true,
          "permissions.skills.USE": true,
          "permissions.skills.use": true,
          "permissions.skills.CREATE": true,
          "permissions.skills.create": true,
          "permissions.SKILLS.USE": true,
          "permissions.SKILLS.use": true,
          "permissions.SKILLS.CREATE": true,
          "permissions.SKILLS.create": true,
        }
      }
    );
    await rolesCollection.updateOne(
      { name: "ADMIN" },
      {
        $set: {
          "permissions.skills.SHARE": true,
          "permissions.skills.share": true,
          "permissions.skills.SHARE_PUBLIC": true,
          "permissions.skills.share_public": true,
          "permissions.SKILLS.SHARE": true,
          "permissions.SKILLS.share": true,
          "permissions.SKILLS.SHARE_PUBLIC": true,
          "permissions.SKILLS.share_public": true,
        }
      }
    );
    console.log("[MongoDB] Ensured marketplace, agents, and skills permissions are active for ADMIN, USER, and all roles.");

    console.log("[MongoDB] Agent & Domain-Selective Skills sync completed successfully.");

  } catch (error) {
    console.error("[MongoDB] Error seeding agent (Is MongoDB running?):", error.message);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
