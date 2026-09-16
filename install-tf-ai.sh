#!/bin/bash

echo -e "\e[36m🚀 Starting TF-AI-Gen One-Shot Installation...\e[0m"

# 1. Prompt for Configuration
read -p "Enter your Google Gemini API Key (or press enter to skip): " apiKey

read -p "Enter path for Terraform Workspace [Default: /opt/TerraformProject]: " tfWorkspace
tfWorkspace=${tfWorkspace:-/opt/TerraformProject}

read -p "Enter path for LibreChat installation [Default: ./LibreChat]: " lcPath
lcPath=${lcPath:-./LibreChat}

echo -e "\e[36mSelect local Ollama models to pull based on your system RAM:\e[0m"
echo " 1) Low-end (8GB RAM): llama3.2, qwen2.5-coder:3b"
echo " 2) Mid-range (16GB RAM): llama3.1, qwen2.5-coder:7b"
echo " 3) High-end (32GB+ RAM): mistral-nemo, qwen2.5-coder:14b"
echo " 4) Skip local models (Use only Gemini/Cloud)"
echo " 5) Custom (space-separated list)"
read -p "Enter your choice (1-5) or press Enter to skip [Default: 4]: " modelChoice

models=()
case $modelChoice in
    1) models=("llama3.2" "qwen2.5-coder:3b") ;;
    2) models=("llama3.1" "qwen2.5-coder:7b") ;;
    3) models=("mistral-nemo" "qwen2.5-coder:14b") ;;
    5) 
        read -p "Enter custom models (space-separated): " customModels
        if [ ! -z "$customModels" ]; then
            read -a models <<< "$customModels"
        fi
        ;;
    *) 
        # Default is 4 or empty (skip)
        ;;
esac

# 2. Check for Node.js (npm)
if ! command -v npm &> /dev/null; then
    echo -e "\e[31mError: Node.js (npm) is not installed. Please install Node.js first!\e[0m"
    exit 1
fi

# 2.5 Check for Terraform
if ! command -v terraform &> /dev/null; then
    echo -e "\e[33m⚙️ Terraform is not installed. Attempting automatic installation...\e[0m"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y gnupg software-properties-common curl
        wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
        echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
        sudo apt-get update && sudo apt-get install terraform -y
    elif command -v brew &> /dev/null; then
        brew tap hashicorp/tap
        brew install hashicorp/tap/terraform
    elif command -v yum &> /dev/null; then
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo
        sudo yum -y install terraform
    else
        echo -e "\e[31mError: Could not determine package manager. Please install Terraform manually from https://developer.hashicorp.com/terraform/downloads\e[0m"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        echo -e "\e[31mError: Automatic installation failed. Please install Terraform manually.\e[0m"
        exit 1
    fi
fi

# 3. Check for Ollama & Download Local AI Models
if [ ${#models[@]} -eq 0 ]; then
    echo -e "\e[33m⏩ Skipping local AI model download as requested.\e[0m"
elif ! command -v ollama &> /dev/null; then
    echo -e "\e[33mWarning: Ollama is not installed. Local AI model pull will be skipped.\e[0m"
else
    echo -e "\e[33m🦙 Pulling Local AI Models via Ollama...\e[0m"
    for model in "${models[@]}"; do
        echo -e "\e[36mPulling $model...\e[0m"
        ollama pull "$model"
    done
fi

# 4. Install MCP Servers globally
echo -e "\e[33m🔌 Installing MCP Servers (Terraform & Filesystem)...\e[0m"
npm install -g @modelcontextprotocol/server-filesystem terraform-mcp-server

# 5. Create the Terraform Workspace
if [ ! -d "$tfWorkspace" ]; then
    echo -e "\e[33m📁 Creating Terraform Workspace at $tfWorkspace...\e[0m"
    sudo mkdir -p "$tfWorkspace"
    sudo chown -R $USER:$USER "$tfWorkspace"
fi

# 6. Download LibreChat
echo -e "\e[33m📥 Cloning LibreChat Repository to $lcPath...\e[0m"
if [ ! -d "$lcPath" ]; then
    git clone https://github.com/danny-avila/LibreChat.git "$lcPath"
fi

# 7. Configure Environment Variables and Copy Files
echo -e "\e[33m⚙️ Configuring Environment Variables and Copying Files...\e[0m"
cp ./librechat.yaml "$lcPath/librechat.yaml"
sed -i "s|REPLACE_WITH_TF_WORKSPACE|$tfWorkspace|g" "$lcPath/librechat.yaml"
sed -i "s|REPLACE_WITH_MCP_RUNNER_PATH|$lcPath/mcp-tf-runner.js|g" "$lcPath/librechat.yaml"

cp ./mcp-tf-runner.js "$lcPath/mcp-tf-runner.js"
cp ./.env.example "$lcPath/.env"
if [ ! -z "$apiKey" ]; then
    sed -i "s/REPLACE_WITH_YOUR_KEY/$apiKey/g" "$lcPath/.env"
fi

# 8. Start Docker Containers
echo -e "\e[33m🐳 Starting LibreChat and MongoDB via Docker...\e[0m"
cd "$lcPath"
docker compose up -d

# 9. Finish Up
echo -e "\e[32m✅ Installation Complete! TF-AI-Gen is now running in Docker!\e[0m"
echo -e "\e[37mAccess the application at: http://localhost:3080\e[0m"

