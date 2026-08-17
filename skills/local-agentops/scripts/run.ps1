$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot

& (Join-Path $PSScriptRoot 'install-env.ps1')
if ($LASTEXITCODE -ne 0) { exit 1 }

$Info = Get-Content (Join-Path $Root 'info.json') -Raw | ConvertFrom-Json
$Venv = Join-Path $env:USERPROFILE ".openvino\venv\$($Info.venv_name)"
$Python = Join-Path $Venv 'Scripts\python.exe'

& $Python (Join-Path $PSScriptRoot 'client.py') @args
exit $LASTEXITCODE

