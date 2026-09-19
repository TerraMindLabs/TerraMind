# Attempt to resize the console window for a better installer experience
try {
    $size = $Host.UI.RawUI.WindowSize
    $size.Width = 150
    $size.Height = 70
    $Host.UI.RawUI.WindowSize = $size
} catch {
    # Ignore if the terminal doesn't support programmatic resizing (e.g., Windows Terminal handles this differently)
}

function Invoke-CommandWithSpinner {
    param(
        [string]$Message,
        [string]$CommandString,
        [string]$WorkingDir = ""
    )
    $spinChars = @('|', '/', '-', '\')
    $i = 0
    $start = [System.Diagnostics.Stopwatch]::StartNew()
    $job = Start-Job -ScriptBlock {
        param($cmd, $dir)
        if ($dir) { Set-Location $dir }
        cmd.exe /c "$cmd" 2>&1 | Out-Null
    } -ArgumentList $CommandString, $WorkingDir

    while ($job.State -eq 'Running') {
        $elapsed = [math]::Floor($start.Elapsed.TotalSeconds)
        $char = $spinChars[$i % $spinChars.Length]
        Write-Host -NoNewline "`r [*] $Message ($char) [${elapsed}s] " -ForegroundColor Cyan
        $i++
        Start-Sleep -Milliseconds 250
    }
    $start.Stop()
    Receive-Job $job | Out-Null
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    $totalSec = [math]::Floor($start.Elapsed.TotalSeconds)
    Write-Host "`r [OK] $Message (Done in ${totalSec}s)                         " -ForegroundColor Green
}

function Ensure-MongoDB {
    Write-Host "`n [db] Checking MongoDB database availability on port 27017..." -ForegroundColor Cyan
    
    # 1. Test if port 27017 is already responding
    $isListening = $false
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect("127.0.0.1", 27017, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(1500, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.EndConnect($iar)
            $isListening = $true
        }
        $tcp.Close()
    } catch {
        $isListening = $false
    }

    if ($isListening) {
        Write-Host " [OK] MongoDB is active and listening on port 27017." -ForegroundColor Green
        return $true
    }

    # 2. Port is NOT listening. Check if a Windows service for MongoDB exists
    $mongoSvc = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if (!$mongoSvc) {
        $mongoSvc = Get-Service | Where-Object { $_.Name -like "*mongo*" -or $_.DisplayName -like "*mongo*" } | Select-Object -First 1
    }

    if ($mongoSvc) {
        Write-Host " [db] Found MongoDB Windows Service ('$($mongoSvc.Name)'), but it is currently stopped." -ForegroundColor Yellow
        Write-Host " [db] Attempting to start MongoDB service..." -ForegroundColor Yellow
        
        # Try standard start first
        cmd.exe /c "net start `"$($mongoSvc.Name)`"" 2>$null
        Start-Sleep -Seconds 2

        # If still stopped, request elevation via UAC prompt to start service
        $checkSvc = Get-Service -Name $mongoSvc.Name -ErrorAction SilentlyContinue
        if ($checkSvc -and $checkSvc.Status -ne "Running") {
            Write-Host " [db] Requesting elevation to start MongoDB Windows service..." -ForegroundColor Cyan
            try {
                Start-Process "cmd.exe" -ArgumentList "/c net start `"$($mongoSvc.Name)`"" -Verb RunAs -WindowStyle Hidden -Wait
                Start-Sleep -Seconds 2
            } catch {
                # User may have clicked No on UAC prompt
            }
        }

        # Check port again
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $iar = $tcp.BeginConnect("127.0.0.1", 27017, $null, $null)
            $wait = $iar.AsyncWaitHandle.WaitOne(2000, $false)
            if ($wait -and $tcp.Connected) {
                $tcp.EndConnect($iar)
                Write-Host " [OK] MongoDB service started successfully and is ready!" -ForegroundColor Green
                $tcp.Close()
                return $true
            }
            $tcp.Close()
        } catch {}
    }

    # 3. Check if Docker is running and offer containerized Mongo
    if (Get-Command "docker" -ErrorAction SilentlyContinue) {
        $dockerRunning = $false
        try {
            docker info 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
        } catch {}

        if ($dockerRunning) {
            Write-Host "`n [?] Docker detected! Would you like to run MongoDB in a lightweight Docker container?" -ForegroundColor Cyan
            Write-Host "    Command: docker run -d -p 27017:27017 --name terramind-mongo mongo:latest" -ForegroundColor DarkGray
            $useDocker = Read-Host "    Start MongoDB via Docker? (Y/n)"
            if ($useDocker -notmatch "^[nN]$") {
                Write-Host " [db] Starting MongoDB container..." -ForegroundColor Cyan
                docker run -d -p 27017:27017 --name terramind-mongo mongo:latest 2>&1 | Out-Null
                docker start terramind-mongo 2>&1 | Out-Null
                Start-Sleep -Seconds 3
                return $true
            }
        }
    }

    # 4. MongoDB is not installed at all. Offer automated winget installation
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        Write-Host "`n [!] MongoDB is not detected on your system." -ForegroundColor Yellow
        Write-Host "    TerraMind requires MongoDB to store chats, configurations, and AI agent prompts." -ForegroundColor White
        Write-Host "`n [?] Would you like TerraMind to automatically install MongoDB Community Server for you?" -ForegroundColor Cyan
        Write-Host "    [1] Auto-install MongoDB via Windows Package Manager (winget) [Recommended]" -ForegroundColor White
        Write-Host "    [2] I will start/install MongoDB manually" -ForegroundColor White
        $dbChoice = Read-Host "`n => Enter choice (1 or 2) [Default: 1]"
        if ([string]::IsNullOrWhiteSpace($dbChoice) -or $dbChoice -eq "1") {
            Write-Host "`n [db] Installing MongoDB Community Server via winget..." -ForegroundColor Yellow
            Invoke-CommandWithSpinner -Message "Installing MongoDB Community Server via winget" -CommandString "winget install MongoDB.Server -e --accept-package-agreements --accept-source-agreements --silent"
            Start-Sleep -Seconds 3
            cmd.exe /c "net start MongoDB" 2>$null
            return $true
        }
    }

    Write-Host "`n [!] Please make sure MongoDB is running before launching TerraMind." -ForegroundColor Yellow
    Write-Host "     Download link: https://www.mongodb.com/try/download/community" -ForegroundColor DarkGray
    return $false
}

function Ensure-OllamaRunning {
    if (Get-Command "ollama" -ErrorAction SilentlyContinue) {
        $running = $false
        try {
            $resp = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/version" -TimeoutSec 2 -ErrorAction Stop
            if ($resp.version) { $running = $true }
        } catch {
            $running = $false
        }
        if (-not $running) {
            Write-Host " [ollama] Starting Ollama background server..." -ForegroundColor Cyan
            Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
            Start-Sleep -Seconds 2
        }
    }
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
        Invoke-CommandWithSpinner -Message "Deleting TerraMind installation ($lcPathFull)" -CommandString "rmdir /s /q `"$lcPathFull`""
        if (Test-Path $lcPathFull) { Remove-Item -Recurse -Force $lcPathFull -ErrorAction SilentlyContinue }
    } else {
        Write-Host "[Skip] TerraMind installation not found at $lcPathFull, skipping..." -ForegroundColor Cyan
    }

    if (Test-Path $tfWorkspace) {
        Invoke-CommandWithSpinner -Message "Deleting Terraform Workspace ($tfWorkspace)" -CommandString "rmdir /s /q `"$tfWorkspace`""
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

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "                🤖 Select your AI Engine Setup                       " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " 1) Local AI via Ollama (100% Offline / Private / Free)" -ForegroundColor White
Write-Host " 2) Cloud AI (Google Gemini, OpenAI, Anthropic Claude)" -ForegroundColor White
Write-Host " 3) Hybrid (Both Local Ollama + Cloud AI Models) [Recommended]" -ForegroundColor White
Write-Host " 4) Skip for now (Configure models & keys manually later)" -ForegroundColor White
$aiChoice = Read-Host "`n => Enter your choice (1-4) [Default: 3]"
if ([string]::IsNullOrWhiteSpace($aiChoice)) { $aiChoice = "3" }

$geminiApiKey = ""
$openaiApiKey = ""
$anthropicApiKey = ""

if ($aiChoice -eq "2" -or $aiChoice -eq "3") {
    Write-Host "`nSelect Cloud AI Provider(s):" -ForegroundColor Cyan
    Write-Host " 1) Google Gemini   👉 Free API key: https://aistudio.google.com/apikey" -ForegroundColor White
    Write-Host " 2) OpenAI          👉 API key:      https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host " 3) Anthropic       👉 API key:      https://console.anthropic.com/settings/keys" -ForegroundColor White
    Write-Host " 4) Enter Multiple / All Keys" -ForegroundColor White
    Write-Host " 5) Skip Cloud Keys (Enter in Web UI Settings later)" -ForegroundColor DarkGray
    $cloudChoice = Read-Host "`n => Enter your choice (1-5) [Default: 1]"
    if ([string]::IsNullOrWhiteSpace($cloudChoice)) { $cloudChoice = "1" }

    switch ($cloudChoice) {
        "1" {
            Write-Host "`n👉 Google Gemini API Key (Free at https://aistudio.google.com/apikey):" -ForegroundColor Cyan
            $geminiApiKey = Read-Host " Enter your Google Gemini API Key"
        }
        "2" {
            Write-Host "`n👉 OpenAI API Key (Get at https://platform.openai.com/api-keys):" -ForegroundColor Cyan
            $openaiApiKey = Read-Host " Enter your OpenAI API Key"
        }
        "3" {
            Write-Host "`n👉 Anthropic Claude API Key (Get at https://console.anthropic.com/settings/keys):" -ForegroundColor Cyan
            $anthropicApiKey = Read-Host " Enter your Anthropic Claude API Key"
        }
        "4" {
            Write-Host "`n👉 Google Gemini API Key (Free at https://aistudio.google.com/apikey):" -ForegroundColor Cyan
            $geminiApiKey = Read-Host " Enter Google Gemini Key (or press enter to skip)"
            Write-Host "👉 OpenAI API Key (https://platform.openai.com/api-keys):" -ForegroundColor Cyan
            $openaiApiKey = Read-Host " Enter OpenAI Key (or press enter to skip)"
            Write-Host "👉 Anthropic Claude API Key (https://console.anthropic.com/settings/keys):" -ForegroundColor Cyan
            $anthropicApiKey = Read-Host " Enter Anthropic Key (or press enter to skip)"
        }
        "5" {
            Write-Host "⏭️ Skipping Cloud API Keys for now. You can enter them anytime in the chat UI via Settings > Provider Keys." -ForegroundColor Yellow
        }
        default {
            Write-Host "`n👉 Google Gemini API Key (Free at https://aistudio.google.com/apikey):" -ForegroundColor Cyan
            $geminiApiKey = Read-Host " Enter your Google Gemini API Key"
        }
    }
}

$models = @()

if ($aiChoice -eq "1" -or $aiChoice -eq "3") {
    # Check if Ollama is installed; if not, attempt automatic installation
    if (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Host "`n⚙️ Ollama is not installed. Attempting automatic installation..." -ForegroundColor Yellow
        Write-Host "   (Official website: https://ollama.com)" -ForegroundColor Cyan
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
            Write-Host "✅ Ollama is installed!" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ Found existing Ollama installation." -ForegroundColor Green
    }

    Ensure-OllamaRunning

    Write-Host "`n======================================================================" -ForegroundColor Cyan
    Write-Host "          Select Local Ollama Models (Sorted by RAM Tier)            " -ForegroundColor Cyan
    Write-Host "          Model Library: https://ollama.com/library                   " -ForegroundColor DarkGray
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "  👉 TIP: Enter a single choice or comma-separated numbers (e.g. 5 or 4,7)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  🟢 LOW-END / LAPTOP (4GB - 8GB RAM):" -ForegroundColor Green
    Write-Host "  [1] qwen2.5-coder:1.5b          (~1GB VRAM - Ultra-fast, runs anywhere)" -ForegroundColor Green
    Write-Host "  [2] qwen2.5-coder:3b            (~2GB VRAM - Lightweight code assistant)" -ForegroundColor Green
    Write-Host "  [3] llama3.2                    (~2.2GB VRAM - Meta 3B general & DevOps)" -ForegroundColor Green
    Write-Host "  [4] Low-End Bundle              👉 qwen2.5-coder:3b + llama3.2" -ForegroundColor Green
    Write-Host ""
    Write-Host "  🟡 MID-RANGE / WORKSTATION (12GB - 16GB RAM):" -ForegroundColor Yellow
    Write-Host "  [5] qwen2.5-coder:7b            (~4.5GB - ⭐ Recommended for Terraform/IaC)" -ForegroundColor Yellow
    Write-Host "  [6] llama3.1                    (~4.7GB - Meta flagship 8B generalist)" -ForegroundColor Yellow
    Write-Host "  [7] codellama:7b                (~4GB - Meta specialized code model)" -ForegroundColor Yellow
    Write-Host "  [8] Mid-Range Bundle            👉 qwen2.5-coder:7b + llama3.1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  🔴 HIGH-END / POWERHOUSE (32GB+ RAM / Dedicated GPU):" -ForegroundColor Red
    Write-Host "  [9] qwen2.5-coder:14b           (~9GB - Enterprise full-stack coding)" -ForegroundColor Red
    Write-Host "  [10] mistral-nemo               (~7GB - High-precision 128k context)" -ForegroundColor Red
    Write-Host "  [11] High-End Bundle            👉 qwen2.5-coder:14b + mistral-nemo" -ForegroundColor Red
    Write-Host ""
    Write-Host "  ⚪ OTHER OPTIONS:" -ForegroundColor White
    Write-Host "  [12] Custom Model               (Enter model tag from ollama.com/library)" -ForegroundColor White
    Write-Host "  [13] Skip Model Pull            (I will run 'ollama pull' manually later)" -ForegroundColor DarkGray
    $modelChoice = Read-Host "`n => Enter choice(s) [Default: 5 (qwen2.5-coder:7b)]"
    if ([string]::IsNullOrWhiteSpace($modelChoice)) { $modelChoice = "5" }

    $selectedModels = [System.Collections.Generic.List[string]]::new()
    $tokens = $modelChoice -split "[,;\s]+" | Where-Object { $_ -ne "" }
    foreach ($token in $tokens) {
        switch ($token) {
            "1" { $selectedModels.Add("qwen2.5-coder:1.5b") }
            "2" { $selectedModels.Add("qwen2.5-coder:3b") }
            "3" { $selectedModels.Add("llama3.2") }
            "4" { $selectedModels.Add("qwen2.5-coder:3b"); $selectedModels.Add("llama3.2") }
            "5" { $selectedModels.Add("qwen2.5-coder:7b") }
            "6" { $selectedModels.Add("llama3.1") }
            "7" { $selectedModels.Add("codellama:7b") }
            "8" { $selectedModels.Add("qwen2.5-coder:7b"); $selectedModels.Add("llama3.1") }
            "9" { $selectedModels.Add("qwen2.5-coder:14b") }
            "10" { $selectedModels.Add("mistral-nemo") }
            "11" { $selectedModels.Add("qwen2.5-coder:14b"); $selectedModels.Add("mistral-nemo") }
            "12" {
                $customInput = Read-Host " Enter custom model name(s) (comma-separated, e.g. phi3:mini, starcoder2:7b)"
                if (-not [string]::IsNullOrWhiteSpace($customInput)) {
                    $customInput -split "[,;\s]+" | Where-Object { $_ -ne "" } | ForEach-Object { $selectedModels.Add($_) }
                }
            }
            "13" { }
            default {
                if ($token -notmatch "^\d+$") {
                    $selectedModels.Add($token)
                }
            }
        }
    }
    $models = @($selectedModels | Select-Object -Unique)
    if ($models.Count -eq 0 -and $modelChoice -ne "13") {
        $models = @("qwen2.5-coder:7b")
    }
} elseif ($aiChoice -eq "4") {
    Write-Host "`n⏭️ Skipping AI model setup for now. You can configure Ollama or Cloud keys anytime later." -ForegroundColor Yellow
} else {
    Write-Host "`n☁️ Cloud AI mode selected. Local Ollama download skipped." -ForegroundColor Green
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

Ensure-MongoDB | Out-Null

if (!(Get-Command "terraform" -ErrorAction SilentlyContinue)) {
    Write-Host "[cfg] Terraform is not installed. Attempting automatic installation..." -ForegroundColor Yellow
    $tfInstalled = $false
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        Write-Host " [pkg] Installing HashiCorp Terraform via winget..." -ForegroundColor Cyan
        winget install Hashicorp.Terraform --accept-package-agreements --accept-source-agreements --silent
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        if (Get-Command "terraform" -ErrorAction SilentlyContinue) { $tfInstalled = $true }
    }
    
    if (-not $tfInstalled) {
        try {
            Write-Host " [pkg] Downloading official HashiCorp Terraform binary (~25MB)..." -ForegroundColor Cyan
            $tfVer = "1.10.5"
            $tfZip = Join-Path $env:TEMP "terraform_${tfVer}_windows_amd64.zip"
            $tfTargetDir = "$basePath\bin"
            if (!(Test-Path $tfTargetDir)) { New-Item -ItemType Directory -Force -Path $tfTargetDir | Out-Null }
            Invoke-WebRequest -Uri "https://releases.hashicorp.com/terraform/${tfVer}/terraform_${tfVer}_windows_amd64.zip" -OutFile $tfZip -UseBasicParsing
            Expand-Archive -Path $tfZip -DestinationPath $tfTargetDir -Force
            Remove-Item $tfZip -Force -ErrorAction SilentlyContinue
            if (Test-Path "$tfTargetDir\terraform.exe") {
                $env:Path = "$tfTargetDir;" + $env:Path
                $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
                if ($userPath -notlike "*$tfTargetDir*") {
                    [System.Environment]::SetEnvironmentVariable("Path", "$tfTargetDir;$userPath", "User")
                }
                $tfInstalled = $true
                Write-Host " [OK] Terraform CLI installed successfully to $tfTargetDir\terraform.exe!" -ForegroundColor Green
            }
        } catch {
            Write-Warning "Could not automatically download Terraform: $_"
        }
    }

    if (-not $tfInstalled) {
        Write-Warning "Terraform is not installed and automated setup failed. Please install Terraform CLI (https://developer.hashicorp.com/terraform/downloads) manually."
    }
}

# 3. Check for Ollama & Download Local AI Models
if ($models.Count -eq 0) {
    if ($aiChoice -eq "3") {
        Write-Host "[Skip] Skipping local AI models (Configuring Cloud mode for now; manual Ollama setup can be done later)." -ForegroundColor Yellow
    } else {
        Write-Host "[Skip] Skipping local AI models as requested." -ForegroundColor Green
    }
    if (-not [string]::IsNullOrWhiteSpace($openaiApiKey)) {
        $env:AGENT_PROVIDER = "openAI"
        $env:AGENT_MODEL = "gpt-4o-mini"
    } elseif (-not [string]::IsNullOrWhiteSpace($anthropicApiKey)) {
        $env:AGENT_PROVIDER = "anthropic"
        $env:AGENT_MODEL = "claude-3-5-sonnet-20241022"
    } else {
        $env:AGENT_PROVIDER = "google"
        $env:AGENT_MODEL = "gemini-3.5-flash-lite"
    }
} else {
    $env:AGENT_PROVIDER = "ollama"
    $env:AGENT_MODEL = $models[0]

    if (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Warning "Ollama command is not currently available in this terminal session. Local AI model pull will be skipped."
        Write-Host "To pull models manually later, run: ollama pull $($models[0])" -ForegroundColor Cyan
    } else {
        Ensure-OllamaRunning
        Write-Host "`n📥 Pulling Local AI Models via Ollama..." -ForegroundColor Yellow
        foreach ($model in $models) {
            Write-Host "Pulling $model..." -ForegroundColor Cyan
            ollama pull $model
        }
        Write-Host "✅ Local models ready!" -ForegroundColor Green
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

$depChoice = "1"
$timeoutSeconds = 30
$chosen = $false

try {
    if (-not [System.Console]::IsInputRedirected) {
        $startTime = [System.DateTime]::Now
        $lastDisplaySec = -1
        while (($remaining = $timeoutSeconds - [int]([System.DateTime]::Now - $startTime).TotalSeconds) -ge 0) {
            if ($remaining -ne $lastDisplaySec) {
                $lastDisplaySec = $remaining
                Write-Host -NoNewline "`r => Enter your choice (1 or 2) [Auto-selecting 1 in ${remaining}s]: "
            }
            if ([System.Console]::KeyAvailable) {
                $key = [System.Console]::ReadKey($true)
                if ($key.Key -eq [System.ConsoleKey]::Enter) {
                    Write-Host ""
                    $chosen = $true
                    break
                } elseif ($key.KeyChar -eq '1' -or $key.KeyChar -eq '2') {
                    $depChoice = [string]$key.KeyChar
                    Write-Host "$depChoice"
                    $chosen = $true
                    break
                }
            }
            Start-Sleep -Milliseconds 100
        }
        if (-not $chosen) {
            Write-Host "`n[Auto] Timeout reached. Selected Fast Install [1] by default." -ForegroundColor Green
        }
    } else {
        Write-Host " => Non-interactive session detected. Defaulting to Fast Install [1]." -ForegroundColor Cyan
    }
} catch {
    $depChoice = "1"
}

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
        Write-Host "[pkg] Found node_modules.zip at $zipTarget!" -ForegroundColor Cyan
        if (Get-Command "tar" -ErrorAction SilentlyContinue) {
            Invoke-CommandWithSpinner -Message "Extracting pre-bundled dependencies (~400MB)" -CommandString "tar -xf `"$zipTarget`" -C `"$lcPathFull`""
        } else {
            Invoke-CommandWithSpinner -Message "Extracting pre-bundled dependencies (~400MB)" -CommandString "powershell -Command `"Expand-Archive -Path '$zipTarget' -DestinationPath '$lcPathFull' -Force`""
        }
    }

    # Delete .zip after successful extraction to save disk space
    if (Test-Path "$lcPathFull\node_modules") {
        if ($zipTarget -and (Test-Path $zipTarget)) {
            Write-Host "[pkg] Cleaning up $zipTarget to free up disk space..." -ForegroundColor Cyan
            Remove-Item $zipTarget -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path "$lcPathFull\node_modules.zip") {
            Remove-Item "$lcPathFull\node_modules.zip" -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "[pkg] Clean install selected. Skipping pre-bundled package download." -ForegroundColor Cyan
}

if (Test-Path "$lcPathFull\node_modules") {
    Invoke-CommandWithSpinner -Message "Finalizing package setup and CLI utilities" -CommandString "npm install cross-env --no-save --silent" -WorkingDir $lcPathFull
} else {
    Write-Host "[pkg] Installing Node dependencies from source (Takes 30+ mins)..." -ForegroundColor Yellow
    Set-Location -Path $lcPathFull
    npm install --no-audit --no-fund --prefer-offline --loglevel verbose
}

if (!(Test-Path "$lcPathFull\packages\api\dist\credentials.cjs") -or !(Test-Path "$lcPathFull\packages\data-schemas\dist\index.cjs")) {
    Write-Host "[cfg] Building internal package modules (@librechat/api, data-schemas)..." -ForegroundColor Yellow
    Invoke-CommandWithSpinner -Message "Compiling package modules" -CommandString "npm run build:packages" -WorkingDir $lcPathFull
}

# 9. Configure Environment Variables and Copy Files
Write-Host "[cfg] Configuring Environment Variables and Copying Files..." -ForegroundColor Yellow

$lcConfig = "$lcPathFull\terramind.yaml"
if (Test-Path $lcConfig) {
    Write-Host "[cfg] Configuring terramind.yaml..." -ForegroundColor Yellow
    $yamlContent = Get-Content $lcConfig -Raw
    $yamlContent = $yamlContent.Replace("REPLACE_WITH_TF_WORKSPACE", $tfWorkspace.Replace("\", "\\"))
    $yamlContent = $yamlContent.Replace("REPLACE_WITH_MCP_RUNNER_PATH", "$lcPathFull\mcp-tf-runner.js".Replace("\", "\\"))
    
    # Configure all available models in endpoints.agents.models
    $baseModels = @("gemini-3.5-flash-lite", "gemini-1.5-flash-latest", "gemini-2.0-flash", "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022")
    $allAgentModels = $baseModels + $models
    $modelsJson = ($allAgentModels | ForEach-Object { "`"$_`"" }) -join ", "
    $ollamaModelsJson = ($models | ForEach-Object { "`"$_`"" }) -join ", "

    $yamlContent = $yamlContent -replace 'models:\s*\["gemini-3.5-flash-lite",\s*"gemini-1.5-flash-latest"\]', "models: [$modelsJson]"

    if (![string]::IsNullOrWhiteSpace($openaiApiKey) -and $yamlContent -notmatch "openAI:") {
        $yamlContent = $yamlContent -replace "  google:\s*\{\}", "  google: {}`r`n  openAI: {}"
    }
    if (![string]::IsNullOrWhiteSpace($anthropicApiKey) -and $yamlContent -notmatch "anthropic:") {
        $yamlContent = $yamlContent -replace "  google:\s*\{\}", "  google: {}`r`n  anthropic: {}"
    }

    if ($models.Count -gt 0) {
        Write-Host "[cfg] Injecting Ollama endpoints and local models into terramind.yaml..." -ForegroundColor Cyan
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
        Write-Host "[cfg] Cloud / Manual mode active. Local Ollama endpoints will be configured on demand." -ForegroundColor Green
    }
    
    Set-Content -Path $lcConfig -Value $yamlContent -Encoding UTF8
}

$envSource = Join-Path $lcPathFull ".env.example"
if (!(Test-Path $envSource) -and (Test-Path "$lcPathFull\.env.example")) {
    $envSource = "$lcPathFull\.env.example"
}

if (Test-Path $envSource) {
    $envContent = Get-Content $envSource -Raw
    
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

    if ($envContent -match "AGENT_PROVIDER=") {
        $envContent = $envContent -replace ".*AGENT_PROVIDER=.*", "AGENT_PROVIDER=`"$($env:AGENT_PROVIDER)`""
    } else {
        $envContent += "`nAGENT_PROVIDER=`"$($env:AGENT_PROVIDER)`""
    }

    if ($envContent -match "AGENT_MODEL=") {
        $envContent = $envContent -replace ".*AGENT_MODEL=.*", "AGENT_MODEL=`"$($env:AGENT_MODEL)`""
    } else {
        $envContent += "`nAGENT_MODEL=`"$($env:AGENT_MODEL)`""
    }

    if (![string]::IsNullOrWhiteSpace($geminiApiKey)) {
        if ($envContent -match "GEMINI_API_KEY=") {
            $envContent = $envContent -replace ".*GEMINI_API_KEY=.*", "GEMINI_API_KEY=`"$geminiApiKey`""
        } else {
            $envContent += "`nGEMINI_API_KEY=`"$geminiApiKey`""
        }
        if ($envContent -match "GOOGLE_KEY=") {
            $envContent = $envContent -replace ".*GOOGLE_KEY=.*", "GOOGLE_KEY=`"$geminiApiKey`""
        } else {
            $envContent += "`nGOOGLE_KEY=`"$geminiApiKey`""
        }
    }

    if (![string]::IsNullOrWhiteSpace($openaiApiKey)) {
        if ($envContent -match "OPENAI_API_KEY=") {
            $envContent = $envContent -replace ".*OPENAI_API_KEY=.*", "OPENAI_API_KEY=`"$openaiApiKey`""
        } else {
            $envContent += "`nOPENAI_API_KEY=`"$openaiApiKey`""
        }
    } else {
        $envContent = $envContent -replace "(?m)^OPENAI_API_KEY=user_provided", "# OPENAI_API_KEY=user_provided"
    }

    if (![string]::IsNullOrWhiteSpace($anthropicApiKey)) {
        if ($envContent -match "ANTHROPIC_API_KEY=") {
            $envContent = $envContent -replace ".*ANTHROPIC_API_KEY=.*", "ANTHROPIC_API_KEY=`"$anthropicApiKey`""
        } else {
            $envContent += "`nANTHROPIC_API_KEY=`"$anthropicApiKey`""
        }
    }

    if ($models.Count -gt 0) {
        $modelsJoined = $models -join " "
        $envContent += "`nOLLAMA_MODELS=`"$modelsJoined`""
    }

    if ($envContent -match "MONGO_URI=") {
        $envContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=mongodb://127.0.0.1:27017/TerraMind"
    } else {
        $envContent += "`nMONGO_URI=mongodb://127.0.0.1:27017/TerraMind"
    }

    if ($envContent -match "SCHEDULES_SINGLE_PROCESS=") {
        $envContent = $envContent -replace ".*SCHEDULES_SINGLE_PROCESS=.*", "SCHEDULES_SINGLE_PROCESS=true"
    } else {
        $envContent += "`nSCHEDULES_SINGLE_PROCESS=true"
    }

    if ($envContent -match "ALLOW_PASSWORD_RESET=") {
        $envContent = $envContent -replace ".*ALLOW_PASSWORD_RESET=.*", "ALLOW_PASSWORD_RESET=true"
    } else {
        $envContent += "`nALLOW_PASSWORD_RESET=true"
    }

    if ($envContent -match "HELP_AND_FAQ_URL=") {
        $envContent = $envContent -replace "HELP_AND_FAQ_URL=.*", "HELP_AND_FAQ_URL=https://github.com/TerraMindLabs/TerraMind"
    } else {
        $envContent += "`nHELP_AND_FAQ_URL=https://github.com/TerraMindLabs/TerraMind"
    }

    # Auto-generate secure random JWT secrets and CREDS keys if not already set
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $jwtBytes = New-Object byte[] 32; $rng.GetBytes($jwtBytes)
    $jwtSecret = [Convert]::ToBase64String($jwtBytes)
    $jwtRefBytes = New-Object byte[] 32; $rng.GetBytes($jwtRefBytes)
    $jwtRefreshSecret = [Convert]::ToBase64String($jwtRefBytes)
    $credsKeyBytes = New-Object byte[] 32; $rng.GetBytes($credsKeyBytes)
    $credsKey = [BitConverter]::ToString($credsKeyBytes).Replace('-','').ToLower()
    $credsIvBytes = New-Object byte[] 16; $rng.GetBytes($credsIvBytes)
    $credsIv = [BitConverter]::ToString($credsIvBytes).Replace('-','').ToLower()

    if ($envContent -match "^JWT_SECRET=\s*$" -or $envContent -match "^JWT_SECRET=$") {
        $envContent = $envContent -replace "(?m)^JWT_SECRET=\s*$", "JWT_SECRET=$jwtSecret"
    } elseif ($envContent -notmatch "JWT_SECRET=") {
        $envContent += "`nJWT_SECRET=$jwtSecret"
    }
    if ($envContent -match "^JWT_REFRESH_SECRET=\s*$" -or $envContent -match "^JWT_REFRESH_SECRET=$") {
        $envContent = $envContent -replace "(?m)^JWT_REFRESH_SECRET=\s*$", "JWT_REFRESH_SECRET=$jwtRefreshSecret"
    } elseif ($envContent -notmatch "JWT_REFRESH_SECRET=") {
        $envContent += "`nJWT_REFRESH_SECRET=$jwtRefreshSecret"
    }
    if ($envContent -match "^CREDS_KEY=\s*$" -or $envContent -match "^CREDS_KEY=$") {
        $envContent = $envContent -replace "(?m)^CREDS_KEY=\s*$", "CREDS_KEY=$credsKey"
    } elseif ($envContent -notmatch "CREDS_KEY=") {
        $envContent += "`nCREDS_KEY=$credsKey"
    }
    if ($envContent -match "^CREDS_IV=\s*$" -or $envContent -match "^CREDS_IV=$") {
        $envContent = $envContent -replace "(?m)^CREDS_IV=\s*$", "CREDS_IV=$credsIv"
    } elseif ($envContent -notmatch "CREDS_IV=") {
        $envContent += "`nCREDS_IV=$credsIv"
    }
    Write-Host "[OK] Generated secure JWT and CREDS secrets for this installation." -ForegroundColor Green

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

# 9b. Deploy TerraMind Logo Assets
$logoSrc = "$lcPathFull\etc\logo\white_trans.png.png"
if (Test-Path $logoSrc) {
    New-Item -ItemType Directory -Force -Path "$lcPathFull\client\public\assets" | Out-Null
    New-Item -ItemType Directory -Force -Path "$lcPathFull\client\dist\assets" | Out-Null
    Copy-Item $logoSrc "$lcPathFull\client\public\assets\white_trans.png" -Force
    Copy-Item $logoSrc "$lcPathFull\client\public\assets\terramind-logo.png" -Force
    Copy-Item $logoSrc "$lcPathFull\client\dist\assets\white_trans.png" -Force
    Copy-Item $logoSrc "$lcPathFull\client\dist\assets\terramind-logo.png" -Force
}
$onlyLogoSrc = "$lcPathFull\etc\logo\only_logo.png"
if (Test-Path $onlyLogoSrc) {
    New-Item -ItemType Directory -Force -Path "$lcPathFull\client\public\assets" | Out-Null
    New-Item -ItemType Directory -Force -Path "$lcPathFull\client\dist\assets" | Out-Null
    Copy-Item $onlyLogoSrc "$lcPathFull\client\public\assets\only_logo.png" -Force
    Copy-Item $onlyLogoSrc "$lcPathFull\client\dist\assets\only_logo.png" -Force
}
Write-Host "[OK] Deployed TerraMind branding logos to client assets." -ForegroundColor Green

# 10. Build Frontend
if ((Test-Path "$lcPathFull\client\dist") -and (Test-Path "$lcPathFull\client\dist\index.html")) {
    Write-Host " [?] Found pre-built frontend (client/dist). Skipping build for faster setup!" -ForegroundColor Green
} else {
    Write-Host "`n [bld] Compiling frontend assets (Vite / React)..." -ForegroundColor Yellow
    Write-Host "       (Note: standard chunk size & eval notices during minification are normal)" -ForegroundColor DarkGray
    Invoke-CommandWithSpinner -Message "Building frontend production bundle" -CommandString "npm run frontend" -WorkingDir $lcPathFull
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
    Ensure-MongoDB | Out-Null
    node seed-agent.js
} else {
    Write-Warning "Could not find seed-agent.js. Skipping Agent database seeding."
}

# 12. Create Launch & Uninstall Shortcuts
Write-Host "`n Creating Launch & Uninstall Shortcuts..." -ForegroundColor Yellow

$iconPath = Join-Path $lcPathFull "etc\favicon\favicon.ico"



# Native C# Compilation for TerraMind.exe & Uninstall_TerraMind.exe with TerraMind Logo
$cscPath = Join-Path $env:windir "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (!(Test-Path $cscPath)) {
    $cscPath = Join-Path $env:windir "Microsoft.NET\Framework\v4.0.30319\csc.exe"
}

if (Test-Path $cscPath) {
    try {
        # TerraMind.exe: Starts the backend server and opens the browser
        $csStart = @"
using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

class Program {
    static void Main() {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string mindDir = Path.Combine(baseDir, "Mind");

        // 1. Start MongoDB
        Process.Start(new ProcessStartInfo {
            FileName = "cmd.exe",
            Arguments = "/c net start MongoDB",
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Hidden,
            WorkingDirectory = mindDir
        });

        // 2. Start Ollama if installed
        Process.Start(new ProcessStartInfo {
            FileName = "cmd.exe",
            Arguments = "/c where ollama && curl -s http://127.0.0.1:11434/api/version || start /b ollama serve",
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Hidden,
            WorkingDirectory = mindDir
        });

        // 3. Start Node backend server in a visible console
        ProcessStartInfo serverPsi = new ProcessStartInfo();
        serverPsi.FileName = "cmd.exe";
        serverPsi.Arguments = @"/k title TerraMind AI Server && echo Starting TerraMind... && echo. && npm run backend";
        serverPsi.WorkingDirectory = mindDir;
        serverPsi.UseShellExecute = true;
        serverPsi.WindowStyle = ProcessWindowStyle.Normal;
        Process.Start(serverPsi);

        // 4. Wait for server to start (5 seconds) then open browser
        Thread.Sleep(5000);
        Process.Start(new ProcessStartInfo {
            FileName = "http://localhost:3080",
            UseShellExecute = true
        });
    }
}
"@
        $tempCs = Join-Path $env:TEMP "TerraMind.cs"
        Set-Content -Path $tempCs -Value $csStart -Encoding UTF8
        $startExePath = Join-Path $basePath "TerraMind.exe"
        $iconArg = if (Test-Path $iconPath) { "/win32icon:`"$iconPath`"" } else { "" }
        if ($iconArg) {
            & $cscPath /nologo /target:winexe $iconArg /out:"$startExePath" "$tempCs" 2>&1 | Out-Null
        } else {
            & $cscPath /nologo /target:winexe /out:"$startExePath" "$tempCs" 2>&1 | Out-Null
        }
        Remove-Item $tempCs -Force -ErrorAction SilentlyContinue

        if (Test-Path $startExePath) {
            Write-Host "[OK] Compiled TerraMind.exe launcher: $startExePath" -ForegroundColor Green
        }

        # Uninstall_TerraMind.exe: Fully self-contained, no .bat dependency, cleans up everything including itself
        $csUninstall = @"
using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

class Program {
    [STAThread]
    static void Main() {
        var result = MessageBox.Show(
            "This will completely uninstall TerraMind and delete all its files.\n\nAre you sure you want to proceed?",
            "TerraMind Uninstaller",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Warning
        );
        if (result != DialogResult.Yes) { return; }

        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string mindDir = Path.Combine(baseDir, "Mind");
        string tfDir = Path.Combine(baseDir, "Terraform");
        string binDir = Path.Combine(baseDir, "bin");

        // Kill all Node processes
        try { Process.Start(new ProcessStartInfo { FileName = "taskkill", Arguments = "/f /im node.exe", UseShellExecute = true, WindowStyle = ProcessWindowStyle.Hidden, CreateNoWindow = true }).WaitForExit(5000); } catch {}

        // Build a self-deleting cleanup script and run it deferred so the exe can exit first
        string cleanupScript = Path.Combine(Path.GetTempPath(), "terramind_uninstall.bat");
        string ownExe = System.Reflection.Assembly.GetExecutingAssembly().Location;
        string launcherExe = Path.Combine(baseDir, "TerraMind.exe");
        string desktopLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "TerraMind.lnk");

        File.WriteAllText(cleanupScript,
            "@echo off\r\n" +
            "timeout /t 2 /nobreak >nul\r\n" +
            "if exist \"" + mindDir + "\" rmdir /s /q \"" + mindDir + "\"\r\n" +
            "if exist \"" + tfDir + "\" rmdir /s /q \"" + tfDir + "\"\r\n" +
            "if exist \"" + binDir + "\" rmdir /s /q \"" + binDir + "\"\r\n" +
            "if exist \"" + desktopLnk + "\" del /f /q \"" + desktopLnk + "\"\r\n" +
            "if exist \"" + launcherExe + "\" del /f /q \"" + launcherExe + "\"\r\n" +
            "if exist \"" + ownExe + "\" del /f /q \"" + ownExe + "\"\r\n" +
            // Try to delete the parent folder itself if empty
            "timeout /t 1 /nobreak >nul\r\n" +
            "rmdir \"" + baseDir.TrimEnd('\\') + "\" 2>nul\r\n" +
            "del /f /q \"%~f0\"\r\n"
        );

        MessageBox.Show("TerraMind has been uninstalled successfully.", "TerraMind Uninstaller", MessageBoxButtons.OK, MessageBoxIcon.Information);

        Process.Start(new ProcessStartInfo {
            FileName = "cmd.exe",
            Arguments = "/c \"" + cleanupScript + "\"",
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Hidden
        });
    }
}
"@
        $tempCsUn = Join-Path $env:TEMP "Uninstall_TerraMind.cs"
        Set-Content -Path $tempCsUn -Value $csUninstall -Encoding UTF8
        $unExePath = Join-Path $basePath "Uninstall_TerraMind.exe"
        if ($iconArg) {
            & $cscPath /nologo /target:winexe /reference:System.Windows.Forms.dll $iconArg /out:"$unExePath" "$tempCsUn" 2>&1 | Out-Null
        } else {
            & $cscPath /nologo /target:winexe /reference:System.Windows.Forms.dll /out:"$unExePath" "$tempCsUn" 2>&1 | Out-Null
        }
        Remove-Item $tempCsUn -Force -ErrorAction SilentlyContinue

        if (Test-Path $unExePath) {
            Write-Host "[OK] Compiled Uninstall_TerraMind.exe: $unExePath" -ForegroundColor Green
        }
    } catch {
        Write-Warning "Could not compile native exe launchers: $_"
    }
}

# Create Desktop Shortcut with TerraMind Logo
try {
    $desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
    if ($desktopPath -and (Test-Path $desktopPath)) {
        $wsh = New-Object -ComObject WScript.Shell
        $lnk = $wsh.CreateShortcut((Join-Path $desktopPath "TerraMind.lnk"))
        $lnk.TargetPath = Join-Path $basePath "TerraMind.exe"
        $lnk.WorkingDirectory = Join-Path $basePath "Mind"
        if (Test-Path $iconPath) {
            $lnk.IconLocation = "$iconPath,0"
        }
        $lnk.Description = "TerraMind AI Cloud Architect"
        $lnk.Save()
        Write-Host "[OK] Created Desktop shortcut with TerraMind Logo: $desktopPath\TerraMind.lnk" -ForegroundColor Green
    }
} catch {
    # Non-fatal
}

# Clean up any leftover zip archives across installation folders to free up disk space
Get-ChildItem -Path $lcPathFull -Filter "*.zip" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $basePath -Filter "*.zip" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

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
    Write-Host "`n[>] To start TerraMind later, double-click TerraMind.exe (or the Desktop shortcut)!" -ForegroundColor Cyan
    Write-Host "[>] To uninstall TerraMind, simply run Uninstall_TerraMind.exe!" -ForegroundColor Yellow
    Pause
}
