#!/bin/bash

# Color definitions
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Verify terminal / stdin connectivity for interactive installer
if [ ! -t 0 ]; then
    if [ -z "$BASH_EXECUTION_STRING" ]; then
        echo -e "${RED}Error: TerraMind interactive installer cannot be run via piped stdin ('curl ... | bash').${NC}"
        echo -e "Please run instead:"
        echo -e "  ${CYAN}bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/TerraMindLabs/TerraMind/main/install-tf-ai.sh)\"${NC}\n"
        exit 1
    elif [ -e /dev/tty ]; then
        exec < /dev/tty
    fi
fi

# Attempt to resize the console window for a better installer experience (Works on many xterm emulators)
printf '\e[8;40;120t'

echo -e "${CYAN}████████╗███████╗██████╗ ██████╗  █████╗ ███╗   ███╗██║███╗   ██╗██████╗ "
echo -e "╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗"
echo -e "   ██║   █████╗  ██████╔╝██████╔╝███████║██╔████╔██║██║██╔██╗ ██║██║  ██║"
echo -e "   ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██║╚██╔╝██║██║██║╚██╗██║██║  ██║"
echo -e "   ██║   ███████╗██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██████╔╝"
echo -e "   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ ${NC}"
run_with_spinner() {
    local title="$1"
    local cmd="$2"
    local dir="${3:-$PWD}"
    
    (cd "$dir" && eval "$cmd") >/dev/null 2>&1 &
    local pid=$!
    local spin='-\|/'
    local i=0
    local start=$(date +%s)
    
    while kill -0 $pid 2>/dev/null; do
        local elapsed=$(( $(date +%s) - start ))
        i=$(( (i+1) % 4 ))
        printf "\r ${CYAN}[*] %s (${spin:$i:1}) [%ds]${NC} " "$title" "$elapsed"
        sleep 0.25
    done
    wait $pid
    local total=$(( $(date +%s) - start ))
    printf "\r ${GREEN}[OK] %s (Completed in %ds)${NC}                     \n" "$title" "$total"
}

ensure_mongodb() {
    echo -e "\n${CYAN}🔍 Checking MongoDB database availability on port 27017...${NC}"
    if nc -z 127.0.0.1 27017 2>/dev/null || (echo > /dev/tcp/127.0.0.1/27017) 2>/dev/null; then
        echo -e "${GREEN}✅ MongoDB is active and listening on port 27017.${NC}"
        return 0
    fi

    if command -v systemctl &> /dev/null; then
        echo -e "${YELLOW}⚙️ Attempting to start MongoDB system service (mongod)...${NC}"
        sudo systemctl start mongod 2>/dev/null || sudo service mongodb start 2>/dev/null || true
        sleep 2
        if nc -z 127.0.0.1 27017 2>/dev/null || (echo > /dev/tcp/127.0.0.1/27017) 2>/dev/null; then
            echo -e "${GREEN}✅ MongoDB service started successfully and is ready!${NC}"
            return 0
        fi
    fi

    if command -v docker &> /dev/null && docker info &> /dev/null; then
        echo -e "\n${CYAN}[?] Docker detected! Would you like to run MongoDB in a Docker container?${NC}"
        read -p "Run MongoDB via Docker? (Y/n): " useDocker
        if [[ ! "$useDocker" =~ ^[nN]$ ]]; then
            docker run -d -p 27017:27017 --name terramind-mongo mongo:latest >/dev/null 2>&1 || docker start terramind-mongo >/dev/null 2>&1
            sleep 3
            return 0
        fi
    fi

    echo -e "${YELLOW}⚠️ Notice: MongoDB is not running on port 27017.${NC}"
    echo -e "   TerraMind requires MongoDB to store chats and agent prompts."
    echo -e "   Please ensure MongoDB is started before running TerraMind."
    return 1
}

ensure_terraform() {
    if command -v terraform &> /dev/null; then
        local tfVer=$(terraform version 2>/dev/null | head -n 1)
        echo -e "${GREEN}✅ Found Terraform CLI: ${tfVer}${NC}"
        return 0
    fi

    echo -e "\n${YELLOW}⚙️ Terraform CLI is not installed. Attempting automatic installation...${NC}"

    local arch="amd64"
    case $(uname -m) in
        x86_64) arch="amd64" ;;
        aarch64|arm64) arch="arm64" ;;
        armv7l) arch="arm" ;;
    esac

    # 1. Fast official HashiCorp standalone binary installation (Zero repo/apt dependencies)
    local tfVer="1.10.5"
    local tfZipUrl="https://releases.hashicorp.com/terraform/${tfVer}/terraform_${tfVer}_linux_${arch}.zip"
    local tempDir=$(mktemp -d 2>/dev/null || echo "/tmp/tf_install_$$")
    mkdir -p "$tempDir"

    if curl -fsSL "$tfZipUrl" -o "$tempDir/terraform.zip" 2>/dev/null; then
        if command -v unzip &> /dev/null; then
            unzip -q -o "$tempDir/terraform.zip" -d "$tempDir" 2>/dev/null
        elif command -v python3 &> /dev/null; then
            python3 -c "import zipfile; zipfile.ZipFile('$tempDir/terraform.zip').extractall('$tempDir')" 2>/dev/null
        elif command -v busybox &> /dev/null; then
            busybox unzip "$tempDir/terraform.zip" -d "$tempDir" 2>/dev/null
        fi

        if [ -f "$tempDir/terraform" ]; then
            chmod +x "$tempDir/terraform"
            if [ -w /usr/local/bin ]; then
                mv "$tempDir/terraform" /usr/local/bin/
            elif command -v sudo &> /dev/null; then
                sudo mv "$tempDir/terraform" /usr/local/bin/ 2>/dev/null || true
            fi
            if [ ! -f /usr/local/bin/terraform ] && [ -f "$tempDir/terraform" ]; then
                mkdir -p "$HOME/.local/bin"
                mv "$tempDir/terraform" "$HOME/.local/bin/"
                export PATH="$HOME/.local/bin:$PATH"
            fi
            rm -rf "$tempDir"
        fi
    fi

    if command -v terraform &> /dev/null; then
        local installedVer=$(terraform version 2>/dev/null | head -n 1)
        echo -e "${GREEN}✅ Terraform CLI installed successfully: ${installedVer}${NC}"
        return 0
    fi

    # 2. Package manager fallback (apt-get)
    if command -v apt-get &> /dev/null; then
        echo -e "${CYAN}Attempting Terraform CLI installation via apt...${NC}"
        local sudoCmd=""
        if [ "$EUID" -ne 0 ] && command -v sudo &> /dev/null; then
            sudoCmd="sudo"
        fi
        $sudoCmd apt-get update -qq 2>/dev/null || true
        $sudoCmd apt-get install -y -qq gnupg software-properties-common wget curl unzip 2>/dev/null || true
        wget -O- https://apt.releases.hashicorp.com/gpg 2>/dev/null | gpg --dearmor 2>/dev/null | $sudoCmd tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null || true
        local codename=$(lsb_release -cs 2>/dev/null || echo "jammy")
        echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $codename main" | $sudoCmd tee /etc/apt/sources.list.d/hashicorp.list > /dev/null || true
        $sudoCmd apt-get update -qq 2>/dev/null || true
        $sudoCmd apt-get install -y -qq terraform 2>/dev/null || true
    fi

    # 3. Brew fallback
    if ! command -v terraform &> /dev/null && command -v brew &> /dev/null; then
        brew install terraform 2>/dev/null || true
    fi

    if command -v terraform &> /dev/null; then
        local installedVer=$(terraform version 2>/dev/null | head -n 1)
        echo -e "${GREEN}✅ Terraform CLI installed successfully: ${installedVer}${NC}"
        return 0
    fi

    echo -e "${RED}⚠️ Could not automatically install Terraform CLI.${NC}"
    echo -e "   Please install Terraform manually: https://developer.hashicorp.com/terraform/downloads"
    exit 1
}

echo ""
echo -e "${WHITE}Welcome to TerraMind (TF-AI-Gen) Setup${NC}"
echo ""

echo -e "${CYAN}What would you like to do?${NC}"
echo " 1) Install TerraMind [Default]"
echo " 2) Uninstall TerraMind"
read -p "Enter your choice (1 or 2) [Default: 1]: " action
action=${action:-1}

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
        run_with_spinner "Deleting TerraMind installation ($lcPathFull)" "rm -rf \"$lcPathFull\""
    else
        echo -e "${CYAN}⏩ TerraMind installation not found at $lcPathFull, skipping...${NC}"
    fi

    if [ -d "$tfWorkspace" ]; then
        run_with_spinner "Deleting Terraform Workspace ($tfWorkspace)" "rm -rf \"$tfWorkspace\""
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
echo -e "${CYAN}Google Gemini API Key is free at: https://aistudio.google.com/apikey${NC}"
read -p "Enter your Google Gemini API Key (or press enter to set later in web app): " apiKey

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

echo -e "\n${CYAN}Select your AI Engine & Local Model Configuration:${NC}"
echo " 1) Configure Local AI via Ollama (100% Offline / Private)"
echo " 2) Use Cloud AI Only (Google Gemini) [Default]"
echo " 3) Skip for now (I will download Ollama and configure manually later)"
read -p "Enter your choice (1-3) [Default: 2]: " aiChoice
aiChoice=${aiChoice:-2}

declare -a models=()

if [ "$aiChoice" == "1" ]; then
    if ! command -v ollama &> /dev/null; then
        echo -e "${YELLOW}⚙️ Ollama is not installed. Attempting automatic installation via official script...${NC}"
        curl -fsSL https://ollama.com/install.sh | sh
        if command -v ollama &> /dev/null; then
            echo -e "${GREEN}✅ Ollama installed successfully!${NC}"
        else
            echo -e "${YELLOW}⚠️ Ollama installation may require restarting your terminal or manual setup from https://ollama.com.${NC}"
        fi
    else
        echo -e "${GREEN}✅ Found existing Ollama installation.${NC}"
    fi

    echo -e "\n${CYAN}Select local Ollama models based on your hardware / RAM:${NC}"
    echo -e "${WHITE} -- Bundles based on System RAM --${NC}"
    echo "  1) Low-End (8GB RAM):          qwen2.5-coder:3b, llama3.2"
    echo "  2) Mid-Range (16GB RAM):       qwen2.5-coder:7b, llama3.1"
    echo "  3) High-End (32GB+ RAM):       qwen2.5-coder:14b, mistral-nemo"
    echo -e "${WHITE} -- Individual Models (8+ Options) --${NC}"
    echo "  4) qwen2.5-coder:1.5b          (Ultra-lightweight, runs on any machine ~1GB)"
    echo "  5) qwen2.5-coder:3b            (Fast & lightweight ~2GB)"
    echo "  6) llama3.2:3b                 (Meta versatile 3B model ~2.2GB)"
    echo "  7) qwen2.5-coder:7b            (Recommended for Terraform/DevOps ~4.5GB)"
    echo "  8) llama3.1:8b                 (Meta flagship open model ~4.7GB)"
    echo "  9) mistral-nemo:12b            (Mistral high precision ~7GB)"
    echo " 10) qwen2.5-coder:14b           (Advanced enterprise code generation ~9GB)"
    echo " 11) codellama:7b                (Meta dedicated code model ~4GB)"
    echo " 12) deepseek-coder:6.7b         (DeepSeek specialized code model ~4GB)"
    echo " 13) Custom                      (Enter comma-separated model names)"
    read -p "Enter your choice (1-13) [Default: 7]: " modelChoice
    modelChoice=${modelChoice:-7}

    case $modelChoice in
        1) models=("qwen2.5-coder:3b" "llama3.2") ;;
        2) models=("qwen2.5-coder:7b" "llama3.1") ;;
        3) models=("qwen2.5-coder:14b" "mistral-nemo") ;;
        4) models=("qwen2.5-coder:1.5b") ;;
        5) models=("qwen2.5-coder:3b") ;;
        6) models=("llama3.2") ;;
        7) models=("qwen2.5-coder:7b") ;;
        8) models=("llama3.1") ;;
        9) models=("mistral-nemo") ;;
        10) models=("qwen2.5-coder:14b") ;;
        11) models=("codellama:7b") ;;
        12) models=("deepseek-coder:6.7b") ;;
        13)
            read -p "Enter custom models (comma-separated): " customModels
            if [ ! -z "$customModels" ]; then
                IFS=',' read -ra models <<< "$customModels"
                for i in "${!models[@]}"; do models[$i]=$(echo "${models[$i]}" | xargs); done
            fi
            ;;
        *) models=("qwen2.5-coder:7b") ;;
    esac
elif [ "$aiChoice" == "3" ]; then
    echo -e "${YELLOW}⏭️ Skipping Ollama setup for now. You can download Ollama later (https://ollama.com) and configure models manually.${NC}"
else
    echo -e "${GREEN}⏭️ Cloud AI mode selected (Google Gemini). Zero Ollama overhead.${NC}"
    if [ -z "$apiKey" ]; then
        echo -e "${YELLOW}ℹ️  Notice: No Gemini API Key was entered.${NC}"
        echo -e "${YELLOW}   Terraform DevOps Expert runs on Google Gemini and needs an API key to chat.${NC}"
        echo -e "${CYAN}   👉 Get a free Gemini key in seconds at: https://aistudio.google.com/apikey${NC}"
        echo -e "${CYAN}   👉 You can enter it in the chat UI via 'Set API Key' or Settings > Provider Keys.${NC}"
    fi
fi

# 2. Dependency Checks
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install Git first!${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Node.js (npm) is not installed. Please install Node.js LTS (https://nodejs.org/) first!${NC}"
    exit 1
fi

ensure_mongodb || true

ensure_terraform

# 3. Check for Ollama & Download Local AI Models
if [ ${#models[@]} -eq 0 ]; then
    if [ "$aiChoice" == "3" ]; then
        echo -e "${YELLOW}⏭️ Skipping local AI models (Configuring Cloud mode for now; manual Ollama setup can be done later).${NC}"
    else
        echo -e "${GREEN}⏭️ Skipping local AI models as requested (Pure Cloud mode).${NC}"
    fi
    export AGENT_PROVIDER="google"
    export AGENT_MODEL="gemini-3.5-flash-lite"
else
    export AGENT_PROVIDER="custom"
    export AGENT_MODEL="${models[0]}"
    if ! command -v ollama &> /dev/null; then
        echo -e "${YELLOW}⚠️ Ollama command is not currently available in this terminal. Local AI model pull will be skipped.${NC}"
        echo -e "${CYAN}To pull models manually later, run: ollama pull ${models[0]}${NC}"
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

# 6. Deploy TerraMind Codebase
echo -e "${YELLOW}📥 Deploying TerraMind codebase to $lcPathFull...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BUNDLED_CHAT_PATH=""
if [ -d "$SCRIPT_DIR/chat" ]; then
    BUNDLED_CHAT_PATH="$SCRIPT_DIR/chat"
elif [ -d "$(pwd)/chat" ]; then
    BUNDLED_CHAT_PATH="$(pwd)/chat"
fi

if [ ! -d "$lcPathFull" ]; then
    if [ -n "$BUNDLED_CHAT_PATH" ] && [ -d "$BUNDLED_CHAT_PATH" ]; then
        echo -e "${CYAN}Using local codebase from $BUNDLED_CHAT_PATH...${NC}"
        cp -r "$BUNDLED_CHAT_PATH" "$basePath"
        mv "$basePath/chat" "$basePath/Mind"
    else
        echo -e "${CYAN}[git] Downloading TerraMind application codebase from GitHub...${NC}"
        tempClone="/tmp/terramind_src_$RANDOM"
        git clone --depth 1 https://github.com/TerraMindLabs/TerraMind.git "$tempClone"
        if [ -d "$tempClone/chat" ]; then
            mv "$tempClone/chat" "$lcPathFull"
            rm -rf "$tempClone"
            echo -e "${GREEN}✅ TerraMind application codebase deployed successfully to $lcPathFull!${NC}"
        else
            echo -e "${RED}ERROR: Failed to download TerraMind codebase from GitHub.${NC}"
            read -p "Press Enter to exit..."
            exit 1
        fi
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
echo -e "\n${YELLOW}📦 Installing Node dependencies via npm...${NC}"
run_with_spinner "Installing Node dependencies" "npm install --no-audit --no-fund --prefer-offline" "$lcPathFull"
run_with_spinner "Finalizing package setup and CLI utilities" "npm install cross-env --no-save --silent" "$lcPathFull"

# Verify that internal monorepo package dist files exist; compile if missing
if [ ! -f "$lcPathFull/packages/api/dist/credentials.cjs" ] || [ ! -f "$lcPathFull/packages/data-schemas/dist/index.cjs" ]; then
    echo -e "${YELLOW}⚙️ Building internal package modules (@librechat/api, data-schemas)...${NC}"
    run_with_spinner "Compiling package modules" "npm run build:packages" "$lcPathFull"
fi

# 9. Configure Environment Variables and Copy Files
echo -e "${YELLOW}⚙️ Configuring Environment Variables and Copying Files...${NC}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

if [ -f "$lcPathFull/terramind.yaml" ]; then
    sed -i "s|REPLACE_WITH_TF_WORKSPACE|$tfWorkspace|g" "$lcPathFull/terramind.yaml"
    sed -i "s|REPLACE_WITH_MCP_RUNNER_PATH|$lcPathFull/mcp-tf-runner.js|g" "$lcPathFull/terramind.yaml"
    
    if [ ${#models[@]} -gt 0 ]; then
        echo -e "${CYAN}Injecting Ollama endpoints and local models into terramind.yaml...${NC}"
        baseModelsJson='"gemini-3.5-flash-lite", "gemini-1.5-flash-latest"'
        localModelsJson=""
        for m in "${models[@]}"; do
            if [ -z "$localModelsJson" ]; then
                localModelsJson="\"$m\""
            else
                localModelsJson="$localModelsJson, \"$m\""
            fi
        done
        allModelsJson="$baseModelsJson, $localModelsJson"
        
        sed -i "s|models: \[\"gemini-3.5-flash-lite\", \"gemini-1.5-flash-latest\"\]|models: [$allModelsJson]|g" "$lcPathFull/terramind.yaml"
        
        ollamaBlock="  custom:\n    - name: \"Ollama\"\n      apiKey: \"ollama\"\n      baseURL: \"http://127.0.0.1:11434/v1\"\n      models:\n        default: [$localModelsJson]\n        fetch: true\n      titleConvo: true\n      titleModel: \"current_model\"\n      summarize: false\n      displayInFilter: true"
        sed -i "s|  google: {}|  google: {}\n$ollamaBlock|g" "$lcPathFull/terramind.yaml"
    else
        echo -e "${GREEN}Pure Cloud mode active. Zero Ollama endpoints injected into terramind.yaml.${NC}"
    fi
fi

envSource="$lcPathFull/.env.example"
envDest="$lcPathFull/.env"

if [ -f "$envSource" ]; then
    cp "$envSource" "$envDest"
    
    if [ ! -z "$apiKey" ]; then
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
        if grep -q "GOOGLE_KEY=" "$envDest"; then
            sed -i "s|.*GOOGLE_KEY=.*|GOOGLE_KEY=\"$apiKey\"|" "$envDest"
        else
            echo "GOOGLE_KEY=\"$apiKey\"" >> "$envDest"
        fi
    fi

    if grep -q "MONGO_URI=" "$envDest"; then
        sed -i "s|^MONGO_URI=.*|MONGO_URI=mongodb://127.0.0.1:27017/TerraMind|g" "$envDest"
    else
        echo "MONGO_URI=mongodb://127.0.0.1:27017/TerraMind" >> "$envDest"
    fi

    if grep -q "SCHEDULES_SINGLE_PROCESS=" "$envDest"; then
        sed -i "s|^SCHEDULES_SINGLE_PROCESS=.*|SCHEDULES_SINGLE_PROCESS=true|g" "$envDest"
    else
        echo "SCHEDULES_SINGLE_PROCESS=true" >> "$envDest"
    fi

    if grep -q "ALLOW_PASSWORD_RESET=" "$envDest"; then
        sed -i "s|^#\?ALLOW_PASSWORD_RESET=.*|ALLOW_PASSWORD_RESET=true|g" "$envDest"
    else
        echo "ALLOW_PASSWORD_RESET=true" >> "$envDest"
    fi

    if grep -q "HELP_AND_FAQ_URL=" "$envDest"; then
        sed -i "s|^HELP_AND_FAQ_URL=.*|HELP_AND_FAQ_URL=https://www.google.com|g" "$envDest"
    else
        echo "HELP_AND_FAQ_URL=https://www.google.com" >> "$envDest"
    fi

    sed -i "s|^OPENAI_API_KEY=user_provided|# OPENAI_API_KEY=user_provided|g" "$envDest"
else
    echo -e "${YELLOW}⚠️ Could not find .env.example to create .env file.${NC}"
fi

htmlPath="$lcPathFull/client/index.html"
if [ -f "$htmlPath" ]; then
    sed -i 's/<title>LibreChat<\/title>/<title>TerraMind<\/title>/g' "$htmlPath"
    sed -i 's/content="LibreChat"/content="TerraMind"/g' "$htmlPath"
    echo -e "${GREEN}✅ Updated index.html with TerraMind title.${NC}"
fi

# 9b. Deploy TerraMind Logo Assets
logoSrc="$lcPathFull/etc/logo/white_trans.png.png"
if [ -f "$logoSrc" ]; then
    mkdir -p "$lcPathFull/client/public/assets" "$lcPathFull/client/dist/assets"
    cp "$logoSrc" "$lcPathFull/client/public/assets/white_trans.png"
    cp "$logoSrc" "$lcPathFull/client/public/assets/terramind-logo.png"
    cp "$logoSrc" "$lcPathFull/client/dist/assets/white_trans.png"
    cp "$logoSrc" "$lcPathFull/client/dist/assets/terramind-logo.png"
fi
onlyLogoSrc="$lcPathFull/etc/logo/only_logo.png"
if [ -f "$onlyLogoSrc" ]; then
    mkdir -p "$lcPathFull/client/public/assets" "$lcPathFull/client/dist/assets"
    cp "$onlyLogoSrc" "$lcPathFull/client/public/assets/only_logo.png"
    cp "$onlyLogoSrc" "$lcPathFull/client/dist/assets/only_logo.png"
fi
echo -e "${GREEN}✅ Deployed TerraMind branding logos to client assets.${NC}"

# 10. Build Frontend
if [ -d "$lcPathFull/client/dist" ] && [ -f "$lcPathFull/client/dist/index.html" ]; then
    echo -e "${GREEN}⚡ Found pre-built frontend (client/dist). Skipping build for faster setup!${NC}"
else
    echo -e "${YELLOW}🏗️ Compiling frontend assets (Vite / React)...${NC}"
    echo -e "   (Note: standard chunk size & eval notices during minification are normal)"
    run_with_spinner "Building frontend production bundle" "npm run frontend" "$lcPathFull"
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
    ensure_mongodb || true
    node seed-agent.js
else
    echo -e "${YELLOW}⚠️ Could not find seed-agent.js. Skipping Agent database seeding.${NC}"
fi

# 12. Create Launch & Uninstall Scripts
echo -e "${YELLOW}📜 Creating Launch & Uninstall Shortcuts...${NC}"
launchScript="$basePath/start-terramind.sh"
echo '#!/bin/bash' > "$launchScript"
echo 'cd "$(dirname "$0")/Mind" || exit' >> "$launchScript"
echo 'echo "Starting TerraMind AI Server..."' >> "$launchScript"
echo 'sudo systemctl start mongod 2>/dev/null || true' >> "$launchScript"
echo 'if [ -f seed-agent.js ]; then node seed-agent.js >/dev/null 2>&1; fi' >> "$launchScript"
echo 'npm run backend' >> "$launchScript"
chmod +x "$launchScript"
echo -e "${GREEN}✅ Created launch script: $launchScript${NC}"

uninstallScript="$basePath/uninstall-terramind.sh"
cat << 'EOF' > "$uninstallScript"
#!/bin/bash
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
echo -e "\n${RED}⚠️ WARNING: This will completely uninstall TerraMind and delete its data!${NC}"
read -p "Are you sure you want to proceed? (y/N): " confirm
if [[ ! "$confirm" =~ ^[yY]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

read -p "Uninstall global MCP NPM packages? (y/N): " removeNpm
read -p "Remove locally downloaded Ollama models? (y/N): " removeModels

echo -e "${YELLOW}🗑️ Forcefully stopping running Node.js servers...${NC}"
pkill -f node || true
killall node 2>/dev/null || true
sleep 2

if [ -d "$BASE_DIR/Mind" ]; then
    echo -e "${YELLOW}🗑️ Deleting TerraMind installation at $BASE_DIR/Mind...${NC}"
    rm -rf "$BASE_DIR/Mind"
fi

if [ -d "$BASE_DIR/Terraform" ]; then
    echo -e "${YELLOW}🗑️ Deleting Terraform Workspace at $BASE_DIR/Terraform...${NC}"
    rm -rf "$BASE_DIR/Terraform"
fi

if [[ "$removeNpm" =~ ^[yY]$ ]] && command -v npm &> /dev/null; then
    echo -e "${YELLOW}🗑️ Uninstalling global MCP packages...${NC}"
    npm uninstall -g @modelcontextprotocol/server-filesystem terraform-mcp-server
fi

if [[ "$removeModels" =~ ^[yY]$ ]] && command -v ollama &> /dev/null; then
    echo -e "${YELLOW}🗑️ Removing standard Ollama models...${NC}"
    models=("llama3.2" "qwen2.5-coder:3b" "llama3.1" "qwen2.5-coder:7b" "mistral-nemo" "qwen2.5-coder:14b")
    for model in "${models[@]}"; do
        ollama rm "$model" 2>/dev/null || true
    done
fi

rm -f "$BASE_DIR/start-terramind.sh"
echo -e "${GREEN}✅ TerraMind uninstallation complete!${NC}"
EOF
chmod +x "$uninstallScript"
echo -e "${GREEN}✅ Created uninstaller script: $uninstallScript${NC}"

# Optional: Clean up temporary cloned repository if user cloned locally and installed elsewhere
if [ -n "$SCRIPT_DIR" ] && [ -d "$SCRIPT_DIR/.git" ] && [ "$(cd "$SCRIPT_DIR" && pwd)" != "$(cd "$basePath" && pwd)" ]; then
    echo -e "\n${CYAN}Notice: You cloned the installer to $SCRIPT_DIR, but installed TerraMind to $basePath.${NC}"
    read -p "Would you like to delete the temporary cloned folder to free up disk space? (y/N): " delClone
    if [[ "$delClone" =~ ^[yY]$ ]]; then
        echo -e "${YELLOW}Cleaning up temporary clone at $SCRIPT_DIR...${NC}"
        rm -rf "$SCRIPT_DIR"
    fi
fi

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
    echo -e "${YELLOW}▶️ To uninstall it later, simply run ./uninstall-terramind.sh in your installation folder!${NC}"
    read -p "Press Enter to exit..."
fi
