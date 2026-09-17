Write-Host "🚀 Starting TerraMind (TF-AI-Gen) One-Shot Installation..." -ForegroundColor Cyan

# 1. Prompt for Configuration
$apiKey = Read-Host "Enter your Google Gemini API Key (or press enter to skip)"

$tfWorkspace = Read-Host "Enter path for Terraform Workspace [Default: C:\TerraformProject]"
if ([string]::IsNullOrWhiteSpace($tfWorkspace)) { $tfWorkspace = "C:\TerraformProject" }

$lcPath = Read-Host "Enter path for TerraMind (LibreChat) installation [Default: .\LibreChat]"
if ([string]::IsNullOrWhiteSpace($lcPath)) { $lcPath = ".\LibreChat" }
$lcPathFull = (Resolve-Path $lcPath -ErrorAction SilentlyContinue).Path
if (!$lcPathFull) { 
    $lcPathFull = (New-Item -ItemType Directory -Path $lcPath -Force).FullName 
}

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
    Default { }
}

# 2. Dependency Checks

# Check Git
if (!(Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed. Please install Git for Windows (https://git-scm.com/download/win) first!"
    exit
}

# Check Node.js (npm)
if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js (npm) is not installed. Please install Node.js LTS (https://nodejs.org/) first!"
    exit
}

# Warn about MongoDB
Write-Host "⚠️ IMPORTANT: Ensure MongoDB Community Server is installed and running natively in the background." -ForegroundColor Yellow
Write-Host "   (https://www.mongodb.com/try/download/community)" -ForegroundColor Yellow

# Check Terraform
if (!(Get-Command "terraform" -ErrorAction SilentlyContinue)) {
    Write-Host "⚙️ Terraform is not installed. Attempting automatic installation via winget..." -ForegroundColor Yellow
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        winget install Hashicorp.Terraform --accept-package-agreements --accept-source-agreements
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

# 6. Download Codebase (LibreChat/TerraMind)
Write-Host "📥 Cloning Repository to $lcPathFull..." -ForegroundColor Yellow
if (!(Test-Path "$lcPathFull\.git")) {
    git clone https://github.com/danny-avila/LibreChat.git $lcPathFull
} else {
    Write-Host "Repository already exists at $lcPathFull, skipping clone." -ForegroundColor Yellow
}

# 7. Download tfsec
$tfsecPath = "$lcPathFull\tfsec.exe"
if (!(Test-Path $tfsecPath)) {
    Write-Host "🛡️ Downloading tfsec.exe..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/aquasecurity/tfsec/releases/latest/download/tfsec-windows-amd64.exe" -OutFile $tfsecPath
}

# 8. Install NPM Dependencies
Write-Host "📦 Installing Node dependencies (npm install)..." -ForegroundColor Yellow
Set-Location -Path $lcPathFull
npm install

# 9. Configure Environment Variables and Copy Files
Write-Host "⚙️ Configuring Environment Variables and Copying Files..." -ForegroundColor Yellow

# Configure librechat.yaml if available in current directory
$yamlSource = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "librechat.yaml"
if (Test-Path $yamlSource) {
    $yamlContent = Get-Content $yamlSource -Raw
    $yamlContent = $yamlContent.Replace("REPLACE_WITH_TF_WORKSPACE", $tfWorkspace.Replace("\", "\\"))
    $yamlContent = $yamlContent.Replace("REPLACE_WITH_MCP_RUNNER_PATH", "$lcPathFull\mcp-tf-runner.js".Replace("\", "\\"))
    Set-Content -Path "$lcPathFull\librechat.yaml" -Value $yamlContent -Encoding UTF8
}

# Copy mcp runner script if available
$runnerSource = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "mcp-tf-runner.js"
if (Test-Path $runnerSource) {
    Copy-Item $runnerSource -Destination "$lcPathFull\mcp-tf-runner.js" -Force
}

# Configure .env
$envSource = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) ".env.example"
if (!(Test-Path $envSource) -and (Test-Path "$lcPathFull\.env.example")) {
    $envSource = "$lcPathFull\.env.example"
}

if (Test-Path $envSource) {
    $envContent = Get-Content $envSource -Raw
    if ($apiKey -ne "") {
        $envContent = $envContent -replace "REPLACE_WITH_YOUR_KEY", $apiKey
    }
    
    # Set APP_TITLE
    if ($envContent -match "APP_TITLE=") {
        $envContent = $envContent -replace "APP_TITLE=.*", "APP_TITLE=TerraMind"
    } else {
        $envContent += "`nAPP_TITLE=TerraMind"
    }

    # Set MONGO_URI
    if ($envContent -match "MONGO_URI=") {
        $envContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=mongodb://127.0.0.1:27017/LibreChat"
    } else {
        $envContent += "`nMONGO_URI=mongodb://127.0.0.1:27017/LibreChat"
    }

    Set-Content -Path "$lcPathFull\.env" -Value $envContent -Encoding UTF8
} else {
    Write-Warning "Could not find .env.example to create .env file."
}

# Update index.html for TerraMind
$htmlPath = "$lcPathFull\client\index.html"
if (Test-Path $htmlPath) {
    $htmlContent = Get-Content $htmlPath -Raw
    $htmlContent = $htmlContent -replace "<title>LibreChat</title>", "<title>TerraMind</title>"
    $htmlContent = $htmlContent -replace 'content="LibreChat"', 'content="TerraMind"'
    Set-Content -Path $htmlPath -Value $htmlContent -Encoding UTF8
    Write-Host "✅ Updated index.html with TerraMind title." -ForegroundColor Green
}

# 10. Build Frontend
Write-Host "🏗️ Building Frontend (npm run frontend)..." -ForegroundColor Yellow
npm run frontend

# 11. Finish Up
Write-Host "✅ Installation Complete! TerraMind is ready to run natively." -ForegroundColor Green
Write-Host "▶️ To start the application, stay in the current directory and run: npm run backend" -ForegroundColor Cyan
Write-Host "🌐 Access the application at: http://localhost:3080" -ForegroundColor White
Write-Host "📝 NOTE: Make sure MongoDB Community Edition is running locally!" -ForegroundColor Yellow
