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
curl -fsSL https://raw.githubusercontent.com/TerraMindLabs/TerraMind/main/install-tf-ai.sh | bash
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

### 2. Dependency Installation Mode
Choose how application dependencies should be resolved:

```text
Dependency Installation Method:
[1] Fast Install - Extract pre-bundled dependencies (~2 mins) [Default]
[2] Clean Install (Recommended) - Build fresh dependencies from source via 'npm install' (Takes 30+ mins)
Enter choice (1 or 2) [Default: 1]:
```

* **Option 1: Fast Install [Default]**: Downloads a pre-packaged, verified dependency archive from Google Drive and unpacks it directly. Perfect for fast testing and getting started in under 3 minutes.
* **Option 2: Clean Install (Recommended)**: Fetches and compiles all npm packages freshly from npm registries. **Recommended for production and development environments**, ensuring 100% native compatibility with your specific OS and Node.js version. *(Note: Takes 30+ minutes depending on internet connection and hardware)*.

---

### 3. AI Engine Configuration
Select your primary AI model provider:

```text
Choose Primary AI Engine:
[1] Local Offline AI (Ollama)
[2] Cloud AI (Google Gemini - Fast & No GPU required) [Default]
[3] Skip for now (Configure manually later)
Enter choice (1, 2, or 3) [Default: 2]:
```

#### Choice 2: Cloud AI (Google Gemini) [Default]
* **Fast & Lightweight**: Zero local GPU or CPU load.
* Requires a free or paid Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/)).
* Keeps your `chat/terramind.yaml` clean with **zero Ollama overhead**.

#### Choice 1: Local Offline AI (Ollama)
* **100% Offline & Private**: Keeps all Terraform configurations and credentials strictly on your machine.
* **Automated Ollama Check & Install**: If Ollama is not detected in your `PATH`, the installer automatically downloads and installs it for you (`winget` / `OllamaSetup.exe` on Windows; official install script on Linux).
* **8+ Hardware-Tailored Model Options**:
  1. `qwen2.5-coder:7b` - Recommended for DevOps & Terraform (Requires ~8 GB RAM / VRAM)
  2. `deepseek-coder-v2:16b` - High performance coding model (~16 GB RAM)
  3. `codellama:7b` - Specialized code synthesis model (~8 GB RAM)
  4. `llama3.2:3b` - Ultra-lightweight model (Runs on 4 GB RAM / standard laptops)
  5. `llama3.1:8b` - Balanced general reasoning and DevOps (~8 GB RAM)
  6. `mistral:7b` - Fast instruction follower (~8 GB RAM)
  7. `qwen2.5-coder:14b` - Precision architecture & complex infrastructure (~16 GB RAM)
  8. `llama3.1:70b` - Enterprise-grade reasoning (Requires 48 GB+ VRAM / Multi-GPU)
  9. `Hardware Bundles`: Automated batch pulling for Pro DevOps, Lightweight, or Ultimate multi-model stacks.
  10. `Custom Model`: Enter any model name available on the Ollama Library.

#### Choice 3: Skip for now
* Skips model pulling and local configuration, allowing you to manually install Ollama and configure custom endpoints at a later time.

---

## 🎮 Launching TerraMind

Once the installation completes, two dedicated launchers are created in your installation folder:

### Starting the Server
* **Windows**: Double-click `Start-TerraMind.exe` (or the Desktop shortcut / `Start-TerraMind.bat`)
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

* **Windows**: Double-click `Uninstall-TerraMind.exe` (or `Uninstall-TerraMind.bat`)
* **Linux / macOS**: Run `./uninstall-terramind.sh`

### What the Uninstaller Does:
1. **Process Termination**: Safely stops all active TerraMind Node.js and MongoDB processes.
2. **Application Cleanup**: Deletes the installed `Mind` folder and configuration files.
3. **Desktop / Menu Shortcuts**: Removes generated shortcuts and launchers.
4. **Interactive Deep Clean (Optional)**:
   - Asks if you want to uninstall globally installed MCP tools (`@modelcontextprotocol/server-filesystem`, etc.).
   - Asks if you want to delete local Ollama models downloaded during setup.

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
