$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Info = Get-Content (Join-Path $Root 'info.json') -Raw | ConvertFrom-Json
$VenvRoot = Join-Path $env:USERPROFILE '.openvino\venv'
$Venv = Join-Path $VenvRoot $Info.venv_name
$Python = Join-Path $Venv 'Scripts\python.exe'
$Requirements = Join-Path $Root 'requirements.txt'

New-Item -ItemType Directory -Force -Path $VenvRoot | Out-Null

if (-not (Test-Path $Python)) {
    $launcher = Get-Command py -ErrorAction SilentlyContinue
    if ($null -eq $launcher) {
        throw 'Python launcher "py" was not found. Install Python 3.11 first.'
    }
    & py "-$($Info.python_version)" -m venv $Venv
}

$Stamp = Join-Path $Venv '.agentops-requirements.sha256'
$CurrentHash = (Get-FileHash $Requirements -Algorithm SHA256).Hash
$PreviousHash = if (Test-Path $Stamp) { Get-Content $Stamp -Raw } else { '' }

if ($CurrentHash -ne $PreviousHash.Trim()) {
    & $Python -m pip install --upgrade pip
    & $Python -m pip install -r $Requirements
    Set-Content -Path $Stamp -Value $CurrentHash -Encoding ascii
}

