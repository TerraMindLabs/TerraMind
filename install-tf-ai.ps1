# Attempt to resize the console window for a better installer experience
try {
    $size = $Host.UI.RawUI.WindowSize
    $size.Width = 150
    $size.Height = 70
    $Host.UI.RawUI.WindowSize = $size
} catch {
    # Ignore if the terminal doesn't support programmatic resizing (e.g., Windows Terminal handles this differently)
}

Write-Host " _____                       __  __ _           _ " -ForegroundColor Cyan
Write-Host "|_   _|__ _ __ _ __ __ _    |  \/  (_)_ __   __| |" -ForegroundColor Cyan
Write-Host "  | |/ _ \ '__| '__/ _' |   | |\/| | | '_ \ / _' |" -ForegroundColor Cyan
Write-Host "  | |  __/ |  | | | (_| |   | |  | | | | | | (_| |" -ForegroundColor Cyan
Write-Host "  |_|\___|_|  |_|  \__,_|___|_|  |_|_|_| |_|\__,_|" -ForegroundColor Cyan
Write-Host "                       |_____|                    " -ForegroundColor Cyan
Write-Host ""
Write-Host "Welcome to TerraMind (TF-AI-Gen) Setup" -ForegroundColor White
Write-Host ""

Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host " 1) Install TerraMind"
Write-Host " 2) Uninstall TerraMind"
$action = Read-Host "Enter your choice (1 or 2)"

if ($action -eq "2") {
    Write-Host "[WARN] WARNING: This will completely uninstall TerraMind (TF-AI-Gen) and delete its data!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure you want to proceed? (y/N)"
    if ($confirm -notmatch "^[yY]$") {
        Write-Host "Uninstallation cancelled."
        Pause
        return
    }

    $currentDrive = (Get-Location).Drive.Name
    $drive = Read-Host "Enter the drive where TerraMind is installed (e.g., C, D, G) [Default: $currentDrive]"
    if ([string]::IsNullOrWhiteSpace($drive)) { $drive = $currentDrive }
    $drive = $drive.Replace(":", "").Substring(0,1)

    $folder = Read-Host "Enter the folder name [Default: TerraMind]"
    if ([string]::IsNullOrWhiteSpace($folder)) { $folder = "TerraMind" }

    $basePath = Join-Path "$drive`:\" $folder
    
    $lcPathFull = Join-Path $basePath "LibreChat"
    $tfWorkspace = Join-Path $basePath "TerraformProject"

    $removeNpm = Read-Host "Uninstall global MCP NPM packages? (y/N)"
    $removeModels = Read-Host "Remove locally downloaded Ollama models (llama3.2, qwen2.5-coder, etc.)? (y/N)"

    if (Test-Path $lcPathFull) {
        Write-Host "[rm] Deleting TerraMind installation at $lcPathFull..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $lcPathFull -ErrorAction Continue
    } else {
        Write-Host "[Skip] TerraMind installation not found at $lcPathFull, skipping..." -ForegroundColor Cyan
    }

    if (Test-Path $tfWorkspace) {
        Write-Host "[rm] Deleting Terraform Workspace at $tfWorkspace..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $tfWorkspace -ErrorAction Continue
    } else {
        Write-Host "[Skip] Terraform Workspace not found at $tfWorkspace, skipping..." -ForegroundColor Cyan
    }

    if ($removeNpm -match "^[yY]$" -and (Get-Command "npm" -ErrorAction SilentlyContinue)) {
        Write-Host "[rm] Uninstalling global MCP packages..." -ForegroundColor Yellow
        npm uninstall -g @modelcontextprotocol/server-filesystem terraform-mcp-server
    }

    if ($removeModels -match "^[yY]$" -and (Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Host "[rm] Removing standard Ollama models..." -ForegroundColor Yellow
        $models = @("llama3.2", "qwen2.5-coder:3b", "llama3.1", "qwen2.5-coder:7b", "mistral-nemo", "qwen2.5-coder:14b")
        foreach ($model in $models) {
            Write-Host "Removing $model..." -ForegroundColor Cyan
            ollama rm $model 2>$null
        }
    }

    Write-Host "[OK] Uninstallation Complete!" -ForegroundColor Green
    Pause
    return
} elseif ($action -ne "1") {
    Write-Host "Invalid choice. Exiting."
    Pause
    return
}

# --- Installation Logic ---

Write-Host "[START] Starting TerraMind (TF-AI-Gen) One-Shot Installation..." -ForegroundColor Cyan

# 1. Prompt for Configuration
$currentDrive = (Get-Location).Drive.Name
$apiKey = Read-Host "Enter your Google Gemini API Key (or press enter to skip)"

$drive = Read-Host "Enter the drive to install TerraMind into (e.g., C, D, G) [Default: $currentDrive]"
if ([string]::IsNullOrWhiteSpace($drive)) { $drive = $currentDrive }
$drive = $drive.Replace(":", "").Substring(0,1)

$folder = Read-Host "Enter the folder name [Default: TerraMind]"
if ([string]::IsNullOrWhiteSpace($folder)) { $folder = "TerraMind" }

$basePath = Join-Path "$drive`:\" $folder

if (!(Test-Path $basePath)) {
    Write-Host "Creating base directory at $basePath..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $basePath -Force | Out-Null
}

$tfWorkspace = Join-Path $basePath "TerraformProject"
$lcPathFull = Join-Path $basePath "LibreChat"

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
            $models = $customModels -split "," | ForEach-Object { $_.Trim() }
        }
    }
    Default { }
}

# 2. Dependency Checks

if (!(Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed. Please install Git for Windows (https://git-scm.com/download/win) first!"
    Pause
    return
}

if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js (npm) is not installed. Please install Node.js LTS (https://nodejs.org/) first!"
    Pause
    return
}

Write-Host "[WARN] IMPORTANT: Ensure MongoDB Community Server is installed and running natively in the background." -ForegroundColor Yellow
Write-Host "   (https://www.mongodb.com/try/download/community)" -ForegroundColor Yellow

if (!(Get-Command "terraform" -ErrorAction SilentlyContinue)) {
    Write-Host "[cfg] Terraform is not installed. Attempting automatic installation via winget..." -ForegroundColor Yellow
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        winget install Hashicorp.Terraform --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        if (!(Get-Command "terraform" -ErrorAction SilentlyContinue)) {
            Write-Warning "Terraform was installed but may require a terminal restart to be fully recognized."
        }
    } else {
        Write-Error "Terraform is not installed and winget is unavailable. Please install Terraform CLI (https://developer.hashicorp.com/terraform/downloads) first!"
        Pause
        return
    }
}

# 3. Check for Ollama & Download Local AI Models
if ($models.Count -eq 0) {
    Write-Host "[Skip] Skipping local AI model download as requested." -ForegroundColor Yellow
} elseif (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
    Write-Warning "Ollama is not installed. Local AI model pull will be skipped."
} else {
    Write-Host " Pulling Local AI Models via Ollama..." -ForegroundColor Yellow
    foreach ($model in $models) {
        Write-Host "Pulling $model..." -ForegroundColor Cyan
        ollama pull $model
    }
}

# 4. Install MCP Servers globally
Write-Host " Installing MCP Servers (Terraform & Filesystem)..." -ForegroundColor Yellow
npm install -g @modelcontextprotocol/server-filesystem terraform-mcp-server

# 5. Create the Terraform Workspace
if (!(Test-Path $tfWorkspace)) {
    Write-Host " Creating Terraform Workspace at $tfWorkspace..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $tfWorkspace | Out-Null
}

# 6. Copy Local Bundled Codebase
Write-Host " Copying bundled TerraMind codebase to $lcPathFull..." -ForegroundColor Yellow
$bundledChatPath = Join-Path $PSScriptRoot "chat"

if (!(Test-Path $lcPathFull)) {
    if (Test-Path $bundledChatPath) {
        Copy-Item -Path $bundledChatPath -Destination $basePath -Recurse -Force
        Rename-Item -Path (Join-Path $basePath "chat") -NewName "LibreChat"
    } else {
        Write-Host "ERROR: Bundled 'chat' directory not found at $bundledChatPath. Please make sure you downloaded the complete installation package." -ForegroundColor Red
        Pause
        exit
    }
} else {
    Write-Host "Directory already exists at $lcPathFull, skipping copy." -ForegroundColor Yellow
}

# 7. Download tfsec
$tfsecPath = "$lcPathFull\tfsec.exe"
if (!(Test-Path $tfsecPath)) {
    Write-Host " Downloading tfsec.exe..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/aquasecurity/tfsec/releases/latest/download/tfsec-windows-amd64.exe" -OutFile $tfsecPath
}

# 8. Install NPM Dependencies
Write-Host "[pkg] Installing Node dependencies (This has been optimized for speed)..." -ForegroundColor Yellow
Set-Location -Path $lcPathFull
npm install --no-audit --no-fund --prefer-offline

# 9. Configure Environment Variables and Copy Files
Write-Host "[cfg] Configuring Environment Variables and Copying Files..." -ForegroundColor Yellow

    $yamlSource = Join-Path $lcPathFull "librechat.yaml"
    if (Test-Path $yamlSource) {
        $yamlContent = Get-Content $yamlSource -Raw
        $yamlContent = $yamlContent.Replace("REPLACE_WITH_TF_WORKSPACE", $tfWorkspace.Replace("\", "\\"))
        $yamlContent = $yamlContent.Replace("REPLACE_WITH_MCP_RUNNER_PATH", "$lcPathFull\mcp-tf-runner.js".Replace("\", "\\"))
        Set-Content -Path $yamlSource -Value $yamlContent -Encoding UTF8
    }

    $envSource = Join-Path $lcPathFull ".env.example"
if (!(Test-Path $envSource) -and (Test-Path "$lcPathFull\.env.example")) {
    $envSource = "$lcPathFull\.env.example"
}

if (Test-Path $envSource) {
    $envContent = Get-Content $envSource -Raw
    if ($apiKey -ne "") {
        $envContent = $envContent -replace "REPLACE_WITH_YOUR_KEY", $apiKey
    }
    
    if ($envContent -match "APP_TITLE=") {
        $envContent = $envContent -replace "APP_TITLE=.*", "APP_TITLE=TerraMind"
    } else {
        $envContent += "`nAPP_TITLE=TerraMind"
    }

    if ($envContent -match "MONGO_URI=") {
        $envContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=mongodb://127.0.0.1:27017/LibreChat"
    } else {
        $envContent += "`nMONGO_URI=mongodb://127.0.0.1:27017/LibreChat"
    }

    Set-Content -Path "$lcPathFull\.env" -Value $envContent -Encoding UTF8
} else {
    Write-Warning "Could not find .env.example to create .env file."
}

$htmlPath = "$lcPathFull\client\index.html"
if (Test-Path $htmlPath) {
    $htmlContent = Get-Content $htmlPath -Raw
    $htmlContent = $htmlContent -replace "<title>LibreChat</title>", "<title>TerraMind</title>"
    $htmlContent = $htmlContent -replace "content=`"LibreChat`"", "content=`"TerraMind`""
    Set-Content -Path $htmlPath -Value $htmlContent -Encoding UTF8
    Write-Host "[OK] Updated index.html with TerraMind title." -ForegroundColor Green
}

# 10. Build Frontend
Write-Host " Building Frontend (npm run frontend)..." -ForegroundColor Yellow
npm run frontend

# 11. Finish Up
Write-Host "[OK] Installation Complete! TerraMind is ready to run natively." -ForegroundColor Green
Write-Host "[>] To start the application, stay in the current directory and run: npm run backend" -ForegroundColor Cyan
Write-Host "[Web] Access the application at: http://localhost:3080" -ForegroundColor White
Write-Host "[Note] NOTE: Make sure MongoDB Community Edition is running locally!" -ForegroundColor Yellow
Pause



