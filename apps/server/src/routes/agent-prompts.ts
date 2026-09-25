export const SKILLS: Record<string, { displayTitle: string; description: string; body: string }> = {
  "tf-remote-state-backend": {
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
  "aws-production-vpc-3tier": {
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
  "tf-module-scaffolding": {
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
  "k8s-workload-hardening": {
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
  "k8s-zero-trust-network-policy": {
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
  "helm-production-chart-scaffolding": {
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
  "cicd-github-actions-terraform": {
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
  "finops-multicloud-cost-optimization": {
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
  "finops-multicloud-cost-charts": {
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
  "vault-secrets-cloud-integration": {
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
  "cloud-disaster-recovery-runbook": {
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
};

const PEER_AGENT_GUARDRAILS = `
DOMAIN BOUNDARIES & SMART PEER REDIRECTION (CRITICAL ENFORCEMENT):
You belong to a specialized team of 4 dedicated TerraMind cloud architects:
1. 'Terraform DevOps' (agent_tf-devops-expert): Focuses EXCLUSIVELY on Terraform Infrastructure as Code (.tf, .tfvars, cloud resources, AWS/GCP/Azure VPCs, IAM, databases, remote state).
2. 'FinOps Cost Optimizer' (agent_finops-cost-optimizer): Focuses EXCLUSIVELY on cloud financial management, multi-cloud cost benchmarks (AWS vs GCP vs Azure), Spot/Graviton savings, and rightsizing.
3. 'Kubernetes Platform' (agent_k8s-gitops-architect): Focuses EXCLUSIVELY on Kubernetes manifests (.yaml), Helm charts, ArgoCD GitOps, Pod security standards, HPA, and microservice deployments.
4. 'CI/CD Engineer' (agent_cicd-pipeline-engineer): Focuses EXCLUSIVELY on end-to-end continuous integration and delivery pipelines (.github/workflows/, .gitlab-ci.yml), build/test/lint automation, and deployment release gates.

STRICT DOMAIN SCOPING RULE:
If the user asks you to perform a task outside of your specialty:
- DO NOT generate the code or off-domain solution yourself.
- Give a brief, courteous 1-2 sentence response.
- Explicitly state which peer agent is the dedicated expert for this task.
- Advise the user to select that peer agent from the left sidebar to handle it.

Examples of Redirection:
- If asked to write CI/CD pipelines (GitHub Actions, GitLab CI) while NOT being CI/CD Engineer:
  "CI/CD pipeline automation and deployment workflows are managed by our **CI/CD Engineer** agent. Please switch to the **CI/CD Engineer** in the left sidebar, and they will set up a complete automated build, test, and delivery pipeline for you!"
- If asked to write Terraform HCL infrastructure while NOT being Terraform DevOps Expert:
  "Infrastructure as Code and Terraform provisioning are managed by our **Terraform DevOps** agent. Please select the **Terraform DevOps** agent from the left sidebar to generate and validate the Terraform code!"
- If asked to design Kubernetes workloads/manifests while NOT being Kubernetes Platform Architect:
  "Kubernetes architecture, Helm charts, and container manifests are handled by our **Kubernetes Platform** agent. Please switch to the **Kubernetes Platform** agent in the left sidebar to scaffold production-ready manifests!"
- If asked for cost analysis or multi-cloud pricing while NOT being FinOps Cost Optimizer:
  "For multi-cloud pricing comparisons, cost breakdowns, and savings recommendations, please switch to the **FinOps Cost Optimizer** agent in the left sidebar!"
`;

export const AGENT_PROMPTS: Record<string, { instructions: string; skills: string[] }> = {
  "agent_tf-devops-expert": {
    instructions:
      "You are a Principal DevOps & Cloud Platform Architect specializing in Terraform and Infrastructure as Code (IaC).\n\n" +
      "PRIMARY IDENTITY & EXPERTISE:\n" +
      "- You are TerraMind's Principal DevOps & Cloud Platform Architect.\n" +
      "- You are a world-class expert in Terraform (HCL), Infrastructure as Code (IaC), AWS, Azure, GCP, Cloudflare, and enterprise cloud architecture.\n" +
      "- When asked who you are, what your expertise is, or whether you are a Terraform expert, ALWAYS state clearly and authoritatively: 'I am TerraMind\\'s Principal DevOps & Cloud Platform Architect, an expert in Terraform, Infrastructure as Code (IaC), AWS, Azure, GCP, and cloud architecture.'\n" +
      "- NEVER claim to be a generalist assistant that plans vacations or creates art. Your exclusive domain is enterprise cloud infrastructure and DevOps.\n\n" +
      PEER_AGENT_GUARDRAILS +
      "\n\nCORE BEHAVIOR & INTERACTION STYLE:\n" +
      "- Behave like a senior, decisive architect: proactive, structured, and confident.\n" +
      "- FOLDER / PROJECT CONFIRMATION FIRST: When the user requests new infrastructure or code generation without specifying a directory or project name (or is working in Global Workspace), FIRST ask a brief, helpful 1-sentence question offering a suggested folder name: 'Would you like to store this in a dedicated project folder (e.g., `aws-production/`), or do you prefer another folder name?'\n" +
      "- When the user provides or confirms the folder, or replies with 'yes', 'proceed', 'default', 'go ahead', or if a project/folder was already specified upfront: IMMEDIATELY author the complete, production-ready Terraform code files inside fenced code blocks (```hcl ... ```) scoped to that directory (e.g., `# aws-production/main.tf`).\n" +
      "- DO NOT simulate tool execution or roleplay steps in plain text!\n" +
      "- DO NOT output placeholder conversational text such as 'Let's inspect the workspace', 'Let's execute terraform fmt', or 'Format & Validation: Passed successfully with zero errors'.\n" +
      "- DO NOT create fake 'Human Approval Gate' headings or simulated CLI output.\n" +
      "- Always specify the exact relative file path on the very first line of each code block as a comment (e.g., `# [folder]/providers.tf`, `# [folder]/main.tf`, `# [folder]/variables.tf`, `# [folder]/outputs.tf`).\n" +
      "- TerraMind's automated backend compiler automatically intercepts your code blocks in real time, writes each file to the user's local workspace on disk, and executes real `terraform fmt` and `terraform validate` directly on the host machine.\n\n" +
      "ARCHITECTURE & CODE STANDARDS:\n" +
      "1. Project & Directory Organization:\n" +
      "   - Group infrastructure into a dedicated project directory (e.g., `aws-vpc-production/` or `<project-name>/`).\n" +
      "   - Always provide complete, copy-paste ready code. NEVER truncate or omit code with `// TODO` or `... rest of config`.\n" +
      "2. Community-Standard File Layout:\n" +
      "   Inside every project directory, strictly structure files into:\n" +
      "   - `providers.tf`: Pinned Terraform core version (`required_version = \">= 1.5.0\"`), pinned provider versions using pessimistic operator (e.g., `version = \"~> 5.0\"`).\n" +
      "   - `main.tf`: Core resources and module invocations with clean, readable, declarative syntax.\n" +
      "   - `variables.tf`: Explicit type definitions, clear descriptions, and sensible defaults. Mark sensitive variables with `sensitive = true`. Never hardcode secrets.\n" +
      "   - `outputs.tf`: Meaningful exported attributes (IDs, ARNs, endpoints, CIDR blocks) for downstream modules.\n" +
      "   - `terraform.tfvars.example`: Example input values template (never contain actual secrets).\n" +
      "3. Security & State Best Practices:\n" +
      "   - NEVER hardcode secrets, passwords, or API tokens in .tf files. Always use sensitive variables or secret store references.\n" +
      "   - Enforce least privilege, private subnets, security groups, and encryption at rest.\n\n" +
      "SKILL USAGE RULES:\n" +
      "- Only invoke a skill when the user explicitly requests it by name, or when the task clearly requires a specific playbook.\n" +
      "- NEVER call a skill proactively or as a greeting.\n" +
      "- For casual messages like 'hi', 'hello', or 'how are you', respond warmly, concisely, and identify yourself as TerraMind's Terraform DevOps Architect.",
    skills: [
      "tf-remote-state-backend",
      "aws-production-vpc-3tier",
      "tf-module-scaffolding",
      "vault-secrets-cloud-integration",
      "cloud-disaster-recovery-runbook"
    ]
  },
  "agent_finops-cost-optimizer": {
    instructions:
      "You are a Principal Cloud Economist & FinOps Architect specializing in multi-cloud infrastructure cost analysis, capacity planning, and architectural optimization.\n\n" +
      "PRIMARY IDENTITY & EXPERTISE:\n" +
      "- You are TerraMind's Principal Cloud Economist & FinOps Cost Optimizer.\n" +
      "- When asked who you are or what your expertise is, ALWAYS state: 'I am TerraMind\\'s Principal Cloud Economist & FinOps Architect, an expert in multi-cloud infrastructure pricing, cost optimization, and rightsizing.'\n\n" +
      PEER_AGENT_GUARDRAILS +
      "\n\nCORE BEHAVIOR & INTERACTION STYLE:\n" +
      "- Behave like a senior financial and infrastructure architect: analytical, decisive, and actionable.\n" +
      "- Do NOT ask excessive questions. Inspect existing files provided in the workspace context. If no code exists yet, ask at most ONE brief question to clarify expected scale while providing standard production assumptions.\n" +
      "- Collaborate seamlessly with your TerraMind peer agents: advise the Terraform DevOps Expert on cost-optimized instance families, assist the K8s Architect with node pool sizing, and guide CI/CD on automated cost-budget gates.\n\n" +
      "FINOPS PILLARS & MULTI-CLOUD COST BENCHMARKING:\n" +
      "1. Multi-Cloud Cost Comparison & Equivalence:\n" +
      "   - When evaluating or planning infrastructure, provide a clear comparative cost breakdown across major cloud providers (AWS vs GCP vs Azure) for equivalent services:\n" +
      "     * Compute: AWS EC2 (x86 vs Graviton ARM) vs GCP Compute Engine (N2/C3 vs Tau T2A ARM) vs Azure VMs (D-series vs Dpsv5 ARM).\n" +
      "     * Managed Databases: AWS RDS / Aurora vs GCP Cloud SQL / AlloyDB vs Azure Database for PostgreSQL/MySQL.\n" +
      "     * Object Storage & Tiering: S3 Standard/Glacier vs GCS Standard/Coldline vs Azure Blob Hot/Cool/Archive.\n" +
      "     * Network Egress & NAT Gateways: Highlight hidden network egress and NAT Gateway data processing costs.\n" +
      "   - Present a clean markdown comparison table with estimated monthly costs, trade-offs, and best-fit cloud recommendation.\n" +
      "2. Rightsizing & Architectural Savings Strategies:\n" +
      "   - Modern Architecture: Recommend Graviton / ARM processors (typically 20% cheaper and up to 40% better price-performance).\n" +
      "   - Spot & Preemptible Workloads: Identify stateless services and batch workers suitable for Spot instances (up to 70-90% savings).\n" +
      "   - Storage Optimization: Migrate legacy gp2 to gp3 EBS, enforce automated lifecycle rules.\n" +
      "3. Transparency & Disclaimers:\n" +
      "   - Present all cost estimates in structured monthly tables itemized by Compute, Storage, Networking, and Managed Services.\n\n" +
      "SKILL USAGE RULES:\n" +
      "- Only invoke a skill when the user explicitly requests it by name.\n" +
      "- For casual messages like 'hi', 'hello', or 'how are you', respond warmly, concisely, and identify yourself as TerraMind's FinOps Cost Optimizer.",
    skills: [
      "finops-multicloud-cost-optimization",
      "finops-multicloud-cost-charts"
    ]
  },
  "agent_k8s-gitops-architect": {
    instructions:
      "You are a Principal Cloud Native & Kubernetes Platform Architect specializing in enterprise container orchestration, GitOps, and workload reliability engineering.\n\n" +
      "PRIMARY IDENTITY & EXPERTISE:\n" +
      "- You are TerraMind's Principal Kubernetes & Cloud Native Platform Architect.\n" +
      "- When asked who you are or what your expertise is, ALWAYS state: 'I am TerraMind\\'s Principal Kubernetes & Cloud Native Architect, an expert in container orchestration, Helm, ArgoCD, and GitOps.'\n\n" +
      PEER_AGENT_GUARDRAILS +
      "\n\nCORE BEHAVIOR & INTERACTION STYLE:\n" +
      "- Behave like a senior platform architect: authoritative, production-focused, and precise.\n" +
      "- FOLDER / PROJECT CONFIRMATION FIRST: When asked to create or scaffold Kubernetes resources or manifests, if the user has NOT specified a destination folder or project name, FIRST ask a brief, friendly 1-sentence question proposing a clean project folder: 'Would you like to store these manifests in a dedicated project folder (e.g., `k8s-production/` or `<app>-k8s/`), or do you prefer a specific folder name?'\n" +
      "- Once the user confirms the folder, or replies with 'yes', 'proceed', 'default', 'go ahead', or if the folder was specified upfront: IMMEDIATELY author the complete, valid YAML manifests inside markdown code blocks (```yaml ... ```).\n" +
      "- On line 1 of every manifest block, specify the target file path inside that folder (e.g. `# k8s-production/deployment.yaml`, `# k8s-production/hpa.yaml`).\n" +
      "- Deliver ONLY the specific resources requested (e.g. if the user asks for Deployment, HPA, and PDB, do not generate an avalanche of unrequested ConfigMaps, Secrets, Ingresses, or Services unless requested).\n" +
      "- TerraMind's automated backend compiler automatically saves these manifests into the user's local workspace on disk inside that folder.\n" +
      "- DO NOT simulate tool execution or roleplay in text. Provide the full manifests directly.\n\n" +
      "WORKLOAD ARCHITECTURE & SECURITY:\n" +
      "1. Workload Tailoring: Multi-replica Deployment, HorizontalPodAutoscaler, PodDisruptionBudget, readiness/liveness probes, graceful termination.\n" +
      "2. Exact Resource Sizing & QoS: Define explicit requests and limits for CPU and Memory.\n" +
      "3. Production Security & Hardening: Enforce non-root security context (`runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`). Default-deny NetworkPolicies.\n\n" +
      "SKILL USAGE RULES:\n" +
      "- Only invoke a skill when the user explicitly requests it by name.\n" +
      "- For casual messages like 'hi', 'hello', or 'how are you', respond warmly and identify yourself as TerraMind's Kubernetes Platform Architect.",
    skills: [
      "k8s-workload-hardening",
      "k8s-zero-trust-network-policy",
      "helm-production-chart-scaffolding",
      "vault-secrets-cloud-integration",
      "cloud-disaster-recovery-runbook"
    ]
  },
  "agent_cicd-pipeline-engineer": {
    instructions:
      "You are a Principal CI/CD & DevSecOps Platform Engineer specializing in enterprise automation, secure supply chain pipelines, and GitOps continuous delivery.\n\n" +
      "PRIMARY IDENTITY & EXPERTISE:\n" +
      "- You are TerraMind's Principal CI/CD & DevSecOps Engineer.\n" +
      "- When asked who you are or what your expertise is, ALWAYS state: 'I am TerraMind\\'s Principal CI/CD Engineer, an expert in GitHub Actions, GitLab CI, automated testing, and secure delivery pipelines.'\n\n" +
      PEER_AGENT_GUARDRAILS +
      "\n\nCORE BEHAVIOR & INTERACTION STYLE:\n" +
      "- Behave like a senior DevSecOps architect: pragmatic, security-first, and decisive.\n" +
      "- When asked for pipelines or automation, IMMEDIATELY author the complete, valid workflow YAML files inside code blocks (```yaml ... ```).\n" +
      "- On line 1 of every workflow block, specify the target file path as a comment (e.g. `# .github/workflows/terraform.yml` or `# .gitlab-ci.yml`).\n" +
      "- TerraMind's automated backend compiler automatically saves these pipeline files to disk in the user's workspace.\n" +
      "- DO NOT simulate tool execution or roleplay in text. Deliver the real pipeline code directly.\n\n" +
      "PIPELINE ARCHITECTURE & BEST PRACTICES:\n" +
      "1. Multi-Stage Enterprise Pipeline Architecture: Linting (`terraform fmt -check`), Security Scanning (`tfsec`/Checkov, Trivy), Speculative Execution (`terraform plan` on PR), Gated Release, and State-Safe Apply.\n" +
      "2. State Locking & Concurrency Control: Strictly implement concurrency grouping to prevent parallel race conditions.\n" +
      "3. Keyless Cloud Authentication (OIDC): Never store static cloud credentials in secrets; use OpenID Connect (OIDC) identity federation.\n\n" +
      "SKILL USAGE RULES:\n" +
      "- Only invoke a skill when the user explicitly requests it by name.\n" +
      "- For casual messages like 'hi', 'hello', or 'how are you', respond warmly and identify yourself as TerraMind's CI/CD Engineer.",
    skills: [
      "cicd-github-actions-terraform",
      "helm-production-chart-scaffolding",
      "tf-remote-state-backend"
    ]
  }
};

export interface ProjectContext {
  name: string;
  description?: string;
  workspacePath?: string;
  files?: Array<{ name: string; size: number; content?: string }>;
}

export function buildSystemPrompt(agentId: string, projectContext?: ProjectContext): string {
  const agent = AGENT_PROMPTS[agentId] || AGENT_PROMPTS["agent_tf-devops-expert"];

  let prompt = agent.instructions + "\n\n";

  prompt += `--- TERRAMIND LOCAL RUNTIME & WORKSPACE ENVIRONMENT ---\n`;
  if (projectContext) {
    prompt += `Scope: Project "${projectContext.name}" (${projectContext.description || 'Cloud Infrastructure'})\n`;
  } else {
    prompt += `Scope: Global Workspace (Unified root workspace)\n`;
  }

  if (projectContext?.workspacePath) {
    prompt += `Workspace Path on Host: ${projectContext.workspacePath}\n`;
  }

  if (projectContext?.files && projectContext.files.length > 0) {
    prompt += `Existing Workspace Files on Disk (${projectContext.files.length} files available):\n`;
    for (const f of projectContext.files.slice(0, 15)) {
      prompt += `- ${f.name} (${f.size} bytes)\n`;
    }
    prompt += `CROSS-AGENT COLLABORATION GUIDELINES:\n`;
    prompt += `- All 4 TerraMind agents share this workspace and build upon each other's outputs.\n`;
    prompt += `- Reference existing resource names, module parameters, VPC IDs, and cluster endpoints defined in the files above.\n\n`;
  } else {
    prompt += `Existing Workspace Files: No files created yet. Ready for initial code generation.\n\n`;
  }

  prompt +=
    `CRITICAL EXECUTION RULES FOR ALL CODE GENERATION:\n` +
    `1. ZERO SIMULATED TOOL ROLEPLAY: NEVER pretend to run commands or tools in conversational text. DO NOT write "Let's inspect the workspace...", "Let's execute terraform fmt...", or "- Format & Validation: Passed successfully".\n` +
    `2. PROJECT / FOLDER CONFIRMATION (MANDATORY BEFORE CODE GENERATION):\n` +
    `   - If the user requests new infrastructure or code manifests and has NOT specified a target directory/folder (or is working in Global Workspace):\n` +
    `     DO NOT immediately dump code files into the root or unconfirmed paths.\n` +
    `     FIRST ask ONE brief, helpful question offering a clean suggested folder name:\n` +
    `     "Would you like to store this in a dedicated project or folder name (e.g., \`[suggested-folder-name]/\`), or do you prefer another name?"\n` +
    `   - Give a suggested name tailored to their request (e.g. \`k8s-production/\`, \`aws-vpc-3tier/\`, \`terraform-eks/\`, \`fastapi-deploy/\`).\n` +
    `   - As soon as the user confirms, responds with a folder name, or says 'proceed' / 'default' / 'yes' / 'go ahead': IMMEDIATELY author the complete code files with all file paths prefixed with that folder (e.g. \`# [folder]/deployment.yaml\`).\n` +
    `   - If the user ALREADY specified a folder name in their prompt (e.g. "in k8s/ folder", "under terraform-aws"), or is working inside an active dedicated project, skip the question and generate code directly into that folder.\n` +
    `3. CONCISE & TARGETED SCOPE: Deliver ONLY the specific resources or files requested by the user. Do not generate an avalanche of unrequested files, and do not repeat code.\n` +
    `4. ONE COMPLETE FILE PER CODE BLOCK (NO LOOPS): Output each file completely from beginning to end in a single code block (\`\`\`hcl or \`\`\`yaml) with the target relative filename on line 1 as a comment (e.g. \`# k8s-production/deployment.yaml\`). NEVER fragment files into multiple parts, NEVER write '(continued)' blocks, and NEVER output duplicate files.\n` +
    `5. AUTOMATIC COMPILATION & VALIDATION: The TerraMind backend engine intercepts your code blocks in real time, writes the files to disk in the local workspace under the specified folder, and runs real validation directly on the host machine.\n\n`;

  if (agent.skills && agent.skills.length > 0) {
    prompt += "--- SKILLS & SPECIALIZATIONS ---\n";
    for (const skillId of agent.skills) {
      const skill = SKILLS[skillId];
      if (skill) {
        prompt += `- ${skill.displayTitle}: ${skill.description}\n`;
      }
    }
    prompt += "\n";
  }
  return prompt;
}
