$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot

if ($args -contains '--no-model') {
    & py '-3.11' (Join-Path $PSScriptRoot 'run.py') @args
    exit $LASTEXITCODE
}

& (Join-Path $PSScriptRoot 'install-env.ps1')
if ($LASTEXITCODE -ne 0) { exit 1 }

$Info = Get-Content (Join-Path $Root 'info.json') -Raw | ConvertFrom-Json
$Venv = Join-Path $env:USERPROFILE ".openvino\venv\$($Info.venv_name)"
$Python = Join-Path $Venv 'Scripts\python.exe'

& $Python (Join-Path $PSScriptRoot 'run.py') @args
exit $LASTEXITCODE
