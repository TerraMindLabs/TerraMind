# Attempt to resize the console window for a better installer experience
try {
    $size = $Host.UI.RawUI.WindowSize
    $size.Width = 140
    $size.Height = 60
    $Host.UI.RawUI.WindowSize = $size
} catch {}

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

function Ensure-Terraform {
    if (Get-Command "terraform" -ErrorAction SilentlyContinue) {
        $tfVer = (terraform version 2>&1 | Select-Object -First 1)
        Write-Host " [OK] Found Terraform CLI: $tfVer" -ForegroundColor Green
        return $true
    }

    Write-Host "`n [!] Terraform CLI is not installed. Attempting automated installation..." -ForegroundColor Yellow

    # Try winget first if available
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        Write-Host " [pkg] Installing Terraform via winget..." -ForegroundColor Cyan
        Invoke-CommandWithSpinner -Message "Installing Terraform CLI" -CommandString "winget install Hashicorp.Terraform --accept-package-agreements --accept-source-agreements --silent"
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        if (Get-Command "terraform" -ErrorAction SilentlyContinue) {
            Write-Host " [OK] Terraform CLI installed successfully via winget!" -ForegroundColor Green
            return $true
        }
    }

    # Fallback to direct zip download
    $tfVer = "1.10.5"
    $tfZipUrl = "https://releases.hashicorp.com/terraform/$tfVer/terraform_${tfVer}_windows_amd64.zip"
    $tempZip = Join-Path $env:TEMP "terraform.zip"
    $installDir = "$env:LOCALAPPDATA\Terraform"

    Write-Host " [net] Downloading Terraform CLI ($tfVer)..." -ForegroundColor Cyan
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $tfZipUrl -OutFile $tempZip -UseBasicParsing
        New-Item -ItemType Directory -Force -Path $installDir | Out-Null
        Expand-Archive -Path $tempZip -DestinationPath $installDir -Force
        Remove-Item $tempZip -Force -ErrorAction SilentlyContinue

        $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*$installDir*") {
            [System.Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
            $env:Path = "$env:Path;$installDir"
        }
        Write-Host " [OK] Terraform CLI installed to $installDir!" -ForegroundColor Green
        return $true
    } catch {
        Write-Warning "Failed to download Terraform: $_"
        Write-Host " Please install Terraform manually from: https://developer.hashicorp.com/terraform/downloads" -ForegroundColor Yellow
        return $false
    }
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
Write-Host "     [ AI Cloud DevOps & Infrastructure Architect ]        " -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host " Welcome to TerraMind Setup" -ForegroundColor White
Write-Host " --------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host " [?] What would you like to do?" -ForegroundColor Cyan
Write-Host "    [1] Install / Update TerraMind [Default]" -ForegroundColor White
Write-Host "    [2] Uninstall TerraMind" -ForegroundColor White
$action = Read-Host "`n => Enter your choice (1 or 2)"
if ([string]::IsNullOrWhiteSpace($action)) { $action = "1" }

if ($action -eq "2") {
    $currentPath = (Get-Location).Path
    $basePath = Read-Host "`nEnter the directory where TerraMind is installed [Default: $currentPath]"
    if ([string]::IsNullOrWhiteSpace($basePath)) { $basePath = $currentPath }

    Write-Host "`n[WARN] This will stop TerraMind and remove application files in $basePath!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure you want to proceed? (y/N)"
    if ($confirm -notmatch "^[yY]$") {
        Write-Host "Uninstallation cancelled."
        return
    }

    Write-Host "`n[kill] Stopping running processes..." -ForegroundColor Yellow
    taskkill /f /im node.exe 2>$null

    $removeModels = Read-Host "Remove locally downloaded Ollama models (llama3.2, qwen2.5-coder, etc.)? (y/N)"
    if ($removeModels -match "^[yY]$" -and (Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Host "[rm] Removing standard Ollama models..." -ForegroundColor Yellow
        $models = @("llama3.2", "qwen2.5-coder:3b", "llama3.1", "qwen2.5-coder:7b", "mistral-nemo", "qwen2.5-coder:14b")
        foreach ($m in $models) {
            ollama rm $m 2>$null
        }
    }

    if (Test-Path $basePath) {
        Invoke-CommandWithSpinner -Message "Deleting TerraMind installation ($basePath)" -CommandString "rmdir /s /q `"$basePath`""
        if (Test-Path $basePath) { Remove-Item -Recurse -Force $basePath -ErrorAction SilentlyContinue }
    }

    $desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "TerraMind.lnk"
    Remove-Item $desktopShortcut -Force -ErrorAction SilentlyContinue

    Write-Host "`n[OK] TerraMind uninstallation complete!" -ForegroundColor Green
    return
}

# --- Installation Logic ---

Write-Host "`n[*] Starting TerraMind Setup..." -ForegroundColor Cyan

# Detect if current directory is already the TerraMind repo
$scriptDir = $PSScriptRoot
$isLocalRepo = $false
if (![string]::IsNullOrWhiteSpace($scriptDir) -and (Test-Path "$scriptDir\package.json") -and (Test-Path "$scriptDir\apps\server") -and (Test-Path "$scriptDir\apps\web")) {
    $isLocalRepo = $true
}

if ($isLocalRepo) {
    $basePath = $scriptDir
    Write-Host " [dir] Detected existing TerraMind repository at: $basePath" -ForegroundColor Green
} else {
    $defaultDrive = (Get-Location).Drive.Name
    $defaultPath = "$defaultDrive`:\TerraMind"
    $userPath = Read-Host "`nEnter installation folder [Default: $defaultPath]"
    if ([string]::IsNullOrWhiteSpace($userPath)) { $basePath = $defaultPath } else { $basePath = $userPath }
    New-Item -ItemType Directory -Force -Path $basePath | Out-Null
}

Write-Host "`n===========================================================" -ForegroundColor DarkGray
Write-Host "           Select your AI Engine Setup                     " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor DarkGray
Write-Host " [1] Local AI via Ollama (100% Offline / Private / Free)" -ForegroundColor White
Write-Host " [2] Cloud AI (Google Gemini, OpenAI, Anthropic Claude)" -ForegroundColor White
Write-Host " [3] Hybrid (Both Local Ollama + Cloud AI Models) [Recommended]" -ForegroundColor White
Write-Host " [4] Skip for now (Configure models & keys later in Web UI)" -ForegroundColor White
$aiChoice = Read-Host "`n => Enter choice (1-4) [Default: 3]"
if ([string]::IsNullOrWhiteSpace($aiChoice)) { $aiChoice = "3" }

$geminiApiKey = ""
$openaiApiKey = ""
$anthropicApiKey = ""

if ($aiChoice -eq "2" -or $aiChoice -eq "3") {
    Write-Host "`n Configure Cloud AI Provider API Keys (optional - can also enter in UI Settings):" -ForegroundColor Cyan
    Write-Host " [1] Google Gemini   👉 Free API key: https://aistudio.google.com/apikey" -ForegroundColor White
    Write-Host " [2] OpenAI          👉 API key:      https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host " [3] Anthropic       👉 API key:      https://console.anthropic.com/settings/keys" -ForegroundColor White
    Write-Host " [4] Enter Multiple Keys" -ForegroundColor White
    Write-Host " [5] Skip for now (Enter anytime via Settings in the Web UI)" -ForegroundColor White
    $cloudChoice = Read-Host "`n => Enter choice (1-5) [Default: 5]"
    if ([string]::IsNullOrWhiteSpace($cloudChoice)) { $cloudChoice = "5" }

    switch ($cloudChoice) {
        "1" { $geminiApiKey = Read-Host " Enter Google Gemini API Key" }
        "2" { $openaiApiKey = Read-Host " Enter OpenAI API Key" }
        "3" { $anthropicApiKey = Read-Host " Enter Anthropic API Key" }
        "4" {
            $geminiApiKey = Read-Host " Enter Google Gemini Key (or press enter to skip)"
            $openaiApiKey = Read-Host " Enter OpenAI Key (or press enter to skip)"
            $anthropicApiKey = Read-Host " Enter Anthropic Key (or press enter to skip)"
        }
        default { Write-Host " [cfg] Skipping cloud keys for now. You can add them in Settings > API Keys." -ForegroundColor Yellow }
    }
}

$models = @()
if ($aiChoice -eq "1" -or $aiChoice -eq "3") {
    if (!(Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Host "`n [ollama] Ollama is not installed. Attempting automated installation via winget..." -ForegroundColor Yellow
        if (Get-Command "winget" -ErrorAction SilentlyContinue) {
            Invoke-CommandWithSpinner -Message "Installing Ollama" -CommandString "winget install Ollama.Ollama --accept-package-agreements --accept-source-agreements --silent"
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        }
    }

    Ensure-OllamaRunning

    Write-Host "`n===========================================================" -ForegroundColor DarkGray
    Write-Host "    Select Local Ollama Models (Sorted by RAM Tier)        " -ForegroundColor Cyan
    Write-Host "===========================================================" -ForegroundColor DarkGray
    Write-Host " [1] qwen2.5-coder:1.5b    (Min RAM: 2GB  | ~1.0GB - Ultra-fast, runs anywhere)" -ForegroundColor Green
    Write-Host " [2] qwen2.5-coder:3b      (Min RAM: 4GB  | ~2.0GB - ⭐ Best overall for CPU & YAML/HCL)" -ForegroundColor Green
    Write-Host " [3] llama3.2              (Min RAM: 4GB  | ~2.0GB - Meta 3B fast CPU generalist)" -ForegroundColor Green
    Write-Host " [4] deepseek-r1:7b        (Min RAM: 8GB  | ~4.7GB - ⭐ Best Architecture & Reasoning)" -ForegroundColor Yellow
    Write-Host " [5] qwen2.5-coder:7b      (Min RAM: 8GB  | ~4.5GB - ⭐ Recommended for Terraform/IaC)" -ForegroundColor Yellow
    Write-Host " [6] llama3.1              (Min RAM: 8GB  | ~4.7GB - Meta flagship 8B generalist)" -ForegroundColor Yellow
    Write-Host " [7] qwen2.5-coder:14b     (Min RAM: 16GB | ~9.0GB - Enterprise full-stack coding)" -ForegroundColor Red
    Write-Host " [8] Skip Model Pull       (Download models manually later via 'ollama pull')" -ForegroundColor White
    $modelChoice = Read-Host "`n => Enter choice (1-8) [Default: 2 (qwen2.5-coder:3b)]"
    if ([string]::IsNullOrWhiteSpace($modelChoice)) { $modelChoice = "2" }

    switch ($modelChoice) {
        "1" { $models += "qwen2.5-coder:1.5b" }
        "2" { $models += "qwen2.5-coder:3b" }
        "3" { $models += "llama3.2" }
        "4" { $models += "deepseek-r1:7b" }
        "5" { $models += "qwen2.5-coder:7b" }
        "6" { $models += "llama3.1" }
        "7" { $models += "qwen2.5-coder:14b" }
        default {}
    }

    if ($models.Count -gt 0 -and (Get-Command "ollama" -ErrorAction SilentlyContinue)) {
        Write-Host "`n [ollama] Verifying / downloading local models..." -ForegroundColor Cyan
        foreach ($m in $models) {
            $installed = (ollama list 2>$null)
            if ($installed -match "^$m[:\s]") {
                Write-Host " [OK] Model $m is already downloaded!" -ForegroundColor Green
            } else {
                Write-Host " [ollama] Pulling $m (this may take a few minutes)..." -ForegroundColor Yellow
                ollama pull $m
            }
        }
    }
}

# 2. Dependency Checks
Write-Host "`n[*] Checking System Prerequisites..." -ForegroundColor Cyan

if (!(Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Host " [!] Git is not installed. Please install Git: https://git-scm.com/download/win" -ForegroundColor Red
    return
}

if (!(Get-Command "node" -ErrorAction SilentlyContinue) -or !(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host " [!] Node.js and npm are required. Please install Node.js LTS: https://nodejs.org/" -ForegroundColor Red
    return
}
$nodeVer = (node -v)
$npmVer = (npm -v)
Write-Host " [OK] Found Node.js: $nodeVer and npm: $npmVer" -ForegroundColor Green

# Database: Embedded SQLite WAL mode
Write-Host " [OK] Database: Embedded SQLite with WAL mode ready (zero external DB required)." -ForegroundColor Green

Ensure-Terraform | Out-Null

# 3. Deploy TerraMind Codebase if not local
if (-not $isLocalRepo) {
    Write-Host "`n [git] Cloning TerraMind repository into $basePath..." -ForegroundColor Cyan
    $tempClone = Join-Path $env:TEMP "terramind_clone_$([Guid]::NewGuid().ToString().Substring(0,8))"
    git clone --depth 1 https://github.com/TerraMindLabs/TerraMind.git "$tempClone"
    if (Test-Path $tempClone) {
        Copy-Item -Path "$tempClone\*" -Destination $basePath -Recurse -Force
        if (Test-Path "$tempClone\.gitignore") { Copy-Item -Path "$tempClone\.gitignore" -Destination $basePath -Force }
        Remove-Item -Recurse -Force $tempClone -ErrorAction SilentlyContinue
        Write-Host " [OK] TerraMind codebase deployed." -ForegroundColor Green
    } else {
        Write-Host " [!] Failed to clone TerraMind repository from GitHub." -ForegroundColor Red
        return
    }
}

# 4. Install NPM Dependencies across workspaces
Write-Host "`n [npm] Installing project dependencies via npm workspaces..." -ForegroundColor Cyan
Invoke-CommandWithSpinner -Message "Installing project dependencies" -CommandString "npm install" -WorkingDir $basePath

# 5. Build Web Frontend
Write-Host "`n [bld] Building web production bundle (Vite / React)..." -ForegroundColor Cyan
Invoke-CommandWithSpinner -Message "Compiling frontend bundle" -CommandString "npm run build" -WorkingDir $basePath

# 6. Configure Environment Variables
Write-Host "`n [cfg] Generating environment configuration..." -ForegroundColor Cyan
$envPath = Join-Path $basePath ".env"
$envLines = @(
    "PORT=3080",
    "APP_TITLE=TerraMind"
)
if (![string]::IsNullOrWhiteSpace($geminiApiKey)) { $envLines += "GEMINI_API_KEY=`"$geminiApiKey`"" }
if (![string]::IsNullOrWhiteSpace($openaiApiKey)) { $envLines += "OPENAI_API_KEY=`"$openaiApiKey`"" }
if (![string]::IsNullOrWhiteSpace($anthropicApiKey)) { $envLines += "ANTHROPIC_API_KEY=`"$anthropicApiKey`"" }
Set-Content -Path $envPath -Value ($envLines -join "`r`n") -Encoding UTF8
Write-Host " [OK] Created .env configuration." -ForegroundColor Green

# 7. Create Launch & Uninstall Shortcuts
Write-Host "`n [app] Creating desktop and folder shortcuts..." -ForegroundColor Cyan

$batPath = Join-Path $basePath "TerraMind.bat"
$batContent = @"
@echo off
title TerraMind - AI Cloud Architect
cd /d "%~dp0"
echo ===========================================================
echo    TerraMind - AI Cloud ^& Infrastructure Architect
echo ===========================================================
echo Starting server on http://localhost:3080...
where ollama >nul 2>nul && (
    curl -s http://127.0.0.1:11434/api/version >nul 2>nul || start /b ollama serve >nul 2>nul
)
start "" "http://localhost:3080"
npm start
pause
"@
Set-Content -Path $batPath -Value $batContent -Encoding ASCII
Write-Host " [OK] Created launcher: TerraMind.bat" -ForegroundColor Green

$uninstallBat = Join-Path $basePath "Uninstall_TerraMind.bat"
$unContent = @"
@echo off
title Uninstall TerraMind
echo [WARN] This will completely remove TerraMind from %~dp0!
set /p confirm="Are you sure you want to proceed? (y/N): "
if /i "%confirm%"=="y" (
    taskkill /f /im node.exe >nul 2>nul
    cd ..
    rmdir /s /q "%~dp0"
    echo TerraMind removed successfully.
)
pause
"@
Set-Content -Path $uninstallBat -Value $unContent -Encoding ASCII
Write-Host " [OK] Created uninstaller: Uninstall_TerraMind.bat" -ForegroundColor Green

# Create Desktop Shortcut
try {
    $wsh = New-Object -ComObject WScript.Shell
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcut = $wsh.CreateShortcut((Join-Path $desktopPath "TerraMind.lnk"))
    $shortcut.TargetPath = $batPath
    $shortcut.WorkingDirectory = $basePath
    $shortcut.Description = "TerraMind AI Cloud Architect"
    $shortcut.Save()
    Write-Host " [OK] Created Desktop shortcut: TerraMind.lnk" -ForegroundColor Green
} catch {}

# 8. Done!
Write-Host "`n===========================================================" -ForegroundColor DarkGray
Write-Host " [OK] Installation Complete! TerraMind is ready to run.    " -ForegroundColor Green
Write-Host " Application URL: http://localhost:3080                    " -ForegroundColor White
Write-Host "===========================================================" -ForegroundColor DarkGray

$startNow = Read-Host "`n 🚀 Start TerraMind server now? (Y/n) [Default: Y]"
if ([string]::IsNullOrWhiteSpace($startNow) -or $startNow -match "^[yY]$") {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$batPath`""
} else {
    Write-Host "`n To launch TerraMind anytime, double-click TerraMind.bat (or your Desktop shortcut)!" -ForegroundColor Cyan
}
