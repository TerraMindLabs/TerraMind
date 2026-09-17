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
*   `librechat.yaml`: The pre-configured engine mapping connecting the AI to the file system and Terraform binary.
*   `mcp-tf-runner.js`: The custom automation engine that allows the AI to securely run `terraform init`, `fmt`, `validate`, and `tfsec`.
*   `seed-agent.js`: The database injection script that pre-builds the AI agent natively into MongoDB.

## ⚡ Quick Start (Installation)
You do not need to manually edit any configuration files. The installer will guide you through setting up your workspace and installing necessary dependencies (like Node.js and Terraform).

**On Linux / macOS:**
```bash
chmod +x install-tf-ai.sh
./install-tf-ai.sh
```

**On Windows:**
Right-click `install-tf-ai.ps1` and select **Run with PowerShell**, or execute:
```powershell
.\install-tf-ai.ps1
```

> **Note:** The installer will ask you where you want to save your Terraform projects, whether you want to download local AI models (based on your RAM), and optionally ask for a Google Gemini API key.

## 📚 Post-Installation Setup
Because of the new Zero-Click Agent Deployment, you do not need to manually create the AI. The installer automatically creates and injects a fully configured 'Terraform DevOps Expert' AI directly into your platform! 

Once the installer finishes and TerraMind is running on `http://localhost:3080`, check out the [SETUP_GUIDE.md](./SETUP_GUIDE.md) to see how to instantly access your AI and test it out.
