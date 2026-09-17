#!/bin/bash

# Color definitions
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting TerraMind (TF-AI-Gen) One-Shot Installation...${NC}"

# 1. Prompt for Configuration
read -p "Enter your Google Gemini API Key (or press enter to skip): " apiKey

read -p "Enter path for Terraform Workspace [Default: ~/TerraformProject]: " tfWorkspace
tfWorkspace=${tfWorkspace:-~/TerraformProject}
# Expand tilde
tfWorkspace="${tfWorkspace/#\~/$HOME}"

read -p "Enter path for TerraMind (LibreChat) installation [Default: ./LibreChat]: " lcPath
lcPath=${lcPath:-./LibreChat}
lcPathFull=$(realpath -m "$lcPath")

echo -e "${CYAN}Select local Ollama models to pull based on your system RAM:${NC}"
echo " 1) Low-end (8GB RAM): llama3.2, qwen2.5-coder:3b"
echo " 2) Mid-range (16GB RAM): llama3.1, qwen2.5-coder:7b"
echo " 3) High-end (32GB+ RAM): mistral-nemo, qwen2.5-coder:14b"
echo " 4) Skip local models (Use only Gemini/Cloud)"
echo " 5) Custom (comma-separated list)"
read -p "Enter your choice (1-5) or press Enter to skip [Default: 4]: " modelChoice
modelChoice=${modelChoice:-4}

declare -a models=()
case $modelChoice in
    1) models=("llama3.2" "qwen2.5-coder:3b") ;;
    2) models=("llama3.1" "qwen2.5-coder:7b") ;;
    3) models=("mistral-nemo" "qwen2.5-coder:14b") ;;
    5) 
        read -p "Enter custom models (comma-separated): " customModels
        if [ ! -z "$customModels" ]; then
            IFS=',' read -ra models <<< "$customModels"
            # Trim whitespace
            for i in "${!models[@]}"; do models[$i]=$(echo "${models[$i]}" | xargs); done
        fi
        ;;
    *) ;;
esac

# 2. Dependency Checks

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install Git first!${NC}"
    exit 1
fi

# Check Node.js (npm)
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Node.js (npm) is not installed. Please install Node.js LTS (https://nodejs.org/) first!${NC}"
    exit 1
fi

# Warn about MongoDB
echo -e "${YELLOW}⚠️ IMPORTANT: Ensure MongoDB Community Server is installed and running natively in the background.${NC}"
echo -e "${YELLOW}   (https://www.mongodb.com/try/download/community)${NC}"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    echo -e "${YELLOW}⚙️ Terraform is not installed.${NC}"
    echo -e "${RED}Please install Terraform CLI (https://developer.hashicorp.com/terraform/downloads) first!${NC}"
    echo "For Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y gnupg software-properties-common && wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null && echo \"deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com \$(lsb_release -cs) main\" | sudo tee /etc/apt/sources.list.d/hashicorp.list && sudo apt update && sudo apt-get install terraform"
    exit 1
fi

# 3. Check for Ollama & Download Local AI Models
if [ ${#models[@]} -eq 0 ]; then
    echo -e "${YELLOW}⏩ Skipping local AI model download as requested.${NC}"
elif ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Ollama is not installed. Local AI model pull will be skipped.${NC}"
else
    echo -e "${YELLOW}🦙 Pulling Local AI Models via Ollama...${NC}"
    for model in "${models[@]}"; do
        echo -e "${CYAN}Pulling $model...${NC}"
        ollama pull "$model"
    done
fi

# 4. Install MCP Servers globally
echo -e "${YELLOW}🔌 Installing MCP Servers (Terraform & Filesystem)...${NC}"
npm install -g @modelcontextprotocol/server-filesystem terraform-mcp-server

# 5. Create the Terraform Workspace
if [ ! -d "$tfWorkspace" ]; then
    echo -e "${YELLOW}📁 Creating Terraform Workspace at $tfWorkspace...${NC}"
    mkdir -p "$tfWorkspace"
fi

# 6. Download Codebase (LibreChat/TerraMind)
echo -e "${YELLOW}📥 Cloning Repository to $lcPathFull...${NC}"
if [ ! -d "$lcPathFull/.git" ]; then
    git clone https://github.com/danny-avila/LibreChat.git "$lcPathFull"
else
    echo -e "${YELLOW}Repository already exists at $lcPathFull, skipping clone.${NC}"
fi

# 7. Download tfsec
tfsecPath="$lcPathFull/tfsec"
if [ ! -f "$tfsecPath" ]; then
    echo -e "${YELLOW}🛡️ Downloading tfsec...${NC}"
    wget -qO "$tfsecPath" "https://github.com/aquasecurity/tfsec/releases/latest/download/tfsec-linux-amd64"
    chmod +x "$tfsecPath"
fi

# 8. Install NPM Dependencies
echo -e "${YELLOW}📦 Installing Node dependencies (npm install)...${NC}"
cd "$lcPathFull" || exit
npm install

# 9. Configure Environment Variables and Copy Files
echo -e "${YELLOW}⚙️ Configuring Environment Variables and Copying Files...${NC}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Configure librechat.yaml if available in current directory
if [ -f "$SCRIPT_DIR/librechat.yaml" ]; then
    cp "$SCRIPT_DIR/librechat.yaml" "$lcPathFull/librechat.yaml"
    sed -i "s|REPLACE_WITH_TF_WORKSPACE|$tfWorkspace|g" "$lcPathFull/librechat.yaml"
    sed -i "s|REPLACE_WITH_MCP_RUNNER_PATH|$lcPathFull/mcp-tf-runner.js|g" "$lcPathFull/librechat.yaml"
fi

# Copy mcp runner script if available
if [ -f "$SCRIPT_DIR/mcp-tf-runner.js" ]; then
    cp "$SCRIPT_DIR/mcp-tf-runner.js" "$lcPathFull/mcp-tf-runner.js"
fi

# Configure .env
envSource="$SCRIPT_DIR/.env.example"
if [ ! -f "$envSource" ] && [ -f "$lcPathFull/.env.example" ]; then
    envSource="$lcPathFull/.env.example"
fi

if [ -f "$envSource" ]; then
    cp "$envSource" "$lcPathFull/.env"
    
    if [ ! -z "$apiKey" ]; then
        sed -i "s/REPLACE_WITH_YOUR_KEY/$apiKey/g" "$lcPathFull/.env"
    fi
    
    # Set APP_TITLE
    if grep -q "APP_TITLE=" "$lcPathFull/.env"; then
        sed -i "s/^APP_TITLE=.*/APP_TITLE=TerraMind/g" "$lcPathFull/.env"
    else
        echo "APP_TITLE=TerraMind" >> "$lcPathFull/.env"
    fi

    # Set MONGO_URI
    if grep -q "MONGO_URI=" "$lcPathFull/.env"; then
        sed -i "s|^MONGO_URI=.*|MONGO_URI=mongodb://127.0.0.1:27017/LibreChat|g" "$lcPathFull/.env"
    else
        echo "MONGO_URI=mongodb://127.0.0.1:27017/LibreChat" >> "$lcPathFull/.env"
    fi
else
    echo -e "${YELLOW}⚠️ Could not find .env.example to create .env file.${NC}"
fi

# Update index.html for TerraMind
htmlPath="$lcPathFull/client/index.html"
if [ -f "$htmlPath" ]; then
    sed -i 's/<title>LibreChat<\/title>/<title>TerraMind<\/title>/g' "$htmlPath"
    sed -i 's/content="LibreChat"/content="TerraMind"/g' "$htmlPath"
    echo -e "${GREEN}✅ Updated index.html with TerraMind title.${NC}"
fi

# 10. Build Frontend
echo -e "${YELLOW}🏗️ Building Frontend (npm run frontend)...${NC}"
npm run frontend

# 11. Finish Up
echo -e "${GREEN}✅ Installation Complete! TerraMind is ready to run natively on Linux.${NC}"
echo -e "${CYAN}▶️ To start the application, stay in the current directory and run: npm run backend${NC}"
echo -e "${WHITE}🌐 Access the application at: http://localhost:3080${NC}"
echo -e "${YELLOW}📝 NOTE: Make sure MongoDB Community Edition is running locally!${NC}"
