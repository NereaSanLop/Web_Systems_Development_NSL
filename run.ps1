[CmdletBinding()]
param(
    [switch]$Install,
    [switch]$NoInstall,
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$StopFirst
)

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'Timebank Dev Runner'
$ScriptStart = Get-Date

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$VenvPython = Join-Path $Root 'venv\Scripts\python.exe'
$BackendDir = Join-Path $Root 'backend'
$FrontendDir = Join-Path $Root 'frontend'

function Write-Section {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Banner {
    Write-Host ''
    Write-Host '=====================================' -ForegroundColor Cyan
    Write-Host '  Timebank Development Runner' -ForegroundColor White
    Write-Host '=====================================' -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)
    Write-Host "[info] $Message" -ForegroundColor DarkGray
}

function Write-Success {
    param([string]$Message)
    Write-Host "[ok]   $Message" -ForegroundColor Green
}

function Format-Duration {
    param([TimeSpan]$Duration)
    return ('{0:mm\:ss}' -f $Duration)
}

function Write-OptionSummary {
    param(
        [bool]$ShouldInstall,
        [bool]$StopFirst,
        [bool]$BackendOnly,
        [bool]$FrontendOnly
    )

    $mode = 'Full Stack'
    if ($BackendOnly) { $mode = 'Backend Only' }
    if ($FrontendOnly) { $mode = 'Frontend Only' }

    Write-Section 'Run Configuration'
    Write-Host ('{0,-16}: {1}' -f 'Mode', $mode) -ForegroundColor Gray
    Write-Host ('{0,-16}: {1}' -f 'Install deps', ($(if ($ShouldInstall) { 'Yes' } else { 'No' }))) -ForegroundColor Gray
    Write-Host ('{0,-16}: {1}' -f 'Stop first', ($(if ($StopFirst) { 'Yes' } else { 'No' }))) -ForegroundColor Gray
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )

    $stepStart = Get-Date
    Write-Info "$Label..."
    & $Action
    $elapsed = (Get-Date) - $stepStart
    Write-Success "$Label completed in $(Format-Duration $elapsed)."
}

function Invoke-InDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][scriptblock]$Script
    )

    Push-Location $Path
    try {
        & $Script
    }
    finally {
        Pop-Location
    }
}

function Get-PythonCommand {
    if (Test-Path $VenvPython) {
        return @($VenvPython)
    }

    $pyCmd = Get-Command py -ErrorAction SilentlyContinue
    if ($null -ne $pyCmd) {
        return @('py', '-3')
    }

    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($null -ne $pythonCmd) {
        return @('python')
    }

    throw 'Python was not found. Install Python 3 first.'
}

function Ensure-Venv {
    if (Test-Path $VenvPython) {
        Write-Info 'Using existing virtual environment.'
        return
    }

    Write-Section 'Python Environment'
    Write-Info 'Creating virtual environment in venv...'
    $py = Get-PythonCommand
    $pyExe = $py[0]
    $pyArgs = @()
    if ($py.Length -gt 1) {
        $pyArgs = $py[1..($py.Length - 1)]
    }
    & $pyExe @pyArgs -m venv (Join-Path $Root 'venv')
    Write-Success 'Virtual environment created.'
}

function Stop-DevPorts {
    # Kill stale uvicorn workers for this project even if they are not attached to the expected port.
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -match '^python(\\.exe)?$' -and
            $_.CommandLine -like '*uvicorn app.main:app*'
        } |
        ForEach-Object {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }

    $ports = @(8000, 3000)
    foreach ($port in $ports) {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($null -ne $connections) {
            $connections |
                Select-Object -ExpandProperty OwningProcess -Unique |
                ForEach-Object {
                    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
                }
        }
    }
}

if ($BackendOnly -and $FrontendOnly) {
    throw 'Use only one of -BackendOnly or -FrontendOnly.'
}

$shouldInstall = $Install -or (-not $NoInstall)
Write-Banner
Write-OptionSummary -ShouldInstall $shouldInstall -StopFirst $StopFirst -BackendOnly $BackendOnly -FrontendOnly $FrontendOnly

if ($StopFirst) {
    Write-Section 'Cleanup'
    Invoke-Step -Label 'Stopping processes on ports 8000 and 3000' -Action {
        Stop-DevPorts
    }
}

if ($shouldInstall) {
    Write-Section 'Dependencies'
    Ensure-Venv

    Invoke-Step -Label 'Installing Python dependencies' -Action {
        & $VenvPython -m pip install -r (Join-Path $Root 'requirements.txt')
    }

    Invoke-Step -Label 'Installing frontend dependencies' -Action {
        Invoke-InDirectory -Path $FrontendDir -Script { npm install }
    }
}

if ($FrontendOnly) {
    Write-Section 'Frontend'
    Write-Info 'Starting frontend in current window...'
    Invoke-InDirectory -Path $FrontendDir -Script { npm start }
    exit 0
}

if ($BackendOnly) {
    Write-Section 'Backend'
    Write-Info 'Starting backend in current window...'
    Invoke-InDirectory -Path $BackendDir -Script {
        # Avoid --reload to prevent mixed Python interpreters in child worker processes.
        & $VenvPython -m uvicorn app.main:app
    }
    exit 0
}

Write-Section 'Launch'
Write-Info 'Starting backend and frontend in separate windows...'
# Keep backend startup consistent with BackendOnly mode.
$backendCmd = "Set-Location '$BackendDir'; & '$VenvPython' -m uvicorn app.main:app"
$frontendCmd = "Set-Location '$FrontendDir'; npm start"

Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCmd | Out-Null

$total = (Get-Date) - $ScriptStart
Write-Success "Done in $(Format-Duration $total). Backend: http://127.0.0.1:8000 | Frontend: http://localhost:3000"
