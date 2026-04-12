[CmdletBinding()]
param(
    [switch]$Install,
    [switch]$NoInstall,
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$StopFirst
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$VenvPython = Join-Path $Root 'venv\Scripts\python.exe'
$BackendDir = Join-Path $Root 'backend'
$FrontendDir = Join-Path $Root 'frontend'

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
        return
    }

    Write-Host 'Creating virtual environment in venv...'
    $py = Get-PythonCommand
    $pyExe = $py[0]
    $pyArgs = @()
    if ($py.Length -gt 1) {
        $pyArgs = $py[1..($py.Length - 1)]
    }
    & $pyExe @pyArgs -m venv (Join-Path $Root 'venv')
}

function Stop-DevPorts {
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

if ($StopFirst) {
    Write-Host 'Stopping processes on ports 8000 and 3000...'
    Stop-DevPorts
}

if ($shouldInstall) {
    Ensure-Venv

    Write-Host 'Installing Python dependencies...'
    & $VenvPython -m pip install -r (Join-Path $Root 'requirements.txt')

    Write-Host 'Installing frontend dependencies...'
    Push-Location $FrontendDir
    try {
        npm install
    }
    finally {
        Pop-Location
    }
}

if ($FrontendOnly) {
    Write-Host 'Starting frontend...'
    Push-Location $FrontendDir
    try {
        npm start
    }
    finally {
        Pop-Location
    }
    exit 0
}

if ($BackendOnly) {
    Write-Host 'Starting backend...'
    Push-Location $BackendDir
    try {
        & $VenvPython -m uvicorn app.main:app --reload
    }
    finally {
        Pop-Location
    }
    exit 0
}

Write-Host 'Starting backend and frontend in separate windows...'
$backendCmd = "Set-Location '$BackendDir'; & '$VenvPython' -m uvicorn app.main:app --reload"
$frontendCmd = "Set-Location '$FrontendDir'; npm start"

Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCmd | Out-Null

Write-Host 'Done. Backend: http://127.0.0.1:8000 | Frontend: http://localhost:3000'
