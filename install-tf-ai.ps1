Write-Host "🚀 Starting TF-AI-Gen One-Shot Installation..." -ForegroundColor Cyan

# 1. Prompt for Configuration
$apiKey = Read-Host "Enter your Google Gemini API Key (or press enter to skip)"

$tfWorkspace = Read-Host "Enter path for Terraform Workspace [Default: C:\TerraformProject]"
if ([string]::IsNullOrWhiteSpace($tfWorkspace)) { $tfWorkspace = "C:\TerraformProject" }

$lcPath = Read-Host "Enter path for LibreChat installation [Default: .\LibreChat]"
if ([string]::IsNullOrWhiteSpace($lcPath)) { $lcPath = ".\LibreChat" }

Write-Host "Select local Ollama models to pull based on your system RAM:" -ForegroundColor Cyan
Write-Host " 1) Low-end (8GB RAM): llama3.2, qwen2.5-coder:3b"
Write-Host " 2) Mid-range (16GB RAM): llama3.1, qwen2.5-coder:7b"
Write-Host " 3) High-end (32GB+ RAM): mistral-nemo, qwen2.5-coder:14b"
Write-Host " 4) Skip local models (Use only Gemini/Cloud)"
Write-Host " 5) Custom (comma-separated list)"
$modelChoice = Read-Host "Enter your choice (1-5) or press Enter to skip [Default: 4]"

$models = @()
switch ($modelChoice) {
    "1" { $models = @("llama3.2", "qwen2.5-coder:3b") }
    "2" { $models = @("llama3.1", "qwen2.5-coder:7b") }
    "3" { $models = @("mistral-nemo", "qwen2.5-coder:14b") }
    "5" { 
        $customModels = Read-Host "Enter custom models (comma-separated)"
        if (-not [string]::IsNullOrWhiteSpace($customModels)) {
            $models = $customModels -split ',' | ForEach-Object { $_.Trim() }
        }
    }
    Default { 
        # Default is 4 or empty (skip)
    }
}

# 2. Check for Node.js (npm)
if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js (npm) is not installed. Please install Node.js first!"
    exit
}

# 2.5 Check for Terraform
if (!(Get-Command "terraform" -ErrorAction SilentlyContinue)) {
    Write-Host "⚙️ Terraform is not installed. Attempting automatic installation via winget..." -ForegroundColor Yellow
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        winget install Hashicorp.Terraform --accept-package-agreements --accept-source-agreements
        # Refresh Path variable for the current session
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        if (!(Get-Command "terraform" -ErrorAction SilentlyContinue)) {
            Write-Warning "Terraform was installed but may require a terminal restart to be fully recognized."
        }
    } else {
        Write-Error "Terraform is not installed and winget is unavailable. Please install Terraform CLI (https://developer.hashicorp.com/terraform/downloads) first!"
        exit
    }
}

# 3. Check for Ollama & Download Local AI Models
if ($models.Count -eq 0) {
    Write-Host "⏩ Skipping local AI model download as requested." -ForegroundColor Yellow
} elseif (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
    Write-Warning "Ollama is not installed. Local AI model pull will be skipped."
} else {
    Write-Host "🦙 Pulling Local AI Models via Ollama..." -ForegroundColor Yellow
    foreach ($model in $models) {
        Write-Host "Pulling $model..." -ForegroundColor Cyan
        ollama pull $model
    }
}

# 4. Install MCP Servers globally
Write-Host "🔌 Installing MCP Servers (Terraform & Filesystem)..." -ForegroundColor Yellow
npm install -g @modelcontextprotocol/server-filesystem terraform-mcp-server

# 5. Create the Terraform Workspace
if (!(Test-Path $tfWorkspace)) {
    Write-Host "📁 Creating Terraform Workspace at $tfWorkspace..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $tfWorkspace | Out-Null
}

# 6. Download LibreChat
Write-Host "📥 Cloning LibreChat Repository to $lcPath..." -ForegroundColor Yellow
if (!(Test-Path $lcPath)) {
    git clone https://github.com/danny-avila/LibreChat.git $lcPath
}

# 7. Configure Environment Variables and Copy Files
Write-Host "⚙️ Configuring Environment Variables and Copying Files..." -ForegroundColor Yellow

$yamlContent = Get-Content ".\librechat.yaml" -Raw
$yamlContent = $yamlContent.Replace("REPLACE_WITH_TF_WORKSPACE", $tfWorkspace.Replace("\", "\\"))
$yamlContent = $yamlContent.Replace("REPLACE_WITH_MCP_RUNNER_PATH", "$lcPath\mcp-tf-runner.js".Replace("\", "\\"))
Set-Content -Path "$lcPath\librechat.yaml" -Value $yamlContent -Encoding UTF8

Copy-Item ".\mcp-tf-runner.js" -Destination "$lcPath\mcp-tf-runner.js" -Force

$envContent = Get-Content ".\.env.example" -Raw
if ($apiKey -ne "") {
    $envContent = $envContent -replace "REPLACE_WITH_YOUR_KEY", $apiKey
}
Set-Content -Path "$lcPath\.env" -Value $envContent -Encoding UTF8

# 8. Start Docker Containers
Write-Host "🐳 Starting LibreChat and MongoDB via Docker..." -ForegroundColor Yellow
Set-Location -Path $lcPath
docker compose up -d

# 9. Finish Up
Write-Host "✅ Installation Complete! TF-AI-Gen is now running in Docker!" -ForegroundColor Green
Write-Host "Access the application at: http://localhost:3080" -ForegroundColor White
Pause

