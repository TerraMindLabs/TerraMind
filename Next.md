📋 Roadmap for Next Session
Interactive Dependency Installation Choice:

Add a setup prompt in the installers:
Option 1 (Default): Fast Install — Auto-download pre-bundled dependencies from Google Drive (~400MB) for rapid startup.
Option 2: Clean npm install — Build fresh dependencies from source (recommended for clean environments or custom architectures).
Fully Dynamic Ollama / Local Model Configuration:

Remove hardcoded model declarations from the base configuration.
Only trigger Ollama detection, model pulling, and endpoint injection into terramind.yaml / .env if the user explicitly selects local models during the installation menu.
Keep the setup minimal and lightweight by default (e.g., Gemini / Cloud only, zero Ollama overhead if not chosen).
Whenever you're ready to resume, just let me know and we'll dive right in! Have a great rest of your day!