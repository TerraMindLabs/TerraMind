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
  - Fixed `$envDest` variable scoping in `install-tf-ai.sh`.

## 🚀 Future Targets
- [ ] End-to-end installer dry-run testing on fresh machines.
- [ ] Additional MCP tools (e.g. cloud provider CLI dry-run runners).
- [ ] Docker containerization / compose setup for TerraMind.