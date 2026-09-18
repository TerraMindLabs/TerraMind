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
*   `chat/seed-agent.js`: The database injection script that pre-builds the AI agent natively into MongoDB.

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
