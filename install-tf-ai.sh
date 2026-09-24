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

# Guard against shell starting in a deleted or invalid working directory (prevents uv_cwd / ENOENT error in Node & Git)
ORIGINAL_PWD=$(pwd 2>/dev/null)
if [ -z "$ORIGINAL_PWD" ] || [ ! -d "$ORIGINAL_PWD" ]; then
    if [ -n "$HOME" ] && [ -d "$HOME" ]; then
        cd "$HOME" 2>/dev/null || cd /tmp 2>/dev/null || true
    else
        cd /tmp 2>/dev/null || true
    fi
fi

# Attempt to resize the console window for a better installer experience
printf '\e[8;40;120t' 2>/dev/null || true

echo -e "${CYAN}████████╗███████╗██████╗ ██████╗  █████╗ ███╗   ███╗██║███╗   ██╗██████╗ "
echo -e "╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗"
echo -e "   ██║   █████╗  ██████╔╝██████╔╝███████║██╔████╔██║██║██╔██╗ ██║██║  ██║"
echo -e "   ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██║╚██╔╝██║██║██║╚██╗██║██║  ██║"
echo -e "   ██║   ███████╗██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██████╔╝"
echo -e "   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ ${NC}"
echo -e "${YELLOW}               [ AI Cloud DevOps & Infrastructure Architect ]${NC}\n"

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

    local tfVer="1.10.5"
    local tfZipUrl="https://releases.hashicorp.com/terraform/${tfVer}/terraform_${tfVer}_linux_${arch}.zip"
    local tempDir=$(mktemp -d 2>/dev/null || echo "/tmp/tf_install_$$")
    mkdir -p "$tempDir"

    if curl -fsSL "$tfZipUrl" -o "$tempDir/terraform.zip" 2>/dev/null; then
        if command -v unzip &> /dev/null; then
            unzip -q -o "$tempDir/terraform.zip" -d "$tempDir" 2>/dev/null
        elif command -v python3 &> /dev/null; then
            python3 -c "import zipfile; zipfile.ZipFile('$tempDir/terraform.zip').extractall('$tempDir')" 2>/dev/null
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

    if command -v apt-get &> /dev/null; then
        local sudoCmd=""
        [ "$EUID" -ne 0 ] && command -v sudo &> /dev/null && sudoCmd="sudo"
        $sudoCmd apt-get update -qq 2>/dev/null || true
        $sudoCmd apt-get install -y -qq gnupg software-properties-common wget curl unzip 2>/dev/null || true
        wget -O- https://apt.releases.hashicorp.com/gpg 2>/dev/null | gpg --dearmor 2>/dev/null | $sudoCmd tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null || true
        local codename=$(lsb_release -cs 2>/dev/null || echo "jammy")
        echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $codename main" | $sudoCmd tee /etc/apt/sources.list.d/hashicorp.list > /dev/null || true
        $sudoCmd apt-get update -qq 2>/dev/null || true
        $sudoCmd apt-get install -y -qq terraform 2>/dev/null || true
    fi

    if command -v terraform &> /dev/null; then
        local installedVer=$(terraform version 2>/dev/null | head -n 1)
        echo -e "${GREEN}✅ Terraform CLI installed successfully: ${installedVer}${NC}"
        return 0
    fi

    echo -e "${YELLOW}⚠️ Could not automatically install Terraform CLI. You can install it manually from: https://developer.hashicorp.com/terraform/downloads${NC}"
    return 0
}

ensure_nodejs() {
    export PATH="/usr/local/bin:$HOME/.local/bin:$PATH"
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        local majorVer=$(node -v 2>/dev/null | tr -d 'v' | cut -d'.' -f1)
        if [ "$majorVer" -ge 18 ]; then
            local nodeVer=$(node -v 2>/dev/null)
            local npmVer=$(npm -v 2>/dev/null)
            echo -e "${GREEN}✅ Found Node.js: ${nodeVer} and npm: ${npmVer}${NC}"
            return 0
        fi
    fi

    echo -e "\n${YELLOW}⚙️ Node.js 18+ is not installed or outdated. Attempting automatic installation (Node.js 20 LTS)...${NC}"
    local sudoCmd=""
    [ "$EUID" -ne 0 ] && command -v sudo &> /dev/null && sudoCmd="sudo"

    if command -v apt-get &> /dev/null; then
        $sudoCmd apt-get update -qq 2>/dev/null || true
        $sudoCmd apt-get install -y -qq curl gnupg ca-certificates 2>/dev/null || true
        curl -fsSL https://deb.nodesource.com/setup_20.x | $sudoCmd bash - 2>/dev/null || true
        $sudoCmd apt-get install -y -qq nodejs 2>/dev/null || true
    elif command -v dnf &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | $sudoCmd bash - 2>/dev/null || true
        $sudoCmd dnf install -y nodejs 2>/dev/null || true
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | $sudoCmd bash - 2>/dev/null || true
        $sudoCmd yum install -y nodejs 2>/dev/null || true
    elif command -v apk &> /dev/null; then
        $sudoCmd apk add --no-cache nodejs npm 2>/dev/null || true
    fi

    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        local nodeVer=$(node -v 2>/dev/null)
        local npmVer=$(npm -v 2>/dev/null)
        echo -e "${GREEN}✅ Node.js ${nodeVer} and npm ${npmVer} installed successfully!${NC}"
        return 0
    fi

    echo -e "${RED}Node.js and npm are required. Please install Node.js 18+ (https://nodejs.org/) first!${NC}"
    exit 1
}

export PATH="/usr/local/bin:$HOME/.local/bin:$PATH"

ensure_ollama_running() {
    export PATH="/usr/local/bin:$HOME/.local/bin:$PATH"
    if ! command -v ollama &> /dev/null; then
        return 1
    fi

    # Verify that the ollama binary is executable (avoid 'required file not found' on minimal/musl containers)
    if ! ollama --version &> /dev/null; then
        echo -e "${YELLOW}⚠️ Ollama binary is present but could not execute (checking container libraries)...${NC}"
        local sudoCmd=""
        [ "$EUID" -ne 0 ] && command -v sudo &> /dev/null && sudoCmd="sudo"
        if command -v apt-get &> /dev/null; then
            $sudoCmd apt-get update -qq 2>/dev/null || true
            $sudoCmd apt-get install -y -qq libc6 libstdc++6 zstd 2>/dev/null || true
        elif command -v apk &> /dev/null; then
            $sudoCmd apk add --no-cache gcompat libc6-compat 2>/dev/null || true
        fi

        if ! ollama --version &> /dev/null; then
            echo -e "${YELLOW}⚠️ Cannot run local Ollama binary in this environment. Skipping local daemon.${NC}"
            echo -e "${YELLOW}💡 Tip: You can select Cloud AI providers (Gemini, OpenAI, Anthropic, Groq, DeepSeek) seamlessly in TerraMind.${NC}"
            return 1
        fi
    fi

    if curl -s http://127.0.0.1:11434/api/version &>/dev/null; then
        echo -e "${GREEN}✅ Ollama daemon is active and listening on port 11434.${NC}"
        return 0
    fi

    echo -e "${YELLOW}⚙️ Starting Ollama daemon in background ('ollama serve')...${NC}"
    
    if [ -d /run/systemd/system ] && command -v systemctl &> /dev/null; then
        sudo systemctl start ollama 2>/dev/null || true
    fi

    if curl -s http://127.0.0.1:11434/api/version &>/dev/null; then
        echo -e "${GREEN}✅ Ollama daemon started successfully!${NC}"
        return 0
    fi

    local ollamaBin=$(command -v ollama || echo "/usr/local/bin/ollama")
    nohup "$ollamaBin" serve > /tmp/ollama_terramind.log 2>&1 &
    local ollamaPid=$!

    for i in {1..10}; do
        if curl -s http://127.0.0.1:11434/api/version &>/dev/null; then
            echo -e "${GREEN}✅ Ollama daemon started successfully (PID: $ollamaPid)!${NC}"
            return 0
        fi
        sleep 1
    done

    return 0
}

echo -e "${WHITE}Welcome to TerraMind Setup${NC}\n"
echo -e "${CYAN}What would you like to do?${NC}"
echo " 1) Install / Update TerraMind [Default]"
echo " 2) Uninstall TerraMind"
read -p "Enter your choice (1 or 2) [Default: 1]: " action
action=${action:-1}

if [ "$action" == "2" ]; then
    echo ""
    currentDir=$(pwd)
    read -p "Enter the directory where TerraMind is installed [Default: $currentDir]: " basePath
    basePath=${basePath:-$currentDir}

    echo -e "\n${RED}⚠️ WARNING: This will stop TerraMind and remove application files in $basePath!${NC}"
    read -p "Are you sure you want to proceed? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[yY]$ ]]; then
        echo "Uninstallation cancelled."
        exit 0
    fi

    echo -e "\n${YELLOW}🛑 Stopping any running TerraMind processes (port 3080)...${NC}"
    TM_PID=$(lsof -ti tcp:3080 2>/dev/null || fuser 3080/tcp 2>/dev/null | tr -d ' ')
    if [ -n "$TM_PID" ]; then
        kill -9 $TM_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Stopped TerraMind process.${NC}"
    fi

    read -p "Remove locally downloaded Ollama models? (y/N): " removeModels
    if [[ "$removeModels" =~ ^[yY]$ ]] && command -v ollama &> /dev/null; then
        echo -e "${YELLOW}🗑️ Removing standard Ollama models...${NC}"
        models=("llama3.2" "qwen2.5-coder:3b" "llama3.1" "qwen2.5-coder:7b" "mistral-nemo" "qwen2.5-coder:14b")
        for model in "${models[@]}"; do
            ollama rm "$model" 2>/dev/null || true
        done
    fi

    if [ -d "$basePath" ]; then
        # Ensure shell is not inside the directory being removed
        local currPwd=$(pwd 2>/dev/null)
        if [ "$currPwd" = "$basePath" ] || [[ "$currPwd" == "$basePath"/* ]]; then
            cd "$HOME" 2>/dev/null || cd /tmp 2>/dev/null || true
        fi
        run_with_spinner "Deleting TerraMind installation ($basePath)" "rm -rf \"$basePath\""
    fi

    rm -f "$HOME/Desktop/TerraMind.desktop" 2>/dev/null || true
    echo -e "${GREEN}✅ TerraMind uninstallation complete!${NC}"
    exit 0
elif [ "$action" != "1" ]; then
    echo "Invalid choice. Exiting."
    exit 1
fi

# --- Installation Logic ---

echo -e "\n${CYAN}🚀 Starting TerraMind Setup...${NC}"

# Detect if current directory is already the TerraMind repo
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
IS_LOCAL_REPO=false
if [ -f "$SCRIPT_DIR/package.json" ] && [ -d "$SCRIPT_DIR/apps/server" ] && [ -d "$SCRIPT_DIR/apps/web" ]; then
    IS_LOCAL_REPO=true
fi

if [ "$IS_LOCAL_REPO" = true ]; then
    basePath="$SCRIPT_DIR"
    echo -e "${GREEN}📁 Detected existing TerraMind repository at:${NC} $basePath"
else
    currentDir=$(pwd 2>/dev/null)
    if [ -z "$currentDir" ] || [ "$currentDir" = "/" ] || [ ! -d "$currentDir" ]; then
        if [ -d "/workspaces" ]; then
            currentDir="/workspaces"
        elif [ -n "$HOME" ] && [ -d "$HOME" ]; then
            currentDir="$HOME"
        else
            currentDir="/tmp"
        fi
    fi
    defaultPath="$currentDir/TerraMind"
    read -p "Enter installation directory [Default: $defaultPath]: " userPath
    basePath=${userPath:-$defaultPath}
    basePath="${basePath/#\~/$HOME}"
    mkdir -p "$basePath"
fi

echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${CYAN}                🤖 Select your AI Engine Setup                       ${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo " 1) Local AI via Ollama (100% Offline / Private / Free)"
echo " 2) Cloud AI (Google Gemini, OpenAI, Anthropic Claude)"
echo " 3) Hybrid (Both Local Ollama + Cloud AI Models) [Recommended]"
echo " 4) Skip for now (Configure models & keys manually in Web UI Settings later)"
read -p "Enter your choice (1-4) [Default: 3]: " aiChoice
aiChoice=${aiChoice:-3}

geminiApiKey=""
openaiApiKey=""
anthropicApiKey=""

if [ "$aiChoice" == "2" ] || [ "$aiChoice" == "3" ]; then
    echo -e "\n${CYAN}Configure Cloud AI Provider API Keys (optional - can also enter in UI Settings):${NC}"
    echo " 1) Google Gemini   👉 Free API key: https://aistudio.google.com/apikey"
    echo " 2) OpenAI          👉 API key:      https://platform.openai.com/api-keys"
    echo " 3) Anthropic       👉 API key:      https://console.anthropic.com/settings/keys"
    echo " 4) Enter Multiple Keys"
    echo " 5) Skip for now (Enter anytime via Settings in the Web UI)"
    read -p "Enter your choice (1-5) [Default: 5]: " cloudChoice
    cloudChoice=${cloudChoice:-5}

    case $cloudChoice in
        1)
            read -p "Enter your Google Gemini API Key: " geminiApiKey
            ;;
        2)
            read -p "Enter your OpenAI API Key: " openaiApiKey
            ;;
        3)
            read -p "Enter your Anthropic Claude API Key: " anthropicApiKey
            ;;
        4)
            read -p "Enter Google Gemini Key (or press enter to skip): " geminiApiKey
            read -p "Enter OpenAI Key (or press enter to skip): " openaiApiKey
            read -p "Enter Anthropic Key (or press enter to skip): " anthropicApiKey
            ;;
        5)
            echo -e "${YELLOW}⏭️ Skipping Cloud API Keys. You can enter them anytime in the Web UI via Settings > API Keys.${NC}"
            ;;
    esac
fi

declare -a models=()

if [ "$aiChoice" == "1" ] || [ "$aiChoice" == "3" ]; then
    if ! command -v ollama &> /dev/null; then
        echo -e "\n${YELLOW}⚙️ Ollama is not installed. Attempting automatic installation via official script...${NC}"
        curl -fsSL https://ollama.com/install.sh | sh || true
    fi

    ensure_ollama_running

    echo -e "\n${CYAN}======================================================================${NC}"
    echo -e "${CYAN}          Select Local Ollama Models (Sorted by RAM Tier)            ${NC}"
    echo -e "${CYAN}======================================================================${NC}"
    echo -e "${GREEN}  [1] qwen2.5-coder:1.5b    (Min RAM: 2GB  | ~1.0GB - Ultra-fast, runs anywhere)${NC}"
    echo -e "${GREEN}  [2] qwen2.5-coder:3b      (Min RAM: 4GB  | ~2.0GB - ⭐ Best overall for CPU & YAML/HCL)${NC}"
    echo -e "${GREEN}  [3] llama3.2              (Min RAM: 4GB  | ~2.0GB - Meta 3B fast CPU generalist)${NC}"
    echo -e "${YELLOW}  [4] deepseek-r1:7b        (Min RAM: 8GB  | ~4.7GB - ⭐ Best Architecture & Reasoning)${NC}"
    echo -e "${YELLOW}  [5] qwen2.5-coder:7b      (Min RAM: 8GB  | ~4.5GB - ⭐ Recommended for Terraform/IaC)${NC}"
    echo -e "${YELLOW}  [6] llama3.1              (Min RAM: 8GB  | ~4.7GB - Meta flagship 8B generalist)${NC}"
    echo -e "${RED}  [7] qwen2.5-coder:14b     (Min RAM: 16GB | ~9.0GB - Enterprise full-stack coding)${NC}"
    echo -e "${WHITE}  [8] Skip Model Pull       (Download models manually later via 'ollama pull')${NC}"
    read -p "Enter your choice (1-8) [Default: 2 (qwen2.5-coder:3b)]: " rawModelChoice
    rawModelChoice=${rawModelChoice:-2}

    case $rawModelChoice in
        1) models+=("qwen2.5-coder:1.5b") ;;
        2) models+=("qwen2.5-coder:3b") ;;
        3) models+=("llama3.2") ;;
        4) models+=("deepseek-r1:7b") ;;
        5) models+=("qwen2.5-coder:7b") ;;
        6) models+=("llama3.1") ;;
        7) models+=("qwen2.5-coder:14b") ;;
        *) ;;
    esac

    if [ ${#models[@]} -gt 0 ]; then
        if ollama --version &> /dev/null; then
            echo -e "\n${YELLOW}📥 Downloading / Verifying Local AI Models via Ollama...${NC}"
            for model in "${models[@]}"; do
                if ollama list 2>/dev/null | grep -q "^${model}:\|^${model} "; then
                    echo -e "${GREEN}✅ Model $model is already installed!${NC}"
                else
                    echo -e "${CYAN}📥 Pulling $model...${NC}"
                    ollama pull "$model" || echo -e "${YELLOW}⚠️ Could not pull $model automatically. You can run 'ollama pull $model' later.${NC}"
                fi
            done
        else
            echo -e "\n${YELLOW}⚠️ Ollama is not executable in this container environment. Model download skipped.${NC}"
            echo -e "${YELLOW}💡 You can continue setup using Cloud AI models (Gemini, Claude, GPT, Groq, DeepSeek).${NC}"
        fi
    fi
fi

# 2. Dependency Checks
echo -e "\n${CYAN}🔍 Checking System Dependencies...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚙️ Git is not installed. Attempting automatic installation...${NC}"
    local sudoCmd=""
    [ "$EUID" -ne 0 ] && command -v sudo &> /dev/null && sudoCmd="sudo"
    if command -v apt-get &> /dev/null; then
        $sudoCmd apt-get update -qq 2>/dev/null || true
        $sudoCmd apt-get install -y -qq git 2>/dev/null || true
    elif command -v apk &> /dev/null; then
        $sudoCmd apk add --no-cache git 2>/dev/null || true
    elif command -v dnf &> /dev/null; then
        $sudoCmd dnf install -y git 2>/dev/null || true
    fi
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Git is not installed. Please install Git first!${NC}"
        exit 1
    fi
fi

ensure_nodejs

# Database: SQLite WAL mode - Zero external DB required
echo -e "${GREEN}✅ Database: SQLite WAL embedded engine ready (zero setup required).${NC}"

ensure_terraform

# 3. Deploy TerraMind Codebase if not local
if [ "$IS_LOCAL_REPO" = false ]; then
    echo -e "\n${YELLOW}📥 Cloning TerraMind codebase from GitHub into $basePath...${NC}"
    mkdir -p "$basePath"
    tempClone="/tmp/terramind_clone_$$"
    rm -rf "$tempClone"
    if (cd /tmp && git clone --depth 1 https://github.com/TerraMindLabs/TerraMind.git "$tempClone"); then
        if [ -d "$tempClone" ] && [ -f "$tempClone/package.json" ]; then
            cp -r "$tempClone"/. "$basePath"/
            rm -rf "$tempClone"
            echo -e "${GREEN}✅ TerraMind codebase deployed successfully.${NC}"
        else
            echo -e "${RED}ERROR: Cloned repository is missing expected files.${NC}"
            rm -rf "$tempClone"
            exit 1
        fi
    else
        rm -rf "$tempClone"
        echo -e "${RED}ERROR: Failed to clone TerraMind repository from GitHub.${NC}"
        exit 1
    fi
fi

# 4. Install NPM Dependencies across workspaces
echo -e "\n${YELLOW}📦 Installing project dependencies via npm workspaces...${NC}"
run_with_spinner "Installing dependencies" "NODE_ENV=development npm install --include=dev" "$basePath"

# Ensure build and execution binaries are linked across workspaces
mkdir -p "$basePath/node_modules/.bin" "$basePath/apps/server/node_modules/.bin" "$basePath/apps/web/node_modules/.bin" 2>/dev/null || true

for binName in tsx esbuild tsc vite; do
    if [ -f "$basePath/node_modules/.bin/$binName" ]; then
        chmod +x "$basePath/node_modules/.bin/$binName" 2>/dev/null || true
        ln -sf "$basePath/node_modules/.bin/$binName" "$basePath/apps/server/node_modules/.bin/$binName" 2>/dev/null || true
        ln -sf "$basePath/node_modules/.bin/$binName" "$basePath/apps/web/node_modules/.bin/$binName" 2>/dev/null || true
    fi
done

# 5. Build Application Bundles (Server & Web UI)
echo -e "\n${YELLOW}🏗️ Building production bundles (Server & Web UI)...${NC}"
if [ -f "$basePath/apps/server/dist/server.js" ] && [ -f "$basePath/apps/web/dist/index.html" ]; then
    run_with_spinner "Verifying production bundles" "npm run build || true" "$basePath"
    echo -e "${GREEN}✅ Production bundles verified and ready.${NC}"
else
    run_with_spinner "Building production bundles" "npm run build" "$basePath"
fi

# 6. Configure Environment Variables
echo -e "\n${YELLOW}⚙️ Setting up environment configuration...${NC}"
envDest="$basePath/.env"
cat << ENV_EOF > "$envDest"
PORT=3080
APP_TITLE=TerraMind
ENV_EOF

if [ -n "$geminiApiKey" ]; then
    echo "GEMINI_API_KEY=\"$geminiApiKey\"" >> "$envDest"
fi
if [ -n "$openaiApiKey" ]; then
    echo "OPENAI_API_KEY=\"$openaiApiKey\"" >> "$envDest"
fi
if [ -n "$anthropicApiKey" ]; then
    echo "ANTHROPIC_API_KEY=\"$anthropicApiKey\"" >> "$envDest"
fi
echo -e "${GREEN}✅ Created .env configuration.${NC}"

# 7. Create Launch & Uninstall Scripts
echo -e "\n${YELLOW}📜 Generating start and uninstall shortcuts...${NC}"

launchScript="$basePath/start-terramind.sh"
cat << 'EOF' > "$launchScript"
#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || exit 1
export PATH="/usr/local/bin:$HOME/.local/bin:$PATH"

echo "==========================================================="
echo "   TerraMind - AI Cloud & Infrastructure Architect        "
echo "==========================================================="
echo " Starting server on http://localhost:3080..."

if command -v ollama &>/dev/null && ! curl -s http://127.0.0.1:11434/api/version &>/dev/null; then
    echo " Starting local Ollama server..."
    if [ -d /run/systemd/system ] && command -v systemctl &>/dev/null; then
        sudo systemctl start ollama 2>/dev/null || true
    fi
    if ! curl -s http://127.0.0.1:11434/api/version &>/dev/null; then
        nohup ollama serve >/dev/null 2>&1 &
        sleep 2
    fi
fi

if [ ! -f "$DIR/apps/web/dist/index.html" ]; then
    echo " Building web frontend assets..."
    (cd "$DIR" && npm run build) >/dev/null 2>&1 || true
fi

if [ -f "$DIR/apps/server/dist/server.js" ]; then
    node "$DIR/apps/server/dist/server.js"
else
    npm start
fi
EOF
chmod +x "$launchScript"
echo -e "${GREEN}✅ Created launch script: $launchScript${NC}"

uninstallScript="$basePath/uninstall-terramind.sh"
cat << 'EOF' > "$uninstallScript"
#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "\033[0;31m⚠️ WARNING: This will completely remove TerraMind from $DIR!\033[0m"
read -p "Are you sure? (y/N): " confirm
if [[ "$confirm" =~ ^[yY]$ ]]; then
    TM_PID=$(lsof -ti tcp:3080 2>/dev/null || fuser 3080/tcp 2>/dev/null | tr -d ' ')
    [ -n "$TM_PID" ] && kill -9 $TM_PID 2>/dev/null || true
    rm -rf "$DIR"
    echo -e "\033[0;32m✅ TerraMind removed successfully.\033[0m"
fi
EOF
chmod +x "$uninstallScript"
echo -e "${GREEN}✅ Created uninstaller script: $uninstallScript${NC}"

# Create Linux Desktop Shortcut if Desktop exists
if [ -d "$HOME/Desktop" ]; then
    desktopFile="$HOME/Desktop/TerraMind.desktop"
    printf '[Desktop Entry]\nName=TerraMind\nComment=TerraMind AI Cloud Architect\nExec=bash -c "%s; read -p Press Enter to close..."\nTerminal=true\nType=Application\nCategories=Development;\n' "$launchScript" > "$desktopFile"
    chmod +x "$desktopFile" 2>/dev/null || true
    echo -e "${GREEN}✅ Created Desktop shortcut: $desktopFile${NC}"
fi

# 8. Finished!
echo -e "\n==========================================================="
echo -e "${GREEN}✅ Setup Complete! TerraMind is ready to run.${NC}"
echo -e "${WHITE}🌐 Application URL: http://localhost:3080${NC}"
echo -e "===========================================================\n"

read -t 10 -p " 🚀 Start TerraMind server now? (Y/n): " startApp
startApp=${startApp:-y}

if [[ ! "$startApp" =~ ^[nN]$ ]]; then
    echo -e "\n${CYAN} Starting TerraMind Server on port 3080... (Press Ctrl+C to stop)${NC}"
    exec "$launchScript"
else
    echo -e "\n${CYAN}▶️ To start TerraMind anytime, simply run:${NC}"
    echo -e "   ${WHITE}./start-terramind.sh${NC} (or 'npm start' in $basePath)\n"
fi
