# AutoDevOps AI (TerraMind)

Welcome to **AutoDevOps AI**, your dedicated, self-correcting AI Cloud Architect. This package installs a private, containerized AI agent that writes, formats, secures, and automatically validates Terraform code against your cloud infrastructure.

## 🚀 The Value Proposition
Setting up secure cloud infrastructure usually takes days of reading docs and writing configuration files. **AutoDevOps AI does it in seconds.**

*   **Self-Documenting & Self-Correcting:** The AI doesn't just write code; it validates it, scans it for security vulnerabilities (like open security groups), fixes its own mistakes, and writes a deployment README for your team.
*   **Dual-Engine Privacy:** Run advanced tasks using Google Gemini's reasoning engine, or flip a switch to use 100% offline local models via Ollama for sensitive, proprietary environments.
*   **Zero-Setup Onboarding:** A one-shot deployment script configures everything on your local machine or server in under 2 minutes.

## 📦 What's Inside
This repository contains a fully automated deployment stack for TerraMind, powered by custom Model Context Protocol (MCP) tools specifically engineered for DevOps automation:
*   `install-tf-ai.sh` & `install-tf-ai.ps1`: The interactive one-shot installers for Linux/macOS and Windows.
*   `chat/terramind.yaml`: The pre-configured engine mapping connecting the AI to the file system and Terraform binary.
*   `chat/mcp-tf-runner.js`: The custom automation engine that allows the AI to securely run `terraform init`, `fmt`, `validate`, and `tfsec`.
*   `chat/seed-agent.js`: The database injection script that pre-builds the 4 AI agents and pre-seeds the top 10 DevOps skills into MongoDB.

### 🤖 4 Integrated DevOps Agents & Selective Skill Scoping
Each agent operates with **selective domain scoping** (`skills_scope: "selected"`), ensuring each expert accesses only the specific blueprints and runbooks relevant to its domain:

1. **🏗️ Terraform DevOps Expert**: Principal Cloud Architect that creates, formats, validates, and provisions modular Terraform code with strict human approval gates.
   * *Scoped Skills:* `tf-remote-state-backend`, `aws-production-vpc-3tier`, `tf-module-scaffolding`, `vault-secrets-cloud-integration`, `cloud-disaster-recovery-runbook`
2. **💰 FinOps & Cloud Cost Optimizer**: Principal Cloud Economist providing multi-cloud cost benchmarks (AWS vs GCP vs Azure), Spot/Graviton rightsizing, visual spend charts, and monthly budget impact.
   * *Scoped Skills:* `finops-multicloud-cost-optimization`, `finops-multicloud-cost-charts`
3. **☸️ Kubernetes & GitOps Platform Engineer**: Principal Platform Architect tailoring workload-specific K8s manifests, resource QoS, health probes, Helm charts, and ArgoCD/Flux GitOps rollouts.
   * *Scoped Skills:* `k8s-workload-hardening`, `k8s-zero-trust-network-policy`, `helm-production-chart-scaffolding`, `vault-secrets-cloud-integration`, `cloud-disaster-recovery-runbook`
4. **🔄 CI/CD Pipeline Engineer**: Principal DevSecOps Engineer creating 5-stage GitHub Actions & GitLab CI pipelines with OIDC keyless authentication, PR plan comments, and state locking.
   * *Scoped Skills:* `cicd-github-actions-terraform`, `helm-production-chart-scaffolding`, `tf-remote-state-backend`

### 🧠 Top Built-In DevOps Skills (Pre-Seeded)
TerraMind automatically injects production-grade architecture blueprints and SOP playbooks into MongoDB:
1. `tf-remote-state-backend`: S3 + DynamoDB / GCS remote state storage, encryption, and zero-downtime migration runbook.
2. `aws-production-vpc-3tier`: Highly available 3-tier VPC blueprint with subnet CIDR formulas, NAT routing, and EKS tagging.
3. `tf-module-scaffolding`: Reusable Terraform child/root module scaffolding with semantic variable validation and output contracts.
4. `k8s-workload-hardening`: Non-root securityContext, CPU/RAM QoS tuning (preventing OOMKilled), graceful termination, and PDB.
5. `k8s-zero-trust-network-policy`: Namespace default-deny traffic rules with least-privilege ingress/egress microservice policies.
6. `helm-production-chart-scaffolding`: Production Helm v3 chart layout, label helpers (`_helpers.tpl`), and JSON Schema validation.
7. `cicd-github-actions-terraform`: Keyless Cloud OIDC authentication, concurrency state locking, and automated PR plan diff comments.
8. `finops-multicloud-cost-optimization`: Cross-cloud instance equivalence matrix (AWS Graviton vs GCP Tau vs Azure Ampere) and gp2-to-gp3 savings.
9. `finops-multicloud-cost-charts`: Multi-cloud side-by-side cost comparison tables, ASCII/Markdown spend distribution charts, 3-year TCO projections, and commitment discount models.
10. `vault-secrets-cloud-integration`: Zero-secret Terraform patterns with AWS Secrets Manager and External Secrets Operator (ESO).
11. `cloud-disaster-recovery-runbook`: Multi-region failover tiers, cross-region state replication, and Velero cluster backup automation.

## 🤖 Flexible AI Engines & Direct Key Generation Links

TerraMind gives you full freedom over your AI models. Choose between 100% offline local models, premier cloud models, or a hybrid setup:

| Provider | Type | Direct API Key / Model Link | Notes |
| :--- | :--- | :--- | :--- |
| **Local Ollama** | 100% Offline / Private | [https://ollama.com/library](https://ollama.com/library) | Free, zero cloud fees, private. Auto-installed by setup script. |
| **Google Gemini** | Cloud AI | [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Generous free tier, fast inference, 1M+ context window. |
| **OpenAI** | Cloud AI | [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) | GPT-4o, GPT-4o-mini support. |
| **Anthropic Claude** | Cloud AI | [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) | Claude 3.5 Sonnet, Claude 3.7 Sonnet reasoning. |

> [!TIP]
> **No Forced Keys:** If you select Local Ollama during installation, TerraMind will **never** prompt or force you to enter a Gemini or cloud API key. You can also run purely offline or enter cloud keys later via **Settings > Provider Keys** in the web interface.

## ⚡ Quick Start (One-Liner Installation)
You do not need to clone this repository manually. Run the single command below in your terminal, and TerraMind will install directly into your chosen directory with zero dead weight:

**On Windows (PowerShell as Administrator or Standard):**
```powershell
irm https://raw.githubusercontent.com/TerraMindLabs/TerraMind/main/install-tf-ai.ps1 | iex
```

**On Linux / macOS (Terminal):**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/TerraMindLabs/TerraMind/main/install-tf-ai.sh)"
```

*(Alternatively, if you have already cloned this repository locally, you can directly run `.\install-tf-ai.ps1` or `./install-tf-ai.sh`)*.

---

## 🎮 Launching & Managing TerraMind
Once installed, you will find two companion shortcuts in your TerraMind folder:

* **Start the AI Server**:
  - **Windows**: Double-click `TerraMind.exe` (or the Desktop shortcut / `TerraMind.bat`)
  - **Linux / macOS**: Run `./start-terramind.sh`
  - Open your browser to `http://localhost:3080`

* **Clean Uninstallation**:
  - **Windows**: Double-click `Uninstall_TerraMind.exe` (or `Uninstall_TerraMind.bat`)
  - **Linux / macOS**: Run `./uninstall-terramind.sh`
  - Cleanly terminates running processes, removes application files, desktop shortcuts, and optionally cleans global MCP packages and local Ollama models.

---

## 👥 Managing Administrators & Users

TerraMind includes built-in role-based access control with **`ADMIN`** and **`USER`** tiers:

* **Automatic Admin Elevation**: The very first user account registered on the web app (`http://localhost:3080`) is automatically granted **`ADMIN`** status.
* **Subsequent Users**: All subsequent accounts are assigned the standard **`USER`** role. Both Admins and Users have access to the Agent Marketplace and AI models.
* **CLI Management Utilities** (run from your installation's `Mind/` directory):
  * **List all users and roles**: `npm run list-users`
  * **Promote to Admin**: `npm run make-admin <email>` *(or `npm run set-role <email> <ADMIN|USER>`)*
  * **Create accounts directly**: `npm run create-user`
  * **Reset passwords**: `npm run reset-password`
  * **Suspend or delete accounts**: `npm run ban-user <email> <mins>` / `npm run delete-user`
* **Locking Down Registration**:
  * Edit `Mind/.env` and set `ALLOW_REGISTRATION=false` to disable public sign-ups, restricting access strictly to accounts created by an administrator.

---

## 📚 Post-Installation Setup
Because of the Zero-Click Agent Deployment, you do not need to manually create or configure the AI. The installer automatically creates and injects a fully configured 'Terraform DevOps Expert' AI directly into your platform! 

Once the installer finishes and TerraMind is running on `http://localhost:3080`, check out the [SETUP_GUIDE.md](./SETUP_GUIDE.md) to see how to instantly access your AI and test it out.
