# TerraMind: Comprehensive Setup & Configuration Guide

Welcome to the **TerraMind** (AutoDevOps AI) Setup & Configuration Guide. This document provides end-to-end instructions for installing, configuring, launching, and managing your self-correcting Terraform AI Architect on Windows, Linux, and macOS.

---

## 📋 Table of Contents
1. [System Requirements & Prerequisites](#-system-requirements--prerequisites)
2. [Installation Methods](#-installation-methods)
   - [Option A: One-Liner Web Install (Recommended)](#option-a-one-liner-web-install-recommended)
   - [Option B: Git Clone Install](#option-b-git-clone-install)
3. [Interactive Setup Options](#-interactive-setup-options)
   - [Installation Directory](#1-installation-directory)
   - [Dependency Installation (Fast vs Clean)](#2-dependency-installation-mode)
   - [AI Engine Configuration (Gemini vs Ollama)](#3-ai-engine-configuration)
4. [Launching TerraMind](#-launching-terramind)
5. [Activating Your Pre-Seeded AI Agent](#-activating-your-pre-seeded-ai-agent)
6. [Testing the DevOps AI Agent](#-testing-the-devops-ai-agent)
7. [Uninstallation & Clean Removal](#-uninstallation--clean-removal)
8. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 💻 System Requirements & Prerequisites

| Component | Minimum Requirement | Recommended |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 (64-bit), Ubuntu 20.04+, Debian 11+, macOS 12+ | Windows 11 / Ubuntu 22.04 LTS |
| **Node.js** | Node.js v18.x or v20.x | Node.js v20.x LTS |
| **RAM** | 8 GB (Cloud Gemini mode) | 16 GB+ (if running local Ollama models) |
| **Disk Space** | 5 GB free disk space | 20 GB+ (if downloading local 7B-14B LLMs) |
| **Terraform CLI** | Terraform v1.5+ installed in system `PATH` | Terraform v1.7+ |
| **Git** | Optional for web install; required for clone | Git 2.40+ |

---

## 🚀 Installation Methods

### Option A: One-Liner Web Install (Recommended)
You do **not** need to manually clone this repository. The one-liner installer automatically streams the setup script and installs TerraMind directly to your chosen directory, leaving **zero dead weight** or unused clone directories on your machine.

#### Windows (PowerShell as Administrator or Standard):
```powershell
irm https://raw.githubusercontent.com/TerraMindLabs/TerraMind/main/install-tf-ai.ps1 | iex
```

#### Linux & macOS (Terminal):
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/TerraMindLabs/TerraMind/main/install-tf-ai.sh)"
```

---

### Option B: Git Clone Install
If you have already cloned the repository or prefer manual cloning:

```bash
git clone https://github.com/TerraMindLabs/TerraMind.git
cd TerraMind
```

Run the local installer:
* **Windows (PowerShell)**:
  ```powershell
  .\install-tf-ai.ps1
  ```
* **Linux / macOS**:
  ```bash
  chmod +x install-tf-ai.sh
  ./install-tf-ai.sh
  ```

> [!TIP]
> **No Dead Weight Guarantee:** If you choose an installation directory outside the cloned repository (for example, `C:\TerraMind`), the installer will prompt you at the end:
> *"Do you want to delete the initial cloned repository folder to avoid dead weight? (y/n)"*
> Answering **y** safely removes the temporary clone directory while leaving your installed application completely intact.

---

## ⚙️ Interactive Setup Options

When you execute the installer, you will be guided through 3 quick interactive choices:

### 1. Installation Directory
Specify where you want TerraMind to live:
* **Windows Default**: `C:\TerraMind`
* **Linux / macOS Default**: `~/TerraMind`

---

### 2. Fast Lightweight Installation
TerraMind is built as an ultra-fast, modern TypeScript monorepo with an embedded SQLite WAL database:
* **Zero External DB Setup**: No MongoDB or external service dependencies to configure.
* **Streamlined Workspaces**: Dependencies install cleanly via `npm install` across server and client in under a minute.
* **Instant Production Build**: The Vite React frontend compiles in seconds into `apps/web/dist`, served directly by the Fastify backend on port 3080.

---

### 3. AI Engine Configuration
Select your preferred AI engine setup during installation:

```text
======================================================================
                🤖 Select your AI Engine Setup                       
======================================================================
 1) Local AI via Ollama (100% Offline / Private / Free)
 2) Cloud AI (Google Gemini, OpenAI, Anthropic Claude)
 3) Hybrid (Both Local Ollama + Cloud AI Models) [Recommended]
 4) Skip for now (Configure models & keys manually later)
Enter your choice (1-4) [Default: 3]:
```

#### Choice 3: Hybrid (Both Local Ollama + Cloud AI Models) [Recommended]
* Combines the best of both worlds: local privacy for sensitive code editing and premier cloud models for high-level architecture planning.

#### Choice 1: Local AI via Ollama (100% Offline / Private / Free)
* **Zero Cloud Dependency & Zero Cost**: Runs completely on your hardware without internet or cloud API fees.
* **No Cloud API Keys Required**: You will **never** be forced or prompted to provide a Gemini, OpenAI, or Anthropic key.
* **Automatic Installation & Background Management**: If Ollama is not installed, the installer downloads it automatically. In environments without systemd (e.g. WSL or bare Docker), TerraMind automatically launches and monitors `ollama serve` in the background.
* **Streamlined, Color-Coded RAM Tiers & Multi-Model Selection**:
  You can choose single models or enter comma-separated numbers (e.g. `5` or `4,7`):

| Color / Tier | Target Hardware | Included Models / Bundles | Model Library Link |
| :--- | :--- | :--- | :--- |
| **🟢 Low-End / Laptop** | 4GB - 8GB RAM | `qwen2.5-coder:1.5b`, `qwen2.5-coder:3b`, `llama3.2`, Low-End Bundle | [Ollama Library](https://ollama.com/library) |
| **🟡 Mid-Range / Workstation** | 12GB - 16GB RAM | `qwen2.5-coder:7b` (⭐ Recommended), `llama3.1`, `codellama:7b`, Mid Bundle | [Ollama Library](https://ollama.com/library) |
| **🔴 High-End / Powerhouse** | 32GB+ RAM / GPU | `qwen2.5-coder:14b`, `mistral-nemo`, High-End Bundle | [Ollama Library](https://ollama.com/library) |

#### Choice 2: Cloud AI (Google Gemini, OpenAI, Anthropic Claude)
* **High Reasoning & Zero Local GPU Burden**: Offloads heavy model computation to cloud inference APIs.
* **Direct Links to Generate API Keys**:
  * **Google Gemini** (Free Tier available): [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
  * **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  * **Anthropic Claude**: [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
* **Flexible Selection**: Pick only the provider you have (or skip entering keys during setup to add them in the Web UI later under **Settings > Provider Keys**).

#### Choice 3: Hybrid (Both Local Ollama + Cloud AI Models)
* Combines the best of both worlds: local privacy for code editing and cloud inference for high-level architecture planning.

#### Choice 4: Skip for now
* Skips model pulling and API key entry. You can configure models and keys anytime later.

---

## 🎮 Launching TerraMind

Once the installation completes, two dedicated launchers are created in your installation folder:

### Starting the Server
* **Windows**: Double-click `TerraMind.exe` (or the Desktop shortcut / `TerraMind.bat`)
* **Linux / macOS**: Run `./start-terramind.sh`

This script starts:
1. The MongoDB database engine (or connects to your local instance).
2. The TerraMind backend & frontend web server.
3. The custom Model Context Protocol (MCP) servers (`tf-runner`, `local-fs`, `terraform-registry`).

Open your browser and navigate to:
```
http://localhost:3080
```

---

## 🤖 Activating Your Pre-Seeded AI Agent

Because of TerraMind's **Zero-Click Agent Deployment**, you do not need to manually configure prompts, system roles, or tool schemas!

1. **Sign Up / Log In**:
   - Open `http://localhost:3080` in your browser.
   - Click **Sign Up** to create your local admin account.
2. **Open the Agent Marketplace**:
   - In the left sidebar, click **Agents**.
3. **Select the Promoted Agent**:
   - You will see the **Terraform DevOps Expert** agent prominently displayed.
   - Click on it to select it.
   - *(Everything is pre-wired: system prompt, file system access, Terraform binary runner, and Terraform Registry integration!)*

---

## 🎉 Testing the DevOps AI Agent

Open a new conversation with the **Terraform DevOps Expert** agent selected and paste one of the following prompts:

### Test Prompt 1: Production AWS VPC
> *"Create a production-ready AWS VPC with 2 public subnets, 2 private subnets, a NAT Gateway, and an Internet Gateway. Save the configuration to my workspace and validate the syntax."*

### Test Prompt 2: Azure Kubernetes Service (AKS)
> *"Generate a complete Azure AKS cluster configuration with an Azure Container Registry (ACR) attachment. Check the Terraform Registry for the latest AzureRM provider syntax, format the code, and run a validation check."*

### Test Prompt 3: Security & Policy Enforcement
> *"Inspect my current Terraform files in the workspace. Identify any security risks (such as open ingress on port 0.0.0.0/0), explain the risks, and refactor the code to adhere to CIS benchmarks."*

### What Happens Behind the Scenes:
1. **Registry Lookup**: Queries the official Terraform Registry MCP for up-to-date provider arguments.
2. **File Generation**: Writes `.tf` files directly to your target directory using the `local-fs` MCP.
3. **Self-Correction (`tf-runner`)**: Executes `terraform fmt` and `terraform validate`. If errors occur, the AI automatically reads the compiler errors, fixes the syntax in-place, and re-validates!

---

## 🗑️ Uninstallation & Clean Removal

If you ever wish to remove TerraMind from your machine, a standalone uninstaller is generated directly inside your installation directory:

* **Windows**: Double-click `Uninstall_TerraMind.exe` (or `Uninstall_TerraMind.bat`)
* **Linux / macOS**: Run `./uninstall-terramind.sh`

### What the Uninstaller Does:
1. **Process Termination**: Safely stops all active TerraMind Node.js and MongoDB processes.
2. **Application Cleanup**: Deletes the installed `Mind` folder and configuration files.
3. **Desktop / Menu Shortcuts**: Removes generated shortcuts and launchers.
4. **Interactive Deep Clean (Optional)**:
   - Asks if you want to uninstall globally installed MCP tools (`@modelcontextprotocol/server-filesystem`, etc.).
   - Asks if you want to delete local Ollama models downloaded during setup.

---

## 👥 Managing Administrators & Users

TerraMind features built-in role-based access control (`ADMIN` and `USER`).

### 1. Default Role Assignment
* **First Registered Account**: The very first user to register on the web interface is automatically assigned the **`ADMIN`** role.
* **Subsequent Accounts**: Any account registered subsequently receives the standard **`USER`** role. Both Admins and Users enjoy access to the Agent Marketplace and AI agents.

### 2. User & Admin Management CLI Commands
All user management operations can be run directly from the `Mind` installation directory:

| Action | Command | Description |
| :--- | :--- | :--- |
| **List Users & Roles** | `npm run list-users` | Displays all registered accounts with their ID, email, and role (`ADMIN` / `USER`). |
| **Change Role / Make Admin** | `npm run set-role <email> ADMIN` | Promotes a user to `ADMIN` (or pass `USER` to demote). Runs interactively if parameters are omitted. |
| **Shortcut: Make Admin** | `npm run make-admin <email>` | Direct alias to elevate an account to `ADMIN`. |
| **Create a User** | `npm run create-user` | Interactively creates a new user account without needing web registration. |
| **Reset Password** | `npm run reset-password` | Interactively resets the password for any user account. |
| **Ban User** | `npm run ban-user <email> <mins>` | Suspends a user account for a specified duration in minutes. |
| **Delete User** | `npm run delete-user` | Cleanly removes a user and cascades their conversations, files, and tokens. |

### 3. Registration Security & Access Control
Inside `Mind/.env`, administrators can lock down access:
* **`ALLOW_REGISTRATION=false`**: Disables public sign-ups on the login page. New users can only be onboarded manually by an administrator using `npm run create-user`.
* **`ALLOW_SOCIAL_REGISTRATION=false`**: Prevents automatic registration from OAuth identity providers.
* **`ALLOW_UNVERIFIED_EMAIL_LOGIN=true`**: Allows logging in immediately without an outbound SMTP email verification service configured.

---

## ❓ Troubleshooting & FAQ

### 1. Port 3080 or Port 27017 is already in use
If another application is running on port `3080` (TerraMind web) or `27017` (MongoDB):
* Edit `.env` inside your installation's `Mind/` folder.
* Update `PORT=3080` to another port (e.g., `PORT=3090`).
* If using an external MongoDB instance, update `MONGO_URI` accordingly.

### 2. Terraform binary not found
Ensure Terraform is installed and added to your system's `PATH`:
* Windows: `terraform -version` in PowerShell.
* Linux/macOS: `which terraform` in Terminal.
If missing, download Terraform from [HashiCorp's official site](https://developer.hashicorp.com/terraform/install).

### 3. Re-running Agent Seeding
If you reset your database and the **Terraform DevOps Expert** agent disappears:
1. Open a terminal in your installation directory:
   ```bash
   cd Mind
   node seed-agent.js
   ```
2. The agent will be re-injected into MongoDB immediately.

### 4. GPU Acceleration with Ollama
If running local models via Ollama, Ollama automatically leverages NVIDIA (CUDA), AMD (ROCm), or Apple Silicon (Metal) GPUs. Verify GPU offloading with:
```bash
ollama ps
```
Ensure your GPU drivers are up to date for optimal inference speeds.
