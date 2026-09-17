#!/bin/bash

# Color definitions
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Attempt to resize the console window for a better installer experience (Works on many xterm emulators)
printf '\e[8;40;120t'

echo -e "${CYAN}████████╗███████╗██████╗ ██████╗  █████╗ ███╗   ███╗██║███╗   ██╗██████╗ "
echo -e "╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗"
echo -e "   ██║   █████╗  ██████╔╝██████╔╝███████║██╔████╔██║██║██╔██╗ ██║██║  ██║"
echo -e "   ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██║╚██╔╝██║██║██║╚██╗██║██║  ██║"
echo -e "   ██║   ███████╗██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██████╔╝"
echo -e "   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ ${NC}"
echo ""
echo -e "${WHITE}Welcome to TerraMind (TF-AI-Gen) Setup${NC}"
echo ""

echo -e "${CYAN}What would you like to do?${NC}"
echo " 1) Install TerraMind"
echo " 2) Uninstall TerraMind"
read -p "Enter your choice (1 or 2): " action

if [ "$action" == "2" ]; then
    echo ""
    echo -e "${RED}[!] CRITICAL: Before proceeding, ensure the TerraMind server is STOPPED!${NC}"
    echo -e "${YELLOW}    Make sure you have completely closed out of the terminal window running your TerraMind server,${NC}"
    echo -e "${YELLOW}    or force-kill all Node processes (e.g. 'pkill node' or 'killall node').${NC}"
    echo -e "${YELLOW}    If the server is still running, the uninstaller will get stuck trying to delete locked files!${NC}"
    echo ""

    currentDir=$(pwd)
    read -p "Enter the base directory where TerraMind is installed (e.g., /opt, /g) [Default: $currentDir]: " baseDir
    baseDir=${baseDir:-$currentDir}
    
    read -p "Enter the folder name [Default: TerraMind]: " folderName
    folderName=${folderName:-TerraMind}
    
    basePath="$baseDir/$folderName"
    
    lcPathFull="$basePath/Mind"
    tfWorkspace="$basePath/Terraform"

    echo -e "\n${YELLOW}The following directories will be permanently deleted:${NC}"
    echo -e "${RED}- $lcPathFull${NC}"
    echo -e "${RED}- $tfWorkspace${NC}"

    echo -e "\n${RED}⚠️ WARNING: This will completely uninstall TerraMind (TF-AI-Gen) and delete its data!${NC}"
    read -p "Are you sure you want to proceed? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[yY]$ ]]; then
        echo "Uninstallation cancelled."
        exit 0
    fi

    read -p $'\nUninstall global MCP NPM packages? (y/N): ' removeNpm
    read -p "Remove locally downloaded Ollama models (llama3.2, qwen2.5-coder, etc.)? (y/N): " removeModels
    read -p "Force-kill all running Node.js servers to prevent file-lock errors? (Recommended) (y/N): " killNode

    if [[ "$killNode" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️ Forcefully stopping all Node.js processes...${NC}"
        pkill -f node || true
        killall node 2>/dev/null || true
        sleep 2
    fi

    if [ -d "$lcPathFull" ]; then
        echo -e "${YELLOW}🗑️ Deleting TerraMind installation at $lcPathFull...${NC}"
        rm -rf "$lcPathFull"
    else
        echo -e "${CYAN}⏩ TerraMind installation not found at $lcPathFull, skipping...${NC}"
    fi

    if [ -d "$tfWorkspace" ]; then
        echo -e "${YELLOW}🗑️ Deleting Terraform Workspace at $tfWorkspace...${NC}"
        rm -rf "$tfWorkspace"
    else
        echo -e "${CYAN}⏩ Terraform Workspace not found at $tfWorkspace, skipping...${NC}"
    fi

    if [[ "$removeNpm" =~ ^[yY]$ ]] && command -v npm &> /dev/null; then
        echo -e "${YELLOW}🗑️ Uninstalling global MCP packages...${NC}"
        npm uninstall -g @modelcontextprotocol/server-filesystem terraform-mcp-server
    fi

    if [[ "$removeModels" =~ ^[yY]$ ]] && command -v ollama &> /dev/null; then
        echo -e "${YELLOW}🗑️ Removing standard Ollama models...${NC}"
        models=("llama3.2" "qwen2.5-coder:3b" "llama3.1" "qwen2.5-coder:7b" "mistral-nemo" "qwen2.5-coder:14b")
        for model in "${models[@]}"; do
            if ollama list | grep -q "$model"; then
                echo -e "${CYAN}Removing $model...${NC}"
                ollama rm "$model"
            fi
        done
    fi

    echo -e "${GREEN}✅ Uninstallation Complete!${NC}"
    exit 0
elif [ "$action" != "1" ]; then
    echo "Invalid choice. Exiting."
    exit 1
fi

# --- Installation Logic ---

echo -e "${CYAN}🚀 Starting TerraMind (TF-AI-Gen) One-Shot Installation...${NC}"

# 1. Prompt for Configuration
currentDir=$(pwd)
read -p "Enter your Google Gemini API Key (or press enter to skip): " apiKey

read -p "Enter the base directory to install TerraMind into (e.g., /opt, /g) [Default: $currentDir]: " baseDir
baseDir=${baseDir:-$currentDir}

read -p "Enter the folder name [Default: TerraMind]: " folderName
folderName=${folderName:-TerraMind}

basePath="$baseDir/$folderName"

if [ ! -d "$basePath" ]; then
    echo -e "${YELLOW}Creating base directory at $basePath...${NC}"
    mkdir -p "$basePath"
fi

tfWorkspace="$basePath/Terraform"
lcPathFull="$basePath/Mind"

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
            for i in "${!models[@]}"; do models[$i]=$(echo "${models[$i]}" | xargs); done
        fi
        ;;
    *) ;;
esac

# 2. Dependency Checks
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install Git first!${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Node.js (npm) is not installed. Please install Node.js LTS (https://nodejs.org/) first!${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️ IMPORTANT: Ensure MongoDB Community Server is installed and running natively in the background.${NC}"
echo -e "${YELLOW}   (https://www.mongodb.com/try/download/community)${NC}"

if ! command -v terraform &> /dev/null; then
    echo -e "${YELLOW}⚙️ Terraform is not installed.${NC}"
    echo -e "${RED}Please install Terraform CLI (https://developer.hashicorp.com/terraform/downloads) first!${NC}"
    echo "For Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y gnupg software-properties-common && wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null && echo \"deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com \$(lsb_release -cs) main\" | sudo tee /etc/apt/sources.list.d/hashicorp.list && sudo apt update && sudo apt-get install terraform"
    exit 1
fi

# 3. Check for Ollama & Download Local AI Models
if [ ${#models[@]} -eq 0 ]; then
    echo -e "${YELLOW}⏭️ Skipping local AI model download as requested.${NC}"
    export AGENT_PROVIDER="google"
    export AGENT_MODEL="gemini-3.5-flash-lite"
else
    export AGENT_PROVIDER="custom"
    export AGENT_MODEL="${models[0]}"
    if ! command -v ollama &> /dev/null; then
        echo -e "${YELLOW}⚠️ Ollama is not installed. Local AI model pull will be skipped.${NC}"
    else
        echo -e "${YELLOW}📥 Pulling Local AI Models via Ollama...${NC}"
        for model in "${models[@]}"; do
            echo -e "${CYAN}Pulling $model...${NC}"
            ollama pull "$model"
        done
    fi
fi

# 4. Install MCP Servers globally
echo -e "${YELLOW}🔌 Installing MCP Servers (Terraform & Filesystem)...${NC}"
npm install -g @modelcontextprotocol/server-filesystem terraform-mcp-server

# 5. Create the Terraform Workspace
if [ ! -d "$tfWorkspace" ]; then
    echo -e "${YELLOW}📁 Creating Terraform Workspace at $tfWorkspace...${NC}"
    mkdir -p "$tfWorkspace"
fi

# 6. Copy Local Bundled Codebase
echo -e "${YELLOW}📥 Copying bundled TerraMind codebase to $lcPathFull...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BUNDLED_CHAT_PATH="$SCRIPT_DIR/chat"

if [ ! -d "$lcPathFull" ]; then
    if [ -d "$BUNDLED_CHAT_PATH" ]; then
        cp -r "$BUNDLED_CHAT_PATH" "$basePath"
        mv "$basePath/chat" "$basePath/Mind"
    else
        echo -e "${RED}ERROR: Bundled 'chat' directory not found at $BUNDLED_CHAT_PATH. Please make sure you downloaded the complete installation package.${NC}"
        read -p "Press Enter to exit..."
        exit 1
    fi
else
    echo -e "${YELLOW}Directory already exists at $lcPathFull, skipping copy.${NC}"
fi

# 7. Download tfsec
tfsecPath="$lcPathFull/tfsec"
if [ ! -f "$tfsecPath" ]; then
    echo -e "${YELLOW}🛡️ Downloading tfsec...${NC}"
    wget -qO "$tfsecPath" "https://github.com/aquasecurity/tfsec/releases/latest/download/tfsec-linux-amd64"
    chmod +x "$tfsecPath"
fi

# 8. Install NPM Dependencies
scriptDir=$(pwd)
zipTarget=""
if [ -f "$lcPathFull/node_modules.zip" ]; then zipTarget="$lcPathFull/node_modules.zip"
elif [ -f "$scriptDir/node_modules.zip" ]; then zipTarget="$scriptDir/node_modules.zip"
elif [ -f "$scriptDir/chat/node_modules.zip" ]; then zipTarget="$scriptDir/chat/node_modules.zip"
fi

# If pre-bundled node_modules doesn't exist and no local zip was found, download it from Google Drive
if [ ! -d "$lcPathFull/node_modules" ] && [ -z "$zipTarget" ]; then
    gdriveFileId="1DXB_zWhrbBIjuq_hd12KsB25T8cEzSlS"
    downloadDest="$lcPathFull/node_modules.zip"
    echo -e "${YELLOW}Pre-bundled node_modules not found locally.${NC}"
    echo -e "${CYAN}📦 Downloading pre-bundled dependencies (~400MB) from Google Drive to accelerate setup...${NC}"
    cookieFile=$(mktemp)
    initUrl="https://drive.google.com/uc?export=download&id=$gdriveFileId"
    page=$(curl -s -c "$cookieFile" -L "$initUrl")
    action=$(echo "$page" | grep -o 'action="[^"]*"' | head -n1 | cut -d'"' -f2)
    [ -z "$action" ] && action="https://drive.usercontent.google.com/download"
    uuid=$(echo "$page" | grep -o 'name="uuid"[^>]*value="[^"]*"' | head -n1 | sed -n 's/.*value="\([^"]*\)".*/\1/p')
    downloadUrl="${action}?id=${gdriveFileId}&export=download&confirm=t"
    [ -n "$uuid" ] && downloadUrl="${downloadUrl}&uuid=${uuid}"

    echo -e "${YELLOW}Downloading node_modules.zip (curl progress below)...${NC}"
    curl -# -b "$cookieFile" -L "$downloadUrl" -o "$downloadDest"
    rm -f "$cookieFile"

    if [ -f "$downloadDest" ] && [ $(wc -c < "$downloadDest") -gt 10000000 ]; then
        echo -e "${GREEN}📦 Download completed successfully!${NC}"
        zipTarget="$downloadDest"
    else
        echo -e "${YELLOW}⚠️ Download failed or incomplete. Falling back to standard npm install.${NC}"
        rm -f "$downloadDest"
    fi
fi

if [ ! -d "$lcPathFull/node_modules" ] && [ ! -z "$zipTarget" ]; then
    echo -e "${YELLOW}📦 Found node_modules.zip at $zipTarget! Extracting to speed up installation (this might take a minute)...${NC}"
    unzip -q -o "$zipTarget" -d "$lcPathFull"
fi

if [ -d "$lcPathFull/node_modules" ]; then
    echo -e "${GREEN}📦 Found pre-bundled node_modules. Skipping npm install for faster setup!${NC}"
    cd "$lcPathFull" || exit
    npm install cross-env --no-save --silent
else
    echo -e "${YELLOW}📦 Installing Node dependencies (This has been optimized for speed)...${NC}"
    cd "$lcPathFull" || exit
    npm install --no-audit --no-fund --prefer-offline --loglevel verbose
fi

# 9. Configure Environment Variables and Copy Files
echo -e "${YELLOW}⚙️ Configuring Environment Variables and Copying Files...${NC}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

if [ -f "$lcPathFull/terramind.yaml" ]; then
    sed -i "s|REPLACE_WITH_TF_WORKSPACE|$tfWorkspace|g" "$lcPathFull/terramind.yaml"
    sed -i "s|REPLACE_WITH_MCP_RUNNER_PATH|$lcPathFull/mcp-tf-runner.js|g" "$lcPathFull/terramind.yaml"
    # Inject agents endpoint override for custom models
    sed -i -z 's/endpoints:\n  google:/endpoints:\n  agents:\n    models: ["gemini-3.5-flash-lite", "gemini-1.5-flash-latest", "llama3.2", "llama3.1", "qwen2.5-coder:3b", "qwen2.5-coder:7b", "mistral-nemo", "qwen2.5-coder:14b"]\n  google:/' "$lcPathFull/terramind.yaml"
fi

envSource="$lcPathFull/.env.example"

if [ -f "$envSource" ]; then
    cp "$envSource" "$lcPathFull/.env"
    
    if [ ! -z "$apiKey" ]; then
        sed -i "s/REPLACE_WITH_YOUR_KEY/$apiKey/g" "$lcPathFull/.env"
    fi
    
    if grep -q "APP_TITLE=" "$lcPathFull/.env"; then
        sed -i "s/REPLACE_WITH_YOUR_KEY/$apiKey/g" "$envDest"
    fi
    
    if grep -q "APP_TITLE=" "$envDest"; then
        sed -i "s/^APP_TITLE=.*/APP_TITLE=TerraMind/g" "$envDest"
    else
        echo "APP_TITLE=TerraMind" >> "$envDest"
    fi

    if grep -q "CONFIG_PATH=" "$envDest"; then
        sed -i 's/.*CONFIG_PATH=.*/CONFIG_PATH="terramind.yaml"/' "$envDest"
    else
        echo 'CONFIG_PATH="terramind.yaml"' >> "$envDest"
    fi

    if [ ! -z "$apiKey" ]; then
        if grep -q "GEMINI_API_KEY=" "$envDest"; then
            sed -i "s|.*GEMINI_API_KEY=.*|GEMINI_API_KEY=\"$apiKey\"|" "$envDest"
        else
            echo "GEMINI_API_KEY=\"$apiKey\"" >> "$envDest"
        fi
    fi

    if grep -q "MONGO_URI=" "$envDest"; then
        sed -i "s|^MONGO_URI=.*|MONGO_URI=mongodb://127.0.0.1:27017/TerraMind|g" "$envDest"
    else
        echo "MONGO_URI=mongodb://127.0.0.1:27017/TerraMind" >> "$envDest"
    fi

    if grep -q "HELP_AND_FAQ_URL=" "$envDest"; then
        sed -i "s|^HELP_AND_FAQ_URL=.*|HELP_AND_FAQ_URL=https://www.google.com|g" "$envDest"
    else
        echo "HELP_AND_FAQ_URL=https://www.google.com" >> "$envDest"
    fi
else
    echo -e "${YELLOW}⚠️ Could not find .env.example to create .env file.${NC}"
fi

htmlPath="$lcPathFull/client/index.html"
if [ -f "$htmlPath" ]; then
    sed -i 's/<title>LibreChat<\/title>/<title>TerraMind<\/title>/g' "$htmlPath"
    sed -i 's/content="LibreChat"/content="TerraMind"/g' "$htmlPath"
    echo -e "${GREEN}✅ Updated index.html with TerraMind title.${NC}"
fi

# 10. Build Frontend
if [ -d "$lcPathFull/client/dist" ]; then
    echo -e "${GREEN}⚡ Found pre-built frontend (client/dist). Skipping build for faster setup!${NC}"
else
    echo -e "${YELLOW}🏗️ Building Frontend (npm run frontend)...${NC}"
    npm run frontend
fi

# 11. Seed Default Agents
echo -e "${YELLOW}🌱 Seeding TerraMind AI Agents into MongoDB...${NC}"
cd "$lcPathFull" || exit
if [ ! -d "$lcPathFull/node_modules/mongodb" ]; then
    npm install mongodb --no-save --silent
fi

if [ ! -f "$lcPathFull/seed-agent.js" ] && [ -f "$BUNDLED_CHAT_PATH/seed-agent.js" ]; then
    cp "$BUNDLED_CHAT_PATH/seed-agent.js" "$lcPathFull/"
fi

if [ -f "$lcPathFull/seed-agent.js" ]; then
    node seed-agent.js
else
    echo -e "${YELLOW}⚠️ Could not find seed-agent.js. Skipping Agent database seeding.${NC}"
fi

# 12. Create Launch Scripts
echo -e "${YELLOW}📜 Creating Launch Shortcut...${NC}"
launchScript="$basePath/start-terramind.sh"
echo '#!/bin/bash' > "$launchScript"
echo 'cd "$(dirname "$0")/Mind" || exit' >> "$launchScript"
echo 'echo "Starting TerraMind AI Server..."' >> "$launchScript"
echo 'npm run backend' >> "$launchScript"
chmod +x "$launchScript"
echo -e "${GREEN}✅ Created launch script: $launchScript${NC}"

# 13. Finish Up
echo -e "${NC}==========================================================="
echo -e "${GREEN}✅ Installation Complete! TerraMind is ready to run.${NC}"
echo -e "${WHITE}🌐 Application URL: http://localhost:3080${NC}"
echo -e "${YELLOW}⚠️ NOTE: Make sure MongoDB Community Edition is running locally!${NC}"
echo -e "${NC}===========================================================\n"

read -t 10 -p " 🚀 Auto-starting TerraMind server in 10 seconds... Start now? (Y/n): " startApp
startApp=${startApp:-y}

if [[ ! "$startApp" =~ ^[nN]$ ]]; then
    echo -e "\n${CYAN} Starting TerraMind Server on port 3080... (Press Ctrl+C to stop)${NC}"
    npm run backend
else
    echo -e "\n${CYAN}▶️ To start it later, simply run ./start-terramind.sh in your installation folder!${NC}"
    read -p "Press Enter to exit..."
fi
