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

Write-Host "`n [?] Select your AI Engine & Local Model Configuration:" -ForegroundColor Cyan
Write-Host "    [1] Configure Local AI via Ollama (100% Offline / Private)" -ForegroundColor White
Write-Host "    [2] Use Cloud AI Only (Google Gemini) [Default]" -ForegroundColor Yellow
Write-Host "    [3] Skip for now (I will download Ollama and configure manually later)" -ForegroundColor DarkGray
$aiChoice = Read-Host "`n => Enter your choice (1-3) [Default: 2]"
if ([string]::IsNullOrWhiteSpace($aiChoice)) { $aiChoice = "2" }

$models = @()
$customModels = ""

if ($aiChoice -eq "1") {
    # Check if Ollama is installed; if not, attempt automatic installation
    if (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Host "[cfg] Ollama is not installed. Attempting automatic installation..." -ForegroundColor Yellow
        $installed = $false
        if (Get-Command "winget" -ErrorAction SilentlyContinue) {
            Write-Host "Installing Ollama via winget..." -ForegroundColor Cyan
            winget install Ollama.Ollama --accept-package-agreements --accept-source-agreements
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            if (Get-Command "ollama" -ErrorAction SilentlyContinue) { $installed = $true }
        }
        
        if (-not $installed) {
            Write-Host "Downloading Ollama installer (OllamaSetup.exe)..." -ForegroundColor Cyan
            $tempOllama = Join-Path $env:TEMP "OllamaSetup.exe"
            try {
                Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile $tempOllama -UseBasicParsing
                Write-Host "Running Ollama installer..." -ForegroundColor Yellow
                Start-Process -FilePath $tempOllama -Wait
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                if (Get-Command "ollama" -ErrorAction SilentlyContinue) { $installed = $true }
            } catch {
                Write-Warning "Could not automatically download Ollama: $_"
            }
        }
        
        if (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
            Write-Warning "Ollama was installed or requires a terminal restart to be recognized in PATH."
            Write-Host "You can also manually launch Ollama from your Start Menu." -ForegroundColor Yellow
        } else {
            Write-Host "[OK] Ollama is installed!" -ForegroundColor Green
        }
    } else {
        Write-Host "[OK] Found existing Ollama installation." -ForegroundColor Green
    }

    Write-Host "`n [?] Select local Ollama models based on your hardware / RAM:" -ForegroundColor Cyan
    Write-Host "    -- Bundles based on System RAM --" -ForegroundColor DarkGray
    Write-Host "    [1] Low-End (8GB RAM):          qwen2.5-coder:3b, llama3.2" -ForegroundColor White
    Write-Host "    [2] Mid-Range (16GB RAM):       qwen2.5-coder:7b, llama3.1" -ForegroundColor White
    Write-Host "    [3] High-End (32GB+ RAM):       qwen2.5-coder:14b, mistral-nemo" -ForegroundColor White
    Write-Host "    -- Individual Models (8+ Options) --" -ForegroundColor DarkGray
    Write-Host "    [4] qwen2.5-coder:1.5b          (Ultra-lightweight, runs on any machine ~1GB)" -ForegroundColor White
    Write-Host "    [5] qwen2.5-coder:3b            (Fast & lightweight ~2GB)" -ForegroundColor White
    Write-Host "    [6] llama3.2:3b                 (Meta versatile 3B model ~2.2GB)" -ForegroundColor White
    Write-Host "    [7] qwen2.5-coder:7b            (Recommended for Terraform/DevOps ~4.5GB)" -ForegroundColor White
    Write-Host "    [8] llama3.1:8b                 (Meta flagship open model ~4.7GB)" -ForegroundColor White
    Write-Host "    [9] mistral-nemo:12b            (Mistral high precision ~7GB)" -ForegroundColor White
    Write-Host "    [10] qwen2.5-coder:14b          (Advanced enterprise code generation ~9GB)" -ForegroundColor White
    Write-Host "    [11] codellama:7b               (Meta dedicated code model ~4GB)" -ForegroundColor White
    Write-Host "    [12] deepseek-coder:6.7b        (DeepSeek specialized code model ~4GB)" -ForegroundColor White
    Write-Host "    [13] Custom                     (Enter comma-separated model names)" -ForegroundColor DarkGray
    $modelChoice = Read-Host "`n => Enter your choice (1-13) [Default: 7]"
    if ([string]::IsNullOrWhiteSpace($modelChoice)) { $modelChoice = "7" }

    switch ($modelChoice) {
        "1"  { $customModels = "qwen2.5-coder:3b, llama3.2" }
        "2"  { $customModels = "qwen2.5-coder:7b, llama3.1" }
        "3"  { $customModels = "qwen2.5-coder:14b, mistral-nemo" }
        "4"  { $customModels = "qwen2.5-coder:1.5b" }
        "5"  { $customModels = "qwen2.5-coder:3b" }
        "6"  { $customModels = "llama3.2" }
        "7"  { $customModels = "qwen2.5-coder:7b" }
        "8"  { $customModels = "llama3.1" }
        "9"  { $customModels = "mistral-nemo" }
        "10" { $customModels = "qwen2.5-coder:14b" }
        "11" { $customModels = "codellama:7b" }
        "12" { $customModels = "deepseek-coder:6.7b" }
        "13" {
            $customModels = Read-Host " Enter models to pull (comma-separated) [Default: qwen2.5-coder:7b]"
            if ([string]::IsNullOrWhiteSpace($customModels)) { $customModels = "qwen2.5-coder:7b" }
        }
        default { $customModels = "qwen2.5-coder:7b" }
    }

    if (-not [string]::IsNullOrWhiteSpace($customModels)) {
        $models = $customModels -split "," | ForEach-Object { $_.Trim() }
    }
} elseif ($aiChoice -eq "3") {
    Write-Host "`n[Skip] Skipping Ollama setup for now. You can download Ollama later (https://ollama.com) and configure models manually." -ForegroundColor Yellow
} else {
    Write-Host "`n[Skip] Cloud AI mode selected (Google Gemini). Zero Ollama overhead." -ForegroundColor Green
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
    if ($aiChoice -eq "3") {
        Write-Host "[Skip] Skipping local AI models (Configuring Cloud mode for now; manual Ollama setup can be done later)." -ForegroundColor Yellow
    } else {
        Write-Host "[Skip] Skipping local AI models as requested (Pure Cloud mode)." -ForegroundColor Green
    }
    $env:AGENT_PROVIDER = "google"
    $env:AGENT_MODEL = "gemini-3.5-flash-lite"
} else {
    $env:AGENT_PROVIDER = "custom"
    $env:AGENT_MODEL = $models[0]

    if (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Warning "Ollama command is not currently available in this terminal session. Local AI model pull will be skipped."
        Write-Host "To pull models manually later, run: ollama pull $($models[0])" -ForegroundColor Cyan
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

# 6. Deploy TerraMind Codebase
Write-Host " Deploying TerraMind codebase to $lcPathFull..." -ForegroundColor Yellow
$bundledChatPath = $null
if (![string]::IsNullOrWhiteSpace($PSScriptRoot) -and (Test-Path (Join-Path $PSScriptRoot "chat"))) {
    $bundledChatPath = Join-Path $PSScriptRoot "chat"
} elseif (Test-Path (Join-Path (Get-Location) "chat")) {
    $bundledChatPath = Join-Path (Get-Location) "chat"
}

if (!(Test-Path $lcPathFull)) {
    if ($bundledChatPath -and (Test-Path $bundledChatPath)) {
        Write-Host "Using local codebase from $bundledChatPath..." -ForegroundColor Cyan
        Copy-Item -Path $bundledChatPath -Destination $basePath -Recurse -Force
        Rename-Item -Path (Join-Path $basePath "chat") -NewName "Mind"
    } else {
        Write-Host "[git] Downloading TerraMind application codebase from GitHub..." -ForegroundColor Cyan
        $tempClone = Join-Path $env:TEMP ("terramind_src_" + [System.Guid]::NewGuid().ToString().Substring(0,8))
        git clone --depth 1 https://github.com/TerraMindLabs/TerraMind.git $tempClone
        if (Test-Path "$tempClone\chat") {
            Move-Item -Path "$tempClone\chat" -Destination $lcPathFull -Force
            Remove-Item -Recurse -Force $tempClone -ErrorAction SilentlyContinue
            Write-Host "[OK] TerraMind application codebase deployed successfully to $lcPathFull" -ForegroundColor Green
        } else {
            Write-Error "Failed to download TerraMind codebase from GitHub."
            Pause
            exit
        }
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
Write-Host "`n [?] How would you like to install Node.js dependencies?" -ForegroundColor Cyan
Write-Host "    [1] Fast Install [Default] - Auto-download pre-bundled dependencies (~400MB) from Google Drive (~2 mins)" -ForegroundColor White
Write-Host "    [2] Clean Install (Recommended) - Build fresh dependencies from source via 'npm install' (Takes 30+ mins)" -ForegroundColor White
$depChoice = Read-Host "`n => Enter your choice (1 or 2) [Default: 1]"
if ([string]::IsNullOrWhiteSpace($depChoice)) { $depChoice = "1" }

$scriptPath = $PSScriptRoot
$zipTarget = ""

if ($depChoice -eq "1") {
    if (Test-Path "$lcPathFull\node_modules.zip") { $zipTarget = "$lcPathFull\node_modules.zip" }
    elseif (Test-Path "$scriptPath\node_modules.zip") { $zipTarget = "$scriptPath\node_modules.zip" }
    elseif (Test-Path "$scriptPath\chat\node_modules.zip") { $zipTarget = "$scriptPath\chat\node_modules.zip" }

    # If pre-bundled node_modules doesn't exist and no local zip was found, download it from Google Drive
    if (!(Test-Path "$lcPathFull\node_modules") -and ($zipTarget -eq "")) {
        $gdriveFileId = "1DXB_zWhrbBIjuq_hd12KsB25T8cEzSlS"
        $downloadDest = "$lcPathFull\node_modules.zip"
        Write-Host "[pkg] Pre-bundled node_modules not found locally." -ForegroundColor Yellow
        Write-Host "[pkg] Downloading pre-bundled dependencies (~400MB) from Google Drive to accelerate setup..." -ForegroundColor Cyan
        
        try {
            $initUrl = "https://drive.google.com/uc?export=download&id=$gdriveFileId"
            $cookieFile = [System.IO.Path]::GetTempFileName()
            
            if (Get-Command "curl.exe" -ErrorAction SilentlyContinue) {
                $resp = curl.exe -s -c "$cookieFile" -L "$initUrl"
                $html = $resp -join "`n"
                $action = "https://drive.usercontent.google.com/download"
                if ($html -match 'action="([^"]+)"') { $action = $Matches[1] }
                $uuid = ""
                if ($html -match 'name="uuid"\s+value="([^"]+)"') { $uuid = $Matches[1] }
                
                $downloadUrl = "$action`?id=$gdriveFileId&export=download&confirm=t"
                if ($uuid) { $downloadUrl += "&uuid=$uuid" }
                
                Write-Host "[pkg] Downloading node_modules.zip (curl progress below)..." -ForegroundColor Yellow
                curl.exe -# -b "$cookieFile" -L "$downloadUrl" -o "$downloadDest"
            } else {
                $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
                $page = Invoke-WebRequest -Uri $initUrl -WebSession $session -UseBasicParsing
                $action = "https://drive.usercontent.google.com/download"
                if ($page.Content -match 'action="([^"]+)"') { $action = $matches[1] }
                $uuid = ""
                if ($page.Content -match 'name="uuid"\s+value="([^"]+)"') { $uuid = $matches[1] }
                
                $downloadUrl = "$action`?id=$gdriveFileId&export=download&confirm=t"
                if ($uuid) { $downloadUrl += "&uuid=$uuid" }
                
                Write-Host "[pkg] Downloading node_modules.zip via Invoke-WebRequest..." -ForegroundColor Yellow
                Invoke-WebRequest -Uri $downloadUrl -WebSession $session -OutFile $downloadDest -UseBasicParsing
            }
            
            Remove-Item $cookieFile -Force -ErrorAction SilentlyContinue
            
            if ((Test-Path $downloadDest) -and ((Get-Item $downloadDest).Length -gt 10000000)) {
                Write-Host "[pkg] Download completed successfully!" -ForegroundColor Green
                $zipTarget = $downloadDest
            } else {
                Write-Warning "Downloaded file is missing or invalid. Falling back to standard npm install."
                Remove-Item $downloadDest -Force -ErrorAction SilentlyContinue
            }
        } catch {
            Write-Warning "Could not download pre-bundled dependencies: $_"
            Write-Host "Falling back to standard npm install..." -ForegroundColor Yellow
        }
    }

    if (!(Test-Path "$lcPathFull\node_modules") -and ($zipTarget -ne "")) {
        Write-Host "[pkg] Found node_modules.zip at $zipTarget! Extracting to speed up installation (this might take a minute)..." -ForegroundColor Yellow
        # Use tar if available (much faster than Expand-Archive for many small files)
        if (Get-Command "tar" -ErrorAction SilentlyContinue) {
            cmd.exe /c "tar -xf `"$zipTarget`" -C `"$lcPathFull`""
        } else {
            Expand-Archive -Path $zipTarget -DestinationPath "$lcPathFull" -Force
        }
    }
} else {
    Write-Host "[pkg] Clean install selected. Skipping pre-bundled package download." -ForegroundColor Cyan
}

if (Test-Path "$lcPathFull\node_modules") {
    Write-Host "[pkg] Found node_modules. Finalizing package setup..." -ForegroundColor Green
    Set-Location -Path $lcPathFull
    npm install cross-env --no-save --silent
} else {
    Write-Host "[pkg] Installing Node dependencies from source (This has been optimized for speed)..." -ForegroundColor Yellow
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
        
        if ($models.Count -gt 0) {
            Write-Host "[cfg] Injecting Ollama endpoints and local models into terramind.yaml..." -ForegroundColor Cyan
            
            # Format model array for agents
            $baseModels = @("gemini-3.5-flash-lite", "gemini-1.5-flash-latest")
            $allAgentModels = $baseModels + $models
            $modelsJson = ($allAgentModels | ForEach-Object { "`"$_`"" }) -join ", "
            $ollamaModelsJson = ($models | ForEach-Object { "`"$_`"" }) -join ", "

            # Update agents models list
            $yamlContent = $yamlContent -replace 'models:\s*\["gemini-3.5-flash-lite",\s*"gemini-1.5-flash-latest"\]', "models: [$modelsJson]"
            
            # Inject custom Ollama endpoint block if not already present
            if ($yamlContent -notmatch "name:\s*`"Ollama`"") {
                $ollamaBlock = @"
  custom:
    - name: "Ollama"
      apiKey: "ollama"
      baseURL: "http://127.0.0.1:11434/v1"
      models:
        default: [$ollamaModelsJson]
        fetch: true
      titleConvo: true
      titleModel: "current_model"
      summarize: false
      displayInFilter: true
"@
                $yamlContent = $yamlContent -replace "  google:\s*\{\}", "  google: {}`r`n$ollamaBlock"
            }
        } else {
            Write-Host "[cfg] Pure Cloud mode active. Zero Ollama endpoints injected into terramind.yaml." -ForegroundColor Green
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

# 12. Create Launch & Uninstall Scripts
Write-Host "`n Creating Launch & Uninstall Shortcuts..." -ForegroundColor Yellow
$batPath = Join-Path $basePath "Start-TerraMind.bat"
$batContent = "@echo off`r`ntitle TerraMind AI Server`r`ncd /d `"%~dp0Mind`"`r`ncls`r`necho Starting TerraMind AI Server...`r`necho Please leave this window open to keep the server running.`r`necho.`r`nnpm run backend`r`npause"
Set-Content -Path $batPath -Value $batContent -Encoding UTF8
Write-Host "[OK] Created launch script: $batPath" -ForegroundColor Green

$uninstallerPath = Join-Path $basePath "Uninstall-TerraMind.bat"
$uninstallerContent = @"
@echo off
title TerraMind Uninstaller
cd /d "%~dp0"
cls
echo ===========================================================
echo            TerraMind (TF-AI-Gen) Uninstaller
echo ===========================================================
echo.
echo [!] WARNING: This will completely remove TerraMind and its workspaces.
set /p confirm="Are you sure you want to uninstall TerraMind? (y/N): "
if /i not "%confirm%"=="y" (
    echo Uninstallation cancelled.
    pause
    exit /b
)

set /p removeNpm="Uninstall global MCP packages (@modelcontextprotocol/server-filesystem, terraform-mcp-server)? (y/N): "
set /p removeModels="Remove local Ollama models? (y/N): "

echo.
echo [*] Force-stopping running Node.js servers...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

if exist "%~dp0Mind" (
    echo [*] Removing TerraMind server files (Mind)...
    rmdir /s /q "%~dp0Mind" >nul 2>&1
)

if exist "%~dp0Terraform" (
    echo [*] Removing Terraform workspace...
    rmdir /s /q "%~dp0Terraform" >nul 2>&1
)

if /i "%removeNpm%"=="y" (
    where npm >nul 2>&1
    if %errorlevel% equ 0 (
        echo [*] Uninstalling global MCP packages...
        call npm uninstall -g @modelcontextprotocol/server-filesystem terraform-mcp-server
    )
)

if /i "%removeModels%"=="y" (
    where ollama >nul 2>&1
    if %errorlevel% equ 0 (
        echo [*] Removing local Ollama models...
        call ollama rm llama3.2 >nul 2>&1
        call ollama rm qwen2.5-coder:3b >nul 2>&1
        call ollama rm llama3.1 >nul 2>&1
        call ollama rm qwen2.5-coder:7b >nul 2>&1
        call ollama rm mistral-nemo >nul 2>&1
        call ollama rm qwen2.5-coder:14b >nul 2>&1
    )
)

if exist "%~dp0Start-TerraMind.bat" del /f /q "%~dp0Start-TerraMind.bat" >nul 2>&1

echo.
echo ===========================================================
echo [OK] TerraMind has been successfully uninstalled!
echo ===========================================================
echo You may now delete this folder if desired.
pause
"@
Set-Content -Path $uninstallerPath -Value $uninstallerContent -Encoding UTF8
Write-Host "[OK] Created uninstaller script: $uninstallerPath" -ForegroundColor Green

# Optional: Clean up temporary cloned repository if user cloned locally and installed elsewhere
if (![string]::IsNullOrWhiteSpace($PSScriptRoot) -and (Test-Path (Join-Path $PSScriptRoot ".git")) -and ((Resolve-Path $PSScriptRoot).Path -ne (Resolve-Path $basePath).Path)) {
    Write-Host "`n [?] Notice: You cloned the installer to $PSScriptRoot, but installed TerraMind to $basePath." -ForegroundColor Cyan
    $delClone = Read-Host "     Would you like to delete the temporary cloned folder to free up disk space? (y/N)"
    if ($delClone -match "^[yY]$") {
        Write-Host " [rm] Scheduling cleanup of $PSScriptRoot..." -ForegroundColor Yellow
        cmd.exe /c "start /b cmd /c (timeout 3 >nul & rmdir /s /q `"$PSScriptRoot`")"
    }
}

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
    Write-Host "[>] To uninstall it later, simply run Uninstall-TerraMind.bat in your installation folder!" -ForegroundColor Yellow
    Pause
}
