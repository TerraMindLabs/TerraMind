# Attempt to resize the console window for a better installer experience
try {
    $size = $Host.UI.RawUI.WindowSize
    $size.Width = 150
    $size.Height = 70
    $Host.UI.RawUI.WindowSize = $size
} catch {
    # Ignore if the terminal doesn't support programmatic resizing (e.g., Windows Terminal handles this differently)
}

Write-Host "===========================================================" -ForegroundColor DarkGray
Write-Host "  _____                    __  __ _           _            " -ForegroundColor Cyan
Write-Host " |_   _|__ _ __ _ __ __ _ |  \/  (_)_ __   __| |           " -ForegroundColor Cyan
Write-Host "   | |/ _ \ '__| '__/ _' || |\/| | | '_ \ / _' |           " -ForegroundColor Cyan
Write-Host "   | |  __/ |  | | | (_| || |  | | | | | | (_| |           " -ForegroundColor Cyan
Write-Host "   |_|\___|_|  |_|  \__,_||_|  |_|_|_| |_|\__,_|           " -ForegroundColor Cyan
Write-Host "                                                           " -ForegroundColor Cyan
Write-Host "             [ AI Cloud DevOps Architect ]                 " -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host " Welcome to TerraMind Setup" -ForegroundColor White
Write-Host " --------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host " [?] What would you like to do?" -ForegroundColor Cyan
Write-Host "    [1] Install TerraMind" -ForegroundColor White
Write-Host "    [2] Uninstall TerraMind" -ForegroundColor White
$action = Read-Host "`n => Enter your choice (1 or 2)"

if ($action -eq "2") {
    Write-Host ""
    Write-Host "[!] CRITICAL: Before proceeding, ensure the TerraMind server is STOPPED!" -ForegroundColor Red
    Write-Host "    Make sure you have completely closed out of the terminal window running your TerraMind server," -ForegroundColor Yellow
    Write-Host "    or run 'taskkill /f /im node.exe' in a separate PowerShell window to force-kill all Node processes." -ForegroundColor Yellow
    Write-Host "    If the server is still running, Windows will lock the files and this uninstaller will get stuck!" -ForegroundColor Yellow
    Write-Host ""

    $currentDrive = (Get-Location).Drive.Name
    $drive = Read-Host "Enter the drive where TerraMind is installed (e.g., C, D, G) [Default: $currentDrive]"
    if ([string]::IsNullOrWhiteSpace($drive)) { $drive = $currentDrive }
    $drive = $drive.Replace(":", "").Substring(0,1)

    $folder = Read-Host "Enter the folder name [Default: TerraMind]"
    if ([string]::IsNullOrWhiteSpace($folder)) { $folder = "TerraMind" }

    $basePath = Join-Path "$drive`:\" $folder
    
    $lcPathFull = Join-Path $basePath "Mind"
    $tfWorkspace = Join-Path $basePath "Terraform"

    Write-Host "`nThe following directories will be permanently deleted:" -ForegroundColor Yellow
    Write-Host "- $lcPathFull" -ForegroundColor Red
    Write-Host "- $tfWorkspace" -ForegroundColor Red

    Write-Host "`n[WARN] WARNING: This will completely uninstall TerraMind (TF-AI-Gen) and delete its data!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure you want to proceed? (y/N)"
    if ($confirm -notmatch "^[yY]$") {
        Write-Host "Uninstallation cancelled."
        Pause
        return
    }

    $removeNpm = Read-Host "Uninstall global MCP NPM packages? (y/N)"
    $removeModels = Read-Host "Remove locally downloaded Ollama models (llama3.2, qwen2.5-coder, etc.)? (y/N)"
    $killNode = Read-Host "Force-kill all running Node.js servers to prevent file-lock errors? (Recommended) (y/N)"

    if ($killNode -match "^[yY]$") {
        Write-Host "[rm] Forcefully stopping all Node.js processes..." -ForegroundColor Yellow
        taskkill /f /im node.exe 2>$null
        Start-Sleep -Seconds 2
    }

    if (Test-Path $lcPathFull) {
        Write-Host "[rm] Deleting TerraMind installation at $lcPathFull (this is optimized for speed)..." -ForegroundColor Yellow
        # cmd.exe rmdir is significantly faster than PowerShell's Remove-Item for deep node_modules folders
        cmd.exe /c "rmdir /s /q `"$lcPathFull`"" 2>$null
        if (Test-Path $lcPathFull) { Remove-Item -Recurse -Force $lcPathFull -ErrorAction SilentlyContinue }
    } else {
        Write-Host "[Skip] TerraMind installation not found at $lcPathFull, skipping..." -ForegroundColor Cyan
    }

    if (Test-Path $tfWorkspace) {
        Write-Host "[rm] Deleting Terraform Workspace at $tfWorkspace..." -ForegroundColor Yellow
        cmd.exe /c "rmdir /s /q `"$tfWorkspace`"" 2>$null
        if (Test-Path $tfWorkspace) { Remove-Item -Recurse -Force $tfWorkspace -ErrorAction SilentlyContinue }
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
} elseif ($basePath -match '^[a-zA-Z]:?$') {
    $basePath = "$basePath\"
}

$tfWorkspace = Join-Path $basePath "Terraform"
$lcPathFull = Join-Path $basePath "Mind"

Write-Host "`n [?] Select local Ollama models to pull based on your system RAM:" -ForegroundColor Cyan
Write-Host "    [1] Low-end (8GB RAM): llama3.2, qwen2.5-coder:3b" -ForegroundColor White
Write-Host "    [2] Mid-range (16GB RAM): llama3.1, qwen2.5-coder:7b" -ForegroundColor White
Write-Host "    [3] High-end (32GB+ RAM): mistral-nemo, qwen2.5-coder:14b" -ForegroundColor White
Write-Host "    [4] Skip local models (Use only Gemini/Cloud)" -ForegroundColor Yellow
Write-Host "    [5] Custom (comma-separated list)" -ForegroundColor DarkGray
$modelChoice = Read-Host "`n => Enter your choice (1-5) [Default: 4]"

$models = @()
$customModels = ""
if ($modelChoice -eq "1") {
    $customModels = "llama3.2, qwen2.5-coder:3b"
} elseif ($modelChoice -eq "2") {
    $customModels = "llama3.1, qwen2.5-coder:7b"
} elseif ($modelChoice -eq "3") {
    $customModels = "mistral-nemo, qwen2.5-coder:14b"
} elseif ($modelChoice -eq "5") {
    $customModels = Read-Host " Enter models to pull (comma-separated) [Default: llama3.2]"
    if ([string]::IsNullOrWhiteSpace($customModels)) {
        $customModels = "llama3.2"
    }
}

if (-not [string]::IsNullOrWhiteSpace($customModels)) {
    $models = $customModels -split "," | ForEach-Object { $_.Trim() }
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
    $env:AGENT_PROVIDER = "google"
    $env:AGENT_MODEL = "gemini-3.5-flash-lite"
} else {
    $env:AGENT_PROVIDER = "custom"
    $env:AGENT_MODEL = $customModels.Split(',')[0].Trim()

    if (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Warning "Ollama is not installed. Local AI model pull will be skipped."
    } else {
        Write-Host " Pulling Local AI Models via Ollama..." -ForegroundColor Yellow
        foreach ($model in $models) {
            Write-Host "Pulling $model..." -ForegroundColor Cyan
            ollama pull $model
        }
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
        Rename-Item -Path (Join-Path $basePath "chat") -NewName "Mind"
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
    $scriptPath = $PSScriptRoot
    $zipTarget = ""
    if (Test-Path "$lcPathFull\node_modules.zip") { $zipTarget = "$lcPathFull\node_modules.zip" }
    elseif (Test-Path "$scriptPath\node_modules.zip") { $zipTarget = "$scriptPath\node_modules.zip" }

    if (!(Test-Path "$lcPathFull\node_modules") -and ($zipTarget -ne "")) {
        Write-Host "[pkg] Found node_modules.zip at $zipTarget! Extracting to speed up installation (this might take a minute)..." -ForegroundColor Yellow
        # Use tar if available (much faster than Expand-Archive for many small files)
        if (Get-Command "tar" -ErrorAction SilentlyContinue) {
            cmd.exe /c "tar -xf `"$zipTarget`" -C `"$lcPathFull`""
        } else {
            Expand-Archive -Path $zipTarget -DestinationPath "$lcPathFull" -Force
        }
    }

if (Test-Path "$lcPathFull\node_modules") {
    Write-Host "[pkg] Found pre-bundled node_modules. Skipping npm install for faster setup!" -ForegroundColor Green
    Set-Location -Path $lcPathFull
    npm install cross-env --no-save --silent
} else {
    Write-Host "[pkg] Installing Node dependencies (This has been optimized for speed)..." -ForegroundColor Yellow
    Set-Location -Path $lcPathFull
    npm install --no-audit --no-fund --prefer-offline --loglevel verbose
}

# 9. Configure Environment Variables and Copy Files
Write-Host "[cfg] Configuring Environment Variables and Copying Files..." -ForegroundColor Yellow

    $lcConfig = "$lcPathFull\terramind.yaml"
    if (Test-Path $lcConfig) {
        Write-Host "[cfg] Configuring terramind.yaml..." -ForegroundColor Yellow
        $yamlContent = Get-Content $lcConfig -Raw
        $yamlContent = $yamlContent.Replace("REPLACE_WITH_TF_WORKSPACE", $tfWorkspace.Replace("\", "\\"))
        $yamlContent = $yamlContent.Replace("REPLACE_WITH_MCP_RUNNER_PATH", "$lcPathFull\mcp-tf-runner.js".Replace("\", "\\"))
        
        # Inject agents if not already present
        if ($yamlContent -notmatch "agents:") {
            $yamlContent = $yamlContent -replace "endpoints:`r?`n  google:", "endpoints:`r`n  agents:`r`n    models: [`"gemini-3.5-flash-lite`", `"gemini-1.5-flash-latest`", `"llama3.2`", `"llama3.1`", `"qwen2.5-coder:3b`", `"qwen2.5-coder:7b`", `"mistral-nemo`", `"qwen2.5-coder:14b`"]`r`n  google:"
        }
        
        Set-Content -Path $lcConfig -Value $yamlContent -Encoding UTF8
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

    if ($envContent -match "CONFIG_PATH=") {
        $envContent = $envContent -replace ".*CONFIG_PATH=.*", "CONFIG_PATH=`"terramind.yaml`""
    } else {
        $envContent += "`nCONFIG_PATH=`"terramind.yaml`""
    }

    if (![string]::IsNullOrWhiteSpace($apiKey)) {
        if ($envContent -match "GEMINI_API_KEY=") {
            $envContent = $envContent -replace ".*GEMINI_API_KEY=.*", "GEMINI_API_KEY=`"$apiKey`""
        } else {
            $envContent += "`nGEMINI_API_KEY=`"$apiKey`""
        }
    }

    if ($envContent -match "MONGO_URI=") {
        $envContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=mongodb://127.0.0.1:27017/TerraMind"
    } else {
        $envContent += "`nMONGO_URI=mongodb://127.0.0.1:27017/TerraMind"
    }

    if ($envContent -match "HELP_AND_FAQ_URL=") {
        $envContent = $envContent -replace "HELP_AND_FAQ_URL=.*", "HELP_AND_FAQ_URL=https://www.google.com"
    } else {
        $envContent += "`nHELP_AND_FAQ_URL=https://www.google.com"
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
if (Test-Path "$lcPathFull\client\dist") {
    Write-Host " [?] Found pre-built frontend (client/dist). Skipping build for faster setup!" -ForegroundColor Green
} else {
    Write-Host " Building Frontend (npm run frontend)..." -ForegroundColor Yellow
    npm run frontend
}

# 11. Seed Default Agents
Write-Host " Seeding TerraMind AI Agents into MongoDB..." -ForegroundColor Yellow
Set-Location -Path $lcPathFull
if (!(Test-Path "$lcPathFull\node_modules\mongodb")) {
    npm install mongodb --no-save --silent
}

if (!(Test-Path "$lcPathFull\seed-agent.js") -and (Test-Path "$bundledChatPath\seed-agent.js")) {
    Copy-Item -Path "$bundledChatPath\seed-agent.js" -Destination "$lcPathFull\seed-agent.js" -Force
}

if (Test-Path "$lcPathFull\seed-agent.js") {
    node seed-agent.js
} else {
    Write-Warning "Could not find seed-agent.js. Skipping Agent database seeding."
}

# 12. Create Launch Scripts
Write-Host "`n Creating Launch Shortcut..." -ForegroundColor Yellow
$batPath = Join-Path $basePath "Start-TerraMind.bat"
$batContent = "@echo off`r`ntitle TerraMind AI Server`r`ncd /d `"%~dp0Mind`"`r`ncls`r`necho Starting TerraMind AI Server...`r`necho Please leave this window open to keep the server running.`r`necho.`r`nnpm run backend`r`npause"
Set-Content -Path $batPath -Value $batContent -Encoding UTF8
Write-Host "[OK] Created launch script: $batPath" -ForegroundColor Green

# 13. Finish Up
Write-Host "`n===========================================================" -ForegroundColor DarkGray
Write-Host "[OK] Installation Complete! TerraMind is ready to run." -ForegroundColor Green
Write-Host "[Web] Application URL: http://localhost:3080" -ForegroundColor White
Write-Host "[Note] NOTE: Make sure MongoDB Community Edition is running locally!" -ForegroundColor Yellow
Write-Host "===========================================================`n" -ForegroundColor DarkGray

Write-Host ""
choice.exe /C YN /T 10 /D Y /M " [?] Auto-starting TerraMind server in 10 seconds... Start now?"

if ($LASTEXITCODE -eq 1) {
    Write-Host "`n Starting TerraMind Server on port 3080... (Press Ctrl+C to stop)" -ForegroundColor Cyan
    npm run backend
} else {
    Write-Host "`n[>] To start it later, simply double-click Start-TerraMind.bat in your installation folder!" -ForegroundColor Cyan
    Pause
}
