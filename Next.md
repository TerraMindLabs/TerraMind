# 📋 Roadmap & Completed Milestones

## ✅ Completed Milestones
- [x] **Embed Chat Engine**: Merged and embedded `chat/` codebase directly into the root `TerraMind` repository as tracked files.
- [x] **Interactive Dependency Installation Choice**: Added interactive choice in `install-tf-ai.ps1` and `install-tf-ai.sh` allowing users to select between:
  - **Option 1 (Default)**: Fast Install via pre-bundled dependencies (~400MB) from Google Drive.
  - **Option 2**: Clean `npm install` from source for clean/custom environments.
- [x] **Fully Dynamic Ollama / Local Model Configuration**:
  - Removed hardcoded Ollama endpoints from base `chat/terramind.yaml`.
  - Zero Ollama overhead by default when Cloud/Gemini is chosen.
  - Dynamically injects chosen models and Ollama endpoints into `terramind.yaml` only when local models are explicitly requested.
- [x] **One-Liner Web Installer (Zero Dead Weight)**:
  - Enabled remote installation without cloning the Git repository:
    - Windows: `irm https://raw.githubusercontent.com/TerraMindLabs/TerraMind/main/install-tf-ai.ps1 | iex`
    - Linux/macOS: `curl -fsSL https://raw.githubusercontent.com/TerraMindLabs/TerraMind/main/install-tf-ai.sh | bash`
  - Eliminates duplicate cloned folders and unused files.
- [x] **Standalone Uninstaller Shortcuts**:
  - Automatically generates `Uninstall-TerraMind.bat` (Windows) and `uninstall-terramind.sh` (Linux/macOS) in the user's installation directory for one-click clean removal.
- [x] **Updated Documentation**:
  - Updated `README.md` with one-liner installation commands and operational guidance.
  - Comprehensive overhaul of `SETUP_GUIDE.md` covering prerequisites, setup options, zero-click agent activation, test prompts, and troubleshooting.

## 🚀 Future Targets
- [ ] End-to-end installer dry-run testing on fresh machines.
- [ ] Additional MCP tools (e.g. cloud provider CLI dry-run runners).
- [ ] Docker containerization / compose setup for TerraMind.